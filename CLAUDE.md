# CLAUDE.md — Sahlearn Development Rules

These are the global rules for building Sahlearn. They override any conflicting habit, opinion, or default. Re-read this file at the start of every new phase and whenever you feel unsure.

---

## 1. Project Overview

This project is **Sahlearn** — a digital course website and admin dashboard for a teacher / training brand in Nigeria.

The platform allows visitors and students to:
- View available courses
- Read blog posts, tutorials, news, and updates
- Submit enrollment requests
- Contact the teacher (form + WhatsApp)

The admin dashboard allows the teacher to manage courses, blog posts, images, contact messages, and enrollment requests.

**Scope: Web app only.** A native mobile app is planned for a future phase. See `docs/MOBILE_ROADMAP.md`. Do not build, scaffold, or install anything mobile-related.

---

## 2. Core Development Rules

- Do not start coding before reading the project documentation in `docs/`.
- Always follow the planning files. If they conflict with each other, ask before guessing.
- Keep the MVP simple, practical, and production-ready.
- Do not add enterprise-level features that aren't in the docs.
- Use clean, readable, maintainable code.
- Separate frontend, backend, database, and utility logic cleanly.
- Prefer reusable components over repeated code.
- Use meaningful file names, function names, and variable names.
- Build phase by phase per `docs/IMPLEMENTATION_PLAN.md`. Don't skip ahead.

---

## 3. Required Documentation Files

Before implementing any feature, read these in this order:

1. `docs/PRD.md` — product requirements (what + why)
2. `docs/TRD.md` — technical requirements (how)
3. `docs/APP_FLOW.md` — user flows
4. `docs/UI_UX_DESIGN_BRIEF.md` — design system
5. `docs/BACKEND_SCHEMA.md` — Mongoose models + API shapes
6. `docs/IMPLEMENTATION_PLAN.md` — phase-by-phase build plan
7. `docs/MOBILE_ROADMAP.md` — read once for context; otherwise ignore (out of scope)

If a feature is not documented anywhere, **do not guess silently**. Either ask for clarification or add a clear note and flag it.

---

## 4. Tech Stack Rules

Use this stack exactly:

- **Frontend:** React.js with Vite
- **Styling:** Tailwind CSS
- **Backend:** Node.js with Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT
- **Password hashing:** bcrypt (`bcryptjs`)
- **Image upload:** Cloudinary
- **Validation:** `express-validator`
- **Frontend deployment:** Vercel or Netlify
- **Backend deployment:** Render
- **Database hosting:** MongoDB Atlas

**Do not** swap any of these unless I explicitly say so. No Next.js, no Prisma, no GraphQL, no tRPC, no Tanstack-Router-instead-of-React-Router. No Redux, no Zustand, no Recoil unless we agree.

`@tanstack/react-query` is optional but allowed if it makes sense.

---

## 5. Repo Structure

Two separate repos:

1. **`sahlearn-api`** — backend
2. **`sahlearn-web`** — frontend

Folder structures are defined in `docs/TRD.md` §21 (frontend) and §22 (backend). Follow them exactly. Don't invent new top-level folders without asking.

---

## 6. Frontend Rules

- Use React functional components only. No class components.
- Use React Router v6 for routing.
- Use Tailwind CSS for all styling.
- Keep components small, reusable, and organized.
- Use service files (`src/services/*.js`) for all API calls. Components import services — they never call `fetch` or `axios` directly.
- Use loading states for async actions.
- Use error states for failed requests.
- Use empty states where there is no data.
- Use protected routes for admin pages.
- Mobile-first responsive design at every breakpoint.
- One `<h1>` per page for SEO.

---

## 7. Backend Rules

- Use Express.js for API routes.
- Use Mongoose for MongoDB models.
- Use controllers for business logic.
- Use routes for endpoint definitions.
- Use middleware for authentication, validation, upload handling, and errors.
- Use centralized error handling — no scattered `try/catch` blocks that swallow errors silently.
- Use environment variables for secrets and configuration.
- Do not expose stack traces in production responses.
- Keep API responses consistent (see §10).

---

## 8. Tailwind CSS Rules

