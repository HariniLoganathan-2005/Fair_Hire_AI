"""
FairHire AI — Model Training Script.

Trains a Logistic Regression model for resume screening demonstration.
The model is intentionally transparent and explainable.

Responsible AI Note:
- Only uses legitimate screening features (skills, experience, education, etc.)
- Protected/demographic attributes are EXCLUDED from training features
- Career gap is included as a feature so the fairness audit can measure its effect
- We do NOT hard-code a career gap penalty
"""

import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report
import joblib
import json
import os
from datetime import datetime, timezone


# Feature columns used by the model
FEATURE_COLUMNS = [
    "skills_match",
    "experience_years",
    "education_match",
    "project_count",
    "certification_count",
    "career_gap_months",
    "career_gap_count",
]

TARGET_COLUMN = "shortlisted"

# Columns that are NEVER used as model features (audit only)
PROTECTED_COLUMNS = ["demographic_gender", "demographic_age_group"]


def train_model(data_path: str = None, output_dir: str = None, test_size: float = 0.2, seed: int = 42):
    """Train Logistic Regression model and save artifacts."""

    if data_path is None:
        data_path = os.path.join(os.path.dirname(__file__), "..", "data", "synthetic_candidates.csv")
    if output_dir is None:
        output_dir = os.path.join(os.path.dirname(__file__), "..", "models")
    os.makedirs(output_dir, exist_ok=True)

    # ─── Load data ──────────────────────────────────────────────────────
    print(f"Loading dataset from {data_path}")
    df = pd.read_csv(data_path)
    print(f"Dataset shape: {df.shape}")

    # ─── Responsible AI check: exclude protected attributes ─────────────
    for col in PROTECTED_COLUMNS:
        if col in FEATURE_COLUMNS:
            raise ValueError(
                f"RESPONSIBLE AI VIOLATION: Protected attribute '{col}' "
                f"must not be in FEATURE_COLUMNS. Remove it."
            )

    # ─── Prepare features and target ────────────────────────────────────
    X = df[FEATURE_COLUMNS].copy()
    y = df[TARGET_COLUMN].copy()

    print(f"\nFeatures: {FEATURE_COLUMNS}")
    print(f"Target: {TARGET_COLUMN}")
    print(f"Class distribution:\n{y.value_counts()}")

    # ─── Train/test split ───────────────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=seed, stratify=y
    )
    print(f"\nTrain: {len(X_train)}, Test: {len(X_test)}")

    # ─── Preprocessing ──────────────────────────────────────────────────
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # ─── Train model ────────────────────────────────────────────────────
    model = LogisticRegression(
        random_state=seed,
        max_iter=1000,
        C=1.0,
        solver="lbfgs",
    )
    model.fit(X_train_scaled, y_train)

    # ─── Evaluate ───────────────────────────────────────────────────────
    y_pred = model.predict(X_test_scaled)
    y_prob = model.predict_proba(X_test_scaled)[:, 1]

    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)

    print(f"\n{'='*50}")
    print("MODEL EVALUATION")
    print(f"{'='*50}")
    print(f"Accuracy:  {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    print(f"\n{classification_report(y_test, y_pred, target_names=['Rejected', 'Shortlisted'])}")

    # ─── Model coefficients (transparency) ──────────────────────────────
    coefficients = dict(zip(FEATURE_COLUMNS, model.coef_[0].tolist()))
    print("\nModel Coefficients (standardized features):")
    for feat, coef in sorted(coefficients.items(), key=lambda x: abs(x[1]), reverse=True):
        print(f"  {feat:25s}: {coef:+.4f}")
    print(f"  {'intercept':25s}: {model.intercept_[0]:+.4f}")

    # ─── Save artifacts ─────────────────────────────────────────────────
    model_path = os.path.join(output_dir, "model.joblib")
    preprocessor_path = os.path.join(output_dir, "preprocessor.joblib")
    metadata_path = os.path.join(output_dir, "model_metadata.json")

    joblib.dump(model, model_path)
    joblib.dump(scaler, preprocessor_path)

    metadata = {
        "model_name": "Resume Screening v1",
        "model_type": "LogisticRegression",
        "version": "1.0",
        "training_date": datetime.now(timezone.utc).isoformat(),
        "dataset_name": "Synthetic Candidate Dataset",
        "dataset_note": "SYNTHETIC dataset for academic demonstration only",
        "features": FEATURE_COLUMNS,
        "target": TARGET_COLUMN,
        "protected_attributes_excluded": PROTECTED_COLUMNS,
        "default_threshold": 0.5,
        "metrics": {
            "accuracy": round(accuracy, 4),
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
        },
        "coefficients": {k: round(v, 4) for k, v in coefficients.items()},
        "intercept": round(model.intercept_[0], 4),
        "train_size": len(X_train),
        "test_size": len(X_test),
        "scaler": "StandardScaler",
        "random_seed": seed,
        "limitations": [
            "Trained on synthetic data — not representative of real hiring",
            "Simple Logistic Regression — may not capture complex patterns",
            "Career gap feature may correlate with protected attributes in real data",
            "Feature engineering is simplified for demonstration purposes",
            "Threshold choice significantly affects selection rates and fairness metrics"
        ],
        "responsible_ai_notes": [
            "Protected attributes are excluded from model features",
            "Career gap is included as a feature for transparency — its effect is measured in fairness audit",
            "Model coefficients are exposed for interpretability",
            "SHAP explanations are available for individual predictions",
            "This model is for academic demonstration only"
        ]
    }

    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\nSaved model -> {model_path}")
    print(f"Saved preprocessor -> {preprocessor_path}")
    print(f"Saved metadata -> {metadata_path}")

    return model, scaler, metadata


if __name__ == "__main__":
    # First generate dataset if it doesn't exist
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "synthetic_candidates.csv")
    if not os.path.exists(data_path):
        print("Dataset not found. Generating...")
        from generate_dataset import generate_dataset
        generate_dataset()
        print()

    train_model()
