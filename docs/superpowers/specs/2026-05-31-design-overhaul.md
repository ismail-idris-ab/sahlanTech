# Sahlearn Design Overhaul Spec
_Date: 2026-05-31_

## Scope
Full visual overhaul of both admin and student portals. Covers layout shells, dashboard pages, all list pages, all detail pages, and all student content pages. Forms are excluded — existing form design is kept as-is.

## Design Direction
**Bold & Branded** — leans into the existing green (#068562) / gold (#C9962A) / dark-teal (#013F4A) palette throughout. EduAdmin-template inspired. High visual weight on primary elements, clean white cards for secondary content.

---

## Section 1 — Layout Shells

### Admin Layout (`AdminLayout.jsx`)
**No structural change.** The dark forest-green sidebar stays full-width (240px, `lg:` breakpoint). Changes are cosmetic polish only:
- Active nav item: keep glowing green dot indicator
- Sidebar group labels: keep `MENU` / `MANAGE` uppercase labels
- Top bar: add date text on desktop (already implemented, keep)
- Top bar notification badge: keep existing logic
- Mobile: existing dark bottom tab bar is kept unchanged

### Student Layout (`StudentLayout.jsx`) — full replacement
**Current:** plain white sidebar, no top bar, no mobile nav.
**New:**

**Top bar (always visible, full width):**
- Background: `linear-gradient(90deg, #013F4A, #068562)`
- Left: Sprout icon + "sahlearn" wordmark + "STUDENT" sub-label in `#71B280`
- Right: notification bell button (gold badge when unread) + student avatar circle (gold gradient, initials)
- Height: ~44px, `sticky top-0 z-30`

**Left sidebar (desktop `lg:` only, 240px):**
- Background: `#ffffff`
- Border right: `1px solid #D8EAE5`
- Active nav item: `bg-surface-100`, `border-right: 2px solid #068562`, text `#068562`, weight 600
- Inactive nav item: text `#506860`, hover `bg-surface-100`
- Bottom user card: avatar circle (green tint initials) + full name + student ID + sign-out button

**Mobile (below `lg:`):**
- Sidebar hidden
- Top bar remains (logo + notifications + avatar)
- New white bottom tab bar replaces nothing (currently missing):
  - Background: `#ffffff`, border-top `1px solid #D8EAE5`
  - 5 tabs: Home, Courses, Tasks, Messages, Profile
  - Active tab: icon bg `rgba(6,133,98,0.1)`, text `#068562`
  - Inactive tab: text `#7A9890`
  - Safe area inset-bottom padding

---

## Section 2 — Dashboard Pages

### Admin Dashboard (`pages/admin/Dashboard.jsx`)
Keep existing structure, upgrade visuals:

**Greeting banner:**
- Keep dark gradient banner, decorative orbs
- Add right-side mini-stat chips: "X total students" (`stats.students.total`) and "X pending" (sum of `messages.new + enrollments.pending + assignments.ungraded + exams.pendingReview`) — small frosted cards inside the banner
- Keep quick-action buttons (+ New Course, + New Post)

**Primary stat cards (4-grid):**
- Green gradient card (Courses): keep as-is, already strong
- Blog Posts, Messages, Enrollments, Active Students: upgrade from plain white to white cards with colored icon background squares (`bg-blue-50`, `bg-amber-50`, etc.) and colored number text — already exists, polish sizing/spacing only

**Secondary stat row (3-grid):**
- Ungraded Submissions, Exam Attempts to Review, New Messages — same white card pattern as above, purple/indigo/orange tints

**Content Health panel:**
- Add Attendance Sessions row below Courses and Blog Posts rows (same progress bar pattern)

**Submissions Inbox panel:**
- Keep as-is (already well-designed)

### Student Dashboard (`pages/student/Dashboard.jsx`) — full replacement

**Welcome banner:**
- `linear-gradient(135deg, #068562, #013F4A)`, border-radius `2xl`
- Decorative orb top-right
- Greeting tag (uppercase, `#71B280`), student full name (`text-2xl font-display`), student ID (`text-xs opacity-50`)
- Row of info chips: "X Courses enrolled" (green chip, from `student.enrolledCourses.length`), "X assignments pending" (gold chip, from `stats.assignments.pending` — hide chip if 0)

**Stat cards (3-grid):**
- Enrolled Courses: green icon bg, number in `#068562`, trend badge "Active"
- Assignments Submitted: blue icon bg, `submitted / total` fraction, orange "X pending" badge when pending > 0
- Exams Taken: purple icon bg, number, green "Avg X%" badge when avg score available

**Two-column panels:**

_Upcoming panel:_
- List of upcoming assignments + exams sorted by due date
- Each item: colored dot (orange = assignment, purple = exam) + title + "Due in X days · Course Name"
- "View all" link top-right

_My Courses panel:_
- Each enrolled course: thumbnail (course cover or colored placeholder gradient) + title + category + progress bar (placeholder, shows 0% until progress tracking is added)
- "View all" link top-right

---

## Section 3 — Page Patterns

### Pattern A — Admin List Pages
Applies to: Students, Courses (card variant), Posts (card variant), Messages, Enrollments, Assignments, Exams, Attendance, Announcements, Team.

**Structure:**
1. Page header: `<h1>` title + subtitle (total count) + action button(s) top-right
2. Filter bar: search box (white, green focus ring) + filter chips (All / status filters / dropdown filters)
3. Content: table or card grid (see variants)
4. Pagination footer inside table wrap

**Table variant** (Students, Messages, Enrollments, Assignments, Exams, Attendance, Announcements, Team):
- Wrapper: `bg-white rounded-2xl border border-ink-300/20 overflow-hidden`
- Header row: `bg-surface-50`, `text-[10px] uppercase tracking-widest text-ink-400`
- Data rows: `hover:bg-surface-50 transition-colors`, bottom border between rows
- Avatar cells: 32px circle with initials gradient, name + ID stacked
- Status badges: pill shape, color-coded (green=active/published, amber=pending/draft, blue=info, red=danger)
- Row actions: small `btn-edit-sm` (green tint) + `btn-danger-sm` (red tint) buttons flush right
- Pagination: `Prev / 1 2 3 / Next` — active page is green filled pill

**Card grid variant** (Courses, Posts):
- 3-col grid `lg:`, 2-col `md:`, 1-col `sm:`
- Each card: cover image or gradient placeholder + published/draft badge overlay + title + meta + status badge + edit button

### Pattern B — Admin Detail Pages
Applies to: StudentDetail, ExamDetail, AssignmentDetail, AttendanceSession.

**Structure:**
1. Breadcrumb: `Parent › Current` — current item in `#068562`
2. Header card: `bg-white rounded-2xl` — large avatar (48px, rounded-xl, gradient) + name + sub-text + badge chips + action buttons (right-aligned)
3. Tab bar: pill tabs (`Overview`, sub-section names) — active tab `bg-brand-primary text-white`, inactive `text-ink-400`
4. Content below tabs: 2-col info cards (`bg-white rounded-2xl`) with `label / value` rows

### Pattern C — Forms
**No change.** Existing form design is kept exactly as-is for:
- CourseForm, ExamForm, AssignmentForm, PostEditor, AnnouncementForm, SiteContent

### Pattern D — Student Content Pages
Applies to: MyCourses, Assignments, AssignmentDetail, Exams, Attendance, Progress, Announcements, Messages, Profile.

**Structure:**
1. Page title + count sub-text
2. Search box + filter chips (where applicable)
3. 2-col card grid (`lg:`), 1-col (`sm:`)

**Card design:**
- `bg-white rounded-2xl border border-surface-200`
- Header: title (font-semibold) + course name (xs, muted) + due-date badge (color-coded: orange=pending, green=submitted/graded)
- Body: description snippet (xs, muted, 2-line clamp)
- Footer: progress bar (thin, green) + status label left + score/action right

**Status badge colors:**
- Pending/due: `bg-orange-50 text-orange-600`
- Submitted: `bg-green-50 text-green-600`
- Graded: `bg-green-50 text-green-700` + score shown
- Overdue: `bg-red-50 text-red-600`

**Empty state:**
- Centered illustration placeholder (colored rounded square, 48px) + heading + sub-text
- Consistent across all student pages

---

## Responsiveness Requirements

| Breakpoint | Admin | Student |
|---|---|---|
| `< lg` (< 1024px) | Sidebar hidden, bottom dark tab bar | Sidebar hidden, top bar stays, bottom white tab bar |
| `lg` (1024px+) | Full 240px sidebar | Full 240px white sidebar + top bar |
| All | Content area scrolls independently | Content area scrolls independently |

Student bottom tab bar tabs: Home (`/student/dashboard`), Courses (`/student/courses`), Tasks (`/student/assignments`), Messages (`/student/messages`), Profile (`/student/profile`)

---

## Design Tokens (existing, no change)

All existing Tailwind tokens in `tailwind.config.js` are used as-is:
- `brand.primary` (#068562), `brand.accent` (#C9962A)
- `forest.*` for admin dark surfaces
- `surface.*` / `ink.*` for light content areas
- `font-display` (DM Serif Display) for headings
- `font-sans` (DM Sans) for body

No new tokens needed.

---

## Out of Scope
- Public-facing pages (Home, About, Courses, Blog, Contact, FAQ, CourseDetail, BlogDetail, Enroll)
- All form pages (CourseForm, ExamForm, AssignmentForm, PostEditor, AnnouncementForm, SiteContent)
- Backend / API changes
- New features or new pages
