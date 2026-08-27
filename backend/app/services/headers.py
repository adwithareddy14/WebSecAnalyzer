from typing import Dict, List, Tuple
from app.schemas.scan import HeaderInfo, Finding, SeverityLevel

def analyze_headers(headers: Dict[str, str], is_https: bool) -> Tuple[List[HeaderInfo], List[Finding]]:
    # Case-insensitive header dictionary mapping
    headers_lower = {k.lower(): v for k, v in headers.items()}
    header_results: List[HeaderInfo] = []
    findings: List[Finding] = []

    # 1. Content-Security-Policy
    csp = headers_lower.get("content-security-policy")
    if csp:
        header_results.append(HeaderInfo(
            header_name="Content-Security-Policy",
            status="Present",
            current_value=csp,
            severity=SeverityLevel.INFO,
            security_significance="Restricts resources (JS, CSS, Images) the browser is allowed to load, preventing XSS and data injection attacks.",
            recommendation="Review CSP directives to ensure unsafe-inline and wildcard sources are avoided."
        ))
        if "unsafe-inline" in csp or "unsafe-eval" in csp or "*" in csp:
            findings.append(Finding(
                title="Permissive Content-Security-Policy Directives",
                severity=SeverityLevel.MEDIUM,
                description="The Content-Security-Policy contains potentially dangerous keywords such as 'unsafe-inline', 'unsafe-eval', or wildcard '*'.",
                evidence=f"CSP: {csp}",
                impact="Reduces the effectiveness of CSP against Cross-Site Scripting (XSS) attacks.",
                recommendation="Replace unsafe directives with nonces, hashes, or strict-dynamic source expressions.",
                category="HTTP Security Headers"
            ))
        else:
            findings.append(Finding(
                title="Content-Security-Policy Configured",
                severity=SeverityLevel.INFO,
                description="A Content-Security-Policy header is present.",
                evidence=f"CSP: {csp}",
                impact="Helps mitigate client-side script injection attacks.",
                recommendation="Maintain and regularly update CSP directives as application dependencies change.",
                category="HTTP Security Headers"
            ))
    else:
        header_results.append(HeaderInfo(
            header_name="Content-Security-Policy",
            status="Absent",
            current_value=None,
            severity=SeverityLevel.MEDIUM,
            security_significance="Restricts resources browser is allowed to load.",
            recommendation="Implement an appropriate Content-Security-Policy to reduce the impact of cross-site scripting (XSS) and code injection."
        ))
        findings.append(Finding(
            title="Missing Content-Security-Policy Header",
            severity=SeverityLevel.MEDIUM,
            description="The server did not send a Content-Security-Policy header.",
            evidence="Header 'Content-Security-Policy' is absent.",
            impact="Increases risk and impact of client-side code injection vulnerabilities such as XSS.",
            recommendation="Deploy a Content-Security-Policy defining trusted domains for scripts, styles, and external assets.",
            category="HTTP Security Headers"
        ))

    # 2. Strict-Transport-Security (HSTS)
    hsts = headers_lower.get("strict-transport-security")
    if hsts:
        header_results.append(HeaderInfo(
            header_name="Strict-Transport-Security",
            status="Present",
            current_value=hsts,
            severity=SeverityLevel.INFO,
            security_significance="Forces web browsers to interact only over encrypted HTTPS connections.",
            recommendation="Ensure max-age is set to at least 31536000 seconds (1 year) and includes subdomains."
        ))
        findings.append(Finding(
            title="Strict-Transport-Security Configured",
            severity=SeverityLevel.INFO,
            description="HSTS is enabled on the server response.",
            evidence=f"HSTS: {hsts}",
            impact="Prevents protocol downgrade attacks and cookie hijacking over HTTP.",
            recommendation="Consider adding 'includeSubDomains' and 'preload' flags if applicable.",
            category="HTTP Security Headers"
        ))
    else:
        sev = SeverityLevel.HIGH if is_https else SeverityLevel.MEDIUM
        header_results.append(HeaderInfo(
            header_name="Strict-Transport-Security",
            status="Absent",
            current_value=None,
            severity=sev,
            security_significance="Forces web browsers to interact with the target only over secure HTTPS connections.",
            recommendation="Implement HSTS with a max-age of at least 31536000 seconds and includeSubDomains."
        ))
        findings.append(Finding(
            title="Missing Strict-Transport-Security Header",
            severity=sev,
            description="The HTTP response is missing the HSTS security header.",
            evidence="Header 'Strict-Transport-Security' is absent.",
            impact="Users might be susceptible to SSL stripping and man-in-the-middle downgrade attacks.",
            recommendation="Enable HSTS (Strict-Transport-Security: max-age=31536000; includeSubDomains).",
            category="HTTP Security Headers"
        ))

    # 3. X-Frame-Options
    xfo = headers_lower.get("x-frame-options")
    if xfo:
        xfo_upper = xfo.upper()
        header_results.append(HeaderInfo(
            header_name="X-Frame-Options",
            status="Present",
            current_value=xfo,
            severity=SeverityLevel.INFO,
            security_significance="Controls whether the site can be embedded in an <iframe> or <frame> element.",
            recommendation="Use DENY or SAMEORIGIN to prevent Clickjacking attacks."
        ))
        if xfo_upper in ["DENY", "SAMEORIGIN"]:
            findings.append(Finding(
                title="X-Frame-Options Configured",
                severity=SeverityLevel.INFO,
                description=f"X-Frame-Options is set to {xfo}.",
                evidence=f"X-Frame-Options: {xfo}",
                impact="Protects the site against clickjacking framing attacks.",
                recommendation="Maintain current framing restrictions.",
                category="HTTP Security Headers"
            ))
        else:
            findings.append(Finding(
                title="Weak X-Frame-Options Header Value",
                severity=SeverityLevel.LOW,
                description=f"X-Frame-Options is set to '{xfo}', which may not offer optimal framing protection.",
                evidence=f"X-Frame-Options: {xfo}",
                impact="Potential risk of framing abuse if set permissively.",
                recommendation="Set X-Frame-Options to DENY or SAMEORIGIN.",
                category="HTTP Security Headers"
            ))
    else:
        header_results.append(HeaderInfo(
            header_name="X-Frame-Options",
            status="Absent",
            current_value=None,
            severity=SeverityLevel.MEDIUM,
            security_significance="Prevents Clickjacking by controlling site framing permissions.",
            recommendation="Add X-Frame-Options: DENY or SAMEORIGIN (or use CSP frame-ancestors directive)."
        ))
        findings.append(Finding(
            title="Missing X-Frame-Options Header",
            severity=SeverityLevel.MEDIUM,
            description="The server did not send an X-Frame-Options header.",
            evidence="Header 'X-Frame-Options' is absent.",
            impact="The site could be embedded into an attacker's malicious iframe to perform clickjacking attacks.",
            recommendation="Set X-Frame-Options header to DENY or SAMEORIGIN.",
            category="HTTP Security Headers"
        ))

    # 4. X-Content-Type-Options
    xcto = headers_lower.get("x-content-type-options")
    if xcto and "nosniff" in xcto.lower():
        header_results.append(HeaderInfo(
            header_name="X-Content-Type-Options",
            status="Present",
            current_value=xcto,
            severity=SeverityLevel.INFO,
            security_significance="Prevents MIME-type sniffing by forcing browser to adhere to declared Content-Type.",
            recommendation="Keep 'nosniff' setting active."
        ))
        findings.append(Finding(
            title="X-Content-Type-Options Configured",
            severity=SeverityLevel.INFO,
            description="X-Content-Type-Options is set to nosniff.",
            evidence=f"X-Content-Type-Options: {xcto}",
            impact="Prevents MIME sniffing attacks.",
            recommendation="Keep setting enabled across all web endpoints.",
            category="HTTP Security Headers"
        ))
    else:
        header_results.append(HeaderInfo(
            header_name="X-Content-Type-Options",
            status="Absent" if not xcto else "Present",
            current_value=xcto,
            severity=SeverityLevel.LOW,
            security_significance="Disables MIME-type sniffing in web browsers.",
            recommendation="Set X-Content-Type-Options: nosniff."
        ))
        findings.append(Finding(
            title="Missing or Invalid X-Content-Type-Options Header",
            severity=SeverityLevel.LOW,
            description="The header X-Content-Type-Options is missing or not set to 'nosniff'.",
            evidence=f"X-Content-Type-Options: {xcto or 'Absent'}",
            impact="Browsers may attempt to infer Content-Type, potentially leading to drive-by code execution.",
            recommendation="Configure header X-Content-Type-Options: nosniff.",
            category="HTTP Security Headers"
        ))

    # 5. Referrer-Policy
    ref_policy = headers_lower.get("referrer-policy")
    if ref_policy:
        header_results.append(HeaderInfo(
            header_name="Referrer-Policy",
            status="Present",
            current_value=ref_policy,
            severity=SeverityLevel.INFO,
            security_significance="Controls how much referrer information is sent with requests.",
            recommendation="Ensure a restrictive policy like strict-origin-when-cross-origin or no-referrer is used."
        ))
        if ref_policy.lower() in ["no-referrer", "strict-origin-when-cross-origin", "same-origin"]:
            findings.append(Finding(
                title="Referrer-Policy Configured",
                severity=SeverityLevel.INFO,
                description=f"Referrer-Policy is configured as '{ref_policy}'.",
                evidence=f"Referrer-Policy: {ref_policy}",
                impact="Protects sensitive URL query parameters from leaking to third parties.",
                recommendation="Maintain current secure Referrer-Policy setting.",
                category="HTTP Security Headers"
            ))
        else:
            findings.append(Finding(
                title="Permissive Referrer-Policy Header",
                severity=SeverityLevel.LOW,
                description=f"Referrer-Policy is set to '{ref_policy}'.",
                evidence=f"Referrer-Policy: {ref_policy}",
                impact="May leak URL paths or tokens in Referer request headers.",
                recommendation="Use strict-origin-when-cross-origin or no-referrer.",
                category="HTTP Security Headers"
            ))
    else:
        header_results.append(HeaderInfo(
            header_name="Referrer-Policy",
            status="Absent",
            current_value=None,
            severity=SeverityLevel.LOW,
            security_significance="Controls HTTP Referer information sent in cross-origin requests.",
            recommendation="Set Referrer-Policy: strict-origin-when-cross-origin."
        ))
        findings.append(Finding(
            title="Missing Referrer-Policy Header",
            severity=SeverityLevel.LOW,
            description="The Referrer-Policy header is absent.",
            evidence="Header 'Referrer-Policy' is absent.",
            impact="Browsers will use default referrer policy, potentially exposing full URLs in cross-origin requests.",
            recommendation="Add Referrer-Policy header set to strict-origin-when-cross-origin.",
            category="HTTP Security Headers"
        ))

    # 6. Permissions-Policy
    perm_policy = headers_lower.get("permissions-policy") or headers_lower.get("feature-policy")
    if perm_policy:
        header_results.append(HeaderInfo(
            header_name="Permissions-Policy",
            status="Present",
            current_value=perm_policy,
            severity=SeverityLevel.INFO,
            security_significance="Controls browser hardware features (camera, microphone, geolocation, payment).",
            recommendation="Restrict unnecessary hardware API permissions."
        ))
        findings.append(Finding(
            title="Permissions-Policy Configured",
            severity=SeverityLevel.INFO,
            description="Permissions-Policy (or Feature-Policy) header is present.",
            evidence=f"Permissions-Policy: {perm_policy}",
            impact="Limits browser feature availability in embedded frames and client scripts.",
            recommendation="Periodically audit feature restrictions.",
            category="HTTP Security Headers"
        ))
    else:
        header_results.append(HeaderInfo(
            header_name="Permissions-Policy",
            status="Absent",
            current_value=None,
            severity=SeverityLevel.LOW,
            security_significance="Controls browser hardware feature APIs.",
            recommendation="Implement Permissions-Policy header to restrict camera, microphone, geolocation access."
        ))
        findings.append(Finding(
            title="Missing Permissions-Policy Header",
            severity=SeverityLevel.LOW,
            description="The Permissions-Policy header is absent.",
            evidence="Header 'Permissions-Policy' is absent.",
            impact="Embedded context scripts could attempt to request access to camera, microphone, or location APIs.",
            recommendation="Define a Permissions-Policy header restricting unneeded browser features.",
            category="HTTP Security Headers"
        ))

    # 7. Additional headers: COOP, CORP, COEP, Cache-Control
    coop = headers_lower.get("cross-origin-opener-policy")
    header_results.append(HeaderInfo(
        header_name="Cross-Origin-Opener-Policy",
        status="Present" if coop else "Absent",
        current_value=coop,
        severity=SeverityLevel.INFO if coop else SeverityLevel.LOW,
        security_significance="Isolates top-level window from cross-origin documents.",
        recommendation="Consider configuring COOP to same-origin for cross-origin isolation."
    ))

    corp = headers_lower.get("cross-origin-resource-policy")
    header_results.append(HeaderInfo(
        header_name="Cross-Origin-Resource-Policy",
        status="Present" if corp else "Absent",
        current_value=corp,
        severity=SeverityLevel.INFO if corp else SeverityLevel.LOW,
        security_significance="Blocks cross-origin requests for resources.",
        recommendation="Consider setting CORP to same-origin or same-site."
    ))

    coep = headers_lower.get("cross-origin-embedder-policy")
    header_results.append(HeaderInfo(
        header_name="Cross-Origin-Embedder-Policy",
        status="Present" if coep else "Absent",
        current_value=coep,
        severity=SeverityLevel.INFO if coep else SeverityLevel.LOW,
        security_significance="Prevents a document from loading cross-origin resources that don't grant permission.",
        recommendation="Configure COEP if cross-origin isolation is needed."
    ))

    cache = headers_lower.get("cache-control")
    header_results.append(HeaderInfo(
        header_name="Cache-Control",
        status="Present" if cache else "Absent",
        current_value=cache,
        severity=SeverityLevel.INFO,
        security_significance="Directs caching behavior to prevent caching sensitive responses.",
        recommendation="Set no-store, no-cache for sensitive dynamic endpoints."
    ))

    # Enrich findings with OWASP, CWE, and detection rules
    from app.services.owasp_cwe import map_owasp_cwe
    for f in findings:
        if not f.owasp_category or not f.cwe_id:
            owasp, cwe = map_owasp_cwe(f.category, f.title)
            f.owasp_category = owasp
            f.cwe_id = cwe
        if not f.detection_rule:
            f.detection_rule = "RULE_HTTP_HEADER_CHECK"

    return header_results, findings
