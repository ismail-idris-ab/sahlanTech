# APP_FLOW.md — Application Flow Document

**Project:** Sahlearn (Web App MVP)
**Scope:** All user journeys on the website
**Note:** Mobile app flows are deferred — see `MOBILE_ROADMAP.md`.

---

## 1. Public Visitor Flow

Visitor lands on `sahlearn.com`
→ Sees Navbar (Home, About, Courses, Blog, Contact, "Enroll Now" CTA) + Hero + Featured Courses + sections
→ Scrolls through homepage
→ Decides next action:

- Click **Courses** → Courses Listing flow
- Click **Blog** → Blog Reading flow
- Click **About** → read teacher bio → click Contact CTA
- Click **WhatsApp floating button** → opens `https://wa.me/<number>` in new tab
- Click **Enroll Now** in hero → goes to `/enroll`

---

## 2. Homepage Flow

Page loads
→ Fetches:
  - `GET /api/courses?featured=true&limit=6`
  - `GET /api/posts?limit=3`
→ Renders sections in order: Hero · Featured Courses · About Teaser · Why Choose Us · Latest Blog · CTA banner · Footer
→ Course cards link to `/courses/:slug`
→ Blog cards link to `/blog/:slug`

---

## 3. Course Discovery Flow

Visitor on `/courses`
→ Sees grid of course cards with cover image, title, level, duration
→ Filters: search input, category chips, level dropdown
→ Clicks course card → `/courses/:slug`

Backend reaction:
- `GET /api/courses?category=design&search=corel`
- Returns only `isPublished: true` courses
- Response per TRD §10 envelope

---

## 4. Course Details Flow

`/courses/:slug`
→ `GET /api/courses/:slug`
→ If 404: render NotFound page with "Browse other courses" link
→ If found:
  - Hero with cover image + title + level badge + duration + price
  - "What you'll learn" bullets
  - Long description (HTML / Markdown rendered)
  - Prerequisites (if any)
  - Two primary CTAs: **Enroll Now** (→ `/enroll/:slug`) and **WhatsApp** (opens chat with pre-filled message: "Hi, I'm interested in `<course title>`")
  - Related courses (3 cards from same category)
  - SEO meta: title = course SEO title, description = course SEO description, og:image = cover

---

## 5. Enrollment Flow

`/enroll/:courseSlug` or `/enroll`
→ If `courseSlug` exists: course is pre-selected and disabled
→ If general: course dropdown shows all published courses
→ Fills form: name, email, phone, course (if not preselected), preferred start date, mode (online / physical / hybrid), notes
→ Clicks Submit
→ Frontend validates
→ `POST /api/enrollments` with payload
→ Loading state on button
→ On success: success screen with check icon, message "We'll contact you within 24 hours via WhatsApp", and two CTAs: "Browse more courses" and "Chat on WhatsApp"
→ On error: inline error message + retry

Backend reaction:
- Rate limit check (3/hour per IP)
- Validate payload
- Create `Enrollment` doc with `status: "pending"` and `courseTitleSnapshot`
- Return `{ status: 'success', data: { id, ... } }`

---

## 6. Blog Reading Flow

`/blog`
→ `GET /api/posts?page=1&limit=9`
→ Grid of blog cards (cover, category badge, title, excerpt, date, read time)
→ Pagination at bottom (Prev / 1 2 3 / Next)
→ Click card → `/blog/:slug`

`/blog/:slug`
→ `GET /api/posts/:slug`
→ If 404 → NotFound
→ Renders cover image, title, author + date, category, tags, content
→ Share buttons (WhatsApp, X/Twitter, copy link)
→ Related posts (3 from same category)
→ SEO meta + JSON-LD Article structured data

---

## 7. Contact Form Flow

`/contact`
→ Page shows contact info (phone, email, WhatsApp, address) on the left, form on the right
→ Form: name, email, phone (optional), subject, message
→ Submit → `POST /api/contact`
→ Success → inline success card "Message received. We'll respond within 24 hours."
→ Error → inline error

Backend reaction:
- Rate limit 5/hour
- Validate
- Create `ContactMessage` with `status: "new"`
- Return success

---

## 8. WhatsApp Contact Flow

