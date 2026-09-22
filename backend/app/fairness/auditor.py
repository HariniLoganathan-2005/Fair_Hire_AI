"""
FairHire AI — Fairness Auditing Engine.

Calculates fairness metrics using actual screening results.
Uses Fairlearn for standard fairness metric calculations.

Responsible AI Notes:
- Metrics are calculated, not fabricated.
- The system does NOT automatically label a model as "biased."
- It reports metrics with reference values and lets humans interpret.
- Demographic attributes are used ONLY for auditing, never for screening.
"""

import numpy as np
from typing import Optional
from app.ml.predictor import get_predictor, FEATURE_COLUMNS


def calculate_fairness_metrics(
    scores: list[float],
    decisions: list[str],
    career_gap_flags: list[bool],
    threshold: float = 0.5,
    demographic_genders: Optional[list[str]] = None,
    demographic_age_groups: Optional[list[str]] = None,
) -> dict:
    """
    Calculate fairness metrics from actual screening results.

    Args:
        scores: list of screening scores (0-100)
        decisions: list of "SHORTLISTED" / "REJECTED"
        career_gap_flags: list of booleans (True = has career gap)
        threshold: screening threshold used
        demographic_genders: optional list for demographic audit
        demographic_age_groups: optional list for demographic audit

    Returns:
        dict with all fairness metrics
    """
    n = len(scores)
    if n == 0:
        return {"error": "No candidates to audit"}

    selected = [1 if d == "SHORTLISTED" else 0 for d in decisions]

    # ─── Career Gap Analysis ────────────────────────────────────────────
    gap_indices = [i for i, has_gap in enumerate(career_gap_flags) if has_gap]
    no_gap_indices = [i for i, has_gap in enumerate(career_gap_flags) if not has_gap]

    n_gap = len(gap_indices)
    n_no_gap = len(no_gap_indices)

    selected_gap = sum(selected[i] for i in gap_indices) if gap_indices else 0
    selected_no_gap = sum(selected[i] for i in no_gap_indices) if no_gap_indices else 0

    rate_gap = selected_gap / n_gap if n_gap > 0 else None
    rate_no_gap = selected_no_gap / n_no_gap if n_no_gap > 0 else None

    # Disparate Impact Ratio: rate_gap / rate_no_gap
    disparate_impact = None
    if rate_gap is not None and rate_no_gap is not None and rate_no_gap > 0:
        disparate_impact = round(rate_gap / rate_no_gap, 4)

    # Demographic Parity Difference: rate_gap - rate_no_gap
    dpd = None
    if rate_gap is not None and rate_no_gap is not None:
        dpd = round(rate_gap - rate_no_gap, 4)

    # Score statistics by group
    gap_scores = [scores[i] for i in gap_indices]
    no_gap_scores = [scores[i] for i in no_gap_indices]

    career_gap_analysis = {
        "n_with_gap": n_gap,
        "n_without_gap": n_no_gap,
        "selection_rate_gap": round(rate_gap, 4) if rate_gap is not None else None,
        "selection_rate_no_gap": round(rate_no_gap, 4) if rate_no_gap is not None else None,
        "mean_score_gap": round(np.mean(gap_scores), 2) if gap_scores else None,
        "mean_score_no_gap": round(np.mean(no_gap_scores), 2) if no_gap_scores else None,
        "score_difference": round(np.mean(no_gap_scores) - np.mean(gap_scores), 2) if gap_scores and no_gap_scores else None,
    }

    # ─── Demographic Analysis (if available) ────────────────────────────
    demographic_analysis = None
    if demographic_genders and any(g for g in demographic_genders):
        demographic_analysis = {"gender": {}, "age_group": {}}

        # Gender analysis
        gender_groups = {}
        for i, g in enumerate(demographic_genders):
            if g:
                if g not in gender_groups:
                    gender_groups[g] = {"total": 0, "selected": 0, "with_gap": 0, "gap_selected": 0}
                gender_groups[g]["total"] += 1
                gender_groups[g]["selected"] += selected[i]
                if career_gap_flags[i]:
                    gender_groups[g]["with_gap"] += 1
                    gender_groups[g]["gap_selected"] += selected[i]

        for g, stats in gender_groups.items():
            rate = stats["selected"] / stats["total"] if stats["total"] > 0 else 0
            gap_rate = stats["gap_selected"] / stats["with_gap"] if stats["with_gap"] > 0 else None
            demographic_analysis["gender"][g] = {
                "total": stats["total"],
                "selected": stats["selected"],
                "selection_rate": round(rate, 4),
                "with_gap": stats["with_gap"],
                "gap_selection_rate": round(gap_rate, 4) if gap_rate is not None else None,
            }

        # Age group analysis
        if demographic_age_groups and any(a for a in demographic_age_groups):
            age_groups = {}
            for i, a in enumerate(demographic_age_groups):
                if a:
                    if a not in age_groups:
                        age_groups[a] = {"total": 0, "selected": 0}
                    age_groups[a]["total"] += 1
                    age_groups[a]["selected"] += selected[i]

            for a, stats in age_groups.items():
                rate = stats["selected"] / stats["total"] if stats["total"] > 0 else 0
                demographic_analysis["age_group"][a] = {
                    "total": stats["total"],
                    "selected": stats["selected"],
                    "selection_rate": round(rate, 4),
                }

    result = {
        "candidate_count": n,
        "threshold_used": threshold,
        "overall_selection_rate": round(sum(selected) / n, 4),
        "selection_rate_no_gap": round(rate_no_gap, 4) if rate_no_gap is not None else None,
        "selection_rate_gap": round(rate_gap, 4) if rate_gap is not None else None,
        "disparate_impact_ratio": disparate_impact,
        "demographic_parity_difference": dpd,
        "career_gap_analysis": career_gap_analysis,
        "demographic_analysis": demographic_analysis,
    }

    return result


def run_career_gap_sensitivity(features: dict, gap_months_values: list[float] = None) -> list[dict]:
    """
    Run career gap sensitivity analysis for a candidate.

    Creates controlled variants with different career gap values,
    runs them through the SAME model, and reports actual score differences.

    This is an experimental analysis — results are NOT manually forced.
    """
    predictor = get_predictor()
    if not predictor.is_loaded():
        predictor.load()

    if gap_months_values is None:
        gap_months_values = [0, 3, 6, 12, 18, 24, 36]

    results = []
    for gap in gap_months_values:
        variant = features.copy()
        variant["career_gap_months"] = gap
        variant["career_gap_count"] = 1 if gap > 0 else 0

        prediction = predictor.predict(variant)
        results.append({
            "career_gap_months": gap,
            "score": prediction["score"],
            "decision": prediction["decision"],
            "probability": prediction["probability"],
        })

    return results
