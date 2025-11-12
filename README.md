# Constructor Stack (frontend + backend из архива) + ML Service

## Состав
- **frontend** — Vite/React из архива (`app/constructor-frontend/constructor-frontend`), сборка → Nginx.
- **backend** — FastAPI WebSocket-сервер из архива (`app/constructor-backend/constructor-backend`).
- **ml-service** — сервис генерации JSON-шаблонов (FastAPI + Ollama), метрики Prometheus, дашборд Grafana.

## Запуск

### 1) Тестовый режим: только фронт и бэк
```bash
cd ./  # корень этого стека
docker compose -f docker-compose.test.yml up -d --build
# Фронт:  http://localhost:8080
# Бэк WS: ws://localhost:8000 
```
Во фронте в форме подключения укажите `ws://localhost:8000` или оставьте по умолчанию.

### 2) Полный режим: фронт + бэк + ml-service + Ollama + Prometheus + Grafana
```bash
cd ./
cp ml-service/.env.example ml-service/.env
docker compose -f docker-compose.full.yml up -d --build
# После старта подтянуть модель в Ollama:
docker exec -it ollama ollama pull ${OLLAMA_MODEL:-qwen2.5:3b}

# Доступы:
# Фронт:     http://localhost:8080
# Бэк WS:    ws://localhost:8000
# ML API:    http://localhost:8088
# Метрики:   http://localhost:8088/metrics
# Prometheus http://localhost:9090
# Grafana:   http://localhost:3000  (admin/admin)
```
> Примечание: фронтенд не проксирует /api. Используйте прямой вызов ML API с фронта или настройте прокси при необходимости.

## Переменные
- `ml-service/.env` — адрес Ollama, модель (`OLLAMA_MODEL`), CORS.
- При необходимости установите `OLLAMA_MOCK=1` у `ml-service` в compose для тестовой генерации без LLM.

