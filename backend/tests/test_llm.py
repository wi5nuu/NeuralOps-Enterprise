import pytest


@pytest.mark.asyncio
async def test_create_conversation(client, auth_headers):
    response = await client.post("/api/playground/conversations", json={
        "title": "Test Conversation",
        "model_id": "claude-3-haiku-20240307",
    }, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Conversation"
    assert "id" in data


@pytest.mark.asyncio
async def test_list_conversations(client, auth_headers):
    await client.post("/api/playground/conversations", json={"title": "Conv 1"}, headers=auth_headers)
    await client.post("/api/playground/conversations", json={"title": "Conv 2"}, headers=auth_headers)

    response = await client.get("/api/playground/conversations", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) >= 2


@pytest.mark.asyncio
async def test_get_conversation(client, auth_headers):
    create_resp = await client.post("/api/playground/conversations", json={"title": "My Conversation"}, headers=auth_headers)
    conv_id = create_resp.json()["id"]

    response = await client.get(f"/api/playground/conversations/{conv_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["id"] == conv_id


@pytest.mark.asyncio
async def test_delete_conversation(client, auth_headers):
    create_resp = await client.post("/api/playground/conversations", json={"title": "Temp"}, headers=auth_headers)
    conv_id = create_resp.json()["id"]

    response = await client.delete(f"/api/playground/conversations/{conv_id}", headers=auth_headers)
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_get_nonexistent_conversation(client, auth_headers):
    response = await client.get("/api/playground/conversations/nonexistent-id", headers=auth_headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_list_prompts(client, auth_headers):
    response = await client.get("/api/playground/prompts", headers=auth_headers)
    assert response.status_code == 200
