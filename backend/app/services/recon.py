import socket
import httpx
from urllib.parse import urlparse
from typing import Tuple, List
from app.schemas.scan import ReconInfo, Finding, SeverityLevel

async def perform_safe_recon(target_url: str, timeout: int = 5) -> Tuple[ReconInfo, List[Finding]]:
    parsed = urlparse(target_url)
    hostname = parsed.hostname
    findings: List[Finding] = []
    ip_address = None
    exposed_files = []

    if hostname:
        try:
            ip_address = socket.gethostbyname(hostname)
            findings.append(Finding(
                title=f"Target Host IP Resolved: {ip_address}",
                severity=SeverityLevel.INFO,
                description=f"Hostname {hostname} resolved to IPv4 address {ip_address}.",
                evidence=f"DNS Lookup: {hostname} -> {ip_address}",
                impact="Identifies network hosting infrastructure.",
                remediation="Ensure host firewall and access control rules restrict non-essential ports.",
                detection_rule="DNS_IP_RESOLVED",
                owasp_category="A05:2021 – Security Misconfiguration",
                cwe_id="CWE-200: Exposure of Sensitive Information",
                category="Reconnaissance"
            ))
        except Exception:
            pass

    # Check safe passive sensitive files exposure
    base_origin = f"{parsed.scheme}://{parsed.netloc}"
    check_paths = ["/robots.txt", "/.git/HEAD", "/security.txt"]

    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=False, verify=False) as client:
            for path in check_paths:
                file_url = base_origin + path
                try:
                    resp = await client.get(file_url, headers={"User-Agent": "WebVulnX/2.0"})
                    if resp.status_code == 200:
                        exposed_files.append(path)
                        if path == "/.git/HEAD" and "refs/" in resp.text:
                            findings.append(Finding(
                                title="Exposed Git Repository Metadata (.git/HEAD)",
                                severity=SeverityLevel.HIGH,
                                description="The root .git repository directory is publicly accessible on the web server.",
                                evidence=f"Accessible URL: {file_url} (Response: {resp.text[:50]}...)",
                                impact="Allows attackers to download full source code history and internal configurations.",
                                remediation="Block public access to hidden dotfiles and .git directories in web server configuration.",
                                detection_rule="EXPOSED_GIT_DIR",
                                owasp_category="A01:2021 – Broken Access Control",
                                cwe_id="CWE-200: Exposure of Sensitive Information",
                                category="Information Disclosure"
                            ))
                        elif path == "/robots.txt":
                            findings.append(Finding(
                                title="Public Robots.txt File Present",
                                severity=SeverityLevel.INFO,
                                description="The server publishes a robots.txt file guiding web crawlers.",
                                evidence=f"Accessible URL: {file_url}",
                                impact="Lists disallowed URL paths that may reveal internal endpoint structures.",
                                remediation="Ensure sensitive administrative or private paths are not disclosed in robots.txt.",
                                detection_rule="ROBOTS_TXT_PRESENT",
                                owasp_category="A01:2021 – Broken Access Control",
                                cwe_id="CWE-200: Exposure of Sensitive Information",
                                category="Information Disclosure"
                            ))
                except Exception:
                    continue
    except Exception:
        pass

    recon_info = ReconInfo(
        hostname=hostname,
        ip_address=ip_address,
        dns_records={"a_record": ip_address} if ip_address else {},
        exposed_files=exposed_files
    )

    return recon_info, findings
