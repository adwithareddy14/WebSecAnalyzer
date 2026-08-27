import sys
import os

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.services.cookies import analyze_cookies

def test_cookie_flags_analysis():
    raw_cookies = [
        "session_id=12345; Path=/",
        "auth_token=abcde; Secure; HttpOnly; SameSite=Strict"
    ]
    cookies, findings = analyze_cookies(raw_cookies, is_https=True)
    
    assert len(cookies) == 2
    # First cookie should trigger missing Secure, HttpOnly, and SameSite findings
    session_cookie = next(c for c in cookies if c.name == "session_id")
    assert session_cookie.secure is False
    assert session_cookie.httponly is False
    assert len(session_cookie.findings) > 0

    # Second cookie should be clean
    auth_cookie = next(c for c in cookies if c.name == "auth_token")
    assert auth_cookie.secure is True
    assert auth_cookie.httponly is True
    assert auth_cookie.samesite == "Strict"
    assert len(auth_cookie.findings) == 0
