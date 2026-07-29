"""AgentEscrow backend — FastAPI app.

Roles: admin, agent (pending → approved).
Public buyer/seller flow at POST /api/leads.
Agent apply flow at POST /api/agents/apply.
Admin controls review/approval, lead assignment, escrow tracking.
"""
from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import io
import uuid
import bcrypt
import jwt
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Literal, List

from fastapi import (
    FastAPI, APIRouter, HTTPException, Depends, Request, Response, status
)
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from bson import ObjectId

from blacklist import is_blacklisted, CORPORATE_BLACKLIST
from pdf_utils import build_agent_contract_pdf, build_client_contract_pdf


# ---------- Config ----------
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
ADMIN_EMAIL = os.environ["ADMIN_EMAIL"].lower()
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]
JWT_ALGO = "HS256"
ACCESS_TTL = timedelta(hours=8)
TERMS_VERSION = "v1.0"

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="AgentEscrow API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s %(levelname)s %(name)s | %(message)s")
log = logging.getLogger("agentescrow")


# ---------- Helpers ----------
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id, "email": email, "role": role,
        "exp": datetime.now(timezone.utc) + ACCESS_TTL,
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def user_public(u: dict) -> dict:
    return {
        "id": str(u["_id"]),
        "email": u["email"],
        "name": u.get("name"),
        "role": u["role"],
        "status": u.get("status", "approved"),
        "brokerage": u.get("brokerage"),
        "license_number": u.get("license_number"),
        "phone": u.get("phone"),
        "service_area": u.get("service_area"),
        "created_at": u.get("created_at"),
    }


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        if payload.get("type") != "access":
            raise HTTPException(401, "Invalid token")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(401, "User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(403, "Admin only")
    return user


async def require_approved_agent(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "agent":
        raise HTTPException(403, "Agent only")
    if user.get("status") != "approved":
        raise HTTPException(403, "Agent application not yet approved")
    return user


def client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


# ---------- Models ----------
class LoginIn(BaseModel):
    email: EmailStr
    password: str


class AgentApplyIn(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    phone: str = Field(min_length=6, max_length=32)
    brokerage: str = Field(min_length=2, max_length=160)
    license_number: str = Field(min_length=2, max_length=64)
    service_area: str = Field(min_length=2, max_length=200)  # cities/counties
    years_experience: int = Field(ge=0, le=70)
    attest_not_zillow: bool
    attest_not_corporate: bool
    attest_will_pay_escrow: bool
    signed_name: str = Field(min_length=2, max_length=120)


class LeadIn(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    kind: Literal["buyer", "seller"]
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str = Field(min_length=6, max_length=32)
    street_address: str = Field(min_length=3, max_length=200)
    city: str = Field(min_length=1, max_length=80)
    state: str = Field(min_length=2, max_length=40)
    zip_code: str = Field(min_length=3, max_length=12)
    property_type: str = Field(min_length=2, max_length=60)
    price_range: str = Field(min_length=1, max_length=60)
    timeline: str = Field(min_length=1, max_length=60)
    notes: Optional[str] = Field(default="", max_length=2000)
    attest_binding_escrow: bool
    signed_name: str = Field(min_length=2, max_length=120)


class AssignIn(BaseModel):
    agent_id: str


class CloseDealIn(BaseModel):
    sale_price: float = Field(gt=0)
    gross_commission_percent: float = Field(gt=0, le=25)
    broker_fee_percent: float = Field(ge=0, le=100)  # percent OF gross commission
    closing_date: str  # ISO date string


# ---------- Startup ----------
@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.leads.create_index("assigned_agent_id")
    await db.leads.create_index("status")
    await db.contracts.create_index("user_id")
    await db.contracts.create_index("lead_id")
    await db.deals.create_index("agent_id")
    await db.deals.create_index("lead_id", unique=True)

    existing = await db.users.find_one({"email": ADMIN_EMAIL})
    if not existing:
        await db.users.insert_one({
            "email": ADMIN_EMAIL,
            "password_hash": hash_password(ADMIN_PASSWORD),
            "name": "Platform Owner",
            "role": "admin",
            "status": "approved",
            "created_at": now_iso(),
        })
        log.info("Seeded admin user %s", ADMIN_EMAIL)
    else:
        # Rehash if env password changed
        if not verify_password(ADMIN_PASSWORD, existing["password_hash"]):
            await db.users.update_one(
                {"_id": existing["_id"]},
                {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}}
            )
            log.info("Refreshed admin password from env")


@app.on_event("shutdown")
async def on_shutdown():
    client.close()


# ---------- Auth ----------
@api.post("/auth/login")
async def login(body: LoginIn, response: Response):
    user = await db.users.find_one({"email": body.email.lower()})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(401, "Invalid email or password")
    if user.get("role") == "agent" and user.get("status") != "approved":
        raise HTTPException(403, f"Agent status: {user.get('status', 'pending')}. Awaiting admin approval.")
    token = create_access_token(str(user["_id"]), user["email"], user["role"])
    response.set_cookie("access_token", token, httponly=True, secure=True,
                        samesite="none", max_age=int(ACCESS_TTL.total_seconds()), path="/")
    return {"user": user_public(user), "token": token}


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user_public(user)


# ---------- Agent apply (public) ----------
@api.post("/agents/apply")
async def agent_apply(body: AgentApplyIn, request: Request):
    if not (body.attest_not_zillow and body.attest_not_corporate and body.attest_will_pay_escrow):
        raise HTTPException(400, "All three attestations must be checked to proceed.")

    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(409, "An account with this email already exists.")

    blocked, term = is_blacklisted(body.brokerage)
    initial_status = "rejected" if blocked else "pending"

    user_doc = {
        "email": email,
        "password_hash": hash_password(body.password),
        "name": body.name,
        "role": "agent",
        "status": initial_status,
        "brokerage": body.brokerage,
        "license_number": body.license_number,
        "phone": body.phone,
        "service_area": body.service_area,
        "years_experience": body.years_experience,
        "blacklist_flag": {"blocked": blocked, "matched_term": term},
        "created_at": now_iso(),
    }
    result = await db.users.insert_one(user_doc)
    user_id = result.inserted_id

    contract = {
        "contract_type": "agent",
        "user_id": str(user_id),
        "lead_id": None,
        "signed_name": body.signed_name,
        "ip_address": client_ip(request),
        "signed_at": now_iso(),
        "terms_version": TERMS_VERSION,
        "attestations": {
            "not_zillow": body.attest_not_zillow,
            "not_corporate": body.attest_not_corporate,
            "will_pay_escrow": body.attest_will_pay_escrow,
        },
        "snapshot": {
            "agent_name": body.name,
            "agent_email": email,
            "brokerage": body.brokerage,
            "license_number": body.license_number,
        },
    }
    c_result = await db.contracts.insert_one(contract)

    await db.users.update_one({"_id": user_id},
                              {"$set": {"contract_id": str(c_result.inserted_id)}})

    return {
        "status": initial_status,
        "blocked": blocked,
        "matched_term": term,
        "user_id": str(user_id),
        "contract_id": str(c_result.inserted_id),
        "message": (
            "Your brokerage matched an excluded corporate/iBuyer structure ("
            f"'{term}'). Your application has been declined."
            if blocked else
            "Application received. An admin will review and approve you shortly."
        ),
    }


# ---------- Lead submission (public) ----------
@api.post("/leads")
async def submit_lead(body: LeadIn, request: Request):
    if not body.attest_binding_escrow:
        raise HTTPException(400, "You must accept the escrow consent to submit a lead.")

    lead_doc = {
        "kind": body.kind,
        "full_name": body.full_name,
        "email": body.email.lower(),
        "phone": body.phone,
        "street_address": body.street_address,
        "city": body.city,
        "state": body.state,
        "zip_code": body.zip_code,
        "property_type": body.property_type,
        "price_range": body.price_range,
        "timeline": body.timeline,
        "notes": body.notes or "",
        "assigned_agent_id": None,
        "status": "new",
        "created_at": now_iso(),
        "assigned_at": None,
    }
    lead_result = await db.leads.insert_one(lead_doc)
    lead_id = lead_result.inserted_id

    contract = {
        "contract_type": "buyerseller",
        "user_id": None,
        "lead_id": str(lead_id),
        "signed_name": body.signed_name,
        "ip_address": client_ip(request),
        "signed_at": now_iso(),
        "terms_version": TERMS_VERSION,
        "attestations": {"binding_escrow_consent": True},
        "snapshot": {
            "client_name": body.full_name,
            "client_email": body.email.lower(),
            "client_role": body.kind,
            "street_address": body.street_address,
            "city": body.city,
            "state": body.state,
        },
    }
    c_result = await db.contracts.insert_one(contract)
    await db.leads.update_one({"_id": lead_id},
                              {"$set": {"contract_id": str(c_result.inserted_id)}})

    return {
        "ok": True,
        "lead_id": str(lead_id),
        "contract_id": str(c_result.inserted_id),
        "message": "Lead submitted. A vetted local agent will reach out soon.",
    }


# ---------- Admin routes ----------
@api.get("/admin/agents")
async def admin_list_agents(status_filter: Optional[str] = None,
                            _: dict = Depends(require_admin)):
    q = {"role": "agent"}
    if status_filter:
        q["status"] = status_filter
    cursor = db.users.find(q).sort("created_at", -1)
    out = []
    async for u in cursor:
        out.append(user_public(u) | {
            "blacklist_flag": u.get("blacklist_flag"),
            "years_experience": u.get("years_experience"),
            "contract_id": u.get("contract_id"),
        })
    return out


@api.post("/admin/agents/{agent_id}/approve")
async def admin_approve_agent(agent_id: str, _: dict = Depends(require_admin)):
    res = await db.users.update_one(
        {"_id": ObjectId(agent_id), "role": "agent"},
        {"$set": {"status": "approved", "approved_at": now_iso()}}
    )
    if res.matched_count == 0:
        raise HTTPException(404, "Agent not found")
    return {"ok": True, "status": "approved"}


@api.post("/admin/agents/{agent_id}/reject")
async def admin_reject_agent(agent_id: str, _: dict = Depends(require_admin)):
    res = await db.users.update_one(
        {"_id": ObjectId(agent_id), "role": "agent"},
        {"$set": {"status": "rejected", "rejected_at": now_iso()}}
    )
    if res.matched_count == 0:
        raise HTTPException(404, "Agent not found")
    return {"ok": True, "status": "rejected"}


@api.get("/admin/leads")
async def admin_list_leads(status_filter: Optional[str] = None,
                           _: dict = Depends(require_admin)):
    q = {}
    if status_filter:
        q["status"] = status_filter
    cursor = db.leads.find(q).sort("created_at", -1)
    out = []
    async for lead in cursor:
        lead["id"] = str(lead["_id"])
        lead.pop("_id", None)
        if lead.get("assigned_agent_id"):
            agent = await db.users.find_one({"_id": ObjectId(lead["assigned_agent_id"])})
            lead["assigned_agent"] = ({"id": str(agent["_id"]), "name": agent["name"],
                                       "email": agent["email"], "brokerage": agent.get("brokerage")}
                                      if agent else None)
        else:
            lead["assigned_agent"] = None
        out.append(lead)
    return out


@api.post("/admin/leads/{lead_id}/assign")
async def admin_assign_lead(lead_id: str, body: AssignIn,
                            _: dict = Depends(require_admin)):
    agent = await db.users.find_one({"_id": ObjectId(body.agent_id),
                                     "role": "agent", "status": "approved"})
    if not agent:
        raise HTTPException(400, "Target agent is not an approved agent.")
    res = await db.leads.update_one(
        {"_id": ObjectId(lead_id)},
        {"$set": {"assigned_agent_id": body.agent_id, "status": "assigned",
                  "assigned_at": now_iso()}}
    )
    if res.matched_count == 0:
        raise HTTPException(404, "Lead not found")
    return {"ok": True}


@api.get("/admin/deals")
async def admin_list_deals(_: dict = Depends(require_admin)):
    cursor = db.deals.find({}).sort("closing_date", -1)
    out = []
    async for d in cursor:
        d["id"] = str(d["_id"]); d.pop("_id", None)
        if d.get("agent_id"):
            a = await db.users.find_one({"_id": ObjectId(d["agent_id"])})
            d["agent"] = {"id": str(a["_id"]), "name": a["name"],
                          "email": a["email"], "brokerage": a.get("brokerage")} if a else None
        out.append(d)
    return out


@api.post("/admin/deals/{deal_id}/mark-escrow-collected")
async def admin_mark_collected(deal_id: str, _: dict = Depends(require_admin)):
    res = await db.deals.update_one(
        {"_id": ObjectId(deal_id)},
        {"$set": {"escrow_status": "collected", "collected_at": now_iso()}}
    )
    if res.matched_count == 0:
        raise HTTPException(404, "Deal not found")
    return {"ok": True, "escrow_status": "collected"}


@api.get("/admin/blacklist")
async def admin_blacklist(_: dict = Depends(require_admin)):
    return {"terms": CORPORATE_BLACKLIST}


# ---------- Agent routes ----------
@api.get("/agent/leads")
async def agent_leads(user: dict = Depends(require_approved_agent)):
    cursor = db.leads.find({"assigned_agent_id": str(user["_id"])}).sort("assigned_at", -1)
    out = []
    async for lead in cursor:
        lead["id"] = str(lead["_id"]); lead.pop("_id", None)
        out.append(lead)
    return out


@api.post("/agent/leads/{lead_id}/close")
async def agent_close_lead(lead_id: str, body: CloseDealIn,
                           user: dict = Depends(require_approved_agent)):
    lead = await db.leads.find_one({"_id": ObjectId(lead_id),
                                    "assigned_agent_id": str(user["_id"])})
    if not lead:
        raise HTTPException(404, "Lead not found or not assigned to you.")
    if await db.deals.find_one({"lead_id": lead_id}):
        raise HTTPException(409, "A deal already exists for this lead.")

    gross_commission = body.sale_price * (body.gross_commission_percent / 100.0)
    broker_fee = gross_commission * (body.broker_fee_percent / 100.0)
    net_commission = gross_commission - broker_fee
    escrow_amount = round(net_commission * 0.06, 2)

    deal = {
        "lead_id": lead_id,
        "agent_id": str(user["_id"]),
        "sale_price": body.sale_price,
        "gross_commission_percent": body.gross_commission_percent,
        "gross_commission_amount": round(gross_commission, 2),
        "broker_fee_percent": body.broker_fee_percent,
        "broker_fee_amount": round(broker_fee, 2),
        "net_commission": round(net_commission, 2),
        "escrow_amount": escrow_amount,
        "closing_date": body.closing_date,
        "escrow_status": "pending",
        "created_at": now_iso(),
    }
    result = await db.deals.insert_one(deal)
    await db.leads.update_one({"_id": ObjectId(lead_id)},
                              {"$set": {"status": "closed", "closed_at": now_iso()}})
    return {"ok": True, "deal_id": str(result.inserted_id),
            "escrow_amount": escrow_amount, "net_commission": round(net_commission, 2)}


@api.get("/agent/deals")
async def agent_deals(user: dict = Depends(require_approved_agent)):
    cursor = db.deals.find({"agent_id": str(user["_id"])}).sort("closing_date", -1)
    out = []
    async for d in cursor:
        d["id"] = str(d["_id"]); d.pop("_id", None)
        out.append(d)
    return out


# ---------- Contract PDF ----------
@api.get("/contracts/{contract_id}/pdf")
async def contract_pdf(contract_id: str, user: dict = Depends(get_current_user)):
    contract = await db.contracts.find_one({"_id": ObjectId(contract_id)})
    if not contract:
        raise HTTPException(404, "Contract not found")

    # authorization: admin, owner (agent), or matches lead's owning email
    is_admin = user.get("role") == "admin"
    is_owner_agent = contract.get("user_id") == str(user["_id"])
    if not (is_admin or is_owner_agent):
        raise HTTPException(403, "Not permitted")

    snap = contract.get("snapshot", {})
    if contract["contract_type"] == "agent":
        pdf = build_agent_contract_pdf(
            agent_name=snap.get("agent_name", ""),
            agent_email=snap.get("agent_email", ""),
            brokerage=snap.get("brokerage", ""),
            license_number=snap.get("license_number", ""),
            signed_name=contract["signed_name"],
            signed_at_iso=contract["signed_at"],
            ip_address=contract.get("ip_address"),
            terms_version=contract.get("terms_version", TERMS_VERSION),
        )
        fname = f"agent-contract-{contract_id}.pdf"
    else:
        pdf = build_client_contract_pdf(
            client_name=snap.get("client_name", ""),
            client_email=snap.get("client_email", ""),
            client_role=snap.get("client_role", "buyer"),
            property_city=snap.get("city", ""),
            property_state=snap.get("state", ""),
            signed_name=contract["signed_name"],
            signed_at_iso=contract["signed_at"],
            ip_address=contract.get("ip_address"),
            terms_version=contract.get("terms_version", TERMS_VERSION),
        )
        fname = f"client-contract-{contract_id}.pdf"

    return StreamingResponse(
        io.BytesIO(pdf),
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{fname}"'},
    )


# ---------- Health ----------
@api.get("/")
async def root():
    return {"service": "AgentEscrow", "ok": True}


@api.get("/blacklist/check")
async def blacklist_check(brokerage: str):
    blocked, term = is_blacklisted(brokerage)
    return {"blocked": blocked, "matched_term": term}


# ---------- Mount ----------
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
