import pytest
from fastapi.testclient import TestClient

from app.core.security import hash_password
from app.models.activity import Activity
from app.models.city import City
from app.models.user import User


def _auth_headers(client: TestClient, email="itinerary@example.com", password="password123"):
    client.post(
        "/api/v1/auth/signup",
        json={
            "first_name": "Itin",
            "last_name": "User",
            "email": email,
            "password": password,
        },
    )
    login = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def _create_trip(client, headers):
    response = client.post(
        "/api/v1/trips",
        headers=headers,
        json={
            "name": "Europe Trip",
            "start_date": "2026-09-01",
            "end_date": "2026-09-14",
            "budget_cap": 3000,
        },
    )
    assert response.status_code == 201
    return response.json()


def _seed_city_and_activity(db):
    city = City(name="Paris", country="France", cost_index=4.0, popularity_score=96)
    db.add(city)
    db.flush()
    activity = Activity(
        city_id=city.id,
        name="Louvre Museum Tour",
        category="Culture",
        cost=45,
        duration=180,
        description="Museum tour",
    )
    db.add(activity)
    db.commit()
    db.refresh(city)
    db.refresh(activity)
    return city, activity


def test_list_stops_empty(client):
    headers = _auth_headers(client, "stops-empty@example.com")
    trip = _create_trip(client, headers)
    response = client.get(f"/api/v1/stops?trip_id={trip['id']}", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["items"] == []
    assert body["total"] == 0


def test_create_list_patch_reorder_delete_stop(client, db):
    headers = _auth_headers(client, "stops-crud@example.com")
    trip = _create_trip(client, headers)
    city, _activity = _seed_city_and_activity(db)

    create = client.post(
        "/api/v1/stops",
        headers=headers,
        json={
            "trip_id": trip["id"],
            "city_id": city.id,
            "start_date": "2026-09-01",
            "end_date": "2026-09-05",
        },
    )
    assert create.status_code == 201
    stop = create.json()
    assert stop["order_index"] == 0

    create2 = client.post(
        "/api/v1/stops",
        headers=headers,
        json={
            "trip_id": trip["id"],
            "city_id": city.id,
            "start_date": "2026-09-06",
            "end_date": "2026-09-10",
        },
    )
    stop2 = create2.json()
    assert stop2["order_index"] == 1

    page1 = client.get(
        f"/api/v1/stops?trip_id={trip['id']}&page=1&page_size=1", headers=headers
    )
    page2 = client.get(
        f"/api/v1/stops?trip_id={trip['id']}&page=2&page_size=1", headers=headers
    )
    assert page1.json()["total"] == 2
    assert len(page1.json()["items"]) == 1
    assert len(page2.json()["items"]) == 1

    patch = client.patch(
        f"/api/v1/stops/{stop['id']}",
        headers=headers,
        json={"start_date": "2026-09-02", "end_date": "2026-09-06"},
    )
    assert patch.status_code == 200
    assert patch.json()["start_date"] == "2026-09-02"

    reorder = client.patch(
        f"/api/v1/stops/{stop2['id']}",
        headers=headers,
        json={"order_index": 0},
    )
    assert reorder.status_code == 200

    delete = client.delete(f"/api/v1/stops/{stop['id']}", headers=headers)
    assert delete.status_code == 204

    remaining = client.get(f"/api/v1/stops?trip_id={trip['id']}", headers=headers)
    assert remaining.json()["total"] == 1
    assert remaining.json()["items"][0]["order_index"] == 0


def test_list_activities_by_city_paginated(client, db):
    headers = _auth_headers(client, "acts@example.com")
    city, _activity = _seed_city_and_activity(db)

    response = client.get(
        f"/api/v1/activities?city_id={city.id}&page=1&page_size=10",
        headers=headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert "items" in body
    assert body["total"] >= 1


def test_trip_activity_crud(client, db):
    headers = _auth_headers(client, "ta-crud@example.com")
    trip = _create_trip(client, headers)
    city, activity = _seed_city_and_activity(db)

    stop = client.post(
        "/api/v1/stops",
        headers=headers,
        json={
            "trip_id": trip["id"],
            "city_id": city.id,
            "start_date": "2026-09-01",
            "end_date": "2026-09-05",
        },
    ).json()

    create = client.post(
        "/api/v1/trip-activities",
        headers=headers,
        json={"stop_id": stop["id"], "activity_id": activity.id},
    )
    assert create.status_code == 201
    ta = create.json()
    assert ta["activity_name"] == "Louvre Museum Tour"
    assert ta["scheduled_date"] == "2026-09-01"
    assert float(ta["effective_cost"]) == 45.0

    listing = client.get(
        f"/api/v1/trip-activities?stop_id={stop['id']}", headers=headers
    )
    assert listing.status_code == 200
    assert listing.json()["total"] == 1

    patch = client.patch(
        f"/api/v1/trip-activities/{ta['id']}",
        headers=headers,
        json={"scheduled_time": "14:30:00"},
    )
    assert patch.status_code == 200
    assert patch.json()["scheduled_time"].startswith("14:30")

    delete = client.delete(f"/api/v1/trip-activities/{ta['id']}", headers=headers)
    assert delete.status_code == 204


def test_itinerary_unauthorized(client, db):
    city, _activity = _seed_city_and_activity(db)
    response = client.get(f"/api/v1/activities?city_id={city.id}")
    assert response.status_code == 401


def test_stops_other_user_forbidden(client, db):
    headers_a = _auth_headers(client, "stop-owner@example.com")
    trip = _create_trip(client, headers_a)
    city, _activity = _seed_city_and_activity(db)
    stop = client.post(
        "/api/v1/stops",
        headers=headers_a,
        json={
            "trip_id": trip["id"],
            "city_id": city.id,
            "start_date": "2026-09-01",
            "end_date": "2026-09-05",
        },
    ).json()

    other = User(
        first_name="Other",
        last_name="User",
        name="Other User",
        email="stop-other@example.com",
        password_hash=hash_password("password123"),
    )
    db.add(other)
    db.commit()

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "stop-other@example.com", "password": "password123"},
    )
    headers_b = {"Authorization": f"Bearer {login.json()['access_token']}"}
    response = client.get(f"/api/v1/stops/{stop['id']}", headers=headers_b)
    assert response.status_code == 404
