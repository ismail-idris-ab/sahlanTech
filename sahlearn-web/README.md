# sahlearn-web

React + Vite + Tailwind CSS frontend for Sahlearn.

## Setup

```bash
cp .env.example .env      # set VITE_API_URL to your backend URL
npm install
npm run dev               # http://localhost:5173
```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## Environment variables

All variables are prefixed `VITE_` and documented in `.env.example`. `VITE_API_URL`
is required (the backend base URL). Vite only exposes `VITE_*` vars to the browser —
never put secrets here.

Note: Vite bakes env values in at **build time**. After changing any `VITE_*` value in
production, you must rebuild/redeploy.

## Deployment

See [../DEPLOYMENT.md](../DEPLOYMENT.md).
