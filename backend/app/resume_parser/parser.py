"""
FairHire AI — Resume Parser.

Extracts text and structured information from PDF and DOCX resumes.
Uses regex-based section-aware extraction for accurate feature computation.

Privacy Note: Resume contents are processed in-memory where possible.
Uploaded files are stored in a controlled local directory only.

Fixes:
- Section-aware date extraction (education dates excluded from experience)
- Expanded skill keyword list (Flutter, OpenCV, Firebase, Arduino, etc.)
- Word-boundary skill matching (avoids "ai" matching "said")
- Improved project / certification counting from dedicated sections
- College/university dates no longer counted as work experience
"""

import re
import os
from datetime import datetime
from typing import Optional
from dateutil import parser as dateutil_parser


# ─── Text extraction ────────────────────────────────────────────────────────

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


# ─── Section splitting ───────────────────────────────────────────────────────

# Headings that mark the start of sections (case-insensitive)
SECTION_HEADINGS = [
    "education", "academic", "qualification",
    "experience", "employment", "work history", "professional experience",
    "skills", "technical skills", "competencies",
    "projects", "project",
    "certifications", "certificates", "achievements", "awards",
    "languages", "publications", "summary", "profile", "objective",
    "internship", "training",
]

_SECTION_PATTERN = re.compile(
    r'(?:^|\n)\s*(' + '|'.join(re.escape(h) for h in SECTION_HEADINGS) + r')\s*[:\-\n]',
    re.IGNORECASE,
)


def split_into_sections(text: str) -> dict[str, str]:
    """Split resume text into named sections."""
    sections: dict[str, str] = {}
    matches = list(_SECTION_PATTERN.finditer(text))

    if not matches:
        return {"full": text}

    # Text before the first section heading
    if matches[0].start() > 0:
        sections["header"] = text[:matches[0].start()].strip()

    for i, match in enumerate(matches):
        heading = match.group(1).strip().lower()
        start = match.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        sections[heading] = text[start:end].strip()

    return sections


# ─── Basic field extractors ──────────────────────────────────────────────────

def extract_email(text: str) -> Optional[str]:
    """Extract email address from text."""
    match = re.search(r'[\w.+-]+@[\w-]+\.[\w.-]+', text)
    return match.group(0) if match else None


def extract_phone(text: str) -> Optional[str]:
    """Extract phone number from text."""
    match = re.search(r'[\+]?[(]?[0-9]{1,4}[)]?[-\s\./0-9]{7,15}', text)
    return match.group(0).strip() if match else None


def extract_name(text: str) -> str:
    """Extract candidate name (first name-like line, heuristic)."""
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    for line in lines[:6]:
        cleaned = re.sub(r'[^a-zA-Z\s\.\-]', '', line).strip()
        if cleaned and 2 <= len(cleaned.split()) <= 5 and len(cleaned) > 2:
            return cleaned
    return "Unknown Candidate"


# ─── Skills extraction ───────────────────────────────────────────────────────

SKILLS_LIST = [
    # Languages
    "Python", "Java", "JavaScript", "TypeScript", "C++", "C#", "C",
    "Go", "Rust", "Ruby", "Kotlin", "Swift", "Scala", "PHP", "R",
    "MATLAB", "Dart", "Bash", "Shell",
    # Web
    "HTML", "CSS", "React", "Angular", "Vue", "Node.js", "Express",
    "Django", "Flask", "FastAPI", "Spring Boot", "REST", "GraphQL", "API",
    # Mobile
    "Flutter", "Android", "iOS", "React Native", "Firebase",
    # Data / ML / AI
    "Machine Learning", "Deep Learning", "NLP", "Computer Vision",
    "AI", "Data Science", "Data Engineering", "Data Analysis",
    "TensorFlow", "PyTorch", "Keras", "Scikit-learn", "OpenCV",
    "Pandas", "NumPy", "SciPy", "Hugging Face",
    "Statistics", "Regression", "Classification", "Clustering",
    # Databases
    "SQL", "MySQL", "PostgreSQL", "MongoDB", "SQLite", "Redis",
    "NoSQL", "Oracle", "Firebase",
    # Cloud / DevOps
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "CI/CD",
    "Git", "GitHub", "GitLab", "Linux",
    # Visualization
    "Power BI", "Tableau", "Excel", "Matplotlib", "Seaborn", "Plotly",
    # Hardware / Embedded
    "Arduino", "Raspberry Pi", "IoT", "Embedded Systems",
    # Project / Management
    "Agile", "Scrum", "Project Management", "Leadership",
    "Communication", "Problem Solving", "Teamwork",
]

# Build a regex pattern for whole-word matching to avoid "ai" matching "said"
_SKILLS_PATTERNS = {
    skill: re.compile(r'\b' + re.escape(skill) + r'\b', re.IGNORECASE)
    for skill in SKILLS_LIST
}


