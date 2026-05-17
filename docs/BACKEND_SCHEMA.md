# BACKEND_SCHEMA.md — Sahlearn

**Project:** Sahlearn (Web App MVP)
**Database:** MongoDB Atlas (Mongoose 8)
**Scope:** Models, validation, relationships, and response shapes

---

## 1. Overview

Sahlearn uses MongoDB with Mongoose. Collections:

| Collection | Purpose |
|---|---|
| `users` | Admin accounts |
| `courses` | Digital courses offered |
| `posts` | Blog posts / articles / tutorials / news |
| `contactmessages` | Submissions from the contact form |
| `enrollments` | Submissions from the enrollment form |
| `media` | (Optional) Cloudinary upload records |

All models use `{ timestamps: true }` so `createdAt` / `updatedAt` are automatic.

---

## 2. User / Admin Model

**File:** `src/models/User.js`

### Purpose
Stores admin credentials. MVP has a single role: `"admin"`. Schema supports more roles later without migration pain.

### Fields

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `name` | String | yes | — | 2–100 chars |
| `email` | String | yes (unique) | — | Lowercased, validated |
| `password` | String | yes | — | bcrypt hash, never returned |
| `role` | String enum | yes | `"admin"` | `["admin"]` for MVP |
| `avatar` | `{ url, public_id }` | no | `null` | Optional Cloudinary |
| `isActive` | Boolean | no | `true` | Soft-disable |
| `lastLoginAt` | Date | no | — | Set on successful login |

### Indexes
- `email` unique

### Validation rules
- `name`: 2–100 chars, trimmed
- `email`: RFC-ish regex, lowercased
- `password`: min 8 chars BEFORE hashing
- `role`: must be in enum
- Password hashed in `pre("save")` hook only when modified
- Instance method `comparePassword(plain)` → `bcrypt.compare(plain, this.password)`
- `toJSON` transform removes `password` and `__v`

### Example schema

```js
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  email: {
    type: String, required: true, unique: true, lowercase: true, trim: true,
    match: [/^[\w.+-]+@[\w-]+(\.[\w-]+)+$/, 'Invalid email']
  },
  password: { type: String, required: true, minlength: 8, select: false },
  role: { type: String, enum: ['admin'], default: 'admin' },
  avatar: { url: String, public_id: String },
  isActive: { type: Boolean, default: true },
  lastLoginAt: Date,
}, { timestamps: true });
```

### Example JSON (sanitized)

```json
{
  "id": "65f1c0c2a4b5f8e3d2c1b0a9",
  "name": "Sahlearn Admin",
  "email": "admin@sahlearn.com",
  "role": "admin",
  "isActive": true,
  "lastLoginAt": "2026-05-17T08:32:11.000Z",
  "createdAt": "2026-04-01T10:00:00.000Z",
  "updatedAt": "2026-05-17T08:32:11.000Z"
}
```

---

## 3. Course Model

**File:** `src/models/Course.js`

### Purpose
Represents a digital course offered by the teacher.

### Fields

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `title` | String | yes | — | 3–150 chars |
| `slug` | String | yes (unique) | auto | Lowercase, hyphenated |
| `shortDescription` | String | yes | — | 10–300 chars |
| `description` | String | yes | — | 50–20000 chars, Markdown or HTML |
| `coverImage` | `{ url, public_id }` | no | — | Required to publish (controller enforces) |
| `category` | String | yes | — | e.g., `"Design"`, `"Office"`, `"AI"`, `"Marketing"` |
| `level` | String enum | yes | `"Beginner"` | `["Beginner","Intermediate","Advanced"]` |
| `duration` | String | yes | — | Free-text e.g., `"4 weeks"` |
| `price` | String | yes | — | Free-text e.g., `"₦25,000"` |
| `whatYouLearn` | [String] | no | `[]` | Bullet points |
| `prerequisites` | [String] | no | `[]` | |
| `isPublished` | Boolean | yes | `false` | Public visibility |
| `isFeatured` | Boolean | yes | `false` | Surfaces on homepage |
| `seoTitle` | String | no | — | 0–70 chars |
| `seoDescription` | String | no | — | 0–160 chars |
| `createdBy` | ObjectId → User | yes | — | Audit |

### Indexes
- `slug` unique
- `isPublished + createdAt` (compound) for public listing
- `isFeatured` for homepage
- `category` for filter
- Text index on `title` + `shortDescription` for search

### Slug generation
- Server-side via `slugify` (`{ lower: true, strict: true }`).
- If duplicate, append `-2`, `-3`, etc.
- Admin can override slug manually (validated).

### Visibility logic
- Public endpoints filter `{ isPublished: true }`
- Admin endpoints (`/api/admin/courses`) return all

