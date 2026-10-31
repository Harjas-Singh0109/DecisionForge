import io
import json
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
)
from backend.database import crud

def generate_pdf_report(inv_id: str) -> io.BytesIO:
    inv = crud.get_investigation(inv_id)
    if not inv:
        raise ValueError(f"Investigation {inv_id} not found")

    alternatives = crud.get_alternatives(inv_id)
    scores = crud.get_scores(inv_id)
    network = crud.get_evidence_network(inv_id)
    scenarios = crud.get_scenarios(inv_id)
    agents = crud.get_agents(inv_id)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40, leftMargin=40,
        topMargin=40, bottomMargin=40
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#080B14'),
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=colors.HexColor('#647CFF'),
        textTransform='uppercase',
        spaceAfter=12
    )

    h2_style = ParagraphStyle(
        'Heading2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#101626'),
        spaceBefore=14,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#1e293b'),
        spaceAfter=6
    )

    callout_style = ParagraphStyle(
        'Callout',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#1e1b4b'),
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        fontName='Helvetica-Bold',
        fontSize=8.5,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#0f172a')
    )

    story = []

    # Header
    story.append(Paragraph("DECISIONFORGE INTELLIGENCE BRIEF", subtitle_style))
    story.append(Paragraph(inv.get("question", "Strategic Decision Analysis"), title_style))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#647CFF'), spaceAfter=12))

    # Meta banner
    meta_text = (
        f"<b>Topic:</b> {inv.get('topic') or 'Technology & Policy'} &nbsp;&nbsp;|&nbsp;&nbsp; "
        f"<b>Scope:</b> {inv.get('geographical_scope') or 'National'} &nbsp;&nbsp;|&nbsp;&nbsp; "
        f"<b>Horizon:</b> {inv.get('time_horizon') or '10 Years'} &nbsp;&nbsp;|&nbsp;&nbsp; "
        f"<b>Status:</b> {inv.get('status').upper()}"
    )
    story.append(Paragraph(meta_text, body_style))
    story.append(Spacer(1, 10))

    # 1. Recommendation Box
    rec_text = inv.get("recommendation_reasoning") or inv.get("summary") or "Investigation completed."
    rec_table = Table(
        [[Paragraph(f"<b>STRATEGIC RECOMMENDATION:</b><br/>{rec_text}", callout_style)]],
        colWidths=[530]
    )
    rec_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#e0e7ff')),
        ('BOX', (0,0), (-1,-1), 1.5, colors.HexColor('#647CFF')),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(rec_table)
    story.append(Spacer(1, 14))

    # 2. Competing Alternatives
    story.append(Paragraph("1. Evaluated Alternatives", h2_style))
    for a in alternatives:
        alt_desc = a.get("description") or "Strategic option under evaluation."
        story.append(Paragraph(f"• <b>{a.get('name')}</b>: {alt_desc}", body_style))
    story.append(Spacer(1, 10))

    # 3. Multi-Criteria Scoring Table
    story.append(Paragraph("2. Deterministic Multi-Criteria Decision Evaluation", h2_style))
    if scores:
        score_rows = [[
            Paragraph("Alternative", table_header_style),
            Paragraph("Criterion", table_header_style),
            Paragraph("Weight", table_header_style),
            Paragraph("Raw (1-10)", table_header_style),
            Paragraph("Weighted", table_header_style),
            Paragraph("Justification", table_header_style)
        ]]
        for s in scores:
            score_rows.append([
                Paragraph(s.get("alternative_name", ""), table_cell_style),
                Paragraph(s.get("criterion", ""), table_cell_style),
                Paragraph(f"{int(s.get('criterion_weight', 0)*100)}%", table_cell_style),
                Paragraph(str(s.get("raw_score", 0)), table_cell_style),
                Paragraph(str(s.get("weighted_score", 0)), table_cell_style),
                Paragraph(s.get("explanation", "")[:100], table_cell_style)
            ])
        score_table = Table(score_rows, colWidths=[100, 90, 40, 45, 50, 205])
        score_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#101626')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(score_table)
    else:
        story.append(Paragraph("No scores recorded yet.", body_style))
    story.append(Spacer(1, 14))

    # 4. Evidence & Claim Verification Audit
    story.append(Paragraph("3. Evidence Verification & Source Audit", h2_style))
    claims = network.get("claims", [])
    if claims:
        claim_rows = [[
            Paragraph("Claim", table_header_style),
            Paragraph("Quality Label", table_header_style),
            Paragraph("Status", table_header_style),
            Paragraph("Verification Analysis", table_header_style)
        ]]
        for c in claims[:6]:
            claim_rows.append([
                Paragraph(c.get("claim_text", ""), table_cell_style),
                Paragraph(c.get("evidence_quality", "Unverified"), table_cell_style),
                Paragraph(c.get("verification_status", "pending").upper(), table_cell_style),
                Paragraph(c.get("explanation", "")[:140], table_cell_style)
            ])
        c_table = Table(claim_rows, colWidths=[180, 85, 55, 210])
        c_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e293b')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(c_table)
    story.append(Spacer(1, 14))

    # 5. Critic Agent Challenges & Vulnerabilities
    critic_agent = next((ag for ag in agents if "Critic" in ag.get("agent_name", "")), None)
    if critic_agent and critic_agent.get("output"):
        try:
            crit_data = json.loads(critic_agent["output"])
            story.append(Paragraph("4. Critic Agent: Challenged Premises & Counter-Evidence", h2_style))
            for assump in crit_data.get("challenged_assumptions", []):
                story.append(Paragraph(f"• <b>Challenged Assumption:</b> {assump}", body_style))
            for ce in crit_data.get("counter_evidence", []):
                story.append(Paragraph(f"• <b>Vulnerability [{ce.get('alternative')}]:</b> {ce.get('point')}", body_style))
        except Exception:
            pass
    story.append(Spacer(1, 14))

    # 6. Scenario Lab Simulation
    story.append(Paragraph("5. Scenario Sensitivity Lab ('What Would Change Our Mind?')", h2_style))
    if scenarios:
        for sc in scenarios[:2]:
            story.append(Paragraph(f"<b>Preset Scenario:</b> {sc.get('scenario_name')}", body_style))
            res = sc.get("calculated_results", {})
            desc = res.get("description", "Deterministic sensitivity calculation.")
            story.append(Paragraph(f"<i>Assumptions:</i> {json.dumps(sc.get('assumptions', {}))}", table_cell_style))
            story.append(Paragraph(f"<i>Outcome:</i> {desc}", body_style))
            story.append(Spacer(1, 4))
    story.append(Spacer(1, 14))

    # 7. Citations & References
    story.append(Paragraph("6. Bibliography & Cited Sources", h2_style))
    sources = network.get("sources", [])
    for idx, s in enumerate(sources):
        story.append(Paragraph(
            f"[{idx+1}] <b>{s.get('title')}</b> — {s.get('publisher', 'Registry')} ({s.get('publication_date') or 'Recent'}).<br/>"
            f"<font color='#2563eb'>{s.get('url')}</font>",
            body_style
        ))

    # Build PDF document
    doc.build(story)
    buffer.seek(0)
    return buffer
