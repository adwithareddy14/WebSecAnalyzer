from fastapi import APIRouter, Response

demo_router = APIRouter()

@demo_router.get("/demo-target", summary="Local Intentionally Vulnerable Security Test Target")
def get_demo_target(response: Response):
    # Set weak / vulnerable response headers for demonstration
    response.headers["Server"] = "DemoServer/1.2.3-vulnerable"
    response.headers["X-Powered-By"] = "Express/4.17.1"
    
    # Intentionally missing HSTS, CSP, X-Frame-Options, X-Content-Type-Options
    
    # Set weak demo cookies
    response.set_cookie(key="session_id", value="demo_token_123456", secure=False, httponly=False)
    response.set_cookie(key="tracking_id", value="track_98765", secure=False, httponly=False)

    return {
        "status": "online",
        "message": "WebSecAnalyzer Local Demo Target Page",
        "notice": "This page intentionally omits key HTTP security headers and cookie security flags for testing.",
        "configuration": {
            "csp": "Missing",
            "hsts": "Missing",
            "x_frame_options": "Missing",
            "cookies": "Insecure demo cookies active"
        }
    }
