"""PDF generation for signed contracts using ReportLab."""
import io
from datetime import datetime, timezone
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, black
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle
)


GOLD = HexColor("#8A6D0B")  # darker gold for print
DARK = HexColor("#0A0A0C")


def _base_styles():
    ss = getSampleStyleSheet()
    ss.add(ParagraphStyle(name="TitleBig", fontName="Helvetica-Bold",
                          fontSize=22, leading=26, textColor=DARK, spaceAfter=12))
    ss.add(ParagraphStyle(name="OverLine", fontName="Helvetica-Bold",
                          fontSize=8, leading=10, textColor=GOLD, spaceAfter=6))
    ss.add(ParagraphStyle(name="H2", fontName="Helvetica-Bold",
                          fontSize=13, leading=16, textColor=DARK,
                          spaceBefore=10, spaceAfter=6))
    ss.add(ParagraphStyle(name="Body", fontName="Helvetica",
                          fontSize=10.5, leading=15, textColor=black))
    return ss


def _footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(GOLD)
    canvas.drawString(0.75 * inch, 0.5 * inch,
                      "AgentMarketplace — Contract copy • Legally binding upon signature")
    canvas.drawRightString(7.75 * inch, 0.5 * inch, f"Page {doc.page}")
    canvas.restoreState()


