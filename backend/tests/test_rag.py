import pytest


@pytest.mark.asyncio
async def test_create_collection(client, auth_headers):
    response = await client.post("/api/rag/collections", json={
        "name": "Test Collection",
        "description": "A test RAG collection",
    }, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Collection"
    assert "id" in data


@pytest.mark.asyncio
async def test_list_collections(client, auth_headers):
    await client.post("/api/rag/collections", json={"name": "Collection 1"}, headers=auth_headers)
    await client.post("/api/rag/collections", json={"name": "Collection 2"}, headers=auth_headers)

    response = await client.get("/api/rag/collections", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2


@pytest.mark.asyncio
async def test_get_collection(client, auth_headers):
    create_resp = await client.post("/api/rag/collections", json={"name": "My Collection"}, headers=auth_headers)
    collection_id = create_resp.json()["id"]

    response = await client.get(f"/api/rag/collections/{collection_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["name"] == "My Collection"


@pytest.mark.asyncio
async def test_get_nonexistent_collection(client, auth_headers):
    response = await client.get("/api/rag/collections/nonexistent-id", headers=auth_headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_collection(client, auth_headers):
    create_resp = await client.post("/api/rag/collections", json={"name": "Temp Collection"}, headers=auth_headers)
    collection_id = create_resp.json()["id"]

    response = await client.delete(f"/api/rag/collections/{collection_id}", headers=auth_headers)
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_upload_document(client, auth_headers):
    create_resp = await client.post("/api/rag/collections", json={"name": "Doc Test"}, headers=auth_headers)
    collection_id = create_resp.json()["id"]

    response = await client.post(
        f"/api/rag/collections/{collection_id}/documents/upload",
        files={"file": ("test.txt", b"Hello world, this is a test document for RAG processing.", "text/plain")},
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["filename"] == "test.txt"
    assert data["status"] in ("completed", "processing")
