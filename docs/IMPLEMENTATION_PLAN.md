# IMPLEMENTATION_PLAN.md — Sahlearn (Web MVP)

**Project:** Sahlearn
**Approach:** Phase-by-phase build of two artifacts (backend + frontend)
**Total realistic timeline (solo dev, part-time):** 4–6 weeks to MVP
**Scope:** WEB ONLY. Mobile app deferred — see `MOBILE_ROADMAP.md`.

---

## How to use this plan

- Build phases **in order**. Don't jump ahead.
- Each phase has: **Goal · Tasks · Files/folders involved · Expected result · Acceptance criteria**.
- A feature is "done" only when its acceptance criteria pass.
- Repo strategy: **2 separate repos** — `sahlearn-api` and `sahlearn-web`. Simpler than a monorepo for MVP.

---

## Phase 1 — Project Setup

### Goal
Backend and frontend scaffolded, both running, talking to each other via a health endpoint.

### Tasks

**Backend (`sahlearn-api`):**
1. `mkdir sahlearn-api && cd sahlearn-api && npm init -y`
2. Install: `express mongoose dotenv cors helmet morgan compression bcryptjs jsonwebtoken express-rate-limit express-validator multer multer-storage-cloudinary cloudinary slugify express-async-errors`
3. Dev deps: `npm i -D nodemon eslint prettier`
4. Create folder structure per TRD §22
5. Create `.env.example` with all keys from TRD §19
6. Create `src/config/db.js` (Mongoose connect)
7. Create `src/app.js` and `server.js`
8. Add `GET /api/health` → `{ status: 'ok' }`
9. Add `"dev": "nodemon server.js"` script
10. Run `npm run dev` and hit `/api/health` with Postman → 200

**Frontend (`sahlearn-web`):**
1. `npm create vite@latest sahlearn-web -- --template react`
2. `cd sahlearn-web && npm install`
3. Install Tailwind: `npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p`
4. Configure `tailwind.config.js` with brand tokens (UI_UX §35)
5. Add Tailwind directives to `src/index.css`
6. Install: `react-router-dom axios react-helmet-async react-hot-toast lucide-react`
7. Create folder structure per TRD §21
8. Add `.env.example` with `VITE_API_URL`, `VITE_WHATSAPP_NUMBER`, `VITE_SITE_URL`
9. Smoke test: replace `App.jsx` with `<h1 className="text-3xl font-bold text-brand-primary">Sahlearn</h1>`
10. Run `npm run dev` → visible at `localhost:5173`

### Expected result
- Backend running on `localhost:5000`, `/api/health` returns 200
- Frontend running on `localhost:5173`, shows "Sahlearn" heading in brand color
- Both have `.env.example` checked in, `.env` ignored

### Acceptance criteria
- [ ] Both projects boot without errors
- [ ] `.env.example` committed
- [ ] `.gitignore` excludes `node_modules`, `.env`, `dist`
- [ ] README in each repo with `npm run dev` instructions

---

## Phase 2 — Backend Foundation

### Goal
Models, routes, middleware, validators in place (with stub controllers) — the API skeleton is complete.

### Tasks
1. Create all Mongoose models per `BACKEND_SCHEMA.md`:
   - `User.js`, `Course.js`, `Post.js`, `ContactMessage.js`, `Enrollment.js`
2. Create middleware:
   - `auth.js` — JWT verify + attach `req.user`
   - `error.js` — centralized error handler
   - `validate.js` — express-validator runner
   - `upload.js` — multer + Cloudinary
   - `rateLimit.js` — limiter factory
3. Create validators per resource (`validators/*.js`)
4. Create controllers (stubs returning `{ status: 'success', data: [] }`)
5. Wire routes in `routes/*.js` and mount in `app.js`
6. Apply `helmet`, `cors`, `morgan`, `compression`, `express.json()`
7. Add 404 handler + error middleware (must be last in `app.js`)
8. Set up MongoDB Atlas cluster, whitelist `0.0.0.0/0` for dev
9. Connect from backend; verify a write works in Atlas UI
10. Build seed admin script `src/utils/seedAdmin.js`

