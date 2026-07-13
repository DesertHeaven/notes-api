# Notes API

Pet project для заметок на Node.js, Express, PostgreSQL, Prisma, Zod и Swagger/OpenAPI.

Проект используется как backend (серверная часть), к которому можно подключать frontend (клиентскую часть) на React, Vue или Angular.

## Stack (стек)

- Node.js
- Express
- PostgreSQL
- Prisma
- Zod
- Swagger/OpenAPI
- Postman

## Project Status (статус проекта)

- API работает локально с PostgreSQL через Prisma
- CRUD endpoints (ручки API) для заметок готовы
- Validation (валидация) выполняется через Zod
- Swagger/OpenAPI подключен
- Notes endpoints защищены через `x-api-key`
- Backend развернут на Render
- PostgreSQL размещен в Neon

## Deployment (размещение)

- API: `https://notes-api-a2d9.onrender.com`
- Health check (проверка состояния): `https://notes-api-a2d9.onrender.com/health`
- Swagger UI: `https://notes-api-a2d9.onrender.com/api-docs`
- Database (база данных): PostgreSQL в Neon

Free instance (бесплатный экземпляр) Render может переходить в спящий режим при отсутствии запросов, поэтому первый ответ иногда приходит с задержкой.

## Architecture (архитектура)

```text
Client / Postman
  -> Render
  -> Express routes
  -> Zod validation
  -> Prisma Client
  -> PostgreSQL (Neon)
```

## Environment Variables (переменные окружения)

Пример переменных окружения находится в `.env.example`.

Для локального запуска нужно создать `.env` и заполнить значения под свою среду.

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/notes_api?schema=public"
PORT=3000
CLIENT_ORIGINS="http://localhost:3000,http://localhost:4200,http://localhost:5173"
API_KEY="change-me"
```

- `DATABASE_URL` - подключение Prisma к PostgreSQL
- `PORT` - порт приложения
- `CLIENT_ORIGINS` - разрешенные frontend origins (источники) для CORS
- `API_KEY` - ключ для protected endpoints (защищенных ручек) заметок

## Installation (установка)

```bash
npm install
```

## Database (база данных)

Локально применить Prisma migrations (миграции):

```bash
npx prisma migrate dev
```

## Start (запуск)

```bash
npm start
```

Локальный адрес:

```text
http://localhost:3000
```

## API Docs (документация API)

Swagger UI:

```text
http://localhost:3000/api-docs
```

OpenAPI JSON:

```text
http://localhost:3000/api-docs-json
```

## Endpoints (ручки API)

Public endpoints (открытые ручки):

```http
GET /
GET /health
GET /api-docs
GET /api-docs-json
```

Protected notes endpoints (защищенные ручки заметок):

```http
GET /api/v1/notes
GET /api/v1/notes/:id
POST /api/v1/notes
PATCH /api/v1/notes/:id
DELETE /api/v1/notes/:id
```

Для protected endpoints нужен header (заголовок):

```http
x-api-key: your-api-key
```

## Example Request (пример запроса)

```http
POST /api/v1/notes
Content-Type: application/json
x-api-key: your-api-key
```

```json
{
  "title": "Learn API",
  "content": "Practice Express, Prisma and PostgreSQL."
}
```

## Deploy Notes (заметки по размещению)

Для deploy (размещения) используются:

- Render для запуска Node.js/Express API
- Neon для удаленной PostgreSQL-базы
- environment variables (переменные окружения) `DATABASE_URL`, `API_KEY` и `CLIENT_ORIGINS`
- команда `npx prisma migrate deploy` для применения migrations (миграций)

## Roadmap (план развития)

- Add JWT authentication (добавить JWT-авторизацию)
- Connect frontend clients (подключить frontend-клиенты)
- Add user-owned notes (сделать заметки, принадлежащие пользователю)
