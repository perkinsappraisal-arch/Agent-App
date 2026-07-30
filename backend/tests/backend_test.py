"""AgentEscrow backend regression tests."""
import io
import os
import uuid
import pytest
import requests
from pathlib import Path
from dotenv import load_dotenv

# Load REACT_APP_BACKEND_URL from frontend/.env when running via pytest
load_dotenv(Path(__file__).resolve().parents[2] / "frontend" / ".env")

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "perkinsappraisal@gmail.com"
ADMIN_PASSWORD = "ChangeMe!2026"


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["user"]["role"] == "admin"
    return data["token"]


@pytest.fixture
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


def _unique_email(prefix="agent"):
    return f"TEST_{prefix}_{uuid.uuid4().hex[:8]}@example.com"


# ---------- Auth ----------
class TestAuth:
    def test_admin_login(self, admin_token):
        assert isinstance(admin_token, str) and len(admin_token) > 20

    def test_me_endpoint(self, admin_headers):
        r = requests.get(f"{API}/auth/me", headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["role"] == "admin"

    def test_invalid_login(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
        assert r.status_code == 401


# ---------- Agent apply ----------
class TestAgentApply:
    def test_zillow_auto_rejected(self):
        email = _unique_email("zillow")
        payload = {
            "name": "Zillow Guy", "email": email, "password": "Passw0rd!",
            "phone": "5551230000", "brokerage": "Zillow Premier Agent",
            "license_number": "LIC123", "service_area": "Austin TX",
            "years_experience": 5,
            "attest_not_zillow": True, "attest_not_corporate": True,
            "attest_will_pay_escrow": True, "signed_name": "Zillow Guy",
        }
        r = requests.post(f"{API}/agents/apply", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["status"] == "rejected"
        assert d["blocked"] is True
        assert d["matched_term"] == "zillow"

    def test_happy_pending(self):
        email = _unique_email("local")
        payload = {
            "name": "Local Agent", "email": email, "password": "Passw0rd!",
            "phone": "5551230000", "brokerage": "Local Realty LLC",
            "license_number": "LIC999", "service_area": "Austin TX",
            "years_experience": 3,
            "attest_not_zillow": True, "attest_not_corporate": True,
            "attest_will_pay_escrow": True, "signed_name": "Local Agent",
        }
        r = requests.post(f"{API}/agents/apply", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["status"] == "pending"
        assert d["blocked"] is False
        assert "contract_id" in d and "user_id" in d
        pytest.pending_agent = {"email": email, "password": "Passw0rd!",
                                "user_id": d["user_id"], "contract_id": d["contract_id"]}

    def test_missing_attestation_400(self):
        payload = {
            "name": "Bad Agent", "email": _unique_email("bad"), "password": "Passw0rd!",
            "phone": "5551230000", "brokerage": "Local Realty LLC",
            "license_number": "LIC1", "service_area": "Austin TX",
            "years_experience": 3,
            "attest_not_zillow": False, "attest_not_corporate": True,
            "attest_will_pay_escrow": True, "signed_name": "Bad Agent",
        }
        r = requests.post(f"{API}/agents/apply", json=payload)
        assert r.status_code == 400

    def test_pending_agent_cannot_login(self):
        info = getattr(pytest, "pending_agent", None)
        assert info, "pending agent fixture missing"
        r = requests.post(f"{API}/auth/login", json={"email": info["email"], "password": info["password"]})
        assert r.status_code == 403


# ---------- Leads ----------
class TestLeads:
    def _valid_lead(self):
        return {
            "kind": "buyer", "full_name": "Jane Buyer",
            "email": _unique_email("buyer"), "phone": "5559990000",
            "street_address": "123 Main St",
            "city": "Austin", "state": "TX", "zip_code": "78701",
            "property_type": "Single Family", "price_range": "500k-800k",
            "timeline": "3 months",
            "attest_binding_escrow": True, "signed_name": "Jane Buyer",
        }

    def test_lead_happy(self):
        r = requests.post(f"{API}/leads", json=self._valid_lead())
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["ok"] is True
        assert "contract_id" in d and "lead_id" in d
        pytest.test_lead = d

    def test_lead_requires_consent(self):
        p = self._valid_lead()
        p["attest_binding_escrow"] = False
        r = requests.post(f"{API}/leads", json=p)
        assert r.status_code == 400


# ---------- Admin approve → agent login ----------
class TestAdminFlow:
    def test_admin_approve_pending(self, admin_headers):
        info = getattr(pytest, "pending_agent")
        r = requests.post(f"{API}/admin/agents/{info['user_id']}/approve", headers=admin_headers)
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "approved"

    def test_agent_can_login_after_approval(self):
        info = getattr(pytest, "pending_agent")
        r = requests.post(f"{API}/auth/login", json={"email": info["email"], "password": info["password"]})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["user"]["role"] == "agent"
        assert data["user"]["status"] == "approved"
        pytest.agent_token = data["token"]
        # verify /auth/me
        me = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {data['token']}"})
        assert me.status_code == 200

    def test_assign_to_non_approved_fails(self, admin_headers):
        # Create another agent left pending
        email = _unique_email("pending2")
        pay = {
            "name": "Pending2", "email": email, "password": "Passw0rd!",
            "phone": "5551110000", "brokerage": "Another Local Realty",
            "license_number": "LIC2", "service_area": "Austin TX",
            "years_experience": 2,
            "attest_not_zillow": True, "attest_not_corporate": True,
            "attest_will_pay_escrow": True, "signed_name": "Pending2",
        }
        a = requests.post(f"{API}/agents/apply", json=pay).json()
        lead_id = pytest.test_lead["lead_id"]
        r = requests.post(f"{API}/admin/leads/{lead_id}/assign",
                          headers=admin_headers, json={"agent_id": a["user_id"]})
        assert r.status_code == 400

    def test_assign_to_approved_ok(self, admin_headers):
        lead_id = pytest.test_lead["lead_id"]
        agent_id = pytest.pending_agent["user_id"]
        r = requests.post(f"{API}/admin/leads/{lead_id}/assign",
                          headers=admin_headers, json={"agent_id": agent_id})
        assert r.status_code == 200, r.text


# ---------- Agent leads / close deal ----------
class TestAgentFlow:
    def test_agent_lists_leads(self):
        token = pytest.agent_token
        r = requests.get(f"{API}/agent/leads", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        leads = r.json()
        assert any(l["id"] == pytest.test_lead["lead_id"] for l in leads)

    def test_close_deal_math(self):
        token = pytest.agent_token
        lead_id = pytest.test_lead["lead_id"]
        payload = {
            "sale_price": 760000, "gross_commission_percent": 3,
            "broker_fee_percent": 30, "closing_date": "2026-02-15",
            "home_warranty_amount": 600,
        }
        r = requests.post(f"{API}/agent/leads/{lead_id}/close",
                          headers={"Authorization": f"Bearer {token}"}, json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        # Response fields
        assert d["marketing_fee"] == 957.60
        assert d["home_warranty_amount"] == 600.0
        assert d["total_escrow_disbursement"] == 1557.60
        assert d["agent_commission"] == 15960.00
        # Verify persistence via GET /api/agent/deals
        deals = requests.get(f"{API}/agent/deals",
                             headers={"Authorization": f"Bearer {token}"}).json()
        deal = next(x for x in deals if x["lead_id"] == lead_id)
        for key in ("marketing_fee", "home_warranty_amount",
                    "total_escrow_disbursement", "agent_commission"):
            assert key in deal, f"missing {key} in agent deal"
        assert deal["marketing_fee"] == 957.60
        assert deal["home_warranty_amount"] == 600.0
        assert deal["total_escrow_disbursement"] == 1557.60
        assert deal["agent_commission"] == 15960.00
        # Backward-compat aliases still present
        assert deal.get("escrow_amount") == 957.60
        assert deal.get("net_commission") == 15960.00

    def test_close_deal_conflict_second_time(self):
        token = pytest.agent_token
        lead_id = pytest.test_lead["lead_id"]
        payload = {
            "sale_price": 500000, "gross_commission_percent": 3,
            "broker_fee_percent": 30, "closing_date": "2026-02-15",
        }
        r = requests.post(f"{API}/agent/leads/{lead_id}/close",
                          headers={"Authorization": f"Bearer {token}"}, json=payload)
        assert r.status_code == 409


# ---------- Contract PDF ----------
class TestContractPDF:
    def test_admin_can_download(self, admin_headers):
        contract_id = pytest.pending_agent["contract_id"]
        r = requests.get(f"{API}/contracts/{contract_id}/pdf", headers=admin_headers)
        assert r.status_code == 200
        assert r.headers["content-type"].startswith("application/pdf")
        assert len(r.content) > 1000

    def test_owner_agent_can_download(self):
        token = pytest.agent_token
        contract_id = pytest.pending_agent["contract_id"]
        r = requests.get(f"{API}/contracts/{contract_id}/pdf",
                         headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200

    def test_unauth_cannot(self):
        contract_id = pytest.pending_agent["contract_id"]
        r = requests.get(f"{API}/contracts/{contract_id}/pdf")
        assert r.status_code == 401


# ---------- Admin misc ----------
class TestAdminMisc:
    def test_blacklist(self, admin_headers):
        r = requests.get(f"{API}/admin/blacklist", headers=admin_headers)
        assert r.status_code == 200
        assert "zillow" in r.json()["terms"]

    def test_non_admin_forbidden(self):
        token = pytest.agent_token
        r = requests.get(f"{API}/admin/agents", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 403


# ---------- Warranty defaults and validation (isolated new lead+agent flow) ----------
def _create_approved_agent_and_assigned_lead(admin_headers):
    """Helper: create fresh pending agent, approve, submit lead, assign."""
    email = _unique_email("warranty_agent")
    pay = {
        "name": "Warranty Agent", "email": email, "password": "Passw0rd!",
        "phone": "5551234567", "brokerage": "Warranty Realty LLC",
        "license_number": "LICW1", "service_area": "Dallas TX",
        "years_experience": 4,
        "attest_not_zillow": True, "attest_not_corporate": True,
        "attest_will_pay_escrow": True, "signed_name": "Warranty Agent",
    }
    ar = requests.post(f"{API}/agents/apply", json=pay).json()
    agent_id = ar["user_id"]
    requests.post(f"{API}/admin/agents/{agent_id}/approve", headers=admin_headers)
    login = requests.post(f"{API}/auth/login", json={"email": email, "password": "Passw0rd!"}).json()
    token = login["token"]

    lead_payload = {
        "kind": "buyer", "full_name": "Warranty Buyer",
        "email": _unique_email("wbuyer"), "phone": "5559990000",
        "street_address": "456 Oak St",
        "city": "Dallas", "state": "TX", "zip_code": "75001",
        "property_type": "Single Family", "price_range": "500k-800k",
        "timeline": "3 months",
        "attest_binding_escrow": True, "signed_name": "Warranty Buyer",
    }
    lr = requests.post(f"{API}/leads", json=lead_payload).json()
    lead_id = lr["lead_id"]
    requests.post(f"{API}/admin/leads/{lead_id}/assign",
                  headers=admin_headers, json={"agent_id": agent_id})
    return token, agent_id, lead_id


class TestWarranty:
    def test_home_warranty_defaults_to_600(self, admin_headers):
        token, _, lead_id = _create_approved_agent_and_assigned_lead(admin_headers)
        payload = {
            "sale_price": 760000, "gross_commission_percent": 3,
            "broker_fee_percent": 30, "closing_date": "2026-03-01",
            # home_warranty_amount omitted → default 600
        }
        r = requests.post(f"{API}/agent/leads/{lead_id}/close",
                          headers={"Authorization": f"Bearer {token}"}, json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["home_warranty_amount"] == 600.0
        assert d["marketing_fee"] == 957.60
        assert d["total_escrow_disbursement"] == 1557.60

    def test_home_warranty_negative_rejected(self, admin_headers):
        token, _, lead_id = _create_approved_agent_and_assigned_lead(admin_headers)
        payload = {
            "sale_price": 500000, "gross_commission_percent": 3,
            "broker_fee_percent": 30, "closing_date": "2026-03-01",
            "home_warranty_amount": -100,
        }
        r = requests.post(f"{API}/agent/leads/{lead_id}/close",
                          headers={"Authorization": f"Bearer {token}"}, json=payload)
        assert r.status_code == 422

    def test_home_warranty_over_5000_rejected(self, admin_headers):
        token, _, lead_id = _create_approved_agent_and_assigned_lead(admin_headers)
        payload = {
            "sale_price": 500000, "gross_commission_percent": 3,
            "broker_fee_percent": 30, "closing_date": "2026-03-01",
            "home_warranty_amount": 5001,
        }
        r = requests.post(f"{API}/agent/leads/{lead_id}/close",
                          headers={"Authorization": f"Bearer {token}"}, json=payload)
        assert r.status_code == 422


# ---------- Admin deals surface warranty/marketing fields ----------
class TestAdminDeals:
    def test_admin_deals_has_new_fields(self, admin_headers):
        r = requests.get(f"{API}/admin/deals", headers=admin_headers)
        assert r.status_code == 200
        deals = r.json()
        assert len(deals) > 0, "expected at least one deal from previous test"
        # At least one deal (the ones we just created) must expose new fields.
        required = ("marketing_fee", "home_warranty_amount",
                    "total_escrow_disbursement", "agent_commission")
        matching = [d for d in deals if all(k in d for k in required)]
        assert len(matching) >= 1, (
            "No admin deal exposes new fields marketing_fee/home_warranty_amount/"
            "total_escrow_disbursement/agent_commission"
        )


# ---------- PDF content (agent + client) ----------
class TestPDFContent:
    def _extract_text(self, pdf_bytes: bytes) -> str:
        """Very lightweight PDF text extraction — pypdf if available."""
        try:
            from pypdf import PdfReader
        except ImportError:
            try:
                from PyPDF2 import PdfReader
            except ImportError:
                pytest.skip("No PDF library installed to inspect PDF text")
        reader = PdfReader(io.BytesIO(pdf_bytes))
        return "\n".join((p.extract_text() or "") for p in reader.pages).lower()

    def test_agent_contract_pdf_marketing_wording(self, admin_headers):
        import io as _io  # noqa
        contract_id = pytest.pending_agent["contract_id"]
        r = requests.get(f"{API}/contracts/{contract_id}/pdf", headers=admin_headers)
        assert r.status_code == 200
        text = self._extract_text(r.content)
        assert "marketing service" in text, "agent PDF missing 'marketing service'"
        assert "6%" in text or "six percent" in text
        assert "home warranty" in text

    def test_client_contract_pdf_home_warranty_wording(self, admin_headers):
        # Fetch admin lead list to obtain a buyerseller contract id
        leads = requests.get(f"{API}/admin/leads", headers=admin_headers).json()
        contract_id = None
        for l in leads:
            if l.get("contract_id"):
                contract_id = l["contract_id"]
                break
        assert contract_id, "no client contract available"
        r = requests.get(f"{API}/contracts/{contract_id}/pdf", headers=admin_headers)
        assert r.status_code == 200
        text = self._extract_text(r.content)
        assert "home warranty" in text
        assert "no cost to the client" in text or "no cost" in text
        assert "marketing fee" in text
        assert "6%" in text or "six percent" in text
