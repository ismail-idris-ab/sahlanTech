# TRD.md — Technical Requirements Document

**Project:** Sahlearn (Web App MVP)
**Audience:** Developers building the system
**Stack:** MERN (MongoDB · Express · React · Node)
**Scope:** WEB ONLY. Mobile app planned for future — see `MOBILE_ROADMAP.md`.

---

## 1. Technical Overview

Sahlearn web is a two-part system:

```
                  ┌─────────────────────────┐
                  │   Sahlearn API          │
                  │   Node + Express        │
                  │   MongoDB Atlas         │
                  │   Cloudinary (assets)   │
                  └─────────────┬───────────┘
                                │ REST + JSON
                ┌───────────────▼────────────────┐
                │   Sahlearn Web                 │
                │   React + Vite                 │
                │   Tailwind CSS                 │
                │                                │
                │   Public site + Admin dashboard│
                └────────────────────────────────┘
```

One backend, one frontend. Two repos.

---

## 2. System Architecture

| Layer | Tech | Hosting | Example domain |
|---|---|---|---|
| Frontend | React 18 + Vite + Tailwind | Vercel or Netlify | `sahlearn.com` |
| Backend API | Node 20 + Express 4 | Render | `api.sahlearn.com` |
| Database | MongoDB 6 (Atlas) | MongoDB Atlas free tier | — |
| Asset CDN | Cloudinary | Cloudinary free tier | — |

---

## 3. Tech Stack

### Backend
- Node.js 20 LTS
- Express 4
- Mongoose 8
- bcryptjs (password hashing)
- jsonwebtoken (JWT)
- express-validator (input validation)
- multer + multer-storage-cloudinary (uploads)
- cloudinary (SDK)
- cors
- helmet
- express-rate-limit
- dotenv
- morgan (dev logging)
- compression
- slugify
- express-async-errors

### Frontend
- React 18
- Vite 5
- React Router v6
- Tailwind CSS 3
- axios
- react-helmet-async (SEO)
- react-hot-toast (notifications)
- react-quill (rich blog editor — alternative: tiptap)
- lucide-react (icons)
- @tanstack/react-query (optional but recommended)

### Dev tooling
- ESLint + Prettier (both repos)
- nodemon for backend dev
- Postman / Hoppscotch for API testing

---

## 4. Frontend Architecture

- **Routing:** React Router v6 with nested routes for `/admin/*`.
- **State:** Local component state + Context for auth. Optional `@tanstack/react-query` for server-state caching. **No Redux for MVP.**
- **Styling:** Tailwind CSS only. No CSS-in-JS, no `.module.css` files unless necessary.
- **API layer:** All HTTP calls live in `src/services/*.js`. Components import services, never call `fetch` / `axios` directly.
- **Auth:** JWT stored in `localStorage` under `sahlearn_token`. `AuthContext` exposes `user`, `login()`, `logout()`. `ProtectedRoute` wraps admin routes.
- **Forms:** Controlled inputs. Optionally use `react-hook-form` if forms grow complex.
- **SEO:** `react-helmet-async` on every public page.
- **Image upload (admin):** Form sends `multipart/form-data` to `/api/upload`. Backend returns Cloudinary URL. Frontend saves URL with the course / post.

### Responsive strategy
- Mobile-first Tailwind classes.
- Test at 320px, 768px, 1024px, 1280px, 1920px.
- 70% of visitors will be on mobile browsers — responsiveness is non-negotiable.

---

## 5. Backend Architecture

```
sahlearn-api/
├── src/
│   ├── config/        # db, cloudinary, env
│   ├── models/        # Mongoose schemas
│   ├── controllers/   # business logic
│   ├── routes/        # Express routers
│   ├── middleware/    # auth, error, upload, validate
│   ├── utils/         # slug, response helpers
│   ├── validators/    # input schemas
│   └── app.js
├── server.js          # entry
├── .env.example
└── package.json
```

- Layered architecture: route → middleware (auth/validate) → controller → model → DB.
- Controllers stay thin; reusable logic in `utils/`.
- Centralized async error handler via `express-async-errors` (or manual `next(err)`).

---

## 6. Database Architecture