### Example schema

```js
const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, minlength: 3, maxlength: 150 },
  slug:  { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[a-z0-9-]+$/ },
  shortDescription: { type: String, required: true, trim: true, maxlength: 300 },
  description: { type: String, required: true },
  coverImage: { url: String, public_id: String },
  category: { type: String, required: true, trim: true, index: true },
  level: { type: String, enum: ['Beginner','Intermediate','Advanced'], default: 'Beginner' },
  duration: { type: String, required: true },
  price: { type: String, required: true },
  whatYouLearn: [String],
  prerequisites: [String],
  isPublished: { type: Boolean, default: false, index: true },
  isFeatured:  { type: Boolean, default: false, index: true },
  seoTitle:       { type: String, maxlength: 70 },
  seoDescription: { type: String, maxlength: 160 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

courseSchema.index({ title: 'text', shortDescription: 'text' });
courseSchema.index({ isPublished: 1, createdAt: -1 });
```

### Example JSON

```json
{
  "id": "65f1c0c2a4b5f8e3d2c1b0aa",
  "title": "CorelDRAW Fundamentals",
  "slug": "coreldraw-fundamentals",
  "shortDescription": "Master CorelDRAW from scratch and create professional designs in 4 weeks.",
  "description": "Long markdown content here...",
  "coverImage": {
    "url": "https://res.cloudinary.com/sahlearn/image/upload/v123/sahlearn/courses/abc.jpg",
    "public_id": "sahlearn/courses/abc"
  },
  "category": "Design",
  "level": "Beginner",
  "duration": "4 weeks",
  "price": "₦25,000",
  "whatYouLearn": ["Workspace basics", "Vector shapes", "Typography", "Export for print"],
  "prerequisites": [],
  "isPublished": true,
  "isFeatured": true,
  "seoTitle": "Learn CorelDRAW Online — Sahlearn",
  "seoDescription": "Practical CorelDRAW course in Nigeria...",
  "createdBy": "65f1c0c2a4b5f8e3d2c1b0a9",
  "createdAt": "2026-04-01T10:00:00.000Z",
  "updatedAt": "2026-05-10T14:00:00.000Z"
}
```

---

## 4. Blog / Post Model

**File:** `src/models/Post.js`

### Purpose
Blog posts, tutorials, news, course updates, announcements. Drives SEO.

### Fields

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `title` | String | yes | — | 3–200 chars |
| `slug` | String | yes (unique) | auto | `[a-z0-9-]+` |
| `excerpt` | String | yes | — | 10–300 chars |
| `content` | String | yes | — | HTML or Markdown, up to 50000 |
| `coverImage` | `{ url, public_id }` | no | — | Required when publishing |
| `category` | String | no | `"General"` | Single |
| `tags` | [String] | no | `[]` | Lowercased |
| `author` | String | no | `"Sahlearn"` | Display name |
| `status` | String enum | yes | `"draft"` | `["draft","published"]` |
| `isFeatured` | Boolean | no | `false` | |
| `publishedAt` | Date | no | — | Set when first published |
| `readTimeMinutes` | Number | no | calculated | ~200 wpm |
| `seoTitle` | String | no | — | 0–70 |
| `seoDescription` | String | no | — | 0–160 |
| `createdBy` | ObjectId → User | yes | — | Audit |

### Indexes
- `slug` unique
- `status + publishedAt` (compound) — public listing
- `category`
- Text index on `title`, `excerpt`, `tags`

### Published / draft logic
- Default `status = "draft"`. `publishedAt` only set when status transitions to `"published"` for the first time.
- Public endpoints filter `{ status: 'published', publishedAt: { $lte: new Date() } }`
- Unpublishing keeps the historical `publishedAt` but removes from public list.

### Example schema

```js
const postSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, minlength: 3, maxlength: 200 },
  slug:  { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[a-z0-9-]+$/ },
  excerpt: { type: String, required: true, maxlength: 300 },
  content: { type: String, required: true },
  coverImage: { url: String, public_id: String },
  category: { type: String, default: 'General', index: true },
  tags: [{ type: String, lowercase: true, trim: true }],
  author: { type: String, default: 'Sahlearn' },
  status: { type: String, enum: ['draft','published'], default: 'draft', index: true },
  isFeatured: { type: Boolean, default: false },
  publishedAt: Date,
  readTimeMinutes: Number,
  seoTitle: { type: String, maxlength: 70 },
  seoDescription: { type: String, maxlength: 160 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ title: 'text', excerpt: 'text', tags: 'text' });
```

### Example JSON

