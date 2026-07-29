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
                      "AgentEscrow — Contract copy • Legally binding upon signature")
    canvas.drawRightString(7.75 * inch, 0.5 * inch, f"Page {doc.page}")
    canvas.restoreState()


def build_agent_contract_pdf(*, agent_name, agent_email, brokerage,
                             license_number, signed_name, signed_at_iso,
                             ip_address, terms_version="v1.0") -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=LETTER,
                            leftMargin=0.75 * inch, rightMargin=0.75 * inch,
                            topMargin=0.75 * inch, bottomMargin=0.75 * inch,
                            title="AgentEscrow — Agent Lead Contract")
    ss = _base_styles()
    story = []

    story.append(Paragraph("AGENTESCROW", ss["OverLine"]))
    story.append(Paragraph("Agent Lead &amp; Commission Escrow Agreement", ss["TitleBig"]))
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

    story.append(Paragraph("1. Grant of Leads", ss["H2"]))
    story.append(Paragraph(
        "AgentEscrow ('Platform') will refer qualifying buyer and seller leads "
        "to the undersigned licensed real estate agent ('Agent') in the Agent's "
        "declared service area. The Platform makes no guarantee of lead volume "
        "or conversion.", ss["Body"]))

    story.append(Paragraph("2. Compensation — Six Percent (6%) of Net Commission", ss["H2"]))
    story.append(Paragraph(
        "In consideration for each closed transaction that originated from a "
        "Platform-supplied lead, the Agent agrees to pay the Platform an amount "
        "equal to <b>six percent (6%) of the Agent's Gross Commission LESS the "
        "Broker Fee</b> actually charged by Agent's brokerage for the same "
        "transaction. Formally: <i>Escrow Amount = 0.06 × (Gross Commission − Broker Fee)</i>.",
        ss["Body"]))

    story.append(Paragraph("3. Escrow Collection at Closing", ss["H2"]))
    story.append(Paragraph(
        "The Agent shall instruct the closing/settlement agent (title company, "
        "escrow officer, or closing attorney) to disburse the Escrow Amount "
        "directly to the Platform out of closing funds, prior to release of "
        "the Agent's net commission. Payment is due at the closing of the "
        "referenced transaction and is <b>only owed if a transaction closes</b>. "
        "No lead fees, subscription fees, or up-front payments are collected.",
        ss["Body"]))

    story.append(Paragraph("4. Zillow / Corporate iBuyer Exclusion", ss["H2"]))
    story.append(Paragraph(
        "Agent attests, under this agreement, that Agent is <b>not employed by, "
        "contracted to, or economically affiliated with Zillow Group, Trulia, "
        "Redfin, Opendoor, Offerpad, or any brokerage operating under a "
        "corporate iBuyer or platform-owned lead-farm structure</b>. Any material "
        "misrepresentation constitutes an immediate breach and forfeiture of "
        "leads and any earned payouts.", ss["Body"]))

    story.append(Paragraph("5. Reporting and Audit", ss["H2"]))
    story.append(Paragraph(
        "Agent shall report closed transactions within seven (7) days of "
        "closing. Platform reserves the right to verify closings against "
        "public records and MLS data. Under-reporting or non-reporting is a "
        "material breach.", ss["Body"]))

    story.append(Paragraph("6. Risk-Free Terms", ss["H2"]))
    story.append(Paragraph(
        "If a lead does not close a transaction, Agent owes the Platform "
        "nothing. There are no cancellation fees or ongoing obligations.",
        ss["Body"]))

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
                            title="AgentEscrow — Client Escrow Consent")
    ss = _base_styles()
    story = []

    story.append(Paragraph("AGENTESCROW", ss["OverLine"]))
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
        "AgentEscrow ('Platform').", ss["Body"]))

    story.append(Paragraph("2. Client Escrow Consent", ss["H2"]))
    story.append(Paragraph(
        "Client acknowledges and irrevocably consents that, at closing of the "
        "resulting real estate transaction, a portion of the referred agent's "
        "commission — equal to <b>six percent (6%) of the agent's Gross "
        "Commission LESS the Broker Fee</b> — will be disbursed by the "
        "closing/settlement agent directly to the Platform out of the same "
        "closing funds. This disbursement <b>does not increase Client's cost</b>; "
        "it is deducted from the agent's commission, not from Client's proceeds "
        "or purchase funds.", ss["Body"]))

    story.append(Paragraph("3. Binding Nature", ss["H2"]))
    story.append(Paragraph(
        "Client agrees this consent is binding and shall be honored as a "
        "written instruction to the closing agent. Client shall not instruct "
        "the closing agent to withhold this disbursement.",
        ss["Body"]))

    story.append(Paragraph("4. No Escrow Service Provided", ss["H2"]))
    story.append(Paragraph(
        "AgentEscrow itself does <b>not</b> act as a licensed escrow holder. "
        "This document is a written disbursement instruction to the closing "
        "or settlement agent of Client's transaction. Actual escrow, title, "
        "and settlement services are performed by a licensed third party of "
        "Client's or Agent's choosing.", ss["Body"]))

    story.append(Paragraph("5. Contingent — No Sale, No Obligation", ss["H2"]))
    story.append(Paragraph(
        "If the transaction does not close, no amount is owed under this "
        "agreement. This is a risk-free lead operation for both Client and Agent.",
        ss["Body"]))

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
