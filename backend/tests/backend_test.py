"""AgentEscrow backend regression tests."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://agent-lead-network.preview.emergentagent.com").rstrip("/")
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
        }
        r = requests.post(f"{API}/agent/leads/{lead_id}/close",
                          headers={"Authorization": f"Bearer {token}"}, json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["escrow_amount"] == 957.60
        assert d["net_commission"] == 15960.00

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
