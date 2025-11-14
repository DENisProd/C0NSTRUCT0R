# Constructor Landing API (Backend)

FastAPI backend для конструктора лендингов с интеграцией LLM, генерацией палитр и библиотекой блоков.

## 🚀 Быстрый старт

### Установка зависимостей

```bash
cd backend
python -m venv venv
source venv/bin/activate  # На Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Настройка окружения

Создайте файл `.env` на основе `.env.example`:

```bash
cp .env.example .env
```

Отредактируйте `.env` при необходимости.
Минимальный набор переменных:

```
DATABASE_URL=postgresql+asyncpg://constructor:constructor@localhost:5432/constructor
API_BASE_URL=http://localhost:8000
CORS_ORIGINS=http://localhost:5173,http://localhost:8080
JWT_SECRET_KEY=<случайная_строка>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200  # 30 дней
```

### База данных и миграции

- Поднимите PostgreSQL (локально или `docker compose up -d db` из корня репозитория).
- Примените миграции:

```bash
cd backend
alembic upgrade head
```

### Запуск сервера

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Сервер будет доступен по адресу: http://localhost:8000

### Документация API

После запуска сервера доступна автоматическая документация:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 📁 Структура проекта

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── ai.py          # AI endpoints (генерация лендингов)
│   │       ├── library.py     # Библиотека блоков
│   │       └── palette.py     # Палитры
│   ├── auth/
│   │   ├── router.py          # Регистрация/логин/смена пароля
│   │   ├── security.py        # JWT, хеширование паролей
│   │   └── dependencies.py    # get_current_user и другие Depends
│   ├── core/
│   │   ├── config.py         # Конфигурация
│   │   └── database.py       # Настройка БД
│   ├── models/
│   │   ├── block.py          # Модель Block
│   │   ├── palette.py        # Модель Palette
│   │   └── user.py           # Пользователи
│   ├── schemas/
│   │   ├── ai.py             # Схемы для AI
│   │   ├── block.py          # Схемы для блоков
│   │   ├── palette.py        # Схемы для палитр
│   │   └── user.py           # DTO для auth модуля
│   └── services/
│       ├── auth_service.py   # Работа с пользователями/паролями
│       ├── llm_generator.py  # Mock LLM генератор
│       ├── block_render.py   # Сервис подготовки JSON
│       └── palette_generator.py  # Генератор палитр
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│       └── *.py
├── main.py                   # Точка входа
├── alembic.ini               # Конфиг миграций
├── .env.example              # Пример переменных окружения
├── requirements.txt          # Зависимости
└── README.md
```

## 🔌 API Endpoints

### Auth

- `POST /api/auth/register` — регистрация (username, email, password)
- `POST /api/auth/login` — получение JWT (живет 30 дней)
- `POST /api/auth/change-password` — смена пароля (требует Bearer токен)

### User Profile

- `GET /api/user/me` — профиль текущего пользователя + статистика по проектам/блокам
- `PUT /api/user/me` — обновление `nickname` и `avatar_url`
- `POST /api/user/change-password` — заглушка смены пароля (payload валидируется, но не применяется)

### Projects

- `GET /api/projects?userId=1` — список проектов пользователя (без удалённых)
- `POST /api/projects` — создание проекта (`title`, `data`, `preview_url?`)
- `GET /api/projects/{id}` — получение проекта по ID
- `PATCH /api/projects/{id}` — обновление `title/data/preview_url`
- `DELETE /api/projects/{id}` — soft-delete (ставит `deleted_at`)
- `POST /api/projects/{id}/media` — загрузка превью/изображения проекта (multipart `file`), файл кладётся в MinIO и возвращается метадата

### User Blocks

- `GET /api/user-blocks?userId=1` — список пользовательских блоков
- `POST /api/user-blocks` — создание нового блока (`title`, `data`, `preview_url?`)
- `DELETE /api/user-blocks/{id}` — удаление блока

### Project Media

- `POST /api/projects/{project_id}/media` — принимает `multipart/form-data` (`file`) и связывает загруженное изображение с проектом; ответ содержит bucket, object_name и ссылку, сформированную из настроек MinIO

### AI (Генерация лендингов)

- `POST /api/ai/generate-landing` - Генерация лендинга по промпту
- `GET /api/ai/supported-blocks` - Список поддерживаемых типов блоков

### Library (Библиотека блоков)

- `GET /api/library/blocks` - Список блоков (с фильтрацией)
- `GET /api/library/block/{id}` - Получить блок по ID
- `POST /api/library/upload` - Загрузить пользовательский блок
- `PUT /api/library/block/{id}` - Обновить блок
- `DELETE /api/library/block/{id}` - Удалить блок

### Ready (Готовые блоки)

- `GET /api/library/ready` — Список готовых (системных) блоков из БД
- `POST /api/library/ready` — Создать готовый блок (сохраняется как системный)

Примеры:

