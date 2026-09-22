"""
FairHire AI — Excel Report Generator using openpyxl.

Exports candidate screening results and fairness metrics to Excel.
"""

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
import os


HEADER_FILL = PatternFill(start_color="1E40AF", end_color="1E40AF", fill_type="solid")
HEADER_FONT = Font(color="FFFFFF", bold=True, size=11)
CELL_FONT = Font(size=10)
THIN_BORDER = Border(
    left=Side(style='thin', color='CCCCCC'),
    right=Side(style='thin', color='CCCCCC'),
    top=Side(style='thin', color='CCCCCC'),
    bottom=Side(style='thin', color='CCCCCC'),
)


def _style_header(ws, row, max_col):
    for col in range(1, max_col + 1):
        cell = ws.cell(row=row, column=col)
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.alignment = Alignment(horizontal='center')
        cell.border = THIN_BORDER


def generate_excel_report(report_data: dict, output_path: str) -> str:
    """Generate an Excel report with candidate results and fairness metrics."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    wb = Workbook()

    # ─── Sheet 1: Screening Results ─────────────────────────────────────
    ws = wb.active
    ws.title = "Screening Results"

    headers = ["Candidate", "Experience (yrs)", "Skills Match", "Education Match",
               "Projects", "Certifications", "Career Gap (months)", "AI Score", "Decision"]
    for col, header in enumerate(headers, 1):
        ws.cell(row=1, column=col, value=header)
    _style_header(ws, 1, len(headers))

    candidates = report_data.get("candidates", [])
    for i, c in enumerate(candidates, 2):
        features = c.get("features", {})
        ws.cell(row=i, column=1, value=c.get("name", f"Candidate {i-1}"))
        ws.cell(row=i, column=2, value=features.get("experience_years", 0))
        ws.cell(row=i, column=3, value=features.get("skills_match", 0))
        ws.cell(row=i, column=4, value=features.get("education_match", 0))
        ws.cell(row=i, column=5, value=features.get("project_count", 0))
        ws.cell(row=i, column=6, value=features.get("certification_count", 0))
        ws.cell(row=i, column=7, value=features.get("career_gap_months", 0))
        ws.cell(row=i, column=8, value=c.get("score", 0))
        ws.cell(row=i, column=9, value=c.get("decision", ""))
        for col in range(1, len(headers) + 1):
            ws.cell(row=i, column=col).font = CELL_FONT
            ws.cell(row=i, column=col).border = THIN_BORDER

    # Auto-width
    for col in range(1, len(headers) + 1):
        ws.column_dimensions[chr(64 + col)].width = 18

    # ─── Sheet 2: Fairness Metrics ──────────────────────────────────────
    ws2 = wb.create_sheet("Fairness Metrics")
    fairness = report_data.get("fairness_metrics", {})

    metrics = [
        ["Metric", "Value", "Reference"],
        ["Total Candidates", str(fairness.get("candidate_count", 0)), ""],
        ["Threshold", str(fairness.get("threshold_used", 0.5)), ""],
        ["Overall Selection Rate", f"{(fairness.get('overall_selection_rate') or 0)*100:.1f}%", ""],
        ["Selection Rate (No Gap)", f"{(fairness.get('selection_rate_no_gap') or 0)*100:.1f}%", ""],
        ["Selection Rate (Career Gap)", f"{(fairness.get('selection_rate_gap') or 0)*100:.1f}%", ""],
        ["Disparate Impact Ratio", str(fairness.get("disparate_impact_ratio", "N/A")), "≥ 0.80 (4/5ths rule)"],
        ["Demographic Parity Difference", str(fairness.get("demographic_parity_difference", "N/A")), "Close to 0"],
    ]

    for i, row in enumerate(metrics, 1):
        for j, val in enumerate(row, 1):
            ws2.cell(row=i, column=j, value=val)
            if i > 1:
                ws2.cell(row=i, column=j).font = CELL_FONT
                ws2.cell(row=i, column=j).border = THIN_BORDER
    _style_header(ws2, 1, 3)

    for col in range(1, 4):
        ws2.column_dimensions[chr(64 + col)].width = 30

    # ─── Sheet 3: Disclaimer ────────────────────────────────────────────
    ws3 = wb.create_sheet("Disclaimer")
    is_demo = report_data.get("is_demo_data", False)
    disclaimers = [
        "FairHire AI — Audit Report",
        "",
        f"Generated: {report_data.get('generated_at', 'N/A')}",
        f"Data Type: {'DEMO/SYNTHETIC DATA' if is_demo else 'Research Data'}",
        "",
        "DISCLAIMER:",
        "This report is generated for academic demonstration purposes only.",
        "Results from synthetic data do not represent real hiring outcomes.",
        "Fairness metrics depend on dataset composition and threshold selection.",
        "This is not legal advice or a compliance certificate.",
    ]
    for i, line in enumerate(disclaimers, 1):
        ws3.cell(row=i, column=1, value=line)
        ws3.cell(row=i, column=1).font = CELL_FONT

    wb.save(output_path)
    return output_path
