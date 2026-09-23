# Deployment Guide

Sahlearn is two apps deployed separately:

- **Backend** (`sahlearn-api`) → Render
- **Frontend** (`sahlearn-web`) → Vercel

Deploy the backend first so you have its public URL for the frontend.

---

## 1. Database (MongoDB Atlas)

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a database user and copy the connection string.
3. Under Network Access, allow your server's IP (or `0.0.0.0/0` for Render).
4. Use this string as `MONGODB_URI`.

No manual migrations are needed — Mongoose creates collections and indexes on first
run. The admin account is seeded automatically on first boot from `ADMIN_SEED_EMAIL`
and `ADMIN_SEED_PASSWORD`.

---

## 2. Backend → Render

The repo includes `render.yaml` (Infrastructure as Code). Either import it, or create
a Web Service manually:

- **Root directory:** `sahlearn-api`
- **Build command:** `npm install --production=false`
- **Start command:** `node server.js`

Set every environment variable from `sahlearn-api/.env.example` in the Render
dashboard (mark secrets as such). At minimum:

- `NODE_ENV=production`
- `MONGODB_URI`
- `JWT_SECRET` (random 32+ chars)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `CORS_ORIGIN` — your Vercel frontend URL (e.g. `https://sahlearn.vercel.app`), no trailing slash
- `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD`
- `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `MAIL_FROM` (optional — email skipped if unset)
- `WA_BUSINESS_NUMBER`, `BANK_NAME`, `BANK_ACCOUNT`, `BANK_ACCOUNT_NAME`

Render auto-deploys on push to `main`. Verify:

```
GET https://<your-api>.onrender.com/api/health  →  { "status": "ok" }
```

> Note: Render's free tier sleeps after inactivity, so the first request after idle
> takes a few seconds to cold-start.

---

## 3. Frontend → Vercel

- **Root directory:** `sahlearn-web`
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Framework preset:** Vite

Set environment variables from `sahlearn-web/.env.example` in the Vercel dashboard.
Required: `VITE_API_URL` = your Render backend URL (no trailing slash).

> `VITE_*` values are baked in at build time. After changing any of them, trigger a
> redeploy — a running build will not pick up new values.

Vercel auto-deploys on push to `main`.

---

## 4. Post-deploy checklist

- [ ] `GET /api/health` returns `{ "status": "ok" }`
- [ ] Frontend loads and can reach the API (no CORS errors in the browser console)
- [ ] `CORS_ORIGIN` on Render exactly matches the Vercel URL
- [ ] Log in to `/admin/login` with the seeded admin, then change the password
- [ ] Test an image upload (confirms Cloudinary credentials)
- [ ] If using email, submit the "forgot password" flow to confirm mail delivery
