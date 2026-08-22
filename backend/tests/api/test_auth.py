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
