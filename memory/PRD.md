# AgentEscrow — PRD

## Original Problem Statement
> New app for agents its for buyers and sellers who need local real estate agents this gives them leads and makes them sign a contract to give 6% of their gross commission less their broker fee for their leads. They must agree to enter the 6% in escrow. No zillow agents, zillow is excluded from this service and other corporate entities with a zillow structure. The is a risk free lead operation that only collects out of escrow if they sell a house.

## User Personas
- **Buyer / Seller** — Public visitor who wants a vetted, local (non-corporate) real estate agent. Submits a lead + signs a binding closing-escrow consent.
- **Agent** — Independent, locally-licensed real estate agent who applies, signs a 6% commission escrow agreement, receives assigned leads, and closes deals.
- **Admin (Owner)** — Reviews agent applications, screens for Zillow/corporate structure, assigns leads to approved agents, tracks escrow pipeline. Seeded as `perkinsappraisal@gmail.com`.

## Core Requirements (Static)
1. Public buyer/seller lead form with binding escrow consent (typed signature + generated PDF).
2. Public agent application flow with three attestations (not Zillow, not corporate, will pay 6% via closing escrow) + typed signature + generated PDF.
3. Automated Zillow / corporate-iBuyer blacklist (case-insensitive substring on brokerage) auto-rejects applications.
4. Admin dashboard: review/approve/reject agents, assign leads to approved agents, escrow tracker, blacklist rules view.
5. Agent dashboard: view assigned leads, mark deals closed with sale price + gross commission % + broker fee %, escrow amount preview and record.
6. Escrow math: `escrow_amount = 0.06 × (sale_price × gross_commission_pct/100) × (1 − broker_fee_pct/100)`.
7. JWT auth (cookie + Bearer). Admin seeded from `.env`.
8. Signed contract PDFs downloadable by admin and the owning agent.
9. Risk-free semantics — nothing is owed unless a deal closes.

## Architecture
- **Backend**: FastAPI + Motor (MongoDB), bcrypt + PyJWT, ReportLab for PDF, cookie + Bearer auth, prefix `/api`.
  - Collections: `users`, `leads`, `contracts`, `deals`.
  - Startup: seeds admin from env, creates indexes.
- **Frontend**: React 19 + React Router v7 + Tailwind + shadcn/ui + sonner + lucide-react. Dark mode-only Cabinet Grotesk + IBM Plex Sans, obsidian/gold/signal-red palette.
- **Design**: Swiss brutalist + luxury dark. Glassmorphism sticky header, tetris pillar grid, tracing-beam borders on high-conversion cards, editorial marquee ticker.

## What's Been Implemented — 2026-07-29
- Full JWT auth (login / logout / me), admin seeding, role gates (admin, approved_agent).
- Public `/leads` + `/agents/apply` endpoints with contract generation.
- Automated blacklist (Zillow, Trulia, Redfin, Opendoor, Offerpad, Compass, HomeLight, Rocket Homes, Realogy, Anywhere, Orchard, Flyhomes, Houwzer, Reali).
- Admin console: agents (approve/reject), leads (assign), deals (mark escrow collected), blacklist view.
- Agent dashboard with `close deal` dialog showing live escrow preview and calendar.
- Signed PDF generation for both agent and buyer/seller contracts (ReportLab, gold/black print theme).
- Landing page with hero, marquee, three pillars, contract-signing showcase, and CTA strip.
- 21/21 backend tests + 6/6 frontend E2E flows passing.

## Prioritized Backlog
### P0 — none open

### P1
- Contract PDF for buyer/seller lookup — currently only admin can pull it after submission (user gets the link on success screen but no re-download without saving link).
- Real Stripe payment collection at closing (currently manual escrow tracking only).
- Email notifications: agent-approved, lead-assigned, deal-closed (Resend integration).

### P2
- DocuSign/HelloSign for full e-signature audit trail.
- Agent-uploaded closing docs (title company disbursement letter).
- Public-facing agent directory page for approved agents.
- Rate limiting + brute-force lockout on `/api/auth/login`.
- Compass "corporate" match — currently substring-matches all "Compass *" brokerages; move to soft-flag for manual review instead of auto-reject.