- Use Tailwind CSS for all styling.
- Do not write custom CSS files unless absolutely necessary.
- No CSS-in-JS, no styled-components, no emotion.
- Use mobile-first responsive classes (`sm:`, `md:`, `lg:`).
- Keep spacing, typography, and layout consistent across the app.
- Use the brand tokens defined in `tailwind.config.js` (per `docs/UI_UX_DESIGN_BRIEF.md` §35).
- Use accessible button and form styles (focus rings, contrast).

---

## 9. Component Rules

Build these reusable components — don't duplicate UI logic across pages:

**Layout / common:**
- `Navbar`, `Footer`, `AdminLayout`, `ProtectedRoute`, `WhatsAppFAB`
- `Button`, `Input`, `Textarea`, `Select`, `Checkbox`, `Toggle`
- `LoadingSpinner`, `Skeleton`, `EmptyState`, `ErrorMessage`
- `Modal`, `Drawer`

**Domain:**
- `CourseCard`, `CourseFilters`
- `BlogCard`, `BlogPagination`
- `DashboardCard` (admin stat card)
- `ImageUploader` (admin)
- `BlogEditor` (wraps react-quill or tiptap)

---

## 10. API Rules

REST API structure. Consistent response envelope.

### Success
```json
{ "status": "success", "data": { ... } }
```

### List with pagination
```json
{
  "status": "success",
  "data": [ ... ],
  "meta": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 }
}
```

### Error
```json
{
  "status": "error",
  "message": "Something went wrong",
  "errors": [ { "field": "email", "message": "Invalid email" } ]
}
```

### Public routes
- `GET /api/courses`
- `GET /api/courses/:slug`
- `GET /api/posts`
- `GET /api/posts/:slug`
- `POST /api/contact`
- `POST /api/enrollments`
- `GET /api/health`
- `GET /sitemap.xml`

