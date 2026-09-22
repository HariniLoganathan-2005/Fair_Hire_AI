"""
FairHire AI — Counterfactual Explanation Generator.

Finds minimal legitimate feature changes that could alter the model's prediction.
Uses actual model predictions — does NOT hard-code results.

Responsible AI Notes:
- Changes are classified as LEGITIMATE, MODEL-SENSITIVE, or NOT RECOMMENDED.
- The system never recommends falsifying employment history.
- Counterfactuals describe model behavior, not instructions to candidates.
"""

import numpy as np
from app.ml.predictor import get_predictor, FEATURE_COLUMNS


# Define perturbation configuration for each feature
PERTURBATION_CONFIG = {
    "skills_match": {
        "steps": [5, 10, 15, 20],
        "direction": "increase",
        "category": "LEGITIMATE",
        "display_name": "Skills Match",
        "action": "Increase verified skills match",
    },
    "experience_years": {
        "steps": [1, 2, 3],
        "direction": "increase",
        "category": "LEGITIMATE",
        "display_name": "Experience",
        "action": "Gain additional work experience",
    },
    "education_match": {
        "steps": [10, 20, 30],
        "direction": "increase",
        "category": "LEGITIMATE",
        "display_name": "Education Match",
        "action": "Complete relevant education/certification",
    },
    "project_count": {
        "steps": [1, 2, 3],
        "direction": "increase",
        "category": "LEGITIMATE",
        "display_name": "Projects",
        "action": "Add relevant verified project",
    },
    "certification_count": {
        "steps": [1, 2],
        "direction": "increase",
        "category": "LEGITIMATE",
        "display_name": "Certifications",
        "action": "Complete skills assessment/certification",
    },
    "career_gap_months": {
        "steps": None,  # special handling: set to 0
        "direction": "decrease",
        "category": "NOT RECOMMENDED",
        "display_name": "Career Gap",
        "action": "Career gap removed",
        "note": "Model counterfactual only. This is NOT a recommendation to alter "
                "or falsify employment history. Career gaps are legitimate life events.",
    },
    "career_gap_count": {
        "steps": None,  # linked to career_gap_months
        "direction": "decrease",
        "category": "NOT RECOMMENDED",
        "display_name": "Career Gap Presence",
        "action": "Career gap flag removed",
        "note": "Linked to career_gap_months counterfactual.",
    },
}


def generate_counterfactuals(features: dict, threshold: float = 0.5) -> dict:
    """
    Generate counterfactual explanations for a screening decision.

    Finds minimal feature changes that could change the outcome.
    All predictions come from the actual model.

    Args:
        features: current candidate feature values
        threshold: screening threshold

    Returns:
        dict with original prediction and list of counterfactual changes
    """
    predictor = get_predictor()
    if not predictor.is_loaded():
        predictor.load()

    # Get original prediction
    original = predictor.predict(features, threshold)
    original_score = original["score"]
    original_decision = original["decision"]

    changes = []

    for feature_name, config in PERTURBATION_CONFIG.items():
        # Skip career_gap_count (it's linked to career_gap_months)
        if feature_name == "career_gap_count":
            continue

        current_value = features.get(feature_name, 0)

        if feature_name == "career_gap_months":
            # Special case: only generate if candidate has a gap
            if current_value > 0:
                variant = features.copy()
                variant["career_gap_months"] = 0
                variant["career_gap_count"] = 0

                new_prediction = predictor.predict(variant, threshold)
                new_score = new_prediction["score"]

                changes.append({
                    "feature": config["display_name"],
                    "feature_key": feature_name,
                    "original_value": round(current_value, 1),
                    "modified_value": 0,
                    "original_score": original_score,
                    "new_score": new_score,
                    "score_change": round(new_score - original_score, 1),
                    "new_decision": new_prediction["decision"],
                    "category": config["category"],
                    "action": config["action"],
                    "note": config.get("note"),
                })
        else:
            # Try each step
            for step in config["steps"]:
                if config["direction"] == "increase":
                    new_value = current_value + step
                else:
                    new_value = max(0, current_value - step)

                # Clip to reasonable bounds
                if feature_name == "skills_match":
                    new_value = min(100, new_value)
                elif feature_name == "education_match":
                    new_value = min(100, new_value)
                elif feature_name == "project_count":
                    new_value = min(15, new_value)
                elif feature_name == "certification_count":
                    new_value = min(10, new_value)

                variant = features.copy()
                variant[feature_name] = new_value

                new_prediction = predictor.predict(variant, threshold)
                new_score = new_prediction["score"]

                # Only include if score actually changes meaningfully
                if abs(new_score - original_score) >= 0.5:
                    changes.append({
                        "feature": config["display_name"],
                        "feature_key": feature_name,
                        "original_value": round(current_value, 1),
                        "modified_value": round(new_value, 1),
                        "original_score": original_score,
                        "new_score": new_score,
                        "score_change": round(new_score - original_score, 1),
                        "new_decision": new_prediction["decision"],
                        "category": config["category"],
                        "action": f"{config['action']} ({current_value:.0f} → {new_value:.0f})",
                        "note": config.get("note"),
                    })
                    break  # Take the smallest effective change per feature

    # Sort: legitimate changes first, then by score impact
    category_order = {"LEGITIMATE": 0, "MODEL-SENSITIVE": 1, "NOT RECOMMENDED": 2}
    changes.sort(key=lambda c: (category_order.get(c["category"], 1), -abs(c["score_change"])))

    return {
        "original_score": original_score,
        "original_decision": original_decision,
        "threshold": threshold,
        "changes": changes,
    }
