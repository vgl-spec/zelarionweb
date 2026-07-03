"""Backend tests for Zelarion demo request endpoints."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://3af12f79-e6fc-487b-b3f7-d589b1107dbc.preview.emergentagent.com").rstrip("/")


@pytest.fixture
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- Health ---
class TestHealth:
    def test_health(self, api):
        r = api.get(f"{BASE_URL}/api/health", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "ok"
        assert data["service"] == "zelarion"


# --- Demo Count ---
class TestDemoCount:
    def test_count_endpoint(self, api):
        r = api.get(f"{BASE_URL}/api/demo/count", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "count" in data
        assert isinstance(data["count"], int)
        assert data["count"] >= 0


# --- Demo Create ---
class TestDemoCreate:
    def test_create_valid_persists_and_increments_count(self, api):
        # capture pre-count
        pre = api.get(f"{BASE_URL}/api/demo/count", timeout=15).json()["count"]

        payload = {
            "name": "TEST_Ada Lovelace",
            "email": "test_ada@example.com",
            "company": "TEST_Analytical Engines Inc",
            "team_size": "11–50",
            "preferred_date": "2026-03-15",
            "message": "TEST_looking forward to it",
        }
        r = api.post(f"{BASE_URL}/api/demo", json=payload, timeout=20)
        assert r.status_code == 201, r.text
        data = r.json()
        # validate response fields
        assert data["name"] == payload["name"]
        assert data["email"] == payload["email"]
        assert data["company"] == payload["company"]
        assert data["team_size"] == payload["team_size"]
        assert data["preferred_date"] == payload["preferred_date"]
        assert data["message"] == payload["message"]
        assert "created_at" in data and isinstance(data["created_at"], str)
        # id present and stringified (no ObjectId leak)
        assert "id" in data or "_id" in data

        # count should have increased
        post = api.get(f"{BASE_URL}/api/demo/count", timeout=15).json()["count"]
        assert post == pre + 1, f"expected {pre+1}, got {post}"

    def test_create_minimal_valid(self, api):
        payload = {
            "name": "TEST_Min User",
            "email": "test_min@example.com",
            "company": "TEST_Co",
            "team_size": "1–10",
        }
        r = api.post(f"{BASE_URL}/api/demo", json=payload, timeout=20)
        assert r.status_code == 201, r.text
        data = r.json()
        assert data["email"] == payload["email"]

    def test_invalid_email_returns_422(self, api):
        payload = {
            "name": "TEST_Bad Email",
            "email": "not-an-email",
            "company": "TEST_Co",
            "team_size": "1–10",
        }
        r = api.post(f"{BASE_URL}/api/demo", json=payload, timeout=15)
        assert r.status_code == 422

    def test_missing_required_field_returns_422(self, api):
        payload = {
            "email": "test_missing@example.com",
            "company": "TEST_Co",
            "team_size": "1–10",
        }
        r = api.post(f"{BASE_URL}/api/demo", json=payload, timeout=15)
        assert r.status_code == 422

    def test_empty_name_returns_422(self, api):
        payload = {
            "name": "",
            "email": "test_empty@example.com",
            "company": "TEST_Co",
            "team_size": "1–10",
        }
        r = api.post(f"{BASE_URL}/api/demo", json=payload, timeout=15)
        assert r.status_code == 422
