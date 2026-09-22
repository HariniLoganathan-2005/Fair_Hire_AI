"""
FairHire AI — ML Prediction Service.

Loads the trained model and generates screening scores for candidates.
Scores come from the actual model — nothing is hard-coded.
"""

import joblib
import numpy as np
import json
import os
from typing import Optional


FEATURE_COLUMNS = [
    "skills_match",
    "experience_years",
    "education_match",
    "project_count",
    "certification_count",
    "career_gap_months",
    "career_gap_count",
]


class Predictor:
    """Loads a trained model and generates predictions."""

    def __init__(self, model_path: str = None, preprocessor_path: str = None, metadata_path: str = None):
        possible_dirs = [
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "models")),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "ml", "models")),
            os.path.abspath(os.path.join(os.getcwd(), "..", "ml", "models")),
            os.path.abspath(os.path.join(os.getcwd(), "ml", "models")),
        ]
        base_dir = next((d for d in possible_dirs if os.path.exists(d)), possible_dirs[0])
        self.model_path = model_path or os.path.join(base_dir, "model.joblib")
        self.preprocessor_path = preprocessor_path or os.path.join(base_dir, "preprocessor.joblib")
        self.metadata_path = metadata_path or os.path.join(base_dir, "model_metadata.json")

        self.model = None
        self.preprocessor = None
        self.metadata = None
        self._loaded = False

    def load(self):
        """Load model artifacts from disk."""
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(
                f"Model not found at {self.model_path}. "
                "Run the training script first: python ml/training/train_model.py"
            )

        self.model = joblib.load(self.model_path)
        self.preprocessor = joblib.load(self.preprocessor_path)

        with open(self.metadata_path, "r") as f:
            self.metadata = json.load(f)

        self._loaded = True

    def is_loaded(self) -> bool:
        return self._loaded

    def predict(self, features: dict, threshold: float = 0.5) -> dict:
        """
        Generate screening prediction for a single candidate.

        Args:
            features: dict with keys matching FEATURE_COLUMNS
            threshold: decision threshold (default 0.5)

        Returns:
            dict with score, decision, probability, features_used
        """
        if not self._loaded:
            self.load()

        # Build feature vector in correct order
        feature_vector = np.array([[features.get(col, 0) for col in FEATURE_COLUMNS]])

        # Scale features
        scaled = self.preprocessor.transform(feature_vector)

        # Get probability
        probability = self.model.predict_proba(scaled)[0, 1]

        # Score = probability * 100
        score = round(probability * 100, 1)

        # Decision based on threshold
        decision = "SHORTLISTED" if probability >= threshold else "REJECTED"

        return {
            "score": score,
            "decision": decision,
            "probability": round(probability, 4),
            "threshold_used": threshold,
            "features_used": {col: features.get(col, 0) for col in FEATURE_COLUMNS},
        }

    def predict_batch(self, candidates_features: list[dict], threshold: float = 0.5) -> list[dict]:
        """Generate predictions for multiple candidates."""
        if not self._loaded:
            self.load()

        results = []
        for features in candidates_features:
            result = self.predict(features, threshold)
            results.append(result)
        return results

    def get_coefficients(self) -> dict:
        """Return model coefficients for transparency."""
        if not self._loaded:
            self.load()

        coefficients = dict(zip(FEATURE_COLUMNS, self.model.coef_[0].tolist()))
        coefficients["intercept"] = self.model.intercept_[0]
        return {k: round(v, 4) for k, v in coefficients.items()}

    def get_metadata(self) -> dict:
        """Return model metadata."""
        if not self._loaded:
            self.load()
        return self.metadata or {}


# Singleton instance
_predictor: Optional[Predictor] = None


def get_predictor() -> Predictor:
    """Get or create the singleton predictor instance."""
    global _predictor
    if _predictor is None:
        _predictor = Predictor()
        try:
            _predictor.load()
        except FileNotFoundError:
            pass  # Model not trained yet — will fail on first prediction
    return _predictor
