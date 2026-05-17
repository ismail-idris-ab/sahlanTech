# PRD.md — Product Requirements Document

**Project:** Sahlearn — Digital Course Platform (Web App)
**Version:** 1.0 (MVP)
**Scope:** WEB ONLY. Mobile app is planned for a future phase — see `MOBILE_ROADMAP.md`.

---

## 1. Project Title

**Sahlearn** — A digital course discovery and enrollment website for a teacher / training brand.

The name **Sahlearn** is used everywhere: branding, SEO metadata, email, social handles.

---

## 2. Project Overview

Sahlearn (web) is a two-part product:

| Part | Tech | Audience |
|---|---|---|
| **Public website** | React + Vite + Tailwind | Visitors, prospective students |
| **Admin dashboard** | Same React app, protected routes | The teacher / admin |
| **Sahlearn API** | Node.js + Express + MongoDB | Backend serving the web app |

For MVP, everything ships as one web application + one API. Mobile comes later.

---

## 3. Problem Statement

The teacher currently has no centralized digital presence to:

1. Showcase the full course catalog professionally.
2. Capture enrollment requests in a structured way (instead of scattered WhatsApp messages).
3. Publish blog posts, tutorials, and news to build authority and SEO traffic.
4. Look credible to prospective students and corporate clients.

Without Sahlearn, leads are lost and the brand looks informal.

---

## 4. Product Goals

| # | Goal | Success signal |
|---|---|---|
| G1 | Build a professional brand presence | Visitors say "this looks legit" |
| G2 | Capture enrollment requests in structured form | Enrollment records in DB |
| G3 | Drive SEO traffic via blog | Blog posts indexed and ranking |
| G4 | Empower the teacher to update content without a developer | Admin can publish a blog post in under 3 minutes |
| G5 | Convert visitors into students via clear CTAs and WhatsApp | Measurable click-through to WhatsApp |

---

## 5. Target Users

### 5.1 Primary
- **Prospective students** in Nigeria looking to learn digital skills (CorelDRAW, PowerPoint, Web Design, AI, Computer Basics, Graphic Design, Canva, Digital Marketing, MS Word, MS Excel).
- Age range: 16–45.
- Device mix: 70% mobile browsers, 30% desktop browsers — the **website must be fully responsive**.

### 5.2 Secondary
- **Corporate / institutional clients** interested in bulk training.
- **The teacher / admin** managing content.

---

## 6. User Roles

| Role | Authentication | Access |
|---|---|---|
| **Visitor** | None | Public pages |
| **Student (prospect)** | None for MVP | Same as visitor + can submit enrollment |
| **Admin (teacher)** | JWT login | Full admin dashboard |

> No student login in MVP. Enrollment is form-based + WhatsApp follow-up.

---

## 7. Public Website Features

| Feature | Description |
|---|---|
| Homepage | Hero, featured courses, about teaser, testimonials, blog teaser, CTA |
| About page | Teacher bio, brand story, credentials |
| Courses listing | Grid of all courses with filter / search |
| Course details | Full course info, what you'll learn, duration, price, enroll CTA |
| Blog listing | Paginated, filter by category |
| Blog details | Full article with cover image, SEO meta, share buttons |
| Contact page | Form + WhatsApp button + email + phone |
| Enrollment page | Per-course or general enrollment form |
| WhatsApp floating button | Persistent FAB on all public pages |

---

## 8. Admin Dashboard Features

| Feature | Description |
|---|---|
| Secure login | JWT-based, email + password |
| Dashboard home | Stats: total courses, posts, messages, enrollments (last 30 days) |
| Course management | Create, edit, delete, publish/unpublish, upload course image |
| Blog management | Create, edit, delete, publish/unpublish, save draft, upload cover, categories, tags, SEO fields |
| Contact messages | List, view detail, mark read/replied, delete |
| Enrollments | List, view detail, change status (pending → contacted → enrolled → rejected), delete |
| Profile / password change | Change admin password |

---

## 9. Course Management Requirements

Each course record has:
- Title (required)
- Slug (auto-generated, unique)
- Short description (for cards)
- Long description (full HTML / Markdown)
- Cover image (Cloudinary)
- Duration (e.g., "4 weeks")
- Level (Beginner / Intermediate / Advanced)
- Price (text, e.g., "₦25,000")
- What you'll learn (array of bullet points)
- Prerequisites (array, optional)
- Category (e.g., Design, Office Productivity, AI, Marketing)
- isPublished (boolean)
- isFeatured (boolean) — surfaces on homepage
- SEO title, SEO description
- createdAt, updatedAt

---

## 10. Blog / CMS Requirements

Each blog post has:
- Title (required)
- Slug (auto-generated, unique)
- Excerpt / summary
- Content (Markdown or rich HTML)
- Cover image (Cloudinary)
- Category (single)
- Tags (array)
- Author (defaults to admin name)
- Status: `draft` | `published`
- isFeatured (boolean)
- SEO title, SEO description
- publishedAt (set when transitioning to published)
- createdAt, updatedAt

Admin must be able to:
- Create / edit / delete posts
- Save as draft
- Publish / unpublish
- Upload cover image
- Add category + tags
- Set SEO title / description

---

## 11. Contact Form Requirements

Fields:
- Full name (required)
- Email (required, validated)
- Phone (optional)
- Subject (required)
- Message (required, 10–2000 chars)

Backend:
- Validate inputs
- Rate limit (5 submissions per IP per hour)
- Store in `ContactMessage` collection
- Status: `new` | `read` | `replied` | `archived`

---

## 12. Enrollment Form Requirements