Click WhatsApp button (floating FAB or inline)
→ Opens `https://wa.me/<phone>?text=<encoded message>` in new tab
→ User completes chat in WhatsApp Web or mobile app

Prefilled messages by context:
- General: "Hi, I'd like to know more about your courses."
- From a course detail page: "Hi, I'm interested in `<course title>`. Please send me more details."
- From an enrollment success page: "Hi, I just submitted an enrollment for `<course title>`. Reference: `<enrollment id>`."

---

## 9. Admin Login Flow

Admin opens `/admin/login`
→ Sees centered card: Sahlearn logo + "Admin Login" + email + password + "Sign in" button
→ Enters credentials → Submit
→ `POST /api/auth/login`
→ On success:
  - Receive `{ token, user }`
  - Save token to `localStorage` (`sahlearn_token`)
  - Set axios default `Authorization` header
  - Populate `AuthContext`
  - Redirect to `/admin`
→ On error: show error toast ("Invalid email or password")

If admin is already logged in and visits `/admin/login`:
→ Redirect to `/admin`

If admin token expires mid-session:
→ Any 401 response triggers global axios interceptor → clear token → redirect to `/admin/login` with toast "Session expired, please log in again"

---

## 10. Admin Dashboard Flow

Admin lands on `/admin`
→ Layout: dark sidebar (logo, links, logout) + light main content
→ Sidebar links: Dashboard, Courses, Blog, Messages, Enrollments, Profile, Logout
→ Dashboard home shows 4 stat cards:
  - Total Courses
  - Total Posts
  - New Messages (last 7 days)
  - Pending Enrollments
→ Plus a recent activity feed (latest 5 messages + 5 enrollments)
→ Fetches `GET /api/admin/stats`
→ Each card is clickable → goes to relevant section

---

## 11. Course Management Flow

### List
Admin on `/admin/courses`
→ `GET /api/admin/courses` (includes drafts)
→ Table: title, category, level, status badge, updated date, actions (Edit, Delete, Publish toggle)
→ "+ New Course" button → `/admin/courses/new`
→ Filter chips: All, Published, Draft

### Create
Admin on `/admin/courses/new`
→ Sees form with:
  - Title (auto-fills slug as you type)
  - Slug (editable)
  - Short description
  - Long description (rich editor)
  - Category select
  - Level select (Beginner / Intermediate / Advanced)
  - Duration
  - Price
  - What you'll learn (dynamic bullet list, add / remove)
  - Prerequisites (dynamic list)
  - Cover image upload → `POST /api/upload` → returns Cloudinary URL → preview shown
  - isFeatured toggle
  - isPublished toggle
  - SEO title, SEO description
→ Click Save → `POST /api/courses`
→ Success: toast "Course created", redirect to `/admin/courses`

### Edit
`/admin/courses/:id/edit`
→ `GET /api/admin/courses/:id` populates form
→ Same form as create
→ Save → `PATCH /api/courses/:id`
→ Success toast + redirect to listing

### Delete
Admin clicks delete on a row
→ Confirmation modal: "Delete `<title>`? This cannot be undone."
→ Confirm → `DELETE /api/courses/:id`
→ Backend also calls `cloudinary.uploader.destroy(public_id)` for cover image
→ Toast "Course deleted", row removed from list

### Publish toggle
Admin clicks toggle on a row
→ Optimistic UI flip
→ `PATCH /api/courses/:id` with `{ isPublished: !current }`
→ On error: revert + toast

---

## 12. Blog / CMS Management Flow

### List
Admin on `/admin/posts`
→ `GET /api/admin/posts?page=1`
→ Table: title, status (Draft / Published), category, updated, actions
→ Filter: All / Drafts / Published

### Create
`/admin/posts/new`
→ Form:
  - Title (auto-slug)
  - Slug (editable)
  - Excerpt
  - Content (rich editor — react-quill or tiptap)
  - Cover image upload → `POST /api/upload`
  - Category (dropdown / new)
  - Tags (chip input, comma-separated)
  - SEO title, SEO description
  - isFeatured
  - Action buttons at top-right: "Save Draft" or "Publish"
→ Save Draft → `POST /api/posts` with `status: 'draft'`
→ Publish → `POST /api/posts` with `status: 'published'` and `publishedAt: Date.now()`

