# Sahlearn

A digital course platform and admin dashboard for a training brand in Nigeria.

Visitors can browse courses, read blog posts, submit enrollment requests, and contact
the teacher. Students get a dashboard with courses, assignments, exams, attendance,
announcements, and messaging. Admins manage all content, students, and submissions.

## Architecture

Two independent applications in this repository:

| Folder | App | Stack | Deploys to |
|--------|-----|-------|------------|
| `sahlearn-api/` | Backend REST API | Node.js, Express, MongoDB (Mongoose), JWT | Render |
| `sahlearn-web/` | Frontend | React, Vite, Tailwind CSS, React Router | Vercel |

Images and file uploads are stored on Cloudinary. Transactional email uses Gmail SMTP.

## Prerequisites

- Node.js 18+ and npm
- A MongoDB database (local or MongoDB Atlas)
- A Cloudinary account (for uploads)
- A Gmail account with an App Password (for email) — optional, email is skipped if unset

## Local setup

Run the backend and frontend in two separate terminals.

### 1. Backend

```bash
cd sahlearn-api
cp .env.example .env      # then fill in real values (see comments in the file)
npm install
npm run dev               # starts on http://localhost:5000
```

On first start an admin account is seeded from `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD`.
Change that password after logging in.

### 2. Frontend

```bash
cd sahlearn-web
cp .env.example .env      # set VITE_API_URL to your backend URL
npm install
npm run dev               # starts on http://localhost:5173
```

## Environment variables

Every variable the apps read is documented with a comment in:

- `sahlearn-api/.env.example`
- `sahlearn-web/.env.example`

Copy each to `.env` and fill in real values. **Never commit `.env` files** — they are
gitignored.

## Available scripts

Backend (`sahlearn-api`):

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start with auto-reload (nodemon) |
| `npm start` | Start for production |

Frontend (`sahlearn-web`):

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md).

## Documentation

Product and technical docs live in `docs/`: `PRD.md`, `TRD.md`, `APP_FLOW.md`,
`BACKEND_SCHEMA.md`, `UI_UX_DESIGN_BRIEF.md`, `IMPLEMENTATION_PLAN.md`.
