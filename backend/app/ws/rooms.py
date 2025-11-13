from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import Dict, Optional
import json
import uuid
import asyncio
from datetime import datetime


router = APIRouter()


class Room:
    def __init__(self, room_id: str):
        self.room_id = room_id
        self.users: Dict[str, dict] = {}
        self.state: dict = {}


# Хранилище комнат в памяти
rooms: Dict[str, Room] = {}


def get_or_create_room(room_id: str) -> Room:
    """Получить комнату или создать новую"""
    if room_id not in rooms:
        rooms[room_id] = Room(room_id)
    return rooms[room_id]


def remove_user_from_room(room_id: str, user_id: str):
    """Удалить пользователя из комнаты"""
    if room_id in rooms:
        room = rooms[room_id]
        if user_id in room.users:
            del room.users[user_id]

            # Уведомляем остальных пользователей
            broadcast_to_room(
                room_id,
                {
                    "type": "leave",
                    "payload": {"userId": user_id},
                    "timestamp": datetime.now().isoformat(),
                },
                exclude_user_id=user_id,
            )


def broadcast_to_room(room_id: str, message: dict, exclude_user_id: Optional[str] = None):
    """Отправить сообщение всем пользователям в комнате"""
    if room_id not in rooms:
        return

    room = rooms[room_id]
    message_json = json.dumps(message)

    disconnected_users = []
    for user_id, user_data in list(room.users.items()):
        if exclude_user_id and user_id == exclude_user_id:
            continue

        try:
            ws: WebSocket = user_data["ws"]
            if ws.client_state.name == "CONNECTED":
                asyncio.create_task(ws.send_text(message_json))
            else:
                disconnected_users.append(user_id)
        except Exception:
            disconnected_users.append(user_id)

    # Удаляем отключенных пользователей
    for user_id in disconnected_users:
        remove_user_from_room(room_id, user_id)


