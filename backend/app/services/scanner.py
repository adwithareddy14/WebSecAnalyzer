import datetime
import hashlib
import httpx
from urllib.parse import urlparse
from typing import List, Dict, Tuple, Optional
from app.schemas.scan import (
    ScanResponse, RedirectStep, Finding, SeverityLevel, ServerInfo, TlsInfo, CorsInfo, ReconInfo, ScanProfile, FindingStatus
)
from app.services.headers import analyze_headers
from app.services.cookies import analyze_cookies
from app.services.tls import analyze_tls
from app.services.cors import analyze_cors
from app.services.recon import perform_safe_recon
from app.services.response_info import analyze_response_info
from app.services.scoring import calculate_score
from app.services.owasp_cwe import map_owasp_cwe

def validate_and_normalize_url(url_str: str) -> str:
    url_str = url_str.strip()
    if not url_str:
        raise ValueError("URL cannot be empty.")
    if "://" in url_str and not url_str.startswith(("http://", "https://")):
        raise ValueError(f"Unsupported protocol scheme in '{url_str}'")
    if not url_str.startswith(("http://", "https://")):
        url_str = "https://" + url_str
    parsed = urlparse(url_str)
    if not parsed.netloc or " " in parsed.netloc or parsed.netloc.startswith(":::"):
        raise ValueError(f"Invalid URL structure or netloc: '{url_str}'")
    return url_str

async def perform_scan(
    url_str: str,
    target_id: Optional[int] = None,
    target_name: Optional[str] = None,
    scan_profile: ScanProfile = ScanProfile.STANDARD,
    timeout: int = 10,
    selected_modules: Optional[List[str]] = None
) -> ScanResponse:
    target_url = validate_and_normalize_url(url_str)
    parsed = urlparse(target_url)
    is_https = parsed.scheme == "https"
    created_at_str = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

    all_findings: List[Finding] = []
    redirect_steps: List[RedirectStep] = []
    headers_dict: Dict[str, str] = {}
    set_cookie_headers: List[str] = []
    status_code = 0

    # Determine execution scope based on scan profile or selected modules
    run_cors = scan_profile in [ScanProfile.STANDARD, ScanProfile.FULL]
    run_recon = scan_profile == ScanProfile.FULL

    if selected_modules:
        run_cors = "cors" in [m.lower() for m in selected_modules] or run_cors
        run_recon = "recon" in [m.lower() for m in selected_modules] or run_recon

    # 1. Dispatch HTTP/HTTPS request
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=timeout, verify=False) as client:
            response = await client.get(target_url, headers={"User-Agent": "WebVulnX/2.0"})
            status_code = response.status_code

            step_idx = 1
            for hist in response.history:
                redirect_steps.append(RedirectStep(step=step_idx, url=str(hist.url), status_code=hist.status_code))
                step_idx += 1
            redirect_steps.append(RedirectStep(step=step_idx, url=str(response.url), status_code=response.status_code))

            headers_dict = dict(response.headers)
            set_cookie_headers = response.headers.get_list("set-cookie")

    except httpx.TimeoutException:
        all_findings.append(Finding(
            title="Scan Connection Timed Out",
            severity=SeverityLevel.HIGH,
            category="Network Accessibility",
            target_url=target_url,
            affected_url=target_url,
            description=f"Connection to target {target_url} timed out after {timeout} seconds.",
            evidence=f"Timeout limit: {timeout}s",
            impact="Target host is unreachable or delaying responses.",
            remediation="Verify target network accessibility and firewall rules.",
            detection_rule="NET_TIMEOUT"
        ))
    except httpx.ConnectError as e:
        all_findings.append(Finding(
            title="Connection Failure to Target Host",
            severity=SeverityLevel.HIGH,
            category="Network Accessibility",
            target_url=target_url,
            affected_url=target_url,
            description=f"Failed to establish connection to {target_url}: {str(e)}",
            evidence=str(e),
            impact="Target host is unreachable.",
            remediation="Confirm domain DNS resolution and port accessibility.",
            detection_rule="NET_CONN_FAIL"
        ))
    except Exception as e:
        all_findings.append(Finding(
            title="HTTP Request Execution Error",
            severity=SeverityLevel.MEDIUM,
            category="Network Accessibility",
            target_url=target_url,
            affected_url=target_url,
            description=f"HTTP request error: {str(e)}",
            evidence=str(e),
            impact="Limited security assessment data retrieved.",
            remediation="Ensure target URL is valid and online.",
            detection_rule="NET_EXEC_ERR"
        ))

    # 2. Header Analysis
    headers_info, header_findings = analyze_headers(headers_dict, is_https)
    all_findings.extend(header_findings)

    # 3. Cookie Analysis
    cookies_info, cookie_findings = analyze_cookies(set_cookie_headers, is_https)
    all_findings.extend(cookie_findings)

    # 4. HTTPS / TLS Inspection
    tls_info, tls_findings = analyze_tls(target_url, timeout=timeout)
    all_findings.extend(tls_findings)

    # 5. Response Info Analysis
    server_info, resp_findings = analyze_response_info(status_code, headers_dict)
    all_findings.extend(resp_findings)

    # 6. CORS Policy Check (Standard / Full profile)
    cors_info = None
    if run_cors:
        cors_info, cors_findings = analyze_cors(headers_dict, target_url)
        all_findings.extend(cors_findings)

    # 7. Safe Reconnaissance & File Checks (Full profile)
    recon_info = None
    if run_recon:
        recon_info, recon_findings = await perform_safe_recon(target_url, timeout=timeout)
        all_findings.extend(recon_findings)

    # Enrich findings with target fields, OWASP, CWE, and unique keys
    for f in all_findings:
        f.target_url = target_url
        if not f.affected_url:
            f.affected_url = target_url
        if not f.target_id:
            f.target_id = target_id
        if not f.owasp_category or not f.cwe_id:
            owasp, cwe = map_owasp_cwe(f.category, f.title)
            f.owasp_category = owasp
            f.cwe_id = cwe
        if not f.detection_rule:
            f.detection_rule = f"RULE_{f.category.replace(' ', '_').upper()}"
        if not f.finding_key:
            raw_key = f"{target_url}:{f.title}:{f.evidence}"
            f.finding_key = hashlib.md5(raw_key.encode('utf-8')).hexdigest()

    # Calculate Score
    final_score, rating, summary_counts = calculate_score(all_findings)

    return ScanResponse(
        target_id=target_id,
        target_name=target_name,
        target_url=target_url,
        created_at=created_at_str,
        scan_profile=scan_profile.value if hasattr(scan_profile, 'value') else str(scan_profile),
        score=final_score,
        rating=rating,
        summary_counts=summary_counts,
        findings=all_findings,
        headers=headers_info,
        cookies=cookies_info,
        tls_info=tls_info,
        cors_info=cors_info,
        recon_info=recon_info,
        redirect_chain=redirect_steps,
        server_info=server_info
    )
