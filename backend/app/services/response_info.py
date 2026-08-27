import re
from typing import Dict, List, Tuple
from app.schemas.scan import ServerInfo, Finding, SeverityLevel

def analyze_response_info(status_code: int, headers: Dict[str, str]) -> Tuple[ServerInfo, List[Finding]]:
    headers_lower = {k.lower(): v for k, v in headers.items()}
    findings: List[Finding] = []
    disclosures: List[str] = []

    server_hdr = headers_lower.get("server")
    x_powered_by = headers_lower.get("x-powered-by")
    content_type = headers_lower.get("content-type")

    # Inspect Server Header
    if server_hdr:
        # Check if version number is disclosed (e.g. Apache/2.4.41 or nginx/1.18.0)
        has_version = bool(re.search(r'\d+\.\d+', server_hdr))
        if has_version:
            disclosures.append(f"Server header discloses software version: {server_hdr}")
            findings.append(Finding(
                title="Server Version Information Disclosure",
                severity=SeverityLevel.LOW,
                description=f"The Server header discloses explicit version details: '{server_hdr}'.",
                evidence=f"Server: {server_hdr}",
                impact="Assists potential attackers in identifying software-specific vulnerabilities or targeted exploits.",
                recommendation="Configure web server to obscure or remove specific version banners.",
                category="Information Disclosure"
            ))
        else:
            findings.append(Finding(
                title="Generic Server Header Present",
                severity=SeverityLevel.INFO,
                description=f"The Server header is present without detailed version numbers ('{server_hdr}').",
                evidence=f"Server: {server_hdr}",
                impact="Low risk, reveals web server brand.",
                recommendation="Consider stripping the Server header completely if not required.",
                category="Information Disclosure"
            ))

    # Inspect X-Powered-By Header
    if x_powered_by:
        disclosures.append(f"X-Powered-By header discloses technology: {x_powered_by}")
        findings.append(Finding(
            title="Technology Disclosure (X-Powered-By)",
            severity=SeverityLevel.LOW,
            description=f"The HTTP response contains an X-Powered-By header: '{x_powered_by}'.",
            evidence=f"X-Powered-By: {x_powered_by}",
            impact="Reveals underlying web framework or runtime stack (e.g., Express, PHP, ASP.NET).",
            recommendation="Disable or remove the X-Powered-By response header in backend server settings.",
            category="Information Disclosure"
        ))

    # Additional technology headers
    for key in ["x-aspnet-version", "x-aspnetmvc-version", "x-generator"]:
        val = headers_lower.get(key)
        if val:
            disclosures.append(f"{key} discloses version: {val}")
            findings.append(Finding(
                title=f"Technology Disclosure ({key})",
                severity=SeverityLevel.LOW,
                description=f"Header '{key}' discloses application stack version: '{val}'.",
                evidence=f"{key}: {val}",
                impact="Provides precise fingerprinting details of backend software stack.",
                recommendation=f"Suppress header '{key}' in application configuration.",
                category="Information Disclosure"
            ))

    server_info = ServerInfo(
        status_code=status_code,
        content_type=content_type,
        server_header=server_hdr,
        x_powered_by=x_powered_by,
        technology_disclosures=disclosures
    )

    return server_info, findings
