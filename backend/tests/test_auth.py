import pytest


@pytest.mark.asyncio
async def test_register(client):
    response = await client.post("/api/auth/register", json={
        "email": "newuser@test.com",
        "password": "testpass123",
        "name": "New User",
        "organization_name": "New Org",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_register_duplicate_email(client, test_user):
    response = await client.post("/api/auth/register", json={
        "email": test_user.email,
        "password": "testpass123",
        "name": "Duplicate",
    })
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_login_success(client, test_user):
    response = await client.post("/api/auth/login", json={
        "email": test_user.email,
        "password": "testpass123",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_invalid_password(client, test_user):
    response = await client.post("/api/auth/login", json={
        "email": test_user.email,
        "password": "wrongpassword",
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_user(client):
    response = await client.post("/api/auth/login", json={
        "email": "nobody@example.com",
        "password": "testpass123",
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token(client, test_user):
    login_resp = await client.post("/api/auth/login", json={
        "email": test_user.email,
        "password": "testpass123",
    })
    refresh_token = login_resp.json()["refresh_token"]

    response = await client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_get_current_user(client, auth_headers, test_user):
    response = await client.get("/api/users/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user.email
    assert data["name"] == test_user.name


@pytest.mark.asyncio
async def test_get_current_user_no_auth(client):
    response = await client.get("/api/users/me")
    assert response.status_code == 401
