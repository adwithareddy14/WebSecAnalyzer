import sys
import os

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.schemas.scan import ScanResponse, TlsInfo, ServerInfo
from app.services.reports import generate_json_report, generate_html_report, generate_csv_report

def test_report_generation():
    scan_resp = ScanResponse(
        target_url="https://example.com",
        created_at="2026-08-24 12:00:00 UTC",
        scan_profile="Standard",
        score=85,
        rating="Good",
        summary_counts={"CRITICAL": 0, "HIGH": 0, "MEDIUM": 1, "LOW": 1, "INFO": 2},
        findings=[],
        headers=[],
        cookies=[],
        tls_info=TlsInfo(https_available=True),
        redirect_chain=[],
        server_info=ServerInfo(status_code=200)
    )

    json_out = generate_json_report(scan_resp)
    assert '"target_url": "https://example.com"' in json_out

    html_out = generate_html_report(scan_resp)
    assert "WebVulnX" in html_out
    assert "https://example.com" in html_out

    csv_out = generate_csv_report(scan_resp)
    assert "Finding ID" in csv_out
