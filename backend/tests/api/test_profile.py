from fastapi.testclient import TestClient
from app.models.city import City


def _auth_headers(client: TestClient, email="profile@example.com", password="password123"):
    client.post(
        "/api/v1/auth/signup",
        json={
            "first_name": "Pro",
            "last_name": "File",
            "email": email,
            "password": password,
        },
    )
    login = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def test_get_profile(client):
    headers = _auth_headers(client, "pro1@example.com")
    res = client.get("/api/v1/users/me", headers=headers)
    assert res.status_code == 200
    assert res.json()["email"] == "pro1@example.com"
    assert res.json()["trip_count"] == 0


def test_update_profile(client):
    headers = _auth_headers(client, "pro2@example.com")
    res = client.patch(
        "/api/v1/users/me",
        headers=headers,
        json={"first_name": "Updated", "bio": "Hello World", "language_pref": "fr"},
    )
    assert res.status_code == 200
    assert res.json()["first_name"] == "Updated"
    assert res.json()["bio"] == "Hello World"
    assert res.json()["language_pref"] == "fr"


def test_saved_destinations(client, db):
    headers = _auth_headers(client, "saved@example.com")
    
    city1 = City(name="City1", country="Country1", cost_index=1, popularity_score=1)
    city2 = City(name="City2", country="Country2", cost_index=1, popularity_score=1)
    db.add_all([city1, city2])
    db.commit()

    # Save
    res = client.post("/api/v1/users/me/saved-destinations", headers=headers, json={"city_id": city1.id})
    assert res.status_code == 200
    assert res.json()["city_name"] == "City1"

    # Duplicate save (idempotent)
    res = client.post("/api/v1/users/me/saved-destinations", headers=headers, json={"city_id": city1.id})
    assert res.status_code == 200

    # Save another
    client.post("/api/v1/users/me/saved-destinations", headers=headers, json={"city_id": city2.id})

    # List
    res = client.get("/api/v1/users/me/saved-destinations", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) == 2

    # Unsave
    res = client.delete(f"/api/v1/users/me/saved-destinations/{city1.id}", headers=headers)
    assert res.status_code == 204

    res = client.get("/api/v1/users/me/saved-destinations", headers=headers)
    assert len(res.json()) == 1
    assert res.json()[0]["city_id"] == city2.id


def test_delete_account(client):
    headers = _auth_headers(client, "del@example.com")
    res = client.delete("/api/v1/users/me", headers=headers)
    assert res.status_code == 204

    # Token should no longer work
    res = client.get("/api/v1/users/me", headers=headers)
    assert res.status_code == 401


def test_delete_account_with_trips_and_shares(client):
    headers = _auth_headers(client, "del-trips@example.com")
    trip = client.post(
        "/api/v1/trips",
        headers=headers,
        json={
            "name": "Trip to delete",
            "start_date": "2026-09-01",
            "end_date": "2026-09-14",
            "budget_cap": 1000,
        },
    )
    assert trip.status_code == 201
    share = client.post(
        "/api/v1/shares",
        headers=headers,
        json={"trip_id": trip.json()["id"]},
    )
    assert share.status_code == 201

    res = client.delete("/api/v1/users/me", headers=headers)
    assert res.status_code == 204, res.text

    res = client.get("/api/v1/users/me", headers=headers)
    assert res.status_code == 401