- MongoDB Atlas, single database `sahlearn`.
- Collections: `users`, `courses`, `posts`, `contactmessages`, `enrollments`, optionally `media`, `categories`.
- Indexes on `slug` (unique), `status`, `createdAt`, `category`.
- See **`BACKEND_SCHEMA.md`** for full schema definitions.

---

## 7. Authentication Flow

```
[Admin Login Form]
        │
        │ POST /api/auth/login  { email, password }
        ▼
[Express route]
        │
        ▼
[authController.login]
        │ 1. find user by email
        │ 2. bcrypt.compare(password, user.password)
        │ 3. sign JWT { id, role } with 7d expiry
        ▼
{ token, user: { id, name, email, role } }
        │
        ▼
[Frontend stores token in localStorage]
[Sets axios default header: Authorization: Bearer <token>]
[AuthContext.user populated]
[Redirect to /admin]
```

Subsequent admin requests:
```
[axios request with Authorization header]
        ▼
[authMiddleware]
  - extract token from header
  - jwt.verify
  - attach req.user
  - next() or 401
        ▼
[Controller]
```

---

## 8. Admin Authorization Requirements

- All `/api/admin/*` routes (and admin-only endpoints like `POST /api/courses`) require `authMiddleware`.
- `User.role` must equal `"admin"` to access admin endpoints.
- Frontend `ProtectedRoute` checks token presence + makes a `GET /api/auth/me` call on mount to validate.
- Expired tokens → frontend clears localStorage and redirects to `/admin/login`.

---

## 9. Image Upload Flow (Cloudinary)

```
[Admin form: file input]
        │
        │ FormData { image: <File> }
        │ POST /api/upload (Authorization: Bearer)
        ▼
[multer middleware]
  - filter: image/jpeg, image/png, image/webp
  - max 5MB
        ▼
[multer-storage-cloudinary]
  - uploads to Cloudinary folder "sahlearn/courses" or "sahlearn/blog"
  - returns secure_url + public_id
        ▼
{ url: "https://res.cloudinary.com/...", public_id: "sahlearn/blog/abc123" }
        ▼
[Frontend stores url + public_id with the course / post]
```

On delete:
- If model has `coverImage.public_id`, call `cloudinary.uploader.destroy(public_id)` after deleting the record.
- Best-effort: log but don't fail the delete if Cloudinary errors.

---

## 10. API Design Approach

- **REST** with conventional verbs.
- **Versioning**: not for MVP (skip `/v1/`). Easy to add later.
- **Response envelope** is consistent:

Success:
```json
{
  "status": "success",
  "data": { ... }
}
```

