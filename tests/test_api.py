import sys
import os
from fastapi.testclient import TestClient

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.main import app

client = TestClient(app)

def test_api_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_demo_target_endpoint():
    response = client.get("/demo-target")
    assert response.status_code == 200
    assert "Server" in response.headers
    assert response.headers["Server"] == "DemoServer/1.2.3-vulnerable"
