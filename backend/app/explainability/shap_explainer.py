"""
FairHire AI — SHAP Explainability Service.

Generates SHAP explanations for individual model predictions.
All values come from the actual model — nothing is fabricated.

Responsible AI Note:
- SHAP values explain what the model learned, not ground truth causality.
- A high negative SHAP value for career_gap means the model penalizes it,
  which is exactly what the fairness audit is designed to detect.
"""

import shap
import numpy as np
from typing import Optional
from app.ml.predictor import get_predictor, FEATURE_COLUMNS


# Human-readable feature names for explanations
FEATURE_DISPLAY_NAMES = {
    "skills_match": "Skills Match",
    "experience_years": "Experience",
    "education_match": "Education",
    "project_count": "Projects",
    "certification_count": "Certifications",
    "career_gap_months": "Career Gap (months)",
    "career_gap_count": "Career Gap Presence",
}


class ShapExplainer:
    """Generates SHAP explanations for screening decisions."""

    def __init__(self):
        self._explainer = None
        self._background_data = None

    def _ensure_explainer(self):
        """Create SHAP explainer if not already initialized."""
        if self._explainer is not None:
            return

        predictor = get_predictor()
        if not predictor.is_loaded():
            predictor.load()

        import pandas as pd

        # Create a small background dataset for SHAP
        # Using synthetic representative samples with named columns to match fitted scaler
        np.random.seed(42)
        n_background = 100
        bg_array = np.column_stack([
            np.clip(np.random.normal(65, 20, n_background), 5, 100),   # skills_match
            np.clip(np.random.exponential(5, n_background), 0.5, 20),  # experience_years
            np.clip(np.random.normal(60, 25, n_background), 0, 100),   # education_match
            np.random.poisson(3, n_background),                         # project_count
            np.random.poisson(1.5, n_background),                       # certification_count
            np.clip(np.random.exponential(3, n_background), 0, 36),    # career_gap_months
            (np.random.random(n_background) > 0.6).astype(float),     # career_gap_count
        ])
        self._background_data = pd.DataFrame(bg_array, columns=FEATURE_COLUMNS)

        # Scale background data (no warning: named columns match fitted scaler)
        bg_scaled = predictor.preprocessor.transform(self._background_data)

        # Use LinearExplainer for Logistic Regression (faster, exact)
        self._explainer = shap.LinearExplainer(predictor.model, bg_scaled)


    def explain(self, features: dict) -> dict:
        """
        Generate SHAP explanation for a single candidate.

        Returns:
            dict with feature_contributions, top_positive, top_negative, natural_language
        """
        self._ensure_explainer()
        predictor = get_predictor()

        import pandas as pd
        # Build feature vector
        df = pd.DataFrame([[features.get(col, 0) for col in FEATURE_COLUMNS]], columns=FEATURE_COLUMNS)
        scaled = predictor.preprocessor.transform(df)

        # Compute SHAP values
        shap_values = self._explainer.shap_values(scaled)

        # For binary classification, shap_values may be a list [class0, class1]
        if isinstance(shap_values, list):
            sv = shap_values[1][0]  # class 1 (shortlisted) SHAP values
        elif len(shap_values.shape) == 3:
            sv = shap_values[0, :, 1]
        else:
            sv = shap_values[0]

        # Build contribution dict
        contributions = {}
        for i, col in enumerate(FEATURE_COLUMNS):
            contributions[col] = round(float(sv[i]), 4)

        # Sort by absolute value
        sorted_features = sorted(contributions.items(), key=lambda x: abs(x[1]), reverse=True)

        # Top positive and negative contributors
        top_positive = [
            {"feature": FEATURE_DISPLAY_NAMES.get(f, f), "feature_key": f, "value": v}
            for f, v in sorted_features if v > 0
        ]
        top_negative = [
            {"feature": FEATURE_DISPLAY_NAMES.get(f, f), "feature_key": f, "value": v}
            for f, v in sorted_features if v < 0
        ]

        # Generate natural-language explanation from actual SHAP values
        natural_language = self._generate_explanation(contributions, features, predictor)

        # Also include model coefficients for additional transparency
        coefficients = predictor.get_coefficients()

        return {
            "feature_contributions": contributions,
            "top_positive": top_positive,
            "top_negative": top_negative,
            "natural_language": natural_language,
            "model_coefficients": coefficients,
        }

    def _generate_explanation(self, contributions: dict, features: dict, predictor) -> str:
        """Generate a natural-language explanation from actual SHAP values."""
        prediction = predictor.predict(features)
        score = prediction["score"]
        decision = prediction["decision"]

        sorted_contribs = sorted(contributions.items(), key=lambda x: abs(x[1]), reverse=True)

        # Top positive
        positives = [(f, v) for f, v in sorted_contribs if v > 0.01]
        negatives = [(f, v) for f, v in sorted_contribs if v < -0.01]

        parts = [f"The model assigned a score of {score}/100, resulting in a {decision} decision."]

        if positives:
            pos_names = [FEATURE_DISPLAY_NAMES.get(f, f) for f, _ in positives[:3]]
            parts.append(
                f"The prediction was influenced positively by {', '.join(pos_names)}."
            )

        if negatives:
            neg_names = [FEATURE_DISPLAY_NAMES.get(f, f) for f, _ in negatives[:3]]
            parts.append(
                f"Features that contributed negatively include {', '.join(neg_names)}."
            )

        # Add specific career gap note if relevant
        gap_contrib = contributions.get("career_gap_months", 0)
        gap_months = features.get("career_gap_months", 0)
        if gap_months > 0 and gap_contrib < -0.02:
            parts.append(
                f"The candidate's career gap of {gap_months:.0f} months had a negative "
                f"contribution (SHAP value: {gap_contrib:+.3f}). This reflects the model's "
                f"learned association and may warrant fairness review."
            )

        return " ".join(parts)


# Singleton
_explainer: Optional[ShapExplainer] = None


def get_shap_explainer() -> ShapExplainer:
    global _explainer
    if _explainer is None:
        _explainer = ShapExplainer()
    return _explainer