List with pagination:
```json
{
  "status": "success",
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

Error:
```json
{
  "status": "error",
  "message": "Email is already in use",
  "errors": [ { "field": "email", "message": "..." } ]
}
```

- HTTP status codes used correctly: 200, 201, 204, 400, 401, 403, 404, 409, 422, 429, 500.

---

## 11. Frontend Routes

See **PRD §13** for the full list. Key technical notes:

- `/admin/*` wrapped in `<ProtectedRoute>` and `<AdminLayout>`.
- `/courses/:slug` and `/blog/:slug` fetch by slug. 404 page if not found OR if `isPublished === false` / `status !== 'published'`.
- `*` catches unknown routes → 404 component.

---

## 12. Backend API Routes

### Auth
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | — | Admin login |
| GET | `/api/auth/me` | Admin | Validate token, return user |

### Courses
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/courses` | — | List published courses (public) |
| GET | `/api/courses/:slug` | — | Single published course by slug |
| GET | `/api/admin/courses` | Admin | List all courses (including drafts) |
| GET | `/api/admin/courses/:id` | Admin | Single course by id |
| POST | `/api/courses` | Admin | Create |
| PATCH | `/api/courses/:id` | Admin | Update |
| DELETE | `/api/courses/:id` | Admin | Delete |

### Blog Posts
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/posts` | — | List published posts (paginated) |
| GET | `/api/posts/:slug` | — | Single published post by slug |
| GET | `/api/admin/posts` | Admin | List all posts (incl. drafts) |
| GET | `/api/admin/posts/:id` | Admin | Single post by id |
| POST | `/api/posts` | Admin | Create |
| PATCH | `/api/posts/:id` | Admin | Update |
| DELETE | `/api/posts/:id` | Admin | Delete |

### Contact
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/contact` | — | Submit message (rate-limited) |
| GET | `/api/contact` | Admin | List messages |
| PATCH | `/api/contact/:id` | Admin | Update status |
| DELETE | `/api/contact/:id` | Admin | Delete |

### Enrollment
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/enrollments` | — | Submit (rate-limited) |
| GET | `/api/enrollments` | Admin | List |
| PATCH | `/api/enrollments/:id` | Admin | Update status |
| DELETE | `/api/enrollments/:id` | Admin | Delete |

### Upload
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/upload` | Admin | Upload single image |

### Stats
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/admin/stats` | Admin | Dashboard counts |

### Health
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/health` | — | Health check (returns `{ status: 'ok' }`) |

---

## 13. Database Models Overview

See `BACKEND_SCHEMA.md` for full schemas. Quick list:

- **User** — admin only for MVP
- **Course**
- **Post** (blog)
- **ContactMessage**
- **Enrollment**
- **Media** (optional)
- **Category** (optional, use constants for MVP)

---

## 14. Validation Requirements

- Every POST / PATCH route validates body.
- Use `express-validator` consistently.
- Reject unknown fields.
- Validate: emails (regex), Nigerian phone (`/^(\+234|0)[789][01]\d{8}$/`), slugs (`/^[a-z0-9-]+$/`), object IDs (`mongoose.isValidObjectId`).
- Length limits: title 3–150, slug 3–150, excerpt 0–300, content up to 50000, message 10–2000.

---

## 15. Error Handling Requirements

- Wrap async controllers with `express-async-errors`.
- Centralized error middleware at the end of `app.js`.
- In production: no stack traces in response body.
- Log errors to console (Render captures stdout).
- 404 handler before the error middleware for unknown routes.

```js
// Sketch
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    status: 'error',
    message: err.expose ? err.message : 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});
```

---

## 16. Security Requirements

- `helmet()` enabled.
- `cors()` with explicit `origin` array: web prod URL + dev `http://localhost:5173`.
- `express-rate-limit` on `/api/contact`, `/api/enrollments`, `/api/auth/login`.
- Bcrypt cost 10.
- JWT secret 32+ random chars, in env only.
- Sanitize HTML in blog content if rendering as HTML — use DOMPurify on the client, or store Markdown and render with a safe renderer.
- File upload: whitelist mime, cap size.
- `mongoose` strict mode on (default).

---

## 17. SEO Technical Requirements

- `react-helmet-async` for `<title>` and `<meta>`.
- Per-page Open Graph + Twitter Card.
- `GET /sitemap.xml` from backend, pulling from published courses + posts.
- `public/robots.txt` served from frontend (allow all, disallow `/admin/*`).
- Pre-rendering: Vite SPA is fine for MVP; consider react-snap or moving to Next.js post-MVP if SEO underperforms.
- Image `alt`, lazy loading via `loading="lazy"`.
- JSON-LD `Article` and `Course` structured data on detail pages.

---

## 18. Performance Requirements

- Vite production build with code splitting per route (`React.lazy` for admin section).
- Image transformations via Cloudinary URL params (`w_800,f_auto,q_auto`).
- Backend uses `compression()` middleware.
- Mongo queries use indexes.

---

## 19. Environment Variables

### Backend (`.env`)
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<32+ random chars>
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CORS_ORIGIN=https://sahlearn.com,https://www.sahlearn.com,http://localhost:5173
ADMIN_SEED_EMAIL=admin@sahlearn.com
ADMIN_SEED_PASSWORD=<set on first run, then rotated>
```

### Frontend (`.env`)
```
VITE_API_URL=https://api.sahlearn.com
VITE_WHATSAPP_NUMBER=2348012345678
VITE_SITE_URL=https://sahlearn.com
```

> **Never commit `.env` files.** Use `.env.example` placeholders.

---

## 20. Deployment Requirements

| Component | Service | Notes |
|---|---|---|
| Backend | Render (Web Service, Node) | Auto-deploy from `main` branch, set env vars in dashboard |
| Frontend | Vercel or Netlify | Auto-deploy from `main`, build `npm run build`, output `dist` |
| Database | MongoDB Atlas | Whitelist `0.0.0.0/0` (OK for MVP on free tier) |
| Assets | Cloudinary | Free tier; folders `sahlearn/courses`, `sahlearn/blog` |

Health check endpoint: `GET /api/health` → `{ status: 'ok' }`.

---

## 21. Recommended Frontend Folder Structure

```
sahlearn-web/
├── public/
│   ├── robots.txt
│   └── favicon.ico
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── common/          # Button, Input, Spinner, EmptyState, ErrorMessage
│   │   ├── layout/          # Navbar, Footer, AdminLayout, ProtectedRoute, WhatsAppFAB
│   │   ├── courses/         # CourseCard, CourseFilters
│   │   ├── blog/            # BlogCard, BlogPagination
│   │   └── admin/           # DashboardCard, CourseForm, BlogEditor, ImageUploader, MessageRow
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   └── useFetch.js
│   ├── pages/
│   │   ├── public/          # Home, About, Courses, CourseDetail, Blog, BlogDetail, Contact, Enroll, NotFound
│   │   └── admin/           # Login, Dashboard, Courses, CourseForm, Posts, PostEditor, Messages, Enrollments, Profile
│   ├── routes/
│   │   └── AppRouter.jsx
│   ├── services/
│   │   ├── api.js           # axios instance
│   │   ├── auth.service.js
│   │   ├── courses.service.js
│   │   ├── posts.service.js
│   │   ├── contact.service.js
│   │   ├── enrollments.service.js
│   │   └── upload.service.js
│   ├── utils/
│   │   ├── formatDate.js
│   │   └── validate.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css            # Tailwind directives
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
├── .env.example
└── package.json
```

---

## 22. Recommended Backend Folder Structure

```
sahlearn-api/
├── src/
│   ├── config/
│   │   ├── db.js
│   │   └── cloudinary.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Course.js
│   │   ├── Post.js
│   │   ├── ContactMessage.js
│   │   └── Enrollment.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── courses.controller.js
│   │   ├── posts.controller.js
│   │   ├── contact.controller.js
│   │   ├── enrollments.controller.js
│   │   ├── upload.controller.js
│   │   └── stats.controller.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── courses.routes.js
│   │   ├── posts.routes.js
│   │   ├── contact.routes.js
│   │   ├── enrollments.routes.js
│   │   ├── upload.routes.js
│   │   └── stats.routes.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── error.js
│   │   ├── upload.js
│   │   ├── validate.js
│   │   └── rateLimit.js
│   ├── validators/
│   │   ├── auth.validator.js
│   │   ├── courses.validator.js
│   │   ├── posts.validator.js
│   │   ├── contact.validator.js
│   │   └── enrollments.validator.js
│   ├── utils/
│   │   ├── slugify.js
│   │   ├── apiResponse.js
│   │   └── seedAdmin.js
│   └── app.js
├── server.js
├── .env.example
└── package.json
```

---

## 23. Development Rules

- **Branching:** `main` (prod) + `develop` + feature branches `feat/*`, `fix/*`.
- **Commits:** Conventional commits (`feat:`, `fix:`, `docs:`, `chore:`).
- **Code style:** Prettier on save. ESLint must pass before commit.
- **No magic numbers / strings:** centralize in `constants.js`.
- **Don't optimize prematurely**, but always add slug + status indexes.

### Forward-compatibility for mobile (low cost, high value)
The mobile app comes later but will hit the **same API**. To keep mobile work cheap when it arrives:
- Keep the API stateless and JSON-only — no server-rendered HTML, no session cookies.
- Don't tie auth to cookies; JWT in the `Authorization` header works for both web and mobile.
- Keep CORS configurable via env so the mobile app's dev origins can be added without code changes.
- Keep the response envelope consistent (TRD §10).

No mobile code is written now. These are just guardrails.

---

## 24. Technical Definition of Done

- [ ] Endpoint matches spec in §12.
- [ ] Validator rejects bad inputs with 400 / 422 and clear errors.
- [ ] Auth middleware blocks unauthorized requests with 401.
- [ ] Response envelope follows §10.
- [ ] Page renders correctly on mobile, tablet, desktop widths.
- [ ] Loading + error + empty states exist.
- [ ] No console errors or warnings.
- [ ] Lighthouse score on the page didn't drop more than 5 points.

---

**End of TRD.**
