import pytest
from fastapi.testclient import TestClient

from app.core.security import hash_password
from app.models.user import User


def _auth_headers(client: TestClient, email="tripper@example.com", password="password123"):
    client.post(
        "/api/v1/auth/signup",
        json={
            "first_name": "Trip",
            "last_name": "User",
            "email": email,
            "password": password,
        },
    )
    login = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_list_trips_empty(client):
    headers = _auth_headers(client, "empty@example.com")
    response = client.get("/api/v1/trips", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["items"] == []
    assert body["total"] == 0
    assert body["page"] == 1


def test_create_list_get_patch_delete_trip(client):
    headers = _auth_headers(client, "crud@example.com")
    create = client.post(
        "/api/v1/trips",
        headers=headers,
        json={
            "name": "Japan Adventure",
            "start_date": "2026-09-01",
            "end_date": "2026-09-14",
            "description": "Tokyo and Kyoto",
            "budget_cap": 2500,
        },
    )
    assert create.status_code == 201
    trip = create.json()
    assert trip["name"] == "Japan Adventure"
    assert trip["stop_count"] == 0

    listing = client.get("/api/v1/trips", headers=headers)
    assert listing.status_code == 200
    assert listing.json()["total"] == 1

    get_one = client.get(f"/api/v1/trips/{trip['id']}", headers=headers)
    assert get_one.status_code == 200

    patch = client.patch(
        f"/api/v1/trips/{trip['id']}",
        headers=headers,
        json={"name": "Japan 2026"},
    )
    assert patch.status_code == 200
    assert patch.json()["name"] == "Japan 2026"

    delete = client.delete(f"/api/v1/trips/{trip['id']}", headers=headers)
    assert delete.status_code == 204

    missing = client.get(f"/api/v1/trips/{trip['id']}", headers=headers)
    assert missing.status_code == 404


def test_trips_pagination(client):
    headers = _auth_headers(client, "pages@example.com")
    for i in range(3):
        client.post(
            "/api/v1/trips",
            headers=headers,
            json={
                "name": f"Trip {i}",
                "start_date": "2026-10-01",
                "end_date": "2026-10-05",
            },
        )
    page1 = client.get("/api/v1/trips?page=1&page_size=2", headers=headers)
    page2 = client.get("/api/v1/trips?page=2&page_size=2", headers=headers)
    assert page1.json()["total"] == 3
    assert len(page1.json()["items"]) == 2
    assert len(page2.json()["items"]) == 1


def test_trips_unauthorized(client):
    response = client.get("/api/v1/trips")
    assert response.status_code == 401


def test_trips_other_user_forbidden(client, db):
    headers_a = _auth_headers(client, "owner@example.com")
    create = client.post(
        "/api/v1/trips",
        headers=headers_a,
        json={"name": "Private", "start_date": "2026-11-01", "end_date": "2026-11-05"},
    )
    trip_id = create.json()["id"]

    other = User(
        first_name="Other",
        last_name="User",
        name="Other User",
        email="other@example.com",
        password_hash=hash_password("password123"),
    )
    db.add(other)
    db.commit()

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "other@example.com", "password": "password123"},
    )
    headers_b = {"Authorization": f"Bearer {login.json()['access_token']}"}
    response = client.get(f"/api/v1/trips/{trip_id}", headers=headers_b)
    assert response.status_code == 404


def test_list_cities_paginated(client):
    headers = _auth_headers(client, "cities@example.com")
    response = client.get("/api/v1/cities?page=1&page_size=10", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert "items" in body
    assert "total_pages" in body