### Expected result
- All endpoints respond with proper envelope shape (even if just stubs)
- Admin user seeded
- Server doesn't crash on bad input

### Acceptance criteria
- [ ] All routes from TRD §12 mounted and respond with envelope shape
- [ ] Invalid body returns 400 with `errors` array
- [ ] Missing token on protected route returns 401
- [ ] Admin seeded; verified in Atlas

---

## Phase 3 — Authentication

### Goal
Working admin login end-to-end + protected route enforcement.

### Tasks

**Backend:**
1. `auth.controller.js`:
   - `login`: find by email, `comparePassword`, sign JWT, return `{ token, user }`, update `lastLoginAt`
   - `me`: return `req.user` (full user via `findById`)
2. Apply `authMiddleware` to all admin routes per TRD §12
3. Rate limit on `/api/auth/login` (10 attempts per 15 min per IP)
4. Test with Postman: login → use token → hit `GET /api/auth/me` → 200; without token → 401

**Frontend:**
1. `src/services/api.js` — axios instance with `baseURL: VITE_API_URL` + request interceptor attaching token from `localStorage`
2. `src/services/auth.service.js` — `login()`, `me()`, `logout()`
3. `src/context/AuthContext.jsx` — `user`, `loading`, `login`, `logout`; checks `localStorage` on mount, calls `me()` to validate
4. `src/components/layout/ProtectedRoute.jsx` — wraps `/admin/*`
5. `src/pages/admin/Login.jsx` — form, submits, on success redirect to `/admin`
6. `src/pages/admin/Dashboard.jsx` — placeholder "Hello, admin"
7. Set up React Router with `/admin/login` and protected `/admin`
8. Global axios response interceptor for 401 → logout + redirect

### Expected result
- Admin can log in via web UI
- Token saved, dashboard loads
- Refresh keeps admin logged in
- Logout clears state and token
- `/admin` while logged out → redirects to `/admin/login`

### Acceptance criteria
- [ ] Wrong password → 401 + "Invalid credentials"
- [ ] Right password → token returned, dashboard reachable
- [ ] Expired / tampered token → kicked to login + toast
- [ ] Rate limit triggers after too many bad logins

---

## Phase 4 — Course System

### Goal
End-to-end CRUD for courses, public listing + admin management.

### Tasks

**Backend:**
1. Implement `courses.controller.js`:
   - `list` (public, filter `isPublished=true`, support `?featured=true`, `?category=`, `?search=`, pagination)
   - `getBySlug` (public, `isPublished=true`)
   - `adminList` (all)
   - `adminGetById`
   - `create` (slug auto-gen, unique check)
   - `update` (only change slug if explicitly provided)
   - `remove` (also `cloudinary.uploader.destroy(public_id)` best-effort)
2. Validators for create/update
3. Test all endpoints with Postman

**Frontend (admin):**
1. `services/courses.service.js` with all CRUD methods
2. `pages/admin/Courses.jsx` — table with filters
3. `pages/admin/CourseForm.jsx` (used for both new + edit)
4. `components/admin/CourseFormFields.jsx` — reusable layout
5. Delete confirmation modal
6. Publish toggle (optimistic update)

**Frontend (public):**
1. `pages/public/Courses.jsx` — listing with filters/search
2. `pages/public/CourseDetail.jsx` — full course view
3. `components/courses/CourseCard.jsx`
4. `components/courses/CourseFilters.jsx`
5. SEO meta via `react-helmet-async`

### Expected result
- Admin can create, edit, delete, publish/unpublish courses
- Public site shows published courses on `/courses`
- Course detail pages work via slugs

