from typing import List, Tuple, Dict
from app.schemas.scan import Finding, SeverityLevel

def calculate_score(findings: List[Finding]) -> Tuple[int, str, Dict[str, int]]:
    base_score = 100
    counts = {
        "CRITICAL": 0,
        "HIGH": 0,
        "MEDIUM": 0,
        "LOW": 0,
        "INFO": 0
    }

    # Weight deductions
    penalties = {
        SeverityLevel.CRITICAL: 20,
        SeverityLevel.HIGH: 15,
        SeverityLevel.MEDIUM: 8,
        SeverityLevel.LOW: 3,
        SeverityLevel.INFO: 0
    }

    for f in findings:
        counts[f.severity.value] += 1
        base_score -= penalties.get(f.severity, 0)

    final_score = max(0, min(100, base_score))

    # Rating classification
    if final_score >= 90:
        rating = "Excellent"
    elif final_score >= 75:
        rating = "Good"
    elif final_score >= 60:
        rating = "Moderate"
    elif final_score >= 40:
        rating = "Weak"
    else:
        rating = "Critical Configuration Risk"

    return final_score, rating, counts
