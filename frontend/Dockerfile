FROM node:20-alpine AS build

# Включаем pnpm через corepack (встроен в Node 16+)
RUN corepack enable pnpm

WORKDIR /app

# Копируем зависимости и lock-файл
COPY package.json pnpm-lock.yaml ./

# Устанавливаем зависимости
RUN pnpm install --frozen-lockfile

# Копируем исходники
COPY . .

# Собираем статику
#RUN pnpm run build