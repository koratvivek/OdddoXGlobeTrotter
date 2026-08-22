import pytest
from fastapi.testclient import TestClient

from app.models.activity import Activity
from app.models.city import City
from app.models.user import User


def _auth_headers(client: TestClient, email="share@example.com", password="password123"):
    client.post(
        "/api/v1/auth/signup",
        json={
            "first_name": "Share",
            "last_name": "User",
            "email": email,
            "password": password,
        },
    )
    login = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def _create_trip(client, headers, name="Europe Trip"):
    response = client.post(
        "/api/v1/trips",
        headers=headers,
        json={
            "name": name,
            "start_date": "2026-09-01",
            "end_date": "2026-09-14",
            "budget_cap": 3000,
            "description": "A lovely European adventure.",
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


def _add_stop_and_activity(client, headers, trip_id, city, activity):
    stop = client.post(
        "/api/v1/stops",
        headers=headers,
        json={
            "trip_id": trip_id,
            "city_id": city.id,
            "start_date": "2026-09-01",
            "end_date": "2026-09-05",
            "order_index": 0,
        },
    )
    assert stop.status_code == 201
    stop_id = stop.json()["id"]
    ta = client.post(
        "/api/v1/trip-activities",
        headers=headers,
        json={
            "stop_id": stop_id,
            "activity_id": activity.id,
            "scheduled_date": "2026-09-02",
            "scheduled_time": "10:00:00",
        },
    )
    assert ta.status_code == 201
    return stop_id


def test_create_share_and_idempotent(client, db):
    headers = _auth_headers(client, "create-share@example.com")
    trip = _create_trip(client, headers)
    city, activity = _seed_city_and_activity(db)
    _add_stop_and_activity(client, headers, trip["id"], city, activity)

    first = client.post("/api/v1/shares", headers=headers, json={"trip_id": trip["id"]})
    assert first.status_code == 201
    body = first.json()
    assert body["trip_id"] == trip["id"]
    slug = body["public_slug"]
    assert 8 <= len(slug) <= 12

    second = client.post("/api/v1/shares", headers=headers, json={"trip_id": trip["id"]})
    assert second.status_code == 201
    assert second.json()["public_slug"] == slug


def test_public_get_without_token(client, db):
    headers = _auth_headers(client, "public-get@example.com")
    trip = _create_trip(client, headers)
    city, activity = _seed_city_and_activity(db)
    _add_stop_and_activity(client, headers, trip["id"], city, activity)

    share = client.post("/api/v1/shares", headers=headers, json={"trip_id": trip["id"]})
    slug = share.json()["public_slug"]

    response = client.get(f"/api/v1/shares/public/{slug}")
    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == slug
    assert data["name"] == trip["name"]
    assert len(data["stops"]) == 1
    assert data["stops"][0]["city_name"] == "Paris"
    assert len(data["stops"][0]["activities"]) == 1
    assert data["budget"]["categories"]["activities"] == 45


def test_public_get_bad_slug_404(client):
    response = client.get("/api/v1/shares/public/not-a-real-slug")
    assert response.status_code == 404


def test_cannot_share_other_users_trip(client, db):
    owner_headers = _auth_headers(client, "owner-share@example.com")
    other_headers = _auth_headers(client, "other-share@example.com")
    trip = _create_trip(client, owner_headers)

    response = client.post(
        "/api/v1/shares",
        headers=other_headers,
        json={"trip_id": trip["id"]},
    )
    assert response.status_code == 404


def test_copy_trip_creates_owned_trip_with_stops(client, db):
    owner_headers = _auth_headers(client, "copy-owner@example.com")
    copier_headers = _auth_headers(client, "copy-user@example.com")
    trip = _create_trip(client, owner_headers)
    city, activity = _seed_city_and_activity(db)
    _add_stop_and_activity(client, owner_headers, trip["id"], city, activity)

    share = client.post("/api/v1/shares", headers=owner_headers, json={"trip_id": trip["id"]})
    slug = share.json()["public_slug"]

    copied = client.post(f"/api/v1/shares/public/{slug}/copy", headers=copier_headers)
    assert copied.status_code == 201
    new_trip_id = copied.json()["trip_id"]
    assert copied.json()["name"].endswith("(copy)")

    trip_detail = client.get(f"/api/v1/trips/{new_trip_id}", headers=copier_headers)
    assert trip_detail.status_code == 200
    assert trip_detail.json()["is_public"] is False

    stops = client.get(f"/api/v1/stops?trip_id={new_trip_id}", headers=copier_headers)
    assert stops.status_code == 200
    assert stops.json()["total"] == 1


def test_list_community_pagination(client, db):
    headers_a = _auth_headers(client, "list-a@example.com")
    headers_b = _auth_headers(client, "list-b@example.com")
    viewer_headers = _auth_headers(client, "list-viewer@example.com")

    trip_a = _create_trip(client, headers_a, name="Trip Alpha")
    trip_b = _create_trip(client, headers_b, name="Trip Beta")
    client.post("/api/v1/shares", headers=headers_a, json={"trip_id": trip_a["id"]})
    client.post("/api/v1/shares", headers=headers_b, json={"trip_id": trip_b["id"]})

    page1 = client.get("/api/v1/shares?page=1&page_size=1", headers=viewer_headers)
    assert page1.status_code == 200
    assert page1.json()["total"] == 2
    assert len(page1.json()["items"]) == 1

    page2 = client.get("/api/v1/shares?page=2&page_size=1", headers=viewer_headers)
    assert page2.status_code == 200
    assert len(page2.json()["items"]) == 1


def test_list_unauthorized_401(client):
    response = client.get("/api/v1/shares")
    assert response.status_code == 401


def test_revoke_then_public_404(client):
    headers = _auth_headers(client, "revoke@example.com")
    trip = _create_trip(client, headers)
    share = client.post("/api/v1/shares", headers=headers, json={"trip_id": trip["id"]})
    share_id = share.json()["id"]
    slug = share.json()["public_slug"]

    delete = client.delete(f"/api/v1/shares/{share_id}", headers=headers)
    assert delete.status_code == 204

    public = client.get(f"/api/v1/shares/public/{slug}")
    assert public.status_code == 404


def test_like_increments_and_idempotent(client, db):
    owner_headers = _auth_headers(client, "like-owner@example.com")
    liker_headers = _auth_headers(client, "like-user@example.com")
    trip = _create_trip(client, owner_headers)
    share = client.post("/api/v1/shares", headers=owner_headers, json={"trip_id": trip["id"]})
    share_id = share.json()["id"]

    first = client.post(f"/api/v1/shares/{share_id}/like", headers=liker_headers)
    assert first.status_code == 200
    assert first.json()["like_count"] == 1
    assert first.json()["liked_by_me"] is True

    second = client.post(f"/api/v1/shares/{share_id}/like", headers=liker_headers)
    assert second.status_code == 200
    assert second.json()["like_count"] == 1

    listing = client.get("/api/v1/shares", headers=liker_headers)
    card = next(item for item in listing.json()["items"] if item["id"] == share_id)
    assert card["like_count"] == 1
    assert card["liked_by_me"] is True


def test_unlike_decrements(client):
    owner_headers = _auth_headers(client, "unlike-owner@example.com")
    liker_headers = _auth_headers(client, "unlike-user@example.com")
    trip = _create_trip(client, owner_headers)
    share = client.post("/api/v1/shares", headers=owner_headers, json={"trip_id": trip["id"]})
    share_id = share.json()["id"]

    client.post(f"/api/v1/shares/{share_id}/like", headers=liker_headers)
    response = client.delete(f"/api/v1/shares/{share_id}/like", headers=liker_headers)
    assert response.status_code == 200
    assert response.json()["like_count"] == 0
    assert response.json()["liked_by_me"] is False


def test_like_without_token_401(client):
    response = client.post("/api/v1/shares/1/like")
    assert response.status_code == 401


def test_public_toggle_creates_community_share(client):
    owner = _auth_headers(client, "toggle-owner@example.com")
    viewer = _auth_headers(client, "toggle-viewer@example.com")
    trip = _create_trip(client, owner, name="Public Toggle Trip")

    patch = client.patch(
        f"/api/v1/trips/{trip['id']}",
        headers=owner,
        json={"is_public": True},
    )
    assert patch.status_code == 200
    assert patch.json()["is_public"] is True

    listing = client.get("/api/v1/shares", headers=viewer)
    assert listing.status_code == 200
    names = [item["trip_name"] for item in listing.json()["items"]]
    assert "Public Toggle Trip" in names

    client.patch(
        f"/api/v1/trips/{trip['id']}",
        headers=owner,
        json={"is_public": False},
    )
    listing = client.get("/api/v1/shares", headers=viewer)
    names = [item["trip_name"] for item in listing.json()["items"]]
    assert "Public Toggle Trip" not in names