### Acceptance criteria
- [ ] Draft course is NOT visible publicly
- [ ] Slug uniqueness enforced (returns 409)
- [ ] Filter by category works
- [ ] Search by title/short description works
- [ ] Featured courses surface on homepage placeholder
- [ ] Cover image displays correctly (Cloudinary URL)
- [ ] Delete clears Cloudinary asset (verify)

---

## Phase 5 — Blog / CMS System

### Goal
Full blog workflow: admin authors with rich editor, public reads with SEO.

### Tasks

**Backend:**
1. `posts.controller.js`:
   - `list` (public, `status='published'`, pagination)
   - `getBySlug` (public)
   - `adminList` / `adminGetById` (all, filter by status)
   - `create` (compute `readTimeMinutes`, set `publishedAt` on publish)
   - `update` (transition logic: draft→published sets `publishedAt`)
   - `remove` (best-effort Cloudinary destroy)
2. Validators

**Frontend (admin):**
1. `services/posts.service.js`
2. `pages/admin/Posts.jsx` — table, filter by status
3. `pages/admin/PostEditor.jsx` — combined create/edit
4. `components/admin/BlogEditor.jsx` — wraps react-quill
5. `components/admin/ImageUploader.jsx` (used for cover)
6. "Save Draft" vs "Publish" buttons with confirmation

**Frontend (public):**
1. `pages/public/Blog.jsx` — paginated grid
2. `pages/public/BlogDetail.jsx` — full article + SEO meta + share
3. `components/blog/BlogCard.jsx`
4. JSON-LD Article structured data on detail page

### Expected result
- Admin can author rich posts and publish
- Public site shows published posts with SEO meta

### Acceptance criteria
- [ ] Drafts not visible publicly
- [ ] Rich text editor saves cleanly
- [ ] `publishedAt` is set correctly on first publish
- [ ] Slug uniqueness enforced
- [ ] Tags stored lowercased, max 10
- [ ] Share button opens new tab with correct URL

---

## Phase 6 — Image Upload

### Goal
Production-ready Cloudinary upload accessible only to admins, used in course + blog forms.

### Tasks

**Backend:**
1. Cloudinary config in `src/config/cloudinary.js`
2. Multer storage in `middleware/upload.js`:
   - Whitelist: `image/jpeg`, `image/png`, `image/webp`
   - Max size 5MB
   - Folder: `sahlearn/<courses|blog|inline>` based on a `?folder=` query param (validated against whitelist)
3. `upload.controller.js`:
   - `single`: returns `{ url, public_id, folder, bytes, width, height }`
4. Route `POST /api/upload` with `authMiddleware`

**Frontend (admin):**
1. `services/upload.service.js`
2. `components/admin/ImageUploader.jsx`:
   - Drag-drop + click-to-pick
   - Client-side validation (type, size)
   - Preview
   - Replace flow
3. Integrate into CourseForm and PostEditor cover image fields

### Expected result
- Admin uploads an image; gets back URL + public_id; saves with course/post
- Cloudinary folders organized per spec

### Acceptance criteria
- [ ] Non-image file rejected with clear message
- [ ] File > 5MB rejected
- [ ] Upload without auth returns 401
- [ ] Image visible on public page after save
- [ ] Deleting a course/post removes image from Cloudinary (verify)

---

## Phase 7 — Contact and Enrollment

### Goal
Public forms work end-to-end; admin can manage submissions.

### Tasks

**Backend:**
1. `contact.controller.js`: `create` (public), `list` / `update` / `remove` (admin)
2. `enrollments.controller.js`: same pattern, including `courseTitleSnapshot` capture
3. Rate limit on `/api/contact` (5/h) and `/api/enrollments` (3/h)
4. Validators
5. Capture `req.ip` and `req.headers['user-agent']`

**Frontend (public):**
1. `services/contact.service.js` and `enrollments.service.js`
2. `pages/public/Contact.jsx` — form + info column
3. `pages/public/Enroll.jsx` — handles both `/enroll` and `/enroll/:courseSlug`
4. Success / error states
5. WhatsApp CTA prefilled with relevant message