### Admin routes (require JWT)
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/courses`
- `PATCH /api/courses/:id`
- `DELETE /api/courses/:id`
- `GET /api/admin/courses`
- `GET /api/admin/courses/:id`
- `POST /api/posts`
- `PATCH /api/posts/:id`
- `DELETE /api/posts/:id`
- `GET /api/admin/posts`
- `GET /api/admin/posts/:id`
- `GET /api/contact`
- `PATCH /api/contact/:id`
- `DELETE /api/contact/:id`
- `GET /api/enrollments`
- `PATCH /api/enrollments/:id`
- `DELETE /api/enrollments/:id`
- `POST /api/upload`
- `GET /api/admin/stats`

Protected routes must require a valid admin token and the user's `role === 'admin'`.

---

## 11. Database Rules

Use these models (full schemas in `docs/BACKEND_SCHEMA.md`):

- `User` (admin only for MVP)
- `Course`
- `Post`
- `ContactMessage`
- `Enrollment`
- `Media` (optional, skip for MVP)

Rules:
- Use **slugs** for public course and blog URLs.
- Published content is visible publicly.
- Draft / unpublished content is only visible in the admin dashboard.
- Indexes per `BACKEND_SCHEMA` — don't skip them.
- Never auto-change a slug when the title is updated. Slug changes are explicit, admin-driven.

---

## 12. Authentication Rules

- Admin auth uses JWT.
- Passwords hashed with bcrypt (cost 10+).
- Admin routes protected by `authMiddleware`.
- Invalid or expired tokens return 401 and block access.
- Frontend admin dashboard wraps `/admin/*` with `ProtectedRoute`.
- Never store plain-text passwords.
- Never expose JWT secret to the frontend.
- JWT secret in env, 32+ random characters, 7-day expiry.
- Login endpoint is rate-limited (10 attempts per 15 min per IP).

---

## 13. Image Upload Rules

Use Cloudinary for all image uploads.

Used for:
- Course cover images
- Blog cover images
- Teacher profile image (optional)
- Inline blog images (optional)

Rules:
- Validate image type (`image/jpeg`, `image/png`, `image/webp` only).
- Max file size: 5MB.
- Store image URL **and** `public_id` in MongoDB.
- Folder convention: `sahlearn/courses`, `sahlearn/blog`, `sahlearn/inline`.
- On delete, call `cloudinary.uploader.destroy(public_id)` best-effort.
- Never store large image files directly in MongoDB.
- Upload endpoint protected by `authMiddleware`.

---

## 14. SEO Rules

Public pages must support:
- Per-page `<title>` and `<meta description>` via `react-helmet-async`
- Clean URL slugs (no query strings for content)
- Open Graph + Twitter Card tags
- Semantic HTML (`<article>`, `<nav>`, `<main>`, `<section>`)
- Proper heading hierarchy (one `<h1>`)
- Canonical URLs
- `sitemap.xml` (backend-generated from published courses + posts)
- `robots.txt` (allow all, disallow `/admin/*`)
- JSON-LD structured data: `Article` on blog detail, `Course` on course detail
- Image `alt` attributes everywhere

Important pages: Home, About, Courses, Course details, Blog, Blog details, Contact.

---

## 15. Security Rules

- Validate all form inputs (`express-validator` on backend, mirror on frontend).
- Sanitize HTML in blog content before rendering.
- Protect admin routes (middleware on backend, `ProtectedRoute` on frontend).
- Use CORS correctly: explicit origins in env, no wildcards in production.
- Use rate limiting on public forms and login.
- Use `helmet()` middleware.
- Do not expose environment variables to the frontend (Vite only exposes `VITE_*`).
- Do not commit `.env` files. Always provide `.env.example`.
- Validate file uploads (mime type + size).
- Return safe error messages in production — no stack traces leaked.
- HTTPS only in production (handled by Render / Vercel automatically).

---

## 16. Error Handling Rules

Backend error response format is consistent:

```json
{
  "status": "error",
  "message": "Something went wrong"
}
```

With field-level errors when applicable:

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email" }
  ]
}
```

HTTP status codes used correctly:

| Code | When |
|---|---|
| 200 | Success |
| 201 | Created |
| 400 | Bad request (malformed body) |
| 401 | Missing / invalid / expired token |
| 403 | Forbidden (role mismatch) |
| 404 | Not found |
| 409 | Conflict (duplicate slug, email) |
| 422 | Validation failed |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

Rules:
- Use `express-async-errors` (or wrap async controllers) so thrown errors reach the central handler.
- Central error middleware is the **last** middleware in `app.js`.
- 404 handler comes just before the error middleware.
- In production, never leak stack traces in API responses. Log them server-side (Render captures stdout).
- Frontend always handles `status === 'error'` consistently — show inline errors, toast for transient ones, page-level state for fatal ones.

---

## 17. Rate Limiting Rules

Apply `express-rate-limit`:

| Endpoint | Limit |
|---|---|
| `POST /api/auth/login` | 10 / 15 min / IP |
| `POST /api/contact` | 5 / hour / IP |
| `POST /api/enrollments` | 3 / hour / IP |

Return 429 with a friendly message when triggered.

---

## 18. Environment Variables

Never hardcode URLs, secrets, or environment-specific values. Use `.env`:

**Backend** (`sahlearn-api/.env`):
```
NODE_ENV
PORT
MONGODB_URI
JWT_SECRET
JWT_EXPIRES_IN
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
CORS_ORIGIN
ADMIN_SEED_EMAIL
ADMIN_SEED_PASSWORD
```

**Frontend** (`sahlearn-web/.env`):
```
VITE_API_URL
VITE_WHATSAPP_NUMBER
VITE_SITE_URL
```

Always commit `.env.example` with placeholders. Never commit `.env`.

---

## 19. Git / Version Control Rules

- `main` branch is always deployable.
- Use feature branches: `feat/courses-crud`, `fix/login-redirect`, etc.
- Use conventional commit messages: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`.
- `.gitignore` must exclude: `node_modules`, `.env`, `dist`, `.DS_Store`, `*.log`.

---

## 20. Build Phase Etiquette

When starting a new phase from `IMPLEMENTATION_PLAN.md`:

1. State the phase number and goal.
2. List the tasks you plan to do.
3. For phases with > 5 tasks, wait for confirmation before starting.

When finishing a phase:

1. Summarize what you built (files, endpoints, screens).
2. Walk through the Acceptance Criteria and mark each pass/fail.
3. Tell me how to test it (URLs, Postman requests, browser steps).
4. Wait for confirmation before moving to the next phase.

---

## 21. Communication Style

- Be direct. If a doc is ambiguous, say so and propose a resolution.
- Ask one focused clarifying question rather than guessing.
- When I push back, explain your reasoning. Don't just cave to the latest thing I said.
- Show me destructive commands before running them.
- Show me file structures before generating dozens of files at once.
- Keep responses focused — no fluff.
- No emojis unless I use them first.

---

**End of CLAUDE.md.**