def build_agent_contract_pdf(*, agent_name, agent_email, brokerage,
                             license_number, signed_name, signed_at_iso,
                             ip_address, terms_version="v1.0") -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=LETTER,
                            leftMargin=0.75 * inch, rightMargin=0.75 * inch,
                            topMargin=0.75 * inch, bottomMargin=0.75 * inch,
                            title="AgentMarketplace — Agent Lead Contract")
    ss = _base_styles()
    story = []

    story.append(Paragraph("AGENTMARKETPLACE", ss["OverLine"]))
    story.append(Paragraph("Agent Marketing Service &amp; Closing Escrow Agreement", ss["TitleBig"]))
    story.append(HRFlowable(width="100%", thickness=1, color=GOLD, spaceAfter=14))

    party_data = [
        ["Agent Name", agent_name],
        ["Agent Email", agent_email],
        ["Brokerage", brokerage],
        ["License #", license_number or "—"],
        ["Terms Version", terms_version],
        ["Signed (UTC)", signed_at_iso],
        ["Signer IP", ip_address or "—"],
    ]
    tbl = Table(party_data, colWidths=[1.6 * inch, 5.1 * inch])
    tbl.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TEXTCOLOR", (0, 0), (0, -1), GOLD),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("LINEBELOW", (0, 0), (-1, -1), 0.25, HexColor("#DDDDDD")),
    ]))
    story.append(tbl)
    story.append(Spacer(1, 14))

    story.append(Paragraph("1. Nature of Service — Marketing", ss["H2"]))
    story.append(Paragraph(
        "AgentMarketplace ('Platform') is a <b>marketing service</b> that refers "
        "qualifying buyer and seller leads to the undersigned licensed real "
        "estate agent ('Agent') in the Agent's declared service area. This is "
        "not an escrow, brokerage, or title service. No lead volume or "
        "conversion is guaranteed.", ss["Body"]))

    story.append(Paragraph("2. Marketing Fee — 6% of the Agent's Own Commission", ss["H2"]))
    story.append(Paragraph(
        "In consideration for each closed transaction that originated from a "
        "Platform-supplied lead, the Agent agrees to pay the Platform a "
        "marketing fee equal to <b>six percent (6%) of the agent's own "
        "commission</b> on that transaction, where the agent's own commission "
        "means the Gross Commission LESS the Broker Fee actually charged by "
        "Agent's brokerage. Formally: <i>Marketing Fee = 0.06 × "
        "(Gross Commission − Broker Fee)</i>.", ss["Body"]))

    story.append(Paragraph("3. Home Warranty for the Client — Paid by Agent", ss["H2"]))
    story.append(Paragraph(
        "In addition to the marketing fee, Agent agrees to <b>purchase and "
        "fund a one-year home warranty for the client</b> from a warranty "
        "provider of the Platform's choosing. The default warranty premium is "
        "<b>$600.00</b> per closed transaction; the actual amount is confirmed "
        "at the time of closing. This home warranty is a benefit the client "
        "receives at no cost in exchange for signing the platform's binding "
        "escrow consent.", ss["Body"]))

    story.append(Paragraph("4. Closing Disbursement", ss["H2"]))
    story.append(Paragraph(
        "The Agent shall instruct the closing / settlement agent (title "
        "company, escrow officer, or closing attorney) to disburse, out of "
        "closing funds and prior to release of Agent's own commission: "
        "(a) the marketing fee to AgentMarketplace, and (b) the home warranty "
        "premium to the designated home warranty provider. Formally: "
        "<i>Total Closing Disbursement = 0.06 × (Gross Commission − "
        "Broker Fee) + Home Warranty Premium</i>. Both amounts are due "
        "only at closing and are <b>only owed if a transaction closes</b>. "
        "No lead fees, subscription fees, or up-front payments are collected.",
        ss["Body"]))

    story.append(Paragraph("5. Zillow / Corporate iBuyer Exclusion", ss["H2"]))
    story.append(Paragraph(
        "Agent attests that Agent is <b>not employed by, contracted to, or "
        "economically affiliated with Zillow Group, Trulia, Redfin, Opendoor, "
        "Offerpad, or any brokerage operating under a corporate iBuyer or "
        "platform-owned lead-farm structure</b>. Any material misrepresentation "
        "constitutes an immediate breach and forfeiture of leads and any "
        "earned payouts.", ss["Body"]))

    story.append(Paragraph("6. Reporting and Audit", ss["H2"]))
    story.append(Paragraph(
        "Agent shall report closed transactions within seven (7) days of "
        "closing. Platform reserves the right to verify closings against "
        "public records and MLS data. Under-reporting or non-reporting is a "
        "material breach.", ss["Body"]))

    story.append(Paragraph("7. Risk-Free Terms", ss["H2"]))
    story.append(Paragraph(
        "If a lead does not close a transaction, Agent owes the Platform "
        "nothing and no home warranty is purchased. There are no cancellation "
        "fees or ongoing obligations.", ss["Body"]))

    story.append(Spacer(1, 16))
    story.append(HRFlowable(width="100%", thickness=0.75, color=GOLD, spaceAfter=10))
    story.append(Paragraph("SIGNATURE", ss["OverLine"]))
    story.append(Paragraph(
        f"<font size=16><b>{signed_name}</b></font>", ss["Body"]))
    story.append(Paragraph(
        f"Typed electronic signature — {signed_at_iso} — IP {ip_address or '—'}",
        ss["Body"]))

    doc.build(story, onFirstPage=_footer, onLaterPages=_footer)
    return buf.getvalue()