**Frontend (admin):**
1. `pages/admin/Messages.jsx` — list + filter + detail modal + status change + delete
2. `pages/admin/Enrollments.jsx` — same pattern
3. Confirmation modals for destructive actions

### Expected result
- Submissions persist; admin sees them; status updates flow

### Acceptance criteria
- [ ] Rate limit kicks in after limit (verify with rapid submissions)
- [ ] Invalid Nigerian phone rejected
- [ ] Status transitions validate
- [ ] WhatsApp button uses correct prefilled message per context
- [ ] Admin Delete works with confirmation

---

## Phase 8 — UI/UX Implementation (Public Pages)

### Goal
All public-facing pages polished and matching the design brief.

### Tasks
1. `Navbar` + `Footer` finalized + mobile hamburger drawer
2. `WhatsAppFAB` component on every public page
3. `Home.jsx` — all sections per UI_UX §11
4. `About.jsx` per §12
5. Refine `Courses.jsx`, `CourseDetail.jsx`, `Blog.jsx`, `BlogDetail.jsx`, `Contact.jsx`, `Enroll.jsx`
6. 404 page (`NotFound.jsx`)
7. Add loading skeletons + empty states + error states across pages
8. Responsive testing at 320 / 768 / 1024 / 1280 / 1920px

### Expected result
- Pixel-reasonable match to design brief
- Fully responsive across all breakpoints

### Acceptance criteria
- [ ] Lighthouse mobile score > 85 on home + course detail + blog detail
- [ ] No horizontal scroll on any width
- [ ] Tap targets ≥ 44px on mobile breakpoint
- [ ] No console errors

---

## Phase 9 — SEO and Performance

### Goal
Public site optimized for search engines and load speed.

### Tasks

**Frontend:**
1. Per-page `<title>` + `<meta description>` via `react-helmet-async`
2. Open Graph + Twitter Card on every public page (use cover image where applicable)
3. JSON-LD: `Article` for blog detail, `Course` for course detail
4. `public/robots.txt` (allow all, disallow `/admin/*`)
5. Canonical URLs
6. Image optimizations: Cloudinary transformations (`w_800,f_auto,q_auto`), `loading="lazy"` on non-hero images
7. Code splitting: `React.lazy` for admin section
8. Vite production build verified

**Backend:**
1. `GET /sitemap.xml` generating sitemap from published courses + posts
2. `compression()` middleware applied (if not already)
3. Mongo indexes verified per BACKEND_SCHEMA

### Expected result
- Search engines can crawl and index
- Pages load fast

### Acceptance criteria
- [ ] `sahlearn.com/sitemap.xml` returns valid XML
- [ ] `sahlearn.com/robots.txt` returns expected content
- [ ] OG tags verified with social card validators
- [ ] Lighthouse Performance > 85 mobile on home
- [ ] No render-blocking resources flagged

---

## Phase 10 — Testing

### Goal
Manual verification across the system.

### Tasks
1. **Public pages**: walk every flow from `APP_FLOW.md`
2. **Admin login**: success, failure, expired token, rate limit
3. **Course CRUD**: create, edit, delete, publish toggle, slug conflict
4. **Blog CRUD**: same + draft/publish transitions
5. **Forms**: contact, enrollment — valid + invalid inputs
6. **Image upload**: type / size enforcement, replace, delete cascade
7. **Responsive**: real devices for top 5 viewports
8. **API errors**: induce 500 (e.g., bad DB), confirm friendly error + no stack trace in prod
9. **Cross-browser**: Chrome, Safari, Firefox, Edge (last 2 versions)
10. **Security spot checks**: token tampering, admin route direct hit, CORS misconfig

### Acceptance criteria
- [ ] All happy-path flows pass
- [ ] All validation paths produce the right error
- [ ] No 500 errors observed on prod-like environment
- [ ] No console errors on any page

