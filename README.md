# FairHire AI — Auditing and Explaining Career-Gap Bias in AI-Driven Resume Screening

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg?logo=react)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-5+-646CFF.svg?logo=vite)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4+-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com)
[![SHAP](https://img.shields.io/badge/Explainability-SHAP-FF6F00.svg)](https://shap.readthedocs.io)
[![Fairlearn](https://img.shields.io/badge/Fairness-Fairlearn-4B32C3.svg)](https://fairlearn.org)

**FairHire AI** is an academic Responsible AI (RAI) demonstration platform designed to audit, explain, and mitigate algorithmic bias against candidates with career breaks in AI-driven resume screening pipelines.

---

## 🎯 Key Capabilities & Architecture

- **Transparent Resume Parsing:** PyMuPDF / python-docx extraction of skills, active employment periods, and detection of uninterrupted career gap intervals.
- **ML Screening Pipeline:** Logistic Regression baseline model trained on standardized features (`skills_match`, `experience_years`, `education_match`, `project_count`, `certification_count`, `career_gap_months`).
- **Mathematical SHAP Attributions:** Directional feature contributions plotted via SHAP explainers to justify every classification probability.
- **Fairness & Bias Auditing:** Automated evaluation under the **EEOC Four-Fifths Rule (80% Rule)**, calculating Disparate Impact Ratio and Demographic Parity Difference across employment continuity groups.
- **Controlled Sensitivity Experiment:** Simulates identical candidate credentials with career gap duration set to zero to mathematically measure career-gap penalties.
- **Actionable Counterfactual Recourse ("What-If" Analysis):** Computes minimal feature perturbations needed to achieve a shortlist outcome, categorizing changes into legitimate skill upgrading vs. ethical bias artifacts (erasing life breaks).
- **Human-in-the-Loop Governance:** Smart queue that flags borderline scores and high-skill rejected profiles for accountable human override with compliance logging.
- **Exportable Audit Artifacts:** One-click generation of PDF compliance reports (ReportLab) and raw audit spreadsheets (openpyxl).
- **Model Card & Dataset Card:** Mitchell et al. Model Card and Gebru et al. Dataset Card documentation for viva presentation.

---

## 🚀 Quick Start Guide

### 1. Backend Setup

```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt

# Generate synthetic dataset and train the baseline model:
python ../ml/training/generate_dataset.py
python ../ml/training/train_model.py

# Launch FastAPI backend server:
uvicorn app.main:app --reload --port 8000
```

FastAPI Swagger API docs will be live at: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The web dashboard will be available at: [http://localhost:5173](http://localhost:5173)

---

## 🎓 Academic Demonstration (Viva Flow)

1. **Load Demo Scenario:** Click the **"Load Academic Demo (5 Profiles)"** button in the sidebar or top bar. This seeds 5 representative candidate profiles with varied experience and career gap intervals.
2. **Dashboard Overview:** Inspect KPI cards, the **Disparate Impact Ratio**, and the selection rate chart comparing continuous vs. career-gap cohorts.
3. **Inspect Candidate Profiles:** Navigate to **Candidates** &rarr; select a candidate with a career gap (e.g., *Sarah Jenkins*) to view their employment timeline and score breakdown.
4. **Inspect SHAP Values:** Open **SHAP Explainability** to see positive/negative feature contributions.
5. **Run Fairness Audit:** Navigate to **Fairness Audit** to inspect the **Four-Fifths Rule** compliance card and view the **Controlled Sensitivity Experiment** showing the score penalty.
6. **Simulate Counterfactuals:** Navigate to **Counterfactuals** to view minimal required changes and the ethical disclaimer warning against asking applicants to erase life breaks.
7. **Execute Human Review:** Go to the **Human Review** queue to override an AI rejection based on high skill alignment.
8. **Export Audit Reports:** Navigate to **Audit Reports** to download formal PDF and Excel files.
9. **Review Model & Dataset Cards:** Inspect the **Model Card** and **Dataset Card** tabs for model architecture and provenance.

---

## ⚖️ Responsible AI Notice

This project is created for **academic demonstration and research**. All candidate profiles and training datasets are synthetic and clearly labeled as **DEMO / ILLUSTRATIVE**. Real hiring decisions should never be automated without human oversight and continuous fairness audits.
