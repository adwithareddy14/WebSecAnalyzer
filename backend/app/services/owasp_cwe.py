from typing import Tuple, Optional

def map_owasp_cwe(category: str, title: str) -> Tuple[str, str]:
    cat_lower = category.lower()
    title_lower = title.lower()

    if "header" in cat_lower or "header" in title_lower:
        return ("A05:2021 – Security Misconfiguration", "CWE-693: Protection Mechanism Failure")
    
    if "cookie" in cat_lower or "cookie" in title_lower:
        return ("A05:2021 – Security Misconfiguration", "CWE-614: Sensitive Cookie Without 'Secure' Attribute")

    if "tls" in cat_lower or "https" in cat_lower or "ssl" in title_lower or "certificate" in title_lower:
        return ("A02:2021 – Cryptographic Failures", "CWE-319: Cleartext Transmission of Sensitive Information")

    if "cors" in cat_lower or "cors" in title_lower:
        return ("A07:2021 – Identification and Authentication Failures", "CWE-942: Permissive Cross-Domain Policy")

    if "disclosure" in cat_lower or "version" in title_lower or "information" in cat_lower:
        return ("A01:2021 – Broken Access Control", "CWE-200: Exposure of Sensitive Information to an Unauthorized Actor")

    if "network" in cat_lower or "timeout" in title_lower:
        return ("A05:2021 – Security Misconfiguration", "CWE-1188: Initialization with Insecure Default Values")

    return ("A05:2021 – Security Misconfiguration", "CWE-16: Configuration")