---

## Phase 11 — Deployment

### Goal
Sahlearn lives at a real URL.

### Tasks

**Database:**
1. MongoDB Atlas production cluster (free tier OK)
2. IP allowlist `0.0.0.0/0` (free tier limitation)
3. Dedicated DB user with strong password

**Backend (Render):**
1. New Web Service from `sahlearn-api` repo
2. Build: `npm install` · Start: `node server.js`
3. Set all env vars per TRD §19
4. Custom domain `api.sahlearn.com` (when ready)
5. Test `/api/health`

**Frontend (Vercel or Netlify):**
1. Connect repo
2. Build command `npm run build` · Output `dist`
3. Env vars: `VITE_API_URL=https://api.sahlearn.com`, `VITE_WHATSAPP_NUMBER`, `VITE_SITE_URL`
4. Custom domain `sahlearn.com` + `www` redirect
5. Test live URLs

**Cloudinary:**
1. Create folders `sahlearn/courses`, `sahlearn/blog`, `sahlearn/inline`
2. Set API key/secret in backend env

### Acceptance criteria
- [ ] Web loads under 3s on 4G
- [ ] Admin can log in on production
- [ ] Production data flows correctly (use a fresh DB)
- [ ] HTTPS active on both domains

---

## Recommended Build Order (Summary)

```
Phase 1  Setup both projects
Phase 2  Backend foundation
Phase 3  Authentication
Phase 4  Courses (backend → admin UI → public UI)
Phase 5  Blog (backend → admin UI → public UI)
Phase 6  Image upload
Phase 7  Contact + Enrollment
Phase 8  UI/UX polish
Phase 9  SEO + performance
Phase 10 Testing
Phase 11 Deployment
```

Build each phase end-to-end. Don't half-finish a phase before starting the next.

---

## Common Mistakes to Avoid

- **Skipping validation.** A 400 with a useful message saves hours of debugging.
- **No slug uniqueness check.** Will bite you on the first duplicate title.
- **Storing JWT in cookies AND localStorage.** Pick one.
- **Forgetting `publishedAt` logic.** Drafts with `publishedAt` set will leak publicly.
- **Hardcoded URLs.** Use env vars from day one.
- **Committing `.env`.** Use `.gitignore` and `.env.example` from day one.
- **No rate limiting.** Public forms WILL be abused.
- **Building the rich editor from scratch.** Use react-quill or tiptap.
- **Image uploads without size limits.** A 50MB upload will burn Cloudinary credits.
- **Over-engineering for v1.** No GraphQL, no microservices. MERN + Render + Atlas + Cloudinary.
- **Forgetting that mobile comes later.** Don't bake web-only assumptions into the API (server-rendered HTML, session cookies). Keep the API JSON-only with JWT auth.

---

## Final Launch Checklist

### Backend
- [ ] All env vars set on Render production
- [ ] CORS limited to production origins
- [ ] Rate limits on public forms + login
- [ ] Helmet enabled
- [ ] No stack traces in prod responses
- [ ] Health endpoint returns 200
- [ ] Admin seeded; seed password rotated

### Frontend
- [ ] Vercel/Netlify build green
- [ ] Custom domain + SSL working
- [ ] `robots.txt` + `sitemap.xml` reachable
- [ ] Lighthouse mobile > 85
- [ ] No console errors
- [ ] OG previews render correctly on WhatsApp, Twitter, Facebook
- [ ] Admin login works against production API

### Content
- [ ] At least 5 published courses
- [ ] At least 3 published blog posts
- [ ] About page reflects real teacher bio + photo
- [ ] Contact info correct (phone, email, WhatsApp)

### Marketing readiness
- [ ] Google Search Console verified
- [ ] (Optional) Google Analytics 4 or Plausible installed
- [ ] Social previews tested
- [ ] Announcement plan: WhatsApp broadcast, Instagram, LinkedIn

---

**End of Implementation Plan.**
