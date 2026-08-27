import sys
import os

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.services.scoring import calculate_score
from app.schemas.scan import Finding, SeverityLevel

def test_perfect_score():
    findings = []
    score, rating, counts = calculate_score(findings)
    assert score == 100
    assert rating == "Excellent"

def test_deduction_scoring():
    findings = [
        Finding(
            title="High Issue", severity=SeverityLevel.HIGH,
            description="desc", evidence="ev", impact="imp", recommendation="rec", category="cat"
        ),
        Finding(
            title="Medium Issue", severity=SeverityLevel.MEDIUM,
            description="desc", evidence="ev", impact="imp", recommendation="rec", category="cat"
        )
    ]
    # Deductions: -15 (High), -8 (Medium) = 100 - 23 = 77
    score, rating, counts = calculate_score(findings)
    assert score == 77
    assert rating == "Good"
    assert counts["HIGH"] == 1
    assert counts["MEDIUM"] == 1