```json
{
  "id": "65f1c1a2a4b5f8e3d2c1b0bb",
  "title": "5 CorelDRAW Tricks Every Designer Should Know",
  "slug": "5-coreldraw-tricks-every-designer-should-know",
  "excerpt": "Speed up your CorelDRAW workflow with these five practical shortcuts.",
  "content": "Markdown body...",
  "coverImage": { "url": "https://res.cloudinary.com/.../cover.jpg", "public_id": "sahlearn/blog/xyz" },
  "category": "Tutorials",
  "tags": ["coreldraw","design","tips"],
  "author": "Sahlearn",
  "status": "published",
  "isFeatured": false,
  "publishedAt": "2026-05-12T09:00:00.000Z",
  "readTimeMinutes": 6,
  "seoTitle": "5 CorelDRAW Tricks — Sahlearn Blog",
  "seoDescription": "Five tricks to speed up your CorelDRAW workflow.",
  "createdBy": "65f1c0c2a4b5f8e3d2c1b0a9",
  "createdAt": "2026-05-11T14:00:00.000Z",
  "updatedAt": "2026-05-12T09:00:00.000Z"
}
```

---

## 5. ContactMessage Model

**File:** `src/models/ContactMessage.js`

### Fields

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `name` | String | yes | — | 2–100 |
| `email` | String | yes | — | Validated |
| `phone` | String | no | — | Optional, Nigerian pattern if present |
| `subject` | String | yes | — | 3–150 |
| `message` | String | yes | — | 10–2000 |
| `status` | String enum | yes | `"new"` | `["new","read","replied","archived"]` |
| `ipAddress` | String | no | — | Abuse audit |
| `userAgent` | String | no | — | Abuse audit |

### Indexes
- `status + createdAt` (compound)

### Validation rules
- Name: 2–100 trimmed
- Email: regex
- Phone: optional; `/^(\+234|0)[789][01]\d{8}$/` if present
- Subject: 3–150
- Message: 10–2000

### Status logic
- `new` → admin hasn't viewed
- `read` → admin opened
- `replied` → admin marked replied
- `archived` → soft-hidden

### Example schema

```js
const contactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  email: { type: String, required: true, lowercase: true, trim: true,
           match: [/^[\w.+-]+@[\w-]+(\.[\w-]+)+$/, 'Invalid email'] },
  phone: { type: String, trim: true,
           match: [/^(\+234|0)[789][01]\d{8}$/, 'Invalid Nigerian phone'] },
  subject: { type: String, required: true, trim: true, minlength: 3, maxlength: 150 },
  message: { type: String, required: true, minlength: 10, maxlength: 2000 },
  status: { type: String, enum: ['new','read','replied','archived'], default: 'new', index: true },
  ipAddress: String,
  userAgent: String,
}, { timestamps: true });
```

---

## 6. Enrollment Model

**File:** `src/models/Enrollment.js`

### Fields

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `fullName` | String | yes | — | 2–100 |
| `email` | String | yes | — | Validated |
| `phone` | String | yes | — | Nigerian pattern |
| `course` | ObjectId → Course | no | — | null if "general" |
| `courseTitleSnapshot` | String | yes | — | Title at submission time |
| `preferredStartDate` | Date | no | — | Optional |
| `mode` | String enum | yes | `"online"` | `["online","physical","hybrid"]` |
| `notes` | String | no | — | 0–500 |
| `status` | String enum | yes | `"pending"` | `["pending","contacted","enrolled","rejected"]` |
| `ipAddress` | String | no | — | |
| `userAgent` | String | no | — | |

### Indexes
- `status + createdAt`
- `course`
- `email`

### Example schema

```js
const enrollmentSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  email: { type: String, required: true, lowercase: true, trim: true,
           match: [/^[\w.+-]+@[\w-]+(\.[\w-]+)+$/, 'Invalid email'] },
  phone: { type: String, required: true, trim: true,
           match: [/^(\+234|0)[789][01]\d{8}$/, 'Invalid Nigerian phone'] },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  courseTitleSnapshot: { type: String, required: true },
  preferredStartDate: Date,
  mode: { type: String, enum: ['online','physical','hybrid'], default: 'online' },
  notes: { type: String, maxlength: 500 },
  status: { type: String, enum: ['pending','contacted','enrolled','rejected'], default: 'pending', index: true },
  ipAddress: String,
  userAgent: String,
}, { timestamps: true });
```

---

## 7. Media Model (Optional)

**File:** `src/models/Media.js`

Optional table tracking every Cloudinary upload — useful when you want a media library or want to clean up orphans. **Skip for MVP** unless you decide otherwise.

