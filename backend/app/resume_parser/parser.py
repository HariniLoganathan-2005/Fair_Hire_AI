"""
FairHire AI — Resume Parser.

Extracts text and structured information from PDF and DOCX resumes.
Uses regex-based extraction for demonstration purposes.

Privacy Note: Resume contents are processed in-memory where possible.
Uploaded files are stored in a controlled local directory only.
"""

import re
import os
from datetime import datetime
from typing import Optional
from dateutil import parser as dateutil_parser


def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from a PDF file using PyMuPDF."""
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text.strip()
    except Exception as e:
        return f"[PDF extraction error: {str(e)}]"


def extract_text_from_docx(file_path: str) -> str:
    """Extract text from a DOCX file using python-docx."""
    try:
        from docx import Document
        doc = Document(file_path)
        text = "\n".join(paragraph.text for paragraph in doc.paragraphs)
        return text.strip()
    except Exception as e:
        return f"[DOCX extraction error: {str(e)}]"


def extract_text(file_path: str) -> str:
    """Extract text from a resume file (PDF or DOCX)."""
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext in (".docx", ".doc"):
        return extract_text_from_docx(file_path)
    else:
        raise ValueError(f"Unsupported file type: {ext}. Supported: .pdf, .docx")


def extract_email(text: str) -> Optional[str]:
    """Extract email address from text."""
    match = re.search(r'[\w.+-]+@[\w-]+\.[\w.-]+', text)
    return match.group(0) if match else None


def extract_phone(text: str) -> Optional[str]:
    """Extract phone number from text."""
    match = re.search(r'[\+]?[(]?[0-9]{1,4}[)]?[-\s\./0-9]{7,15}', text)
    return match.group(0).strip() if match else None


def extract_name(text: str) -> str:
    """Extract candidate name (first non-empty line, heuristic)."""
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    if lines:
        # Take the first line that looks like a name (no special chars, short)
        for line in lines[:5]:
            cleaned = re.sub(r'[^a-zA-Z\s\.\-]', '', line).strip()
            if cleaned and len(cleaned.split()) <= 5 and len(cleaned) > 2:
                return cleaned
    return "Unknown Candidate"


def extract_skills(text: str) -> list[str]:
    """Extract skills from text using keyword matching."""
    common_skills = [
        "Python", "Java", "JavaScript", "TypeScript", "C++", "C#", "Go", "Rust", "Ruby",
        "SQL", "NoSQL", "MongoDB", "PostgreSQL", "MySQL", "SQLite", "Redis",
        "React", "Angular", "Vue", "Node.js", "Express", "Django", "Flask", "FastAPI",
        "Machine Learning", "Deep Learning", "NLP", "Computer Vision", "AI",
        "TensorFlow", "PyTorch", "Keras", "Scikit-learn", "Pandas", "NumPy",
        "AWS", "Azure", "GCP", "Docker", "Kubernetes", "CI/CD", "Git",
        "HTML", "CSS", "REST", "GraphQL", "API",
        "Statistics", "Data Analysis", "Data Science", "Data Engineering",
        "Agile", "Scrum", "Project Management", "Leadership",
        "Communication", "Problem Solving", "Teamwork",
        "Excel", "Tableau", "Power BI", "MATLAB", "R",
    ]

    found = []
    text_lower = text.lower()
    for skill in common_skills:
        if skill.lower() in text_lower:
            found.append(skill)
    return found


def extract_education(text: str) -> tuple[str, str]:
    """Extract education information and level."""
    education_text = ""
    education_level = "Unknown"

    # Look for education section
    sections = re.split(r'\n(?:EDUCATION|Education|Academic|ACADEMIC)', text, maxsplit=1)
    if len(sections) > 1:
        edu_section = sections[1].split('\n\n')[0]  # Take first paragraph after heading
        education_text = edu_section.strip()[:500]

    # Determine education level
    text_lower = text.lower()
    if any(term in text_lower for term in ["ph.d", "phd", "doctorate", "doctoral"]):
        education_level = "PhD"
    elif any(term in text_lower for term in ["master", "m.s.", "m.sc", "mba", "m.tech"]):
        education_level = "Master's"
    elif any(term in text_lower for term in ["bachelor", "b.s.", "b.sc", "b.tech", "b.e.", "bba"]):
        education_level = "Bachelor's"
    elif any(term in text_lower for term in ["associate", "diploma"]):
        education_level = "Associate"
    elif any(term in text_lower for term in ["high school", "secondary"]):
        education_level = "High School"

    return education_text, education_level


def extract_dates(text: str) -> list[tuple[Optional[str], Optional[str], str]]:
    """Extract employment date ranges from text. Returns (start, end, context)."""
    date_patterns = [
        # "Jan 2020 - Dec 2022" or "January 2020 - Present"
        r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*[\s,]*\d{4})\s*[-–—to]+\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*[\s,]*\d{4}|[Pp]resent|[Cc]urrent)',
        # "2020 - 2022" or "2020-Present"
        r'(\d{4})\s*[-–—to]+\s*(\d{4}|[Pp]resent|[Cc]urrent)',
        # "MM/YYYY - MM/YYYY"
        r'(\d{1,2}/\d{4})\s*[-–—to]+\s*(\d{1,2}/\d{4}|[Pp]resent|[Cc]urrent)',
    ]

    dates = []
    for pattern in date_patterns:
        for match in re.finditer(pattern, text):
            start_str = match.group(1)
            end_str = match.group(2)

            # Get surrounding context
            start_pos = max(0, match.start() - 100)
            context = text[start_pos:match.start()].strip().split('\n')[-1]

            dates.append((start_str, end_str, context))

    return dates


def parse_date_string(date_str: str) -> Optional[datetime]:
    """Parse a date string into a datetime object."""
    if not date_str or date_str.lower() in ("present", "current"):
        return datetime.now()

    try:
        return dateutil_parser.parse(date_str, fuzzy=True)
    except (ValueError, TypeError):
        # Try just year
        match = re.search(r'\d{4}', date_str)
        if match:
            return datetime(int(match.group()), 1, 1)
        return None


def calculate_career_gaps(date_ranges: list[tuple[str, str, str]]) -> tuple[float, int, list[dict]]:
    """
    Calculate career gaps from employment date ranges.

    Returns:
        (total_gap_months, gap_count, list of gap periods)
    """
    # Parse and sort date ranges
    periods = []
    for start_str, end_str, context in date_ranges:
        start = parse_date_string(start_str)
        end = parse_date_string(end_str)
        if start and end:
            periods.append({
                "start": start,
                "end": end,
                "start_str": start_str,
                "end_str": end_str,
                "context": context,
            })

    if not periods:
        return 0, 0, []

    # Sort by start date
    periods.sort(key=lambda x: x["start"])

    gaps = []
    total_gap_months = 0
    gap_count = 0

    for i in range(1, len(periods)):
        prev_end = periods[i - 1]["end"]
        curr_start = periods[i]["start"]

        if curr_start > prev_end:
            gap_days = (curr_start - prev_end).days
            gap_months = gap_days / 30.44  # average days per month

            if gap_months >= 2:  # Only count gaps >= 2 months
                total_gap_months += gap_months
                gap_count += 1
                gaps.append({
                    "start": prev_end.strftime("%Y-%m"),
                    "end": curr_start.strftime("%Y-%m"),
                    "months": round(gap_months, 1),
                })

    return round(total_gap_months, 1), gap_count, gaps


def parse_resume(file_path: str) -> dict:
    """
    Full resume parsing pipeline.

    Returns a structured candidate dict.
    """
    text = extract_text(file_path)

    if text.startswith("[") and "error" in text.lower():
        return {"error": text, "raw_text": ""}

    name = extract_name(text)
    email = extract_email(text)
    phone = extract_phone(text)
    skills = extract_skills(text)
    education_text, education_level = extract_education(text)
    date_ranges = extract_dates(text)
    total_gap_months, gap_count, gaps = calculate_career_gaps(date_ranges)

    # Estimate total experience from date ranges
    total_exp_years = 0
    for start_str, end_str, _ in date_ranges:
        start = parse_date_string(start_str)
        end = parse_date_string(end_str)
        if start and end:
            total_exp_years += (end - start).days / 365.25
    total_exp_years = round(max(0, total_exp_years - total_gap_months / 12), 1)

    # Count projects and certifications (heuristic)
    projects_count = len(re.findall(r'(?:project|portfolio|built|developed|created)\s*:', text, re.IGNORECASE))
    certs_count = len(re.findall(r'(?:certified|certification|certificate|license)\b', text, re.IGNORECASE))

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "education": education_text,
        "education_level": education_level,
        "skills": skills,
        "total_experience_years": total_exp_years,
        "career_gap_months": total_gap_months,
        "career_gap_count": gap_count,
        "career_gaps": gaps,
        "projects_count": projects_count,
        "certifications_count": certs_count,
        "date_ranges": [(s, e, c) for s, e, c in date_ranges],
        "raw_text": text,
    }
