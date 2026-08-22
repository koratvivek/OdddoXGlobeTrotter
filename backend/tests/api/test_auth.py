def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_signup_login_and_me(client):
    signup = client.post(
        "/api/v1/auth/signup",
        json={
            "first_name": "Jamie",
            "last_name": "Lee",
            "email": "jamie@example.com",
            "password": "password123",
            "city": "London",
            "country": "UK",
        },
    )
    assert signup.status_code == 201
    token = signup.json()["access_token"]

    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    body = me.json()
    assert body["email"] == "jamie@example.com"
    assert body["first_name"] == "Jamie"
    assert body["name"] == "Jamie Lee"

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "jamie@example.com", "password": "password123"},
    )
    assert login.status_code == 200
    assert "access_token" in login.json()


def test_signup_duplicate_email(client):
    payload = {
        "first_name": "A",
        "last_name": "B",
        "email": "dup@example.com",
        "password": "password123",
    }
    assert client.post("/api/v1/auth/signup", json=payload).status_code == 201
    dup = client.post("/api/v1/auth/signup", json=payload)
    assert dup.status_code == 409


def test_login_unknown_user_returns_404(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "missing@example.com", "password": "password123"},
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "User not found."


def test_login_wrong_password_returns_401(client):
    client.post(
        "/api/v1/auth/signup",
        json={
            "first_name": "Wrong",
            "last_name": "Pass",
            "email": "wrongpass@example.com",
            "password": "password123",
        },
    )
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "wrongpass@example.com", "password": "not-the-password"},
    )
    assert response.status_code == 401


def test_change_password_requires_auth(client):
    response = client.post(
        "/api/v1/auth/change-password",
        json={"current_password": "password123", "new_password": "newpass123"},
    )
    assert response.status_code == 401


def test_change_password_wrong_current(client):
    client.post(
        "/api/v1/auth/signup",
        json={
            "first_name": "Ch",
            "last_name": "Pass",
            "email": "changepass@example.com",
            "password": "password123",
        },
    )
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "changepass@example.com", "password": "password123"},
    )
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    response = client.post(
        "/api/v1/auth/change-password",
        headers=headers,
        json={"current_password": "wrong-old", "new_password": "newpass123"},
    )
    assert response.status_code == 401


def test_change_password_success(client):
    client.post(
        "/api/v1/auth/signup",
        json={
            "first_name": "New",
            "last_name": "Pass",
            "email": "newpass@example.com",
            "password": "password123",
        },
    )
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "newpass@example.com", "password": "password123"},
    )
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    response = client.post(
        "/api/v1/auth/change-password",
        headers=headers,
        json={"current_password": "password123", "new_password": "newpass123"},
    )
    assert response.status_code == 200

    old = client.post(
        "/api/v1/auth/login",
        json={"email": "newpass@example.com", "password": "password123"},
    )
    assert old.status_code == 401

    fresh = client.post(
        "/api/v1/auth/login",
        json={"email": "newpass@example.com", "password": "newpass123"},
    )
    assert fresh.status_code == 200
