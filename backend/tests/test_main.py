import pytest
from httpx import AsyncClient
from backend.main import app

@pytest.mark.asyncio
async def test_root():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/")
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_user_initiated_flow():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Create
        response = await ac.post("/conversations/", json={"mode": "user_initiated", "title": "Test User"})
        assert response.status_code == 200
        data = response.json()
        conv_id = data["id"]
        assert len(data["messages"]) == 0

        # Send Message
        response = await ac.post(f"/conversations/{conv_id}/messages", json={"content": "Hello"})
        assert response.status_code == 200
        msg_data = response.json()
        assert msg_data["sender"] == "ai"
        
        # Get History
        response = await ac.get(f"/conversations/{conv_id}")
        assert response.status_code == 200
        assert len(response.json()["messages"]) >= 2

@pytest.mark.asyncio
async def test_ai_initiated_flow():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Create
        response = await ac.post("/conversations/", json={"mode": "ai_initiated", "title": "Test AI"})
        assert response.status_code == 200
        data = response.json()
        assert len(data["messages"]) > 0
        assert data["messages"][0]["sender"] == "ai"