### Fields

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `url` | String | yes | — | Cloudinary secure_url |
| `public_id` | String | yes (unique) | — | Cloudinary id |
| `folder` | String | yes | — | e.g., `"sahlearn/blog"` |
| `mimeType` | String | yes | — | `image/jpeg` etc. |
| `sizeBytes` | Number | yes | — | |
| `width` | Number | no | — | |
| `height` | Number | no | — | |
| `uploadedBy` | ObjectId → User | yes | — | |

### Storage structure (Cloudinary folders)
- `sahlearn/courses/<slug>-<timestamp>` — course covers
- `sahlearn/blog/<slug>-<timestamp>` — blog covers
- `sahlearn/inline/<timestamp>` — inline blog images
- `sahlearn/avatars/<userId>` — admin avatars (future)

---

## 8. Categories

**Recommendation:** Skip a `Category` model for MVP. Use a constant in `src/utils/constants.js`:

```js
exports.CATEGORIES = ['Design','Office','AI','Marketing','General'];
```

Referenced by both validators and frontend. Promote to a real model in v1.1 if admin asks to manage them.

---

## 9. Slug Generation Rules

- Use `slugify(title, { lower: true, strict: true })`.
- Strip accents, lowercase, replace spaces with `-`, remove non-`[a-z0-9-]`.
- Reserved slugs (cannot be used): `["admin","api","login","new","edit","sitemap","robots"]`.
- On create: if generated slug exists, append `-2`, `-3` …
- On update: if `title` changes, do **NOT** auto-change slug. Slug change is opt-in via the admin form to preserve SEO and existing links.

---

## 10. Course Visibility Logic

| Endpoint | Filter |
|---|---|
| `GET /api/courses` | `{ isPublished: true }` |
| `GET /api/courses/:slug` | `{ slug, isPublished: true }` |
| `GET /api/courses?featured=true` | `{ isPublished: true, isFeatured: true }` |
| `GET /api/admin/courses` | (no filter — all) |
| `GET /api/admin/courses/:id` | by id, all |

---

## 11. Blog Visibility Logic

| Endpoint | Filter |
|---|---|
| `GET /api/posts` | `{ status: 'published', publishedAt: { $lte: now } }` |
| `GET /api/posts/:slug` | `{ slug, status: 'published' }` |
| `GET /api/admin/posts` | (no filter — all, default sort by `updatedAt` desc) |
| `GET /api/admin/posts?status=draft` | drafts only |

Pagination: default `limit=10`, `page=1`. Max `limit=50`.

---

## 12. Contact Message Status Logic

Transitions allowed:

```
new ──► read ──► replied ──► archived
                  ▲              │
                  └──────────────┘   (admin can re-open from archive)
```

`PATCH /api/contact/:id` body: `{ status: 'read' }`. Reject invalid statuses.

---

## 13. Enrollment Status Logic

Transitions:

```
pending ──► contacted ──► enrolled
   │             │             ▲
   │             ▼             │
   └─────► rejected ◄──────────┘
```

`PATCH /api/enrollments/:id` body: `{ status }`. Reject unknown statuses.

---

## 14. Image Storage Structure

- All images live in **Cloudinary**, never in MongoDB binary.
- Mongo stores `{ url, public_id }` only.
- Folder convention per §7.
- Delete: best-effort `cloudinary.uploader.destroy(public_id)` after record delete. Failures are logged, not surfaced to the admin.

---

## 15. Recommended API Response Shape

### Single resource success
```json
{
  "status": "success",
  "data": { /* resource */ }
}
```

### List with pagination
```json
{
  "status": "success",
  "data": [ /* items */ ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

### Auth login
```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOi...",
    "user": { "id": "...", "name": "...", "email": "...", "role": "admin" }
  }
}
```

### Created resource
HTTP 201 with `{ status, data }` envelope.

### Delete
HTTP 200 with `{ status: "success", data: { id } }` — stick to one shape so the frontend handles every response identically.

---

## 16. Error Response Shape

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email" },
    { "field": "password", "message": "Must be at least 8 characters" }
  ]
}
```

For simple errors, omit `errors`:

```json
{
  "status": "error",
  "message": "Course not found"
}
```

HTTP codes:

| Code | When |
|---|---|
| 400 | Bad request (malformed body) |
| 401 | Missing / invalid / expired token |
| 403 | Forbidden (role mismatch) |
| 404 | Resource not found |
| 409 | Conflict (duplicate slug, duplicate email) |
| 422 | Validation failed |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

---

## 17. Seeding the Admin

A one-time seed script `src/utils/seedAdmin.js`:

1. Checks if any user with role `admin` exists.
2. If none, creates one from env vars `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD` (password hashed).
3. Logs a message: rotate the seed password from the dashboard immediately.

Gate behind a `SEED_ADMIN=true` env flag if running on Render, to keep it explicit.

---

**End of BACKEND_SCHEMA.**
