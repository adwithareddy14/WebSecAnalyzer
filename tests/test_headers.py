import sys
import os

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.services.headers import analyze_headers
from app.schemas.scan import SeverityLevel

def test_missing_security_headers():
    headers = {"Content-Type": "text/html"}
    header_info_list, findings = analyze_headers(headers, is_https=True)
    
    titles = [f.title for f in findings]
    assert "Missing Content-Security-Policy Header" in titles
    assert "Missing Strict-Transport-Security Header" in titles
    assert "Missing X-Frame-Options Header" in titles

def test_present_security_headers():
    headers = {
        "Content-Security-Policy": "default-src 'self'",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer"
    }
    header_info_list, findings = analyze_headers(headers, is_https=True)

    severities = [f.severity for f in findings]
    assert SeverityLevel.HIGH not in severities
    assert SeverityLevel.MEDIUM not in severities
