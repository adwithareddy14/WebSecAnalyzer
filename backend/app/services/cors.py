from typing import Dict, List, Tuple
from app.schemas.scan import CorsInfo, Finding, SeverityLevel

def analyze_cors(headers: Dict[str, str], target_url: str) -> Tuple[CorsInfo, List[Finding]]:
    headers_lower = {k.lower(): v for k, v in headers.items()}
    findings: List[Finding] = []

    allow_origin = headers_lower.get("access-control-allow-origin")
    allow_credentials_str = headers_lower.get("access-control-allow-credentials")
    allow_credentials = allow_credentials_str.lower() == "true" if allow_credentials_str else False
    allow_methods = headers_lower.get("access-control-allow-methods")

    misconfigured = False

    if allow_origin:
        if allow_origin == "*" and allow_credentials:
            misconfigured = True
            f = Finding(
                title="Critical Insecure CORS Policy: Wildcard Origin with Credentials",
                severity=SeverityLevel.CRITICAL,
                description="The server returns Access-Control-Allow-Origin: * along with Access-Control-Allow-Credentials: true.",
                evidence=f"Access-Control-Allow-Origin: {allow_origin}, Access-Control-Allow-Credentials: {allow_credentials_str}",
                impact="Allows arbitrary third-party websites to read authenticated cross-origin response data.",
                remediation="Specify trusted explicit origin domain instead of wildcard '*' when credentials are required.",
                detection_rule="CORS_WILDCARD_CREDENTIALS",
                owasp_category="A07:2021 – Identification and Authentication Failures",
                cwe_id="CWE-942: Permissive Cross-Domain Policy",
                category="CORS Policy"
            )
            findings.append(f)
        elif allow_origin == "*":
            misconfigured = True
            f = Finding(
                title="Permissive CORS Policy: Wildcard Access-Control-Allow-Origin",
                severity=SeverityLevel.LOW,
                description="The server allows cross-origin requests from any domain (Access-Control-Allow-Origin: *).",
                evidence=f"Access-Control-Allow-Origin: {allow_origin}",
                impact="Third-party sites can read public API responses. If API contains unauthenticated sensitive data, it leaks.",
                remediation="Restrict Access-Control-Allow-Origin to specific trusted origins if resources are private.",
                detection_rule="CORS_WILDCARD_ORIGIN",
                owasp_category="A05:2021 – Security Misconfiguration",
                cwe_id="CWE-942: Permissive Cross-Domain Policy",
                category="CORS Policy"
            )
            findings.append(f)
        else:
            f = Finding(
                title="Explicit CORS Origin Configured",
                severity=SeverityLevel.INFO,
                description=f"The server configures explicit CORS origin restriction: {allow_origin}.",
                evidence=f"Access-Control-Allow-Origin: {allow_origin}",
                impact="Restricts cross-origin resource sharing to specified domain.",
                remediation="Maintain and regularly audit trusted origin whitelist.",
                detection_rule="CORS_EXPLICIT_ORIGIN",
                owasp_category="A05:2021 – Security Misconfiguration",
                cwe_id="CWE-942: Permissive Cross-Domain Policy",
                category="CORS Policy"
            )
            findings.append(f)
    else:
        # Absence of CORS headers is standard/secure for non-API web targets
        pass

    cors_info = CorsInfo(
        allow_origin=allow_origin,
        allow_credentials=allow_credentials,
        allow_methods=allow_methods,
        misconfigured=misconfigured,
        findings=findings
    )

    return cors_info, findings