@router.websocket("/ws/rooms/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_id: str,
    name: str = Query(..., description="Имя пользователя"),
    token: str = Query(None, description="JWT токен для аутентификации"),
):
    """WebSocket endpoint для подключения к комнате"""
    # Токен опционален, но если передан, можно использовать для идентификации пользователя
    await websocket.accept()

    # Генерируем ID пользователя
    user_id = f"user-{uuid.uuid4().hex[:12]}"

    # Получаем или создаем комнату
    room = get_or_create_room(room_id)

    # Добавляем пользователя в комнату
    room.users[user_id] = {
        "id": user_id,
        "name": name,
        "ws": websocket,
        "joined_at": datetime.now().isoformat(),
    }

    # Отправляем текущее состояние проекта новому пользователю
    if room.state:
        await websocket.send_text(
            json.dumps({
                "type": "sync_state",
                "payload": room.state,
                "timestamp": datetime.now().isoformat(),
            })
        )

    # Уведомляем всех о новом пользователе
    broadcast_to_room(
        room_id,
        {
            "type": "join",
            "payload": {
                "id": user_id,
                "name": name,
            },
            "timestamp": datetime.now().isoformat(),
        },
        exclude_user_id=user_id,
    )

    # Отправляем список всех пользователей новому участнику
    users_list = [
        {"id": uid, "name": user_data["name"]}
        for uid, user_data in room.users.items()
    ]
    await websocket.send_text(
        json.dumps({
            "type": "users_list",
            "payload": users_list,
            "timestamp": datetime.now().isoformat(),
        })
    )

    try:
        while True:
            # Получаем сообщение от клиента
            data = await websocket.receive_text()

            try:
                message = json.loads(data)
                message_type = message.get("type")
                payload = message.get("payload", {})

                # Обработка различных типов сообщений
                if message_type == "sync_state":
                    # Обновляем состояние комнаты
                    room.state = payload
                    # Отправляем всем остальным
                    broadcast_to_room(room_id, message, exclude_user_id=user_id)

                elif message_type in [
                    "update_block",
                    "add_block",
                    "delete_block",
                    "move_block",
                    "update_theme",
                    "update_header",
                    "update_footer",
                ]:
                    # Обновляем состояние проекта на основе изменения
                    if message_type == "update_block":
                        block_id = payload.get("blockId")
                        block_data = payload.get("data", {})

                        def update_block_recursive(blocks_list):
                            for block in blocks_list:
                                if block.get("id") == block_id:
                                    block.update(block_data)
                                    return True
                                # Проверяем вложенные блоки
                                if block.get("type") == "container" and "children" in block:
                                    if update_block_recursive(block["children"]):
                                        return True
                                if block.get("type") == "grid" and "cells" in block:
                                    for cell in block["cells"]:
                                        if cell.get("block") and update_block_recursive([cell["block"]]):
                                            return True
                            return False

                        if "blocks" in room.state:
                            update_block_recursive(room.state.get("blocks", []))

                    elif message_type == "add_block":
                        new_block = payload.get("block")
                        if new_block:
                            if "blocks" not in room.state:
                                room.state["blocks"] = []
                            room.state["blocks"].append(new_block)

                    elif message_type == "delete_block":
                        block_id = payload.get("blockId")

                        def delete_block_recursive(blocks_list):
                            for i, block in enumerate(blocks_list):
                                if block.get("id") == block_id:
                                    blocks_list.pop(i)
                                    return True
                                # Проверяем вложенные блоки
                                if block.get("type") == "container" and "children" in block:
                                    if delete_block_recursive(block["children"]):
                                        return True
                                if block.get("type") == "grid" and "cells" in block:
                                    for cell in block["cells"]:
                                        if cell.get("block") and cell["block"].get("id") == block_id:
                                            cell["block"] = None
                                            return True
                                        if cell.get("block") and "children" in cell["block"]:
                                            if delete_block_recursive(cell["block"]["children"]):
                                                return True
                            return False

                        if "blocks" in room.state:
                            delete_block_recursive(room.state.get("blocks", []))

                    elif message_type == "move_block":
                        from_index = payload.get("fromIndex")
                        to_index = payload.get("toIndex")
                        if "blocks" in room.state and isinstance(room.state["blocks"], list):
                            blocks = room.state["blocks"]
                            if 0 <= from_index < len(blocks) and 0 <= to_index < len(blocks):
                                moved = blocks.pop(from_index)
                                blocks.insert(to_index, moved)

                    elif message_type == "update_theme":
                        if "theme" not in room.state:
                            room.state["theme"] = {}
                        room.state["theme"].update(payload)

                    elif message_type == "update_header":
                        if "header" not in room.state:
                            room.state["header"] = {}
                        room.state["header"].update(payload)

                    elif message_type == "update_footer":
                        if "footer" not in room.state:
                            room.state["footer"] = {}
                        room.state["footer"].update(payload)

                    # Отправляем обновленное состояние всем остальным
                    broadcast_to_room(
                        room_id,
                        {
                            "type": "sync_state",
                            "payload": room.state,
                            "timestamp": datetime.now().isoformat(),
                        },
                        exclude_user_id=user_id,
                    )

                elif message_type == "cursor_update":
                    # Отправляем обновление курсора всем остальным
                    broadcast_to_room(room_id, message, exclude_user_id=user_id)

                else:
                    # Игнорируем неизвестные типы сообщений
                    pass

            except json.JSONDecodeError:
                # Игнорируем некорректный JSON
                pass
            except Exception:
                # Логируем, но продолжаем работу цикла
                pass

    except WebSocketDisconnect:
        remove_user_from_room(room_id, user_id)
    except Exception:
        remove_user_from_room(room_id, user_id)


@router.get("/rooms/{room_id}/info")
async def get_room_info(room_id: str):
    """Получить информацию о комнате"""
    if room_id not in rooms:
        return {"error": "Room not found"}

    room = rooms[room_id]
    return {
        "room_id": room_id,
        "users_count": len(room.users),
        "users": [
            {"id": uid, "name": user_data["name"]}
            for uid, user_data in room.users.items()
        ],
        "has_state": bool(room.state),
    }