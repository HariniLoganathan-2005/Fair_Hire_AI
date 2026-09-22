"""
FairHire AI — FastAPI Application Entry Point.

Main application setup with CORS, routing, and database initialization.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from dotenv import load_dotenv
load_dotenv()

from app.database.database import init_db
from app.api import jobs, resumes, candidates, screening, explanations, fairness, counterfactual, reviews, reports, demo, dashboard


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup/shutdown lifecycle."""
    # Startup
    init_db()
    os.makedirs(os.getenv("UPLOAD_DIR", "./uploads"), exist_ok=True)
    os.makedirs("./reports_output", exist_ok=True)

    # Try to load the ML model
    try:
        from app.ml.predictor import get_predictor
        predictor = get_predictor()
        if predictor.is_loaded():
            print("✓ ML model loaded successfully")
        else:
            print("⚠ ML model not found — run training script first")
    except Exception as e:
        print(f"⚠ ML model loading issue: {e}")

    yield
    # Shutdown (cleanup if needed)


app = FastAPI(
    title="FairHire AI",
    description=(
        "AI Resume Screening with Fairness Auditing and Explainable Decisions. "
        "Academic Responsible AI demonstration platform."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["Jobs"])
app.include_router(resumes.router, prefix="/api/resumes", tags=["Resumes"])
app.include_router(candidates.router, prefix="/api/candidates", tags=["Candidates"])
app.include_router(screening.router, prefix="/api/screening", tags=["Screening"])
app.include_router(explanations.router, prefix="/api/explanations", tags=["Explanations"])
app.include_router(fairness.router, prefix="/api/fairness", tags=["Fairness"])
app.include_router(counterfactual.router, prefix="/api/counterfactual", tags=["Counterfactual"])
app.include_router(reviews.router, prefix="/api/reviews", tags=["Human Reviews"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(demo.router, prefix="/api/demo", tags=["Demo"])


@app.get("/api/health")
def health_check():
    from app.ml.predictor import get_predictor
    predictor = get_predictor()
    return {
        "status": "healthy",
        "model_loaded": predictor.is_loaded(),
        "version": "1.0.0"
    }
