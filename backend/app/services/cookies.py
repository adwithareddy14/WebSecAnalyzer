from typing import List, Tuple
from http.cookies import SimpleCookie
from app.schemas.scan import CookieInfo, Finding, SeverityLevel

def analyze_cookies(raw_set_cookie_headers: List[str], is_https: bool) -> Tuple[List[CookieInfo], List[Finding]]:
    cookie_results: List[CookieInfo] = []
    findings: List[Finding] = []

    for header_str in raw_set_cookie_headers:
        cookie = SimpleCookie()
        try:
            cookie.load(header_str)
        except Exception:
            continue

        for name, morsel in cookie.items():
            value_preview = morsel.value[:20] + "..." if len(morsel.value) > 20 else morsel.value
            secure = bool(morsel['secure'])
            httponly = bool(morsel['httponly'])
            samesite = morsel['samesite'] if 'samesite' in morsel and morsel['samesite'] else None
            domain = morsel['domain'] if 'domain' in morsel and morsel['domain'] else None
            path = morsel['path'] if 'path' in morsel and morsel['path'] else None
            expires = morsel['expires'] if 'expires' in morsel and morsel['expires'] else morsel.get('max-age', None)

            cookie_findings: List[Finding] = []

            # Check Secure flag
            if is_https and not secure:
                f = Finding(
                    title=f"Cookie Missing Secure Flag: {name}",
                    severity=SeverityLevel.MEDIUM,
                    description=f"Cookie '{name}' was set over HTTPS without the Secure flag.",
                    evidence=f"Set-Cookie: {name}=... (Secure flag missing)",
                    impact="Cookie could be inadvertently transmitted in unencrypted HTTP requests over network sniffing paths.",
                    recommendation=f"Add the 'Secure' attribute to cookie '{name}'.",
                    category="Cookie Security"
                )
                cookie_findings.append(f)
                findings.append(f)

            # Check HttpOnly flag
            if not httponly:
                # Sensitive session cookie names
                is_session = any(token in name.lower() for token in ["session", "token", "auth", "jwt", "sid", "user"])
                sev = SeverityLevel.MEDIUM if is_session else SeverityLevel.LOW
                f = Finding(
                    title=f"Cookie Missing HttpOnly Flag: {name}",
                    severity=sev,
                    description=f"Cookie '{name}' does not specify the HttpOnly attribute.",
                    evidence=f"Set-Cookie: {name}=... (HttpOnly flag missing)",
                    impact="Client-side scripts can access this cookie via document.cookie, increasing risk if XSS occurs.",
                    recommendation=f"Add the 'HttpOnly' attribute to cookie '{name}'.",
                    category="Cookie Security"
                )
                cookie_findings.append(f)
                findings.append(f)

            # Check SameSite attribute
            if not samesite:
                f = Finding(
                    title=f"Cookie Missing SameSite Attribute: {name}",
                    severity=SeverityLevel.LOW,
                    description=f"Cookie '{name}' does not specify a SameSite policy.",
                    evidence=f"Set-Cookie: {name}=... (SameSite missing)",
                    impact="Increases vulnerability to Cross-Site Request Forgery (CSRF) attacks.",
                    recommendation=f"Set SameSite=Lax or SameSite=Strict on cookie '{name}'.",
                    category="Cookie Security"
                )
                cookie_findings.append(f)
                findings.append(f)
            elif samesite.lower() == "none" and not secure:
                f = Finding(
                    title=f"Insecure Cookie SameSite=None without Secure flag: {name}",
                    severity=SeverityLevel.HIGH,
                    description=f"Cookie '{name}' has SameSite=None but lacks the Secure attribute.",
                    evidence=f"Set-Cookie: {name}=... SameSite=None",
                    impact="Modern browsers will reject this cookie or expose it across origins insecurely.",
                    recommendation=f"Set SameSite=None only in conjunction with the Secure flag over HTTPS.",
                    category="Cookie Security"
                )
                cookie_findings.append(f)
                findings.append(f)

            cookie_results.append(CookieInfo(
                name=name,
                value_preview=value_preview,
                secure=secure,
                httponly=httponly,
                samesite=samesite,
                domain=domain,
                path=path,
                expires_or_maxage=expires,
                findings=cookie_findings
            ))

    from app.services.owasp_cwe import map_owasp_cwe
    for f in findings:
        if not f.owasp_category or not f.cwe_id:
            owasp, cwe = map_owasp_cwe(f.category, f.title)
            f.owasp_category = owasp
            f.cwe_id = cwe
        if not f.detection_rule:
            f.detection_rule = "RULE_COOKIE_ATTRIBUTE_CHECK"

    return cookie_results, findings
