# ML Site Template Generator (FastAPI + Ollama)

Генерирует JSON-шаблон лендинга по короткому запросу пользователя через локальную LLM в Ollama.

## Запуск (docker-compose)

1) Скопируйте `.env.example` в `.env` и при необходимости измените переменные.
2) Старт:
```bash
docker compose up -d --build
```
3) Подтяните модель в контейнере Ollama один раз:
```bash
docker exec -it ollama ollama pull ${OLLAMA_MODEL:-qwen2.5:3b}
```

API будет на `http://localhost:8088`.

## Эндпойнты

- `GET /health` — проверка сервиса.
- `GET /schema` — целевая схема JSON-шаблона для фронтенда.
- `POST /api/v1/generate` — генерация шаблона.
  Пример запроса:
  ```bash
  curl -X POST http://localhost:8088/api/v1/generate         -H "Content-Type: application/json"         -d '{"query":"сайт пиво","language":"ru","theme":"light"}'
  ```

Пример ответа (сокращено):
```json
{
  "template": {
    "version": "1.0",
    "meta": { "title": "Пивоварня ...", "description": "...", "keywords": ["пиво"], "theme":"light", "palette":{"primary":"#...","accent":"#..."} },
    "layout": [
      {"type":"hero","title":"...", "blocks":[{"type":"text","text":"..."},{"type":"button","text":"Купить","href":"#"}]}
    ]
  },
  "raw": { "...": "..." }
}
```

## Интеграция с фронтендом

Любой фронтенд может вызвать `/api/v1/generate` и отрисовать `layout`:
```ts
// пример на React/TS
async function generateTemplate(query: string) {
  const r = await fetch("http://localhost:8088/api/v1/generate", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ query, language: "ru", theme: "light" })
  });
  const data = await r.json();
  return data.template;
}
```

Далее сопоставьте `section.type` и `block.type` вашим UI-компонентам.

## Заметки
- По умолчанию используется `qwen2.5:3b`. Установите нужную модель через `OLLAMA_MODEL`.
- Сервис принудительно просит JSON от LLM через `format: "json"` и валидирует ответ Pydantic-схемой.
- CORS настраивается через `.env`.

## Запуск: 2 варианта docker-compose

### Вариант A. Тестовый (frontend + backend, без Ollama)
Используется mock-режим. Можно проверить интеграцию фронта и API без LLM.

```bash
cp .env.example .env
docker compose -f docker-compose.test.yml up -d --build
# открыть фронтенд: http://localhost:8080
# API: http://localhost:8088
```

### Вариант B. Полный (frontend + backend + Ollama + Prometheus + Grafana)
Поднимает всю связку с реальной LLM и мониторингом.

```bash
cp .env.example .env
# подтяните модель в Ollama после старта контейнера:
# docker exec -it ollama ollama pull ${OLLAMA_MODEL:-qwen2.5:3b}

docker compose -f docker-compose.full.yml up -d --build

# Проверка сервисов:
# Фронтенд:   http://localhost:8080
# API:        http://localhost:8088
# Prometheus: http://localhost:9090
# Grafana:    http://localhost:3000  (логин/пароль: admin/admin)
# Метрики:    http://localhost:8088/metrics
```

### Что делает фронтенд-демо
Лёгкий статиκ-сайт на Nginx. Поле запроса → POST на `/api/v1/generate` → отрисовка `layout` на странице.
Nginx проксирует `/api` на `ml-service:8088`.

### Примечания
- Для реального фронтенда просто замените сервис `frontend` в компоузе на ваш.
- Для production уберите mock-режим `OLLAMA_MOCK`.
- Grafana заранее настроена: Prometheus-датасорс и дашборд `ML Service FastAPI` с RPS и p95.
