from fastapi.testclient import TestClient
from app.models.user import User


def _auth_headers(client: TestClient, email="normal@example.com", is_admin=False, db=None):
    client.post(
        "/api/v1/auth/signup",
        json={
            "first_name": "Normal",
            "last_name": "User",
            "email": email,
            "password": "password123",
        },
    )
    if is_admin and db:
        user = db.query(User).filter_by(email=email).first()
        user.is_admin = True
        db.commit()

    login = client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def test_admin_routes_forbidden_for_normal_user(client):
    headers = _auth_headers(client, "normal1@example.com")
    res = client.get("/api/v1/admin/overview", headers=headers)
    assert res.status_code == 403


def test_admin_overview(client, db):
    headers = _auth_headers(client, "admin1@example.com", is_admin=True, db=db)
    res = client.get("/api/v1/admin/overview", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_users"] > 0
    assert "total_trips" in data


def test_admin_users(client, db):
    headers = _auth_headers(client, "admin2@example.com", is_admin=True, db=db)
    res = client.get("/api/v1/admin/users?page=1&page_size=10", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) > 0
    assert "trip_count" in data["items"][0]


def test_admin_stats(client, db):
    headers = _auth_headers(client, "admin3@example.com", is_admin=True, db=db)
    
    res = client.get("/api/v1/admin/stats/trips", headers=headers)
    assert res.status_code == 200
    assert "completed" in res.json()

    res = client.get("/api/v1/admin/stats/cities", headers=headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)

    res = client.get("/api/v1/admin/stats/activities", headers=headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)
