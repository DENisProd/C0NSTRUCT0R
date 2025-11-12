import os
import sys

import anyio
import pytest
from fastapi.testclient import TestClient

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from main import app

pytestmark = pytest.mark.anyio("asyncio")


def build_block_payload(name: str = "Custom Block") -> dict:
    return {
        "name": name,
        "description": "Test block",
        "category": "test",
        "tags": ["test"],
        "blocks": [
            {
                "id": "text-1",
                "type": "text",
                "content": "Hello world",
                "style": {"color": "#000000"},
            }
        ],
        "preview": None,
        "author": "tester",
    }


def sample_palette_payload() -> dict:
    return {
        "primary": "#111111",
        "secondary": "#222222",
        "background": "#ffffff",
        "text": "#000000",
        "accent": "#ff0000",
        "surface": "#f1f1f1",
        "border": "#333333",
    }


async def test_root_and_health(client):
    resp = await client.get("/")
    assert resp.status_code == 200
    assert resp.json()["message"] == "Constructor Landing API"

    health = await client.get("/health")
    assert health.status_code == 200
    assert health.json()["status"] == "ok"


async def test_auth_flow(client):
    register_payload = {
        "username": "tester",
        "email": "tester@example.com",
        "password": "StrongPass123!",
    }
    register_resp = await client.post("/api/auth/register", json=register_payload)
    assert register_resp.status_code == 201
    assert register_resp.json()["email"] == "tester@example.com"

    login_resp = await client.post(
        "/api/auth/login",
        json={"email": register_payload["email"], "password": register_payload["password"]},
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]

    change_resp = await client.post(
        "/api/auth/change-password",
        headers={"Authorization": f"Bearer {token}"},
        json={"current_password": register_payload["password"], "new_password": "NewPass123!"},
    )
    assert change_resp.status_code == 200
    assert change_resp.json()["detail"] == "Пароль обновлен"

    new_login = await client.post(
        "/api/auth/login",
        json={"email": register_payload["email"], "password": "NewPass123!"},
    )
    assert new_login.status_code == 200
    assert "access_token" in new_login.json()


async def test_library_crud_flow(client):
    list_resp = await client.get("/api/library/blocks")
    assert list_resp.status_code == 200

    block_payload = build_block_payload()
    create_resp = await client.post("/api/library/upload", json=block_payload)
    assert create_resp.status_code == 200
    created_block = create_resp.json()
    block_id = created_block["id"]
    assert created_block["is_custom"] is True

    update_payload = {
        "name": "Updated Block",
        "blocks": [
            {
                "id": "text-2",
                "type": "text",
                "content": "Updated",
            }
        ],
    }
    update_resp = await client.put(f"/api/library/block/{block_id}", json=update_payload)
    assert update_resp.status_code == 200
    assert update_resp.json()["name"] == "Updated Block"

    ready_payload = build_block_payload("System Block")
    ready_resp = await client.post("/api/library/ready", json=ready_payload)
    assert ready_resp.status_code == 200
    assert ready_resp.json()["is_custom"] is False

    delete_resp = await client.delete(f"/api/library/block/{block_id}")
    assert delete_resp.status_code == 200
    assert delete_resp.json()["message"] == "Блок успешно удален"


async def test_palette_endpoints(client):
    apply_resp = await client.post(
        "/api/palette/apply",
        json={
            "blocks": [{"id": "text", "type": "text", "content": "Hello", "style": {}}],
            "palette": sample_palette_payload(),
        },
    )
    assert apply_resp.status_code == 200
    assert "blocks" in apply_resp.json()

    list_resp = await client.get("/api/palette/list")
    assert list_resp.status_code == 200
    assert isinstance(list_resp.json(), list)

    generate_resp = await client.post("/api/palette/generate", json={"description": "dark"})
    assert generate_resp.status_code == 200
    assert generate_resp.json()["background"].startswith("#")

    create_resp = await client.post(
        "/api/palette/",
        json={
            "name": "Custom Palette",
            "palette": sample_palette_payload(),
            "description": "Test palette",
        },
    )
    assert create_resp.status_code == 200
    assert create_resp.json()["name"] == "Custom Palette"


async def test_ai_endpoints(client):
    generate_resp = await client.post(
        "/api/ai/generate-landing",
        json={"prompt": "Landing for IT product", "categories": ["hero", "cta"]},
    )
    assert generate_resp.status_code == 200
    body = generate_resp.json()
    assert "blocks" in body and isinstance(body["blocks"], list)

    supported_resp = await client.get("/api/ai/supported-blocks")
    assert supported_resp.status_code == 200
    assert "blocks" in supported_resp.json()


async def test_websocket_room():
    def run_ws_test():
        with TestClient(app) as ws_client:
            with ws_client.websocket_connect("/ws/rooms/demo?name=Tester") as websocket:
                message = websocket.receive_json()
                assert message["type"] in {"sync_state", "users_list", "join"}
                users_list = websocket.receive_json()
                assert users_list["type"] == "users_list"

    await anyio.to_thread.run_sync(run_ws_test)
