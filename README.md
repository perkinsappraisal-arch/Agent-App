# AgentEscrow

A cheerful, closing-secured **marketing service** that connects buyers/sellers with trusted local real estate agents — within an hour of the property. Agents pay a **6% marketing fee on their own commission** and fund a **1-year home warranty for the client**, both at closing. No Zillow. No corporate iBuyers.

- **Frontend:** React 19 + React Router + Tailwind + shadcn/ui
- **Backend:** FastAPI + Motor (MongoDB) + JWT auth + ReportLab PDFs
- **Live preview:** https://agent-lead-network.preview.emergentagent.com
- **Live production:** https://agent-lead-network.emergent.host

## Local setup

```bash
# Backend
cd backend
cp .env.example .env   # fill in real values
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Frontend
cd frontend
yarn install
yarn start
```

## Admin

Seeded from `backend/.env` on first boot. Default is `perkinsappraisal@gmail.com` / `ChangeMe!2026` — **rotate this before going live**.

## Key routes

- `/` — Landing (marketing)
- `/leads/new` — Buyer/seller lead form + binding escrow consent
- `/agents/apply` — Agent application + 6% marketing fee + home-warranty contract
- `/login` — Sign in
- `/agent` — Approved agent dashboard (leads, deals, close-deal calculator)
- `/admin` — Admin console (approve agents, assign leads, escrow tracker)

## Escrow math

At closing, out of the agent's commission:

```
Marketing Fee     = 0.06 × (Gross Commission − Broker Fee)
Home Warranty     = fixed premium (default $600, configurable per deal)
Total Disbursement = Marketing Fee + Home Warranty
Agent Take-Home    = Agent Commission − Total Disbursement
```

Nothing owed if the deal doesn't close.

## Excluded brokerages

Any brokerage matching (case-insensitive substring) is auto-rejected on application: Zillow, Trulia, Redfin, Opendoor, Offerpad, Compass, HomeLight, Rocket Homes, Realogy, Anywhere Real Estate, Orchard, Flyhomes, Houwzer, Reali.

## Tests

```bash
cd /app
pytest backend/tests/backend_test.py -v -n 0
# 27/27 passing as of last run
```