def build_client_contract_pdf(*, client_name, client_email, client_role,
                              property_city, property_state,
                              signed_name, signed_at_iso, ip_address,
                              terms_version="v1.0") -> bytes:
    """Buyer/Seller binding contract — commits them to route agent
    commission escrow portion through closing."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=LETTER,
                            leftMargin=0.75 * inch, rightMargin=0.75 * inch,
                            topMargin=0.75 * inch, bottomMargin=0.75 * inch,
                            title="AgentMarketplace — Client Escrow Consent")
    ss = _base_styles()
    story = []

    story.append(Paragraph("AGENTMARKETPLACE", ss["OverLine"]))
    story.append(Paragraph("Client Escrow Consent &amp; Binding Agreement", ss["TitleBig"]))
    story.append(HRFlowable(width="100%", thickness=1, color=GOLD, spaceAfter=14))
    party_data = [
        ["Client Name", client_name],
        ["Client Email", client_email],
        ["Client Role", client_role.title()],
        ["Property Area", f"{property_city}, {property_state}"],
        ["Terms Version", terms_version],
        ["Signed (UTC)", signed_at_iso],
        ["Signer IP", ip_address or "—"],
    ]
    tbl = Table(party_data, colWidths=[1.6 * inch, 5.1 * inch])
    tbl.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TEXTCOLOR", (0, 0), (0, -1), GOLD),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("LINEBELOW", (0, 0), (-1, -1), 0.25, HexColor("#DDDDDD")),
    ]))
    story.append(tbl)
    story.append(Spacer(1, 14))

    story.append(Paragraph("1. Purpose", ss["H2"]))
    story.append(Paragraph(
        "The undersigned ('Client') is a prospective buyer or seller who has "
        "requested a local, non-corporate real estate agent referral from "
        "AgentMarketplace ('Platform'), which is a <b>marketing service</b> that "
        "connects clients with independent local agents.", ss["Body"]))

    story.append(Paragraph("2. What the Client Receives", ss["H2"]))
    story.append(Paragraph(
        "Client will be matched with a vetted independent local agent "
        "(non-corporate, non-Zillow-structure) who lives within an hour of "
        "the Client's property or search area. In addition, upon closing of "
        "the resulting transaction, the Client receives a <b>one-year home "
        "warranty at no cost to the Client</b>, purchased and funded by the "
        "referred agent out of the agent's commission at closing.",
        ss["Body"]))

    story.append(Paragraph("3. Client Escrow Consent", ss["H2"]))
    story.append(Paragraph(
        "Client acknowledges and irrevocably consents that, at closing of the "
        "resulting real estate transaction, the closing / settlement agent "
        "shall disburse the following amounts to the Platform (and its "
        "designated home warranty provider) out of the referred agent's "
        "commission, prior to release of the agent's net proceeds: (a) a "
        "<b>marketing fee equal to six percent (6%) of the agent's own "
        "commission</b> (Gross Commission − Broker Fee), and (b) the premium "
        "for the Client's <b>one-year home warranty</b>. These disbursements "
        "come from the agent's commission — <b>not</b> from Client's proceeds, "
        "purchase funds, or closing costs — and do not increase Client's cost "
        "of the transaction.", ss["Body"]))

    story.append(Paragraph("4. Binding Nature", ss["H2"]))
    story.append(Paragraph(
        "Client agrees this consent is binding and shall be honored as a "
        "written instruction to the closing agent. Client shall not instruct "
        "the closing agent to withhold either disbursement.",
        ss["Body"]))

    story.append(Paragraph("5. Platform Is Not an Escrow Holder", ss["H2"]))
    story.append(Paragraph(
        "AgentMarketplace itself does <b>not</b> act as a licensed escrow holder. "
        "This document is a written disbursement instruction to the closing "
        "or settlement agent of Client's transaction. Actual escrow, title, "
        "and settlement services are performed by a licensed third party of "
        "Client's or Agent's choosing.", ss["Body"]))

    story.append(Paragraph("6. Contingent — No Sale, No Obligation", ss["H2"]))
    story.append(Paragraph(
        "If the transaction does not close, no amount is owed under this "
        "agreement and no home warranty is purchased. This is a risk-free "
        "referral for both Client and Agent.", ss["Body"]))

    story.append(Spacer(1, 16))
    story.append(HRFlowable(width="100%", thickness=0.75, color=GOLD, spaceAfter=10))
    story.append(Paragraph("SIGNATURE", ss["OverLine"]))
    story.append(Paragraph(
        f"<font size=16><b>{signed_name}</b></font>", ss["Body"]))
    story.append(Paragraph(
        f"Typed electronic signature — {signed_at_iso} — IP {ip_address or '—'}",
        ss["Body"]))

    doc.build(story, onFirstPage=_footer, onLaterPages=_footer)
    return buf.getvalue()
