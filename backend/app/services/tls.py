import socket
import ssl
from datetime import datetime, timezone
from urllib.parse import urlparse
from typing import Tuple, List, Optional
from app.schemas.scan import TlsInfo, Finding, SeverityLevel

def analyze_tls(target_url: str, timeout: int = 10) -> Tuple[TlsInfo, List[Finding]]:
    parsed = urlparse(target_url)
    hostname = parsed.hostname
    port = parsed.port or (443 if parsed.scheme == "https" else 80)
    findings: List[Finding] = []

    from app.services.owasp_cwe import map_owasp_cwe

    def enrich_findings(f_list: List[Finding]) -> List[Finding]:
        for f in f_list:
            if not f.owasp_category or not f.cwe_id:
                owasp, cwe = map_owasp_cwe(f.category, f.title)
                f.owasp_category = owasp
                f.cwe_id = cwe
            if not f.detection_rule:
                f.detection_rule = "RULE_TLS_METRICS_CHECK"
        return f_list

    if not hostname:
        return TlsInfo(https_available=False, issues=["Invalid target hostname"]), []

    # If scheme is HTTP, check if port 443 supports TLS
    check_port = 443 if parsed.scheme == "http" else port

    context = ssl.create_default_context()
    context.check_hostname = True
    context.verify_mode = ssl.CERT_REQUIRED

    try:
        with socket.create_connection((hostname, check_port), timeout=timeout) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()
                tls_version = ssock.version()
                cipher = ssock.cipher()
                cipher_name = cipher[0] if cipher else None

                # Extract Subject & Issuer
                subject_dict = dict(x[0] for x in cert.get('subject', ()))
                issuer_dict = dict(x[0] for x in cert.get('issuer', ()))

                subject_str = subject_dict.get('commonName') or subject_dict.get('organizationName') or str(cert.get('subject'))
                issuer_str = issuer_dict.get('organizationName') or issuer_dict.get('commonName') or str(cert.get('issuer'))

                # Dates
                not_before_str = cert.get('notBefore')
                not_after_str = cert.get('notAfter')

                valid_from = None
                valid_to = None
                days_remaining = None

                if not_before_str and not_after_str:
                    try:
                        date_fmt = r"%b %d %H:%M:%S %Y %Z"
                        dt_not_before = datetime.strptime(not_before_str, date_fmt).replace(tzinfo=timezone.utc)
                        dt_not_after = datetime.strptime(not_after_str, date_fmt).replace(tzinfo=timezone.utc)

                        valid_from = dt_not_before.strftime("%Y-%m-%d %H:%M:%S UTC")
                        valid_to = dt_not_after.strftime("%Y-%m-%d %H:%M:%S UTC")

                        now = datetime.now(timezone.utc)
                        delta = dt_not_after - now
                        days_remaining = delta.days

                        if days_remaining < 0:
                            f = Finding(
                                title="Expired TLS/SSL Certificate",
                                severity=SeverityLevel.HIGH,
                                description=f"The TLS certificate for {hostname} expired on {valid_to}.",
                                evidence=f"Certificate expiration date: {valid_to}",
                                impact="Browsers will block connection or display security warnings to users.",
                                recommendation="Renew the SSL/TLS certificate immediately.",
                                category="HTTPS / TLS Security"
                            )
                            findings.append(f)
                        elif days_remaining < 30:
                            f = Finding(
                                title="TLS/SSL Certificate Expiring Soon",
                                severity=SeverityLevel.MEDIUM,
                                description=f"The TLS certificate for {hostname} will expire in {days_remaining} days.",
                                evidence=f"Certificate expiration date: {valid_to} ({days_remaining} days remaining)",
                                impact="Site will become inaccessible securely if certificate expires without renewal.",
                                recommendation="Plan immediate certificate renewal.",
                                category="HTTPS / TLS Security"
                            )
                            findings.append(f)
                    except Exception:
                        pass

                # Check TLS Version
                if tls_version in ["TLSv1", "TLSv1.1", "SSLv3", "SSLv2"]:
                    f = Finding(
                        title=f"Outdated TLS Version Supported: {tls_version}",
                        severity=SeverityLevel.HIGH,
                        description=f"The server negotiated an insecure or deprecated TLS protocol version ({tls_version}).",
                        evidence=f"TLS Version: {tls_version}",
                        impact="Exposes encrypted traffic to known protocol downgrade vulnerabilities and attacks.",
                        recommendation="Disable TLS 1.0/1.1 and SSLv3. Require TLS 1.2 or TLS 1.3.",
                        category="HTTPS / TLS Security"
                    )
                    findings.append(f)
                else:
                    findings.append(Finding(
                        title=f"Modern TLS Protocol Enabled ({tls_version})",
                        severity=SeverityLevel.INFO,
                        description=f"The server negotiated secure protocol version {tls_version}.",
                        evidence=f"TLS Version: {tls_version}, Cipher: {cipher_name}",
                        impact="Provides strong cryptographic protection for transport data.",
                        recommendation="Maintain support for modern TLS 1.2 and TLS 1.3 protocols.",
                        category="HTTPS / TLS Security"
                    ))

                # If URL scheme was HTTP, flag missing default HTTPS
                if parsed.scheme == "http":
                    findings.append(Finding(
                        title="Target Accessed via Unencrypted HTTP Scheme",
                        severity=SeverityLevel.MEDIUM,
                        description="The initial scan target URL uses http:// instead of https://.",
                        evidence=f"Target URL: {target_url}",
                        impact="Plaintext HTTP transfers can be intercepted or modified in transit.",
                        recommendation="Enforce HTTPS redirect and upgrade all site links to https://.",
                        category="HTTPS / TLS Security"
                    ))

                tls_info = TlsInfo(
                    https_available=True,
                    subject=subject_str,
                    issuer=issuer_str,
                    valid_from=valid_from,
                    valid_to=valid_to,
                    days_remaining=days_remaining,
                    hostname_verified=True,
                    tls_version=tls_version,
                    cipher_name=cipher_name,
                    issues=[]
                )
                return tls_info, enrich_findings(findings)

    except ssl.SSLCertVerificationError as e:
        f = Finding(
            title="TLS/SSL Certificate Verification Failed",
            severity=SeverityLevel.HIGH,
            description=f"Hostname verification or certificate validation failed: {str(e)}",
            evidence=f"SSL Verification Error: {str(e)}",
            impact="Browsers will display untrusted certificate warnings, exposing users to MITM attacks.",
            recommendation="Install a valid SSL certificate signed by a recognized Certificate Authority (CA).",
            category="HTTPS / TLS Security"
        )
        return TlsInfo(https_available=False, hostname_verified=False, issues=[str(e)]), enrich_findings([f])
    except Exception as e:
        # Check if HTTP only
        if parsed.scheme == "http":
            f = Finding(
                title="HTTPS Not Available on Target",
                severity=SeverityLevel.HIGH,
                description="The target site does not support HTTPS connections.",
                evidence=f"Connection error to SSL port 443: {str(e)}",
                impact="All traffic to and from the target is transmitted in cleartext.",
                recommendation="Deploy an SSL/TLS certificate and enable HTTPS.",
                category="HTTPS / TLS Security"
            )
            return TlsInfo(https_available=False, hostname_verified=False, issues=["HTTPS connection failed"]), enrich_findings([f])
        
        return TlsInfo(https_available=False, hostname_verified=False, issues=[str(e)]), []