### Edit
Same as Create with prefilled values via `GET /api/admin/posts/:id`.

Two top-right buttons depending on current state:
- If draft: "Save Draft" + "Publish"
- If published: "Save Changes" + "Unpublish"

### Delete
Same modal pattern as courses, hits `DELETE /api/posts/:id`.

---

## 13. Image Upload Flow

Admin clicks "Upload cover" on course / blog form
→ File picker opens
→ Selects image (JPG/PNG/WEBP, < 5MB)
→ Frontend validates type + size client-side
→ Shows upload spinner
→ `POST /api/upload` with `FormData { image }` and Authorization header
→ Backend multer + Cloudinary uploads to folder `sahlearn/<courses|blog>`
→ Returns `{ url, public_id }`
→ Frontend stores both in form state and shows preview
→ When form is saved, the URL is persisted with the course / post

Replace image: same flow, plus optional backend call to destroy the previous `public_id`.

---

## 14. Contact Message Management Flow

Admin on `/admin/messages`
→ `GET /api/contact?status=new`
→ Table / card list: name, email, subject, preview, date, status, actions (View, Mark Read, Delete)
→ Click a row → opens detail modal with full message + "Reply via email" (mailto) + "Reply via WhatsApp" (if phone present) + status dropdown
→ Change status → `PATCH /api/contact/:id`
→ Delete → confirmation → `DELETE /api/contact/:id`

Default sort: newest first.

---

## 15. Enrollment Management Flow

Admin on `/admin/enrollments`
→ `GET /api/enrollments?status=pending`
→ Table: name, course, phone, mode, date, status, actions
→ Status dropdown: pending → contacted → enrolled → rejected
→ Click row → modal with all details + WhatsApp button (prefilled) + status change + notes
→ Status change → `PATCH /api/enrollments/:id`
→ Delete → confirmation → `DELETE /api/enrollments/:id`

Filter by: status, course, date range.

---

## 16. Error State Flows

### Network error / 5xx
→ Show ErrorMessage component with retry button (inline within the page area)

### 404 / not found
→ Dedicated NotFound page with link home

### 401 (admin only)
→ Clear token, toast, redirect to `/admin/login`

### Form validation errors
→ Field-level red border + error text below input
→ Submit button shows errors on submit; doesn't silently fail

### Rate-limit error (429)
→ Toast: "Too many requests. Please try again in a few minutes."

---

## 17. Empty State Flows

| Context | Display |
|---|---|
| No courses match filter | Centered illustration + "No courses found" + "Clear filters" button |
| No blog posts yet | "Stay tuned — first post coming soon" + CTA "Contact us" |
| Admin: 0 messages | "Inbox is empty" + sub-text |
| Admin: 0 enrollments | "No enrollment requests yet" |

---

## 18. Mobile-Browser Considerations (Web)

The site is a responsive web app, so on phones it must:
- Use a hamburger menu in the navbar
- Have tap targets ≥ 44px
- Show the WhatsApp FAB pinned to the bottom-right (with safe spacing from the FAB to bottom edge)
- Stack columns single-file
- Use larger touch-friendly buttons on forms
- Avoid hover-only information

This is **not** the mobile app — it's the website viewed on a phone. The native mobile app is a future phase.

---

## 19. Full User Journey Summary

### Visitor → Student (happy path)

```
Discovers Sahlearn via Google search / Instagram / WhatsApp share
   │
   ▼
Lands on /courses → opens CorelDRAW course → clicks Enroll
   → fills form → success → clicks WhatsApp → chats with teacher → enrolls offline
   │
   ▼
Backend has new Enrollment doc with status 'pending'
   │
   ▼
Admin logs in to dashboard
   ├─► Sees new enrollment in dashboard stat card
   ├─► Goes to /admin/enrollments → opens detail → contacts via WhatsApp button
   ├─► Updates status to 'contacted'
   ├─► After class confirmation, updates status to 'enrolled'
   └─► Optionally writes a blog post about the new cohort → publishes → SEO boost
```

### Reader → Subscriber (blog-led)

```
Discovers Sahlearn blog post via Google ("learn coreldraw nigeria")
   │
   ▼
Reads article → sees related courses sidebar → clicks course → Enroll
```

---

**End of APP_FLOW.**
