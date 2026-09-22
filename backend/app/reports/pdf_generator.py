"""
FairHire AI — PDF Report Generator using ReportLab.

Generates a comprehensive audit report with all sections.
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
import os
from datetime import datetime, timezone


def generate_audit_pdf(report_data: dict, output_path: str) -> str:
    """Generate a PDF audit report from report data."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    doc = SimpleDocTemplate(
        output_path, pagesize=A4,
        rightMargin=20*mm, leftMargin=20*mm,
        topMargin=20*mm, bottomMargin=20*mm
    )

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='Title2', parent=styles['Title'], fontSize=20, spaceAfter=12))
    styles.add(ParagraphStyle(name='Subtitle', parent=styles['Normal'], fontSize=12, textColor=colors.grey, spaceAfter=20, alignment=TA_CENTER))
    styles.add(ParagraphStyle(name='SectionHeader', parent=styles['Heading2'], fontSize=14, spaceAfter=8, spaceBefore=16, textColor=colors.HexColor('#1e40af')))
    styles.add(ParagraphStyle(name='BodyText2', parent=styles['Normal'], fontSize=10, spaceAfter=6, alignment=TA_JUSTIFY))
    styles.add(ParagraphStyle(name='Disclaimer', parent=styles['Normal'], fontSize=9, textColor=colors.grey, spaceAfter=6, fontName='Helvetica-Oblique'))

    elements = []

    # ─── Title Page ─────────────────────────────────────────────────────
    elements.append(Spacer(1, 60))
    elements.append(Paragraph("FairHire AI", styles['Title2']))
    elements.append(Paragraph("Fairness Audit Report", styles['Title']))
    elements.append(Paragraph(
        f"Generated on {datetime.now(timezone.utc).strftime('%B %d, %Y at %H:%M UTC')}",
        styles['Subtitle']
    ))
    elements.append(Spacer(1, 20))

    is_demo = report_data.get("is_demo_data", False)
    if is_demo:
        elements.append(Paragraph(
            "⚠ DEMO DATA — This report uses synthetic/demo data for illustration purposes only. "
            "Results do not represent real hiring outcomes.",
            styles['Disclaimer']
        ))

    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#1e40af')))
    elements.append(Spacer(1, 20))

    # ─── 1. Project Information ─────────────────────────────────────────
    elements.append(Paragraph("1. Project Information", styles['SectionHeader']))
    elements.append(Paragraph(
        "FairHire AI — Auditing and Explaining Career-Gap Bias in AI-Driven Resume Screening. "
        "This system demonstrates responsible AI practices for automated resume screening.",
        styles['BodyText2']
    ))

    # ─── 2. Model Information ──────────────────────────────────────────
    model_info = report_data.get("model_info", {})
    elements.append(Paragraph("2. Model Information", styles['SectionHeader']))
    model_table_data = [
        ["Property", "Value"],
        ["Model", model_info.get("model_name", "Resume Screening v1")],
        ["Type", model_info.get("model_type", "Logistic Regression")],
        ["Version", model_info.get("version", "1.0")],
        ["Features", ", ".join(model_info.get("features", []))],
        ["Threshold", str(report_data.get("threshold", 0.5))],
    ]
    t = Table(model_table_data, colWidths=[120, 350])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('BACKGROUND', (0, 1), (0, -1), colors.HexColor('#f0f4ff')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(t)

    # ─── 3. Dataset Information ────────────────────────────────────────
    elements.append(Paragraph("3. Dataset Information", styles['SectionHeader']))
    elements.append(Paragraph(
        f"Dataset: {report_data.get('dataset_name', 'Synthetic Candidate Dataset')}<br/>"
        f"Total Candidates: {report_data.get('candidate_count', 0)}<br/>"
        f"Candidates with Career Gaps: {report_data.get('candidates_with_gaps', 0)}",
        styles['BodyText2']
    ))

    # ─── 4. Screening Results ──────────────────────────────────────────
    elements.append(Paragraph("4. Screening Results Summary", styles['SectionHeader']))
    screening = report_data.get("screening_summary", {})
    screen_data = [
        ["Metric", "Value"],
        ["Total Screened", str(screening.get("total", 0))],
        ["Shortlisted", str(screening.get("shortlisted", 0))],
        ["Rejected", str(screening.get("rejected", 0))],
        ["Selection Rate", f"{screening.get('selection_rate', 0)*100:.1f}%"],
    ]
    t = Table(screen_data, colWidths=[120, 350])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('BACKGROUND', (0, 1), (0, -1), colors.HexColor('#f0f4ff')),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(t)

    # ─── 5. Career Gap Analysis ────────────────────────────────────────
    elements.append(Paragraph("5. Career Gap Analysis", styles['SectionHeader']))
    fairness = report_data.get("fairness_metrics", {})
    cga = fairness.get("career_gap_analysis", {})
    gap_data = [
        ["Metric", "No Career Gap", "Career Gap"],
        ["Count", str(cga.get("n_without_gap", 0)), str(cga.get("n_with_gap", 0))],
        ["Selection Rate",
         f"{(cga.get('selection_rate_no_gap') or 0)*100:.1f}%",
         f"{(cga.get('selection_rate_gap') or 0)*100:.1f}%"],
        ["Mean Score",
         str(cga.get("mean_score_no_gap", "N/A")),
         str(cga.get("mean_score_gap", "N/A"))],
    ]
    t = Table(gap_data, colWidths=[120, 175, 175])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('BACKGROUND', (0, 1), (0, -1), colors.HexColor('#f0f4ff')),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(t)

    # ─── 6. Fairness Metrics ───────────────────────────────────────────
    elements.append(Paragraph("6. Fairness Metrics", styles['SectionHeader']))
    metrics_data = [
        ["Metric", "Value", "Reference"],
        ["Disparate Impact Ratio",
         str(fairness.get("disparate_impact_ratio", "N/A")),
         "≥ 0.80 (4/5ths rule guideline)"],
        ["Demographic Parity Difference",
         str(fairness.get("demographic_parity_difference", "N/A")),
         "Close to 0 indicates parity"],
    ]
    t = Table(metrics_data, colWidths=[160, 100, 210])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('BACKGROUND', (0, 1), (0, -1), colors.HexColor('#f0f4ff')),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(t)

    # ─── 7. Human Review Statistics ────────────────────────────────────
    elements.append(Paragraph("7. Human Review Statistics", styles['SectionHeader']))
    reviews = report_data.get("human_reviews", {})
    elements.append(Paragraph(
        f"Total cases sent for human review: {reviews.get('total', 0)}<br/>"
        f"Approved: {reviews.get('approved', 0)}<br/>"
        f"Rejected: {reviews.get('rejected', 0)}<br/>"
        f"Skills Assessment Requested: {reviews.get('skills_assessment', 0)}",
        styles['BodyText2']
    ))

    # ─── 8. Limitations ────────────────────────────────────────────────
    elements.append(PageBreak())
    elements.append(Paragraph("8. Limitations", styles['SectionHeader']))
    limitations = [
        "Dataset representativeness — synthetic data does not reflect real-world hiring patterns.",
        "Synthetic demographic data was used for fairness audit demonstration.",
        "Model simplification — Logistic Regression may not capture complex interactions.",
        "Resume parsing errors — regex-based extraction has inherent limitations.",
        "Correlation does not establish causation — observed disparities may have multiple explanations.",
        "Fairness metrics depend on dataset composition and threshold selection.",
        "Counterfactuals describe model behavior and do not establish real-world causality.",
    ]
    for lim in limitations:
        elements.append(Paragraph(f"• {lim}", styles['BodyText2']))

    # ─── 9. Responsible AI Recommendations ─────────────────────────────
    elements.append(Paragraph("9. Responsible AI Recommendations", styles['SectionHeader']))
    recommendations = [
        "Conduct pre-deployment and periodic fairness audits.",
        "Maintain audit logs for AI screening decisions.",
        "Provide meaningful explanations for automated decisions.",
        "Introduce human review for potentially affected candidates.",
        "Use skills-based verification alongside resume screening.",
        "Monitor career-gap-related selection disparities.",
        "Do not encourage candidates to conceal truthful employment history.",
    ]
    for i, rec in enumerate(recommendations, 1):
        elements.append(Paragraph(f"{i}. {rec}", styles['BodyText2']))

    elements.append(Spacer(1, 30))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.grey))
    elements.append(Paragraph(
        "This report was generated by FairHire AI for academic demonstration purposes. "
        "It is not legal advice and should not be treated as a compliance certificate.",
        styles['Disclaimer']
    ))

    # Build PDF
    doc.build(elements)
    return output_path
