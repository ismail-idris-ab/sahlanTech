# sahlearn-api

Node.js + Express + MongoDB backend for Sahlearn.

## Setup

```bash
cp .env.example .env
# Fill in all values in .env
npm install
npm run dev
```

Server starts on `http://localhost:5000`.

## Health check

```
GET /api/health  →  { "status": "ok" }
```
