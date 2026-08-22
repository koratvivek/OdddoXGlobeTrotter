from fastapi.testclient import TestClient

# Minimal valid 1x1 PNG
PNG_BYTES = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00"
    b"\x01\x01\x01\x00\x18\xdd\x8d\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
)


def _auth_headers(client: TestClient, email="upload@example.com", password="password123"):
    client.post(
        "/api/v1/auth/signup",
        json={
            "first_name": "Up",
            "last_name": "Load",
            "email": email,
            "password": password,
        },
    )
    login = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def test_upload_image_requires_auth(client):
    response = client.post(
        "/api/v1/uploads/image",
        files={"file": ("photo.png", PNG_BYTES, "image/png")},
    )
    assert response.status_code == 401


def test_upload_image_success(client):
    headers = _auth_headers(client)
    response = client.post(
        "/api/v1/uploads/image",
        headers=headers,
        files={"file": ("photo.png", PNG_BYTES, "image/png")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["url"].startswith("/uploads/")
    assert body["url"].endswith(".png")

    served = client.get(body["url"])
    assert served.status_code == 200
    assert served.headers["content-type"].startswith("image/")