def extract_skills(text: str) -> list[str]:
    """Extract skills from text using whole-word keyword matching."""
    found = []
    for skill, pattern in _SKILLS_PATTERNS.items():
        if pattern.search(text):
            found.append(skill)
    return found


# ─── Education extraction ────────────────────────────────────────────────────

EDUCATION_INSTITUTIONS = re.compile(
    r'university|college|institute|school|academy|iit|nit|bit|vit|coimbatore|'
    r'b\.?tech|m\.?tech|b\.?e\.|m\.?s\.|b\.?sc|m\.?sc|bachelor|master|ph\.?d|'
    r'higher secondary|higher second|grade xi|grade xii|11th|12th|cgpa|gpa|percentage',
    re.IGNORECASE,
)


def extract_education(text: str) -> tuple[str, str]:
    """Extract education information and level from text."""
    sections = split_into_sections(text)
    edu_text = ""
    for key in ("education", "academic", "qualification"):
        if key in sections:
            edu_text = sections[key][:500]
            break

    if not edu_text:
        # Fallback: search full text
        edu_sections = re.split(r'\n(?:EDUCATION|Education|Academic|ACADEMIC)', text, maxsplit=1)
        if len(edu_sections) > 1:
            edu_text = edu_sections[1].split('\n\n')[0].strip()[:500]

    # Determine education level
    text_lower = text.lower()
    if any(t in text_lower for t in ["ph.d", "phd", "doctorate", "doctoral"]):
        education_level = "PhD"
    elif any(t in text_lower for t in ["master", "m.s.", "m.sc", "mba", "m.tech", "m.e."]):
        education_level = "Master's"
    elif any(t in text_lower for t in ["bachelor", "b.s.", "b.sc", "b.tech", "b.e.", "bba", "b.tech"]):
        education_level = "Bachelor's"
    elif any(t in text_lower for t in ["associate", "diploma"]):
        education_level = "Associate"
    elif any(t in text_lower for t in ["high school", "secondary", "grade xi", "grade xii", "12th", "11th"]):
        education_level = "High School"
    else:
        education_level = "Unknown"

    return edu_text, education_level


# ─── Date extraction (work experience only) ─────────────────────────────────

DATE_PATTERNS = [
    # "Jan 2020 - Dec 2022" / "May 2025 – Jun 2025"
    re.compile(
        r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*[\s,]*\d{4})'
        r'\s*[-–—to]+\s*'
        r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*[\s,]*\d{4}|[Pp]resent|[Cc]urrent)',
        re.IGNORECASE,
    ),
    # "MM/YYYY – MM/YYYY"
    re.compile(
        r'(\d{1,2}/\d{4})\s*[-–—to]+\s*(\d{1,2}/\d{4}|[Pp]resent|[Cc]urrent)',
        re.IGNORECASE,
    ),
    # Avoid bare "YYYY – YYYY" — those are almost always education spans
]

# Lines that strongly suggest an education context — skip date ranges from these
_EDU_CONTEXT = re.compile(
    r'university|college|institute|school|cgpa|gpa|grade|b\.?tech|m\.?tech|'
    r'bachelor|master|higher secondary|10th|12th|11th',
    re.IGNORECASE,
)


def _get_work_experience_text(text: str) -> str:
    """Extract only the work-experience sections, excluding education."""
    sections = split_into_sections(text)
    work_keys = [k for k in sections if any(
        w in k for w in ("experience", "employment", "work", "internship", "professional", "training")
    )]
    if work_keys:
        return "\n".join(sections[k] for k in work_keys)
    # Fallback: return full text but caller will filter by context
    return text


def extract_dates(text: str) -> list[tuple[Optional[str], Optional[str], str]]:
    """
    Extract employment date ranges from WORK sections only.
    Returns list of (start_str, end_str, context).
    """
    work_text = _get_work_experience_text(text)
    dates = []

    for pattern in DATE_PATTERNS:
        for match in pattern.finditer(work_text):
            # Check context: skip if this line looks like an education entry
            line_start = work_text.rfind('\n', 0, match.start())
            line_end = work_text.find('\n', match.end())
            surrounding = work_text[max(0, line_start):line_end if line_end != -1 else len(work_text)]

            if _EDU_CONTEXT.search(surrounding):
                continue  # Skip education dates

            start_str = match.group(1)
            end_str = match.group(2)
            context = surrounding.strip().split('\n')[-1][:100]
            dates.append((start_str, end_str, context))

    return dates


# ─── Gap calculation ────────────────────────────────────────────────────────