Fields:
- Full name (required)
- Email (required, validated)
- Phone (required, validated as Nigerian phone)
- Course (reference to course OR free text if "general enrollment")
- Preferred start date (optional)
- Mode preference: `online` | `physical` | `hybrid`
- Notes (optional, 0–500 chars)

Backend:
- Validate inputs
- Rate limit (3 per IP per hour)
- Store in `Enrollment` collection
- Status: `pending` | `contacted` | `enrolled` | `rejected`

---

## 13. Website Pages (Routes)

| Route | Page |
|---|---|
| `/` | Home |
| `/about` | About |
| `/courses` | Courses listing |
| `/courses/:slug` | Course detail |
| `/blog` | Blog listing |
| `/blog/:slug` | Blog detail |
| `/contact` | Contact |
| `/enroll` | General enrollment |
| `/enroll/:courseSlug` | Course-specific enrollment |
| `/admin/login` | Admin login |
| `/admin` | Admin dashboard (protected) |
| `/admin/courses` | Course management (protected) |
| `/admin/courses/new` | New course (protected) |
| `/admin/courses/:id/edit` | Edit course (protected) |
| `/admin/posts` | Blog management (protected) |
| `/admin/posts/new` | New post (protected) |
| `/admin/posts/:id/edit` | Edit post (protected) |
| `/admin/messages` | Contact messages (protected) |
| `/admin/enrollments` | Enrollments (protected) |
| `/admin/profile` | Admin profile (protected) |
| `*` | 404 Not Found |

---

## 14. Functional Requirements

- Home page loads in under 3 seconds on 3G.
- All public features work without login.
- Admin authentication uses JWT.
- Forms validate client-side and server-side.
- All images served from Cloudinary.
- Slugs are unique and human-readable.
- Blog and courses support draft / published states.
- The website is fully responsive (mobile / tablet / desktop).

---

## 15. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Uptime | 99% (best effort on free tier) |
| TTI on 3G | < 4s |
| API p95 latency | < 800ms |
| Accessibility | WCAG 2.1 AA basics (color contrast, labels, focus rings) |
| Browser support | Last 2 versions of Chrome, Safari, Firefox, Edge |
| Lighthouse score | > 85 mobile on key pages |

---

## 16. SEO Requirements

- Per-page `<title>` and `<meta description>`
- Open Graph + Twitter Card tags
- Clean slug URLs (`/courses/coreldraw-fundamentals`, not query strings)
- `sitemap.xml` auto-generated from published courses + posts
- `robots.txt`
- Semantic HTML (`<article>`, `<nav>`, `<main>`, proper heading hierarchy)
- Canonical URLs
- JSON-LD structured data for courses and articles (recommended)
- Image `alt` attributes everywhere

---

## 17. Security Requirements

- JWT with strong secret (32+ chars random), expiry 7 days.
- Passwords hashed with bcrypt (cost 10+).
- All admin routes protected by middleware.
- Input validation on every endpoint.
- Rate limiting on public forms and login.
- CORS configured to accept only the deployed web origin (+ localhost in dev).
- No secrets in client bundles.
- `.env` never committed.
- Cloudinary uploads limited to images < 5MB, mime-type whitelisted.
- HTTPS only in production.

---

## 18. MVP Scope

### ✅ In scope (Web MVP)
- Public website (home, about, courses, course detail, blog, blog detail, contact, enroll)
- Admin dashboard (login, stats, courses CRUD, blog CRUD with draft/publish, messages, enrollments)
- Shared backend API
- Cloudinary image upload
- JWT admin login
- Categories + tags for blog
- SEO meta tags + sitemap + robots
- Responsive design
- WhatsApp integration

### 🚫 Out of scope (future)
- **Mobile app** — see `MOBILE_ROADMAP.md`
- Student accounts and login
- Payment processing
- Video streaming / hosted lessons
- Live classes / scheduling
- Quizzes / assessments
- Certificates
- Student dashboards
- Push notifications
- Multi-language (i18n)
- Reviews / ratings
- Affiliate / referral
- Newsletter system
- Comments on blog

---

## 19. Future Features (Post-MVP)

| Feature | Why later |
|---|---|
| Mobile app (React Native + Expo) | Web MVP comes first; mobile in next phase |
| Paystack payment | Needs business decision on pricing model |
| Student accounts | Needs progress tracking design first |
| Video lessons | Needs hosting strategy (Bunny, Mux, YouTube unlisted) |
| Comments on blog | Spam moderation is its own project |
| Newsletter | Needs email service (Resend, Mailgun) |
| Multi-instructor | Single-teacher MVP is intentional |

---

## 20. Acceptance Criteria

The web MVP is accepted when:

1. Visitor can browse home, about, courses, course detail, blog, blog detail, contact, enroll — fully responsive on mobile / tablet / desktop.
2. Admin can log in, manage courses (CRUD), manage blog posts (CRUD with draft/publish), view messages, view enrollments, update enrollment status.
3. Image upload works end-to-end via Cloudinary.
4. Contact + enrollment submissions persist to MongoDB and appear in admin.
5. Admin protected routes reject invalid / missing tokens on both frontend and direct API calls.
6. All public pages have unique titles + meta descriptions, `sitemap.xml` resolves.
7. Frontend deployed on Vercel/Netlify, API on Render, DB on Atlas.
8. No critical bugs; no security holes.

---

## 21. Definition of Done

A feature is "done" when:

- [ ] Backend endpoint built + validated + error-handled
- [ ] Frontend integrated + responsive + loading / error / empty states
- [ ] Tested manually in browser at mobile + desktop widths
- [ ] No console errors
- [ ] Documented in code where tricky
- [ ] Reviewed against the matching section of this PRD

---

**End of PRD.**
