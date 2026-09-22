"""
FairHire AI — Synthetic Training Dataset Generator.

Generates a clearly labeled SYNTHETIC dataset for training the resume screening model.
This dataset is for ACADEMIC DEMONSTRATION ONLY and does not represent real hiring data.

Responsible AI Note:
- Demographic attributes are included ONLY for fairness auditing.
- They are NOT used as model training features.
- Career gap is included as a feature so the model can learn from it naturally;
  we do NOT hard-code any penalty. The fairness audit then measures any disparities.
"""

import pandas as pd
import numpy as np
import os
import json


def generate_dataset(n_candidates: int = 200, seed: int = 42, output_dir: str = None):
    """Generate a synthetic candidate dataset for training."""
    np.random.seed(seed)

    if output_dir is None:
        output_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    os.makedirs(output_dir, exist_ok=True)

    # ─── Feature generation ─────────────────────────────────────────────
    # skills_match: 0-100 scale (percentage match with job requirements)
    skills_match = np.clip(np.random.normal(65, 20, n_candidates), 5, 100).round(1)

    # experience_years: 0-20 years
    experience_years = np.clip(np.random.exponential(5, n_candidates), 0.5, 20).round(1)

    # education_match: 0-100 scale
    education_match = np.clip(np.random.normal(60, 25, n_candidates), 0, 100).round(1)

    # project_count: 0-10
    project_count = np.random.poisson(3, n_candidates)
    project_count = np.clip(project_count, 0, 10)

    # certification_count: 0-5
    certification_count = np.random.poisson(1.5, n_candidates)
    certification_count = np.clip(certification_count, 0, 5)

    # career_gap_months: most have 0, some have gaps
    # ~60% no gap, ~20% short gap (1-6), ~12% medium (6-18), ~8% long (18-36)
    gap_type = np.random.choice(
        ["none", "short", "medium", "long"],
        size=n_candidates,
        p=[0.60, 0.20, 0.12, 0.08]
    )
    career_gap_months = np.zeros(n_candidates)
    for i, gt in enumerate(gap_type):
        if gt == "short":
            career_gap_months[i] = np.random.uniform(1, 6)
        elif gt == "medium":
            career_gap_months[i] = np.random.uniform(6, 18)
        elif gt == "long":
            career_gap_months[i] = np.random.uniform(18, 36)
    career_gap_months = career_gap_months.round(1)

    career_gap_count = (career_gap_months > 0).astype(int)

    # ─── Target generation ──────────────────────────────────────────────
    # Generate target based on a latent scoring function.
    # The model will learn this relationship; we don't hard-code the gap penalty.
    # However, the training data may naturally reflect some gap-related patterns
    # (this is what the fairness audit is designed to detect).
    latent_score = (
        0.30 * (skills_match / 100)
        + 0.25 * np.clip(experience_years / 10, 0, 1)
        + 0.15 * (education_match / 100)
        + 0.10 * np.clip(project_count / 5, 0, 1)
        + 0.08 * np.clip(certification_count / 3, 0, 1)
        - 0.08 * np.clip(career_gap_months / 24, 0, 1)  # mild natural correlation
        + np.random.normal(0, 0.08, n_candidates)  # noise
    )

    # Normalize to 0-1 range
    latent_score = np.clip(latent_score, 0, 1)

    # Binary decision at threshold 0.45 (slightly below 0.5 to get ~55% shortlist)
    shortlisted = (latent_score >= 0.45).astype(int)

    # ─── Demographic attributes (AUDIT ONLY) ────────────────────────────
    # These are SYNTHETIC and for fairness audit demonstration ONLY
    demo_gender = np.random.choice(["Male", "Female", "Non-binary"], n_candidates, p=[0.45, 0.45, 0.10])
    demo_age_group = np.random.choice(["18-25", "26-35", "36-45", "46-55", "56+"], n_candidates, p=[0.15, 0.35, 0.25, 0.15, 0.10])

    # ─── Build DataFrame ────────────────────────────────────────────────
    df = pd.DataFrame({
        "candidate_id": range(1, n_candidates + 1),
        "skills_match": skills_match,
        "experience_years": experience_years,
        "education_match": education_match,
        "project_count": project_count,
        "certification_count": certification_count,
        "career_gap_months": career_gap_months,
        "career_gap_count": career_gap_count,
        "shortlisted": shortlisted,
        # Audit-only attributes (NOT model features)
        "demographic_gender": demo_gender,
        "demographic_age_group": demo_age_group,
    })

    # Save dataset
    csv_path = os.path.join(output_dir, "synthetic_candidates.csv")
    df.to_csv(csv_path, index=False)

    # Save dataset card
    dataset_card = {
        "name": "Synthetic Candidate Dataset",
        "description": "SYNTHETIC dataset created for academic demonstration of FairHire AI. "
                       "This data does NOT represent real candidates or real hiring outcomes.",
        "source": "Programmatically generated for Responsible AI coursework",
        "n_records": n_candidates,
        "features": [
            "skills_match", "experience_years", "education_match",
            "project_count", "certification_count",
            "career_gap_months", "career_gap_count"
        ],
        "target": "shortlisted",
        "demographic_attributes": ["demographic_gender", "demographic_age_group"],
        "demographic_note": "SYNTHETIC demographic attributes included ONLY for fairness audit demonstration. "
                            "NOT used as model features. NOT inferred from real candidate data.",
        "limitations": [
            "Entirely synthetic — does not reflect real-world hiring patterns",
            "Latent scoring function is simplified",
            "Demographic attributes are randomly assigned",
            "Career gap effects are artificial correlations",
            "Not suitable for drawing real-world conclusions"
        ],
        "seed": seed,
        "generated_by": "FairHire AI dataset generator"
    }
    card_path = os.path.join(output_dir, "dataset_card.json")
    with open(card_path, "w") as f:
        json.dump(dataset_card, f, indent=2)

    print(f"Generated {n_candidates} candidates -> {csv_path}")
    print(f"Shortlisted: {shortlisted.sum()} ({shortlisted.mean()*100:.1f}%)")
    print(f"Candidates with career gaps: {(career_gap_months > 0).sum()}")
    print(f"Dataset card -> {card_path}")

    return df, csv_path


if __name__ == "__main__":
    generate_dataset()
