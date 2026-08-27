import pytest
import sys
import os

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.services.scanner import validate_and_normalize_url

def test_url_normalization():
    assert validate_and_normalize_url("example.com") == "https://example.com"
    assert validate_and_normalize_url("http://example.com") == "http://example.com"
    assert validate_and_normalize_url("https://test.org/path") == "https://test.org/path"

def test_invalid_url():
    with pytest.raises(ValueError):
        validate_and_normalize_url(":::invalid")