def parse_date_string(date_str: str) -> Optional[datetime]:
    """Parse a date string into a datetime object."""
    if not date_str or date_str.lower() in ("present", "current"):
        return datetime.now()
    try:
        return dateutil_parser.parse(date_str, fuzzy=True)
    except (ValueError, TypeError):
        match = re.search(r'\d{4}', date_str)
        if match:
            return datetime(int(match.group()), 1, 1)
        return None


def calculate_career_gaps(date_ranges: list[tuple[str, str, str]]) -> tuple[float, int, list[dict]]:
    """
    Calculate career gaps from employment date ranges.
    Returns: (total_gap_months, gap_count, list of gap periods)
    """
    periods = []
    for start_str, end_str, context in date_ranges:
        start = parse_date_string(start_str)
        end = parse_date_string(end_str)
        if start and end and end >= start:
            periods.append({"start": start, "end": end,
                            "start_str": start_str, "end_str": end_str})

    if not periods:
        return 0.0, 0, []

    periods.sort(key=lambda x: x["start"])

    gaps = []
    total_gap_months = 0.0
    gap_count = 0

    for i in range(1, len(periods)):
        prev_end = periods[i - 1]["end"]
        curr_start = periods[i]["start"]
        if curr_start > prev_end:
            gap_days = (curr_start - prev_end).days
            gap_months = gap_days / 30.44
            if gap_months >= 2:
                total_gap_months += gap_months
                gap_count += 1
                gaps.append({
                    "start": prev_end.strftime("%Y-%m"),
                    "end": curr_start.strftime("%Y-%m"),
                    "months": round(gap_months, 1),
                })

    return round(total_gap_months, 1), gap_count, gaps


# ─── Project / Certification counting ───────────────────────────────────────

def count_projects(text: str, sections: dict[str, str]) -> int:
    """
    Count projects from the PROJECTS section.
    Falls back to counting bullet-point style entries in full text.
    """
    project_section = ""
    for key in ("projects", "project"):
        if key in sections:
            project_section = sections[key]
            break

    if project_section:
        # Each project is typically a titled entry — count lines that look like titles
        # (non-empty, start with capital letter, not a bullet, not too long)
        title_lines = [
            l.strip() for l in project_section.split('\n')
            if l.strip()
            and not l.strip().startswith(('•', '-', '*', '–'))
            and len(l.strip()) < 120
            and re.match(r'^[A-Z\d]', l.strip())
        ]
        if title_lines:
            return min(len(title_lines), 15)  # cap sanity

    # Fallback: count "Built", "Developed", "Engineered", "Designed", "Created"
    # project-starter verbs as heuristic
    starter_verbs = re.findall(
        r'(?:^|\n)\s*(?:Built|Developed|Engineered|Designed|Created|Implemented|'
        r'Deployed|Automated|Architected|Built a|Developed a)',
        text, re.IGNORECASE
    )
    return len(starter_verbs)


def count_certifications(text: str, sections: dict[str, str]) -> int:
    """Count certifications from the CERTIFICATIONS / CERTIFICATES section."""
    cert_section = ""
    for key in ("certifications", "certificates", "certification", "certificate"):
        if key in sections:
            cert_section = sections[key]
            break

    if cert_section:
        # Each line that is non-empty and not a sub-bullet is a cert entry
        cert_lines = [
            l.strip() for l in cert_section.split('\n')
            if l.strip() and len(l.strip()) > 5
        ]
        return min(len(cert_lines), 10)

    # Fallback keyword search
    return len(re.findall(
        r'(?:certified|certification|certificate|license|credential)\b',
        text, re.IGNORECASE
    ))


# ─── Main parsing pipeline ───────────────────────────────────────────────────

def parse_resume(file_path: str) -> dict:
    """
    Full resume parsing pipeline.
    Returns a structured candidate dict with correctly computed features.
    """
    text = extract_text(file_path)

    if text.startswith("[") and "error" in text.lower():
        return {"error": text, "raw_text": ""}

    sections = split_into_sections(text)

    name = extract_name(text)
    email = extract_email(text)
    phone = extract_phone(text)
    skills = extract_skills(text)
    education_text, education_level = extract_education(text)

    # Date ranges from WORK sections only (education dates excluded)
    date_ranges = extract_dates(text)
    total_gap_months, gap_count, gaps = calculate_career_gaps(date_ranges)

    # Experience = sum of work period durations (capped, no future dates)
    now = datetime.now()
    total_exp_years = 0.0
    for start_str, end_str, _ in date_ranges:
        start = parse_date_string(start_str)
        end = parse_date_string(end_str)
        if start and end:
            # Don't count future end dates beyond today
            end = min(end, now)
            if end > start:
                total_exp_years += (end - start).days / 365.25

    # Subtract gap time from total experience
    total_exp_years = round(max(0.0, total_exp_years - total_gap_months / 12), 1)

    projects_count = count_projects(text, sections)
    certs_count = count_certifications(text, sections)

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
