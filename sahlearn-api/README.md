# sahlearn-api

Node.js + Express + MongoDB backend for Sahlearn.

## Setup

```bash
cp .env.example .env      # fill in every value (each is documented in the file)
npm install
npm run dev               # http://localhost:5000
```

On first boot, an admin user is seeded from `ADMIN_SEED_EMAIL` and
`ADMIN_SEED_PASSWORD`. Log in and change the password immediately.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start with nodemon (auto-reload) |
| `npm start` | Start for production |

## Environment variables

All required variables are listed with comments in `.env.example`. Key ones:

- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — random 32+ char secret for signing tokens
- `CLOUDINARY_*` — file/image upload credentials
- `CORS_ORIGIN` — comma-separated allowed frontend origins
- `GMAIL_USER` / `GMAIL_APP_PASSWORD` / `MAIL_FROM` — email (optional; email is
  skipped with a warning if unset)

## Health check

```
GET /api/health  →  { "status": "ok" }
```

## Deployment

See [../DEPLOYMENT.md](../DEPLOYMENT.md). Render config is in `../render.yaml`.