```bash
# Список готовых блоков
curl "http://localhost:8000/api/library/ready?category=hero&tags=cta,primary"

# Создание готового блока
curl -X POST "http://localhost:8000/api/library/ready" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Hero — готовый",
    "description": "Герой с заголовком и кнопкой",
    "category": "hero",
    "tags": ["hero", "ready"],
    "blocks": [
      {"type":"text","id":"t1","content":"Заголовок"},
      {"type":"button","id":"b1","text":"Подробнее"}
    ],
    "preview": "https://example.com/preview.png",
    "author": "system"
  }'
```

### Palette (Палитры)

- `POST /api/palette/apply` - Применить палитру к блокам
- `GET /api/palette/list` - Список предустановленных палитр
- `POST /api/palette/generate` - Сгенерировать палитру по описанию
- `POST /api/palette/` - Создать новую палитру

### WebSocket (Реальное время)

- `WS /ws/rooms/{room_id}` — подключение к комнате для совместного редактирования
- `GET /rooms/{room_id}/info` — информация о комнате: пользователи и наличие состояния

Пример подключения:

```
ws://localhost:8000/ws/rooms/demo?name=Denis
```

Поддерживаемые типы сообщений через WS:
- `sync_state` — полная синхронизация состояния проекта
- `update_block`, `add_block`, `delete_block`, `move_block` — операции с блоками
- `update_theme`, `update_header`, `update_footer` — обновления отдельных частей состояния
- `cursor_update` — обновление положения курсора пользователя

## 🗄️ База данных

По умолчанию используется PostgreSQL (драйвер `asyncpg`). Локально можно поднять контейнер командой `docker compose up -d db`.

### Миграции (Alembic)

```bash
# Создать миграцию (в директории backend/)
alembic revision --autogenerate -m "message"

# Применить миграции
alembic upgrade head
```

## 🧪 Тестирование

### Запуск автотестов

Тесты используют тот же PostgreSQL, поэтому перед запуском поднимите БД:

```bash
docker compose up -d db
```

Далее (из каталога `backend`) активируйте venv и выполните pytest, указав строку подключения. **Важно:** фикстуры дропаают все таблицы перед каждым тестом, поэтому гоняйте их на отдельной БД или убедитесь, что API сейчас не работает с этой базой.

```bash
source venv/bin/activate
DATABASE_URL=postgresql+asyncpg://constructor:constructor@localhost:5432/constructor pytest -q
```

### Примеры запросов с использованием curl

#### Генерация лендинга

```bash
curl -X POST "http://localhost:8000/api/ai/generate-landing" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Создай лендинг для IT компании",
    "categories": ["hero", "features"]
  }'
```

Ответ:
```json
{
  "blocks": [...],
  "palette": {
    "primary": "#007bff",
    "secondary": "#6c757d",
    "background": "#ffffff",
    "text": "#212529",
    "accent": "#28a745"
  },
  "meta": {...}
}
```

#### Получить список блоков

```bash
# Все блоки
curl "http://localhost:8000/api/library/blocks"

# Фильтр по категории
curl "http://localhost:8000/api/library/blocks?category=hero"

# Только пользовательские блоки
curl "http://localhost:8000/api/library/blocks?is_custom=true"

# Фильтр по тегам
curl "http://localhost:8000/api/library/blocks?tags=hero,cta"
```

#### Получить блок по ID

```bash
curl "http://localhost:8000/api/library/block/1"
```

#### Загрузить пользовательский блок

```bash
curl -X POST "http://localhost:8000/api/library/upload" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Мой блок",
    "description": "Описание блока",
    "category": "custom",
    "tags": ["custom", "test"],
    "blocks": [
      {
        "id": "text-1",
        "type": "text",
        "content": "Привет!",
        "style": {
          "fontSize": "24px",
          "color": "#000000"
        }
      }
    ]
  }'
```

#### Применить палитру к блокам

```bash
curl -X POST "http://localhost:8000/api/palette/apply" \
  -H "Content-Type: application/json" \
  -d '{
    "blocks": [
      {
        "id": "text-1",
        "type": "text",
        "content": "Текст"
      }
    ],
    "palette": {
      "primary": "#007bff",
      "background": "#ffffff",
      "text": "#212529",
      "accent": "#28a745"
    }
  }'
```

#### Получить список предустановленных палитр

```bash
curl "http://localhost:8000/api/palette/list"
```

#### Сгенерировать палитру по описанию

```bash
curl -X POST "http://localhost:8000/api/palette/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Темная тема для IT компании"
  }'
```

## 📝 Примечания

- Mock LLM генератор возвращает предсказуемые данные для тестирования
- Валидация JSON-конфигураций блоков выполняется автоматически
- CORS настроен для работы с frontend на localhost:5173 и localhost:3000

## 🔄 Интеграция с Frontend

Frontend должен отправлять запросы на:
- `http://localhost:8000/api/ai/generate-landing`
- `http://localhost:8000/api/library/*`
- `http://localhost:8000/api/palette/*`

И подключаться по WebSocket для совместной работы:
- `ws://localhost:8000/ws/rooms/{room_id}?name=<UserName>`

Убедитесь, что переменная окружения `VITE_API_BASE_URL` в frontend указывает на backend.
