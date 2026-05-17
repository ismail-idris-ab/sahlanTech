# UI_UX_DESIGN_BRIEF.md — Sahlearn

**Project:** Sahlearn (Web App MVP)
**Scope:** Visual + interaction design for the responsive web app
**Note:** Mobile-app-specific design notes are in `MOBILE_ROADMAP.md`.

---

## 1. Design Goals

1. **Trustworthy** — looks like a real institution, not a side hustle.
2. **Clear** — visitors understand what Sahlearn does within 5 seconds.
3. **Frictionless** — enrolling takes ≤ 3 clicks from anywhere on the site.
4. **Educational tone** — calm, focused, no aggressive marketing.
5. **Responsive** — beautiful on every device width.
6. **Brand-consistent** — colors, type, and tone identical across all pages.

---

## 2. Brand Personality

| Trait | Manifestation |
|---|---|
| Approachable | Warm primary color, rounded corners, friendly headlines |
| Confident | Strong contrast, decisive CTAs, no excessive disclaimers |
| Modern | Clean grids, generous whitespace, no skeuomorphism |
| Educational | Clarity over cleverness, real photography over stock illustrations |
| Local-aware | Currency in ₦, phone in +234 format, WhatsApp-first contact |

The brand name **Sahlearn** reads as "easy to learn." Lowercase wordmark (`sahlearn.`) feels modern; the period is optional but works as a brand signature.

---

## 3. Visual Direction

- Inspired by: Frontend Masters (clean educational), Skillshare (warm photography), Paystack (Nigerian polish).
- Avoid: bootcamp-y neons, generic Bootstrap looks, dated card shadows.
- Photography over illustration where possible. If illustration: line-art / undraw style, single accent color.

---

## 4. Recommended Color Palette

### Primary tokens

| Token | Hex | Use |
|---|---|---|
| `brand-primary` | `#1E5AA8` | Primary buttons, links, brand accents |
| `brand-primary-dark` | `#163F75` | Hover states |
| `brand-accent` | `#F5B400` | Highlights, "Featured" badges (sparingly) |
| `brand-success` | `#10B981` | Success toasts, "Enrolled" status |
| `brand-warning` | `#F59E0B` | "Draft" badges, "Pending" status |
| `brand-danger` | `#EF4444` | Delete buttons, error states |

### Neutrals

| Token | Hex | Use |
|---|---|---|
| `ink-900` | `#0F172A` | Body text, headings |
| `ink-700` | `#334155` | Secondary text |
| `ink-500` | `#64748B` | Captions, meta |
| `ink-300` | `#CBD5E1` | Borders |
| `surface-100` | `#F8FAFC` | Page background |
| `surface-white` | `#FFFFFF` | Cards, modals |

### Admin sidebar

| Token | Hex | Use |
|---|---|---|
| `sidebar-bg` | `#0B1220` | Dark sidebar background |
| `sidebar-text` | `#E2E8F0` | Sidebar text |
| `sidebar-active` | `#F5B400` | Active link accent (gold) |

> Tailwind config: extend `theme.colors` with these as `brand`, `ink`, `surface`, `sidebar` namespaces.

---

## 5. Typography

- Headings: **Plus Jakarta Sans** or **Inter** (variable weight)
- Body: **Inter**
- Code (blog snippets): **JetBrains Mono**

Font sizes (Tailwind scale):
- H1: `text-4xl md:text-5xl lg:text-6xl` (semibold/bold)
- H2: `text-3xl md:text-4xl`
- H3: `text-xl md:text-2xl`
- Body: `text-base` (16px)
- Small / meta: `text-sm` / `text-xs`

Line height: `leading-relaxed` for body, `leading-tight` for headings. Slight negative tracking on headings (`tracking-tight`).

---

## 6. Layout Style

- Max content width: `max-w-7xl` (1280px) centered.
- Generous vertical rhythm: section padding `py-16 md:py-24`.
- Grid for course / blog listings: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`.
- Admin layout: fixed sidebar (`w-64`), main content `flex-1 p-6 md:p-8`.

---

## 7. Spacing and Component Style

- Border radius: `rounded-xl` (12px) for cards, `rounded-lg` (8px) for buttons/inputs, `rounded-full` for chips/avatars.
- Shadows: `shadow-sm` on default cards, `shadow-md` on hover.
- Borders: `border border-ink-300` for inputs.
- Transitions: `transition-colors` on hovers, `transition-all` on cards.

---

## 8. Mobile-First Design Rules

- Design every layout starting from 375px width, then expand.
- Tap targets ≥ 44×44px.
- Single column on mobile, multi-column on tablet+.
- Sticky CTAs on long pages for conversion (course detail enroll button).
- Never rely on hover for critical info — must be visible by default for touch users.
- Hamburger menu in navbar below `md` breakpoint.
- WhatsApp FAB stays in bottom-right at all widths.

---

## 9. Public Website Design Requirements

- Top navbar sticky with subtle shadow on scroll.
- Hero on homepage uses real teacher imagery + clear value prop + 2 CTAs.
- All public pages have WhatsApp floating action button (bottom-right).
- Footer with: short brand statement, quick links, contact info, social handles, copyright.

---

## 10. Admin Dashboard Design Requirements

- Dark sidebar + light main content.
- Gold accent on active nav item.
- Cards for dashboard stats with icon + number + label.
- Tables: clean, sortable, row hover. On mobile breakpoint: stack as cards.
- All destructive actions confirmed via modal.
- Toasts (react-hot-toast) for transient feedback.

---

## 11. Homepage Sections

1. **Sticky Navbar** — logo · Home · About · Courses · Blog · Contact · "Enroll Now" button (primary)
2. **Hero** — Headline ("Practical digital skills, taught simply.") · sub-headline · 2 CTAs (Explore Courses · Talk on WhatsApp) · hero image
3. **Featured Courses** — heading "Popular Courses" + 3–6 cards (grid)
4. **About Teaser** — image + 2 paragraphs + "Read more" link
5. **Why Choose Sahlearn** — 4-icon row: Practical projects · Flexible learning · Trusted teacher · WhatsApp support
6. **Latest from Blog** — 3 cards
7. **CTA Banner** — full-width band: "Ready to learn?" + "Enroll Now" button
8. **Footer**

---

## 12. About Page Layout

- Hero strip with page title + breadcrumb
- Two-column: teacher photo + bio
- Credentials grid (icons)
- "What I teach" section linking to Courses
- CTA at bottom: contact

---

## 13. Courses Page Layout

- Page header + short intro
- Filter row: search input · category chips · level dropdown
- Grid of CourseCards `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Pagination at bottom (or "Load more")

---

## 14. Course Details Page Layout

- Breadcrumb (Home · Courses · `<Title>`)
- Two columns at `lg+`:
  - Left (`lg:col-span-2`): cover image · title · level/duration badges · description · what you'll learn · prerequisites
  - Right (`lg:col-span-1`, sticky): card with price, primary "Enroll Now" button, secondary "WhatsApp" button, course meta
- Below: Related courses

On mobile: single column, cover at top, sticky bottom bar with Enroll + WhatsApp buttons.

---

## 15. Blog Page Layout

- Page header
- Optional featured post hero (1 big card)
- Grid of cards (3-col on desktop, 2 on tablet, 1 on mobile)
- Sidebar (right, optional): categories, popular posts, newsletter (future)
- Pagination

---

## 16. Blog Detail Page Layout

- Breadcrumb
- Article hero: title (large), meta (date · author · read time), category tag, cover image
- Article content (`max-w-3xl` centered for readability)
- Share buttons (sticky on left at desktop, inline on mobile)
- Author card at bottom
- Related posts (3 cards)
- CTA: "Want to learn this hands-on? Browse our courses"

---

## 17. Contact Page Layout

- Two-column: left = info (WhatsApp button · email · phone · address), right = form
- On mobile: single column (info on top, form below)
- Toast on success
- Inline error states on invalid fields

---

## 18. Enrollment Page Layout

- Centered card (`max-w-2xl`)
- If course pre-selected: course summary card at top (image + title + price)
- Form fields stacked
- Primary "Submit Enrollment" button
- Success state: replaces form with green checkmark + message + WhatsApp button

---

## 19. Admin Login Page Layout

- Full-height centered card on neutral background
- Sahlearn logo at top
- "Admin Login" heading
- Email input · password input · "Sign in" button (full width)
- No public-facing link to this page from main nav

---

## 20. Admin Dashboard Layout

- Sidebar: logo header · nav links · logout at bottom
- Top bar: page title · admin name · avatar
- Main: 4 stat cards in a row, then recent activity
- Stat card: icon (left, in a soft tinted circle), number (large), label, delta (small, optional)
- On smaller widths the sidebar collapses to icons only or to an overlay drawer.

---

## 21. Course Management UI

- Table view by default
- Columns: Title · Category · Level · Status badge · Updated · Actions
- Action buttons inline: pencil (edit), trash (delete), eye (toggle publish)
- Filter row at top: search · status chip filter
- "+ New Course" button top-right (primary)

Form layout (create/edit):
- Two columns on desktop: main fields left, sidebar with image upload + publish toggles right
- Mobile fallback: single column

---

## 22. Blog Editor UI

- Top toolbar: Title input (large, borderless) · slug field (smaller, faded) · status pill
- Main editor area: rich text (react-quill / tiptap) with toolbar (bold, italic, list, link, image, heading)
- Sidebar (right):
  - Cover image upload
  - Category select
  - Tags chip input
  - SEO title (with character count)
  - SEO description (with character count)
  - Featured toggle
- Sticky top-right buttons: "Save Draft" / "Publish" (or "Save Changes" / "Unpublish")

---

## 23. Messages UI

- Table or card list (cards on smaller widths)
- Each row: avatar (initials) · name · subject · preview · date · status pill · action menu
- Filter chips: All / New / Read / Replied
- Click row → side drawer or modal with full details + actions

---

## 24. Enrollment Management UI

- Same pattern as Messages
- Each row: name · course · phone · mode · date · status select
- Status select is inline: dropdown with colored options
- Click row → modal with all details + notes + WhatsApp button + delete

---

## 25. Empty States

Each empty state has:
- Small illustration or `lucide-react` icon in a soft tinted circle
- Heading (`"No courses yet"`)
- Sub-text (`"Add your first course to get started."`)
- Primary CTA (`"+ New Course"`)

---

## 26. Loading States

- **Inline loading**: spinner inside button (button disabled, text replaced with spinner + "Saving...").
- **Page loading**: skeleton placeholders for cards (preferred) or a full-page spinner (acceptable for MVP).

---

## 27. Error States

- **Inline form errors**: red text below the input + red border.
- **Page-level error**: centered card with icon + message + retry button.
- **Toast**: short non-blocking errors for background actions.

---

## 28. CTA Button Style

Primary:
- `bg-brand-primary text-white font-medium px-5 py-3 rounded-lg hover:bg-brand-primary-dark transition`

Secondary:
- `border border-ink-300 text-ink-900 bg-white hover:bg-surface-100`

Ghost / text:
- `text-brand-primary hover:underline`

Danger:
- `bg-brand-danger text-white hover:bg-red-700`

Sizes: `sm` (px-3 py-1.5 text-sm), `md` (px-5 py-3), `lg` (px-6 py-4 text-lg, full-width on mobile).

---

## 29. Card Design

Course card:
- White surface, `rounded-xl`, `shadow-sm`, hover lift
- Cover image (16:9), category badge top-left, level badge top-right
- Title (`text-lg font-semibold`), excerpt (clamp 2 lines), duration + price footer

Blog card:
- Same chassis
- Category pill (small, top), title, excerpt (clamp 3 lines), date + read time footer

Dashboard stat card:
- White, rounded, with a colored soft icon circle on left, number + label on right, optional delta below

---

## 30. Form Design

- Label above input (never placeholder-as-label).
- Input: `border border-ink-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary`.
- Help text small grey below input.
- Errors red below input.
- Group related fields in `space-y-4`.
- Submit button full-width on mobile, content-width on desktop.

---

## 31. Navigation Design

- Sticky navbar with logo left, links center, primary CTA right.
- Mobile menu: hamburger → slide-in drawer with the same links.
- Admin sidebar: dark, with icon + label per link.

---

## 32. Footer Design

- Background `bg-ink-900`, text `text-surface-100`
- 4 columns on desktop: Brand · Quick Links · Courses · Contact
- Social icons row
- Bottom: copyright + small print + admin login link (subtle)
- Stacks on mobile

---

## 33. Accessibility Rules

- Color contrast meets WCAG 2.1 AA (text 4.5:1 minimum).
- All form inputs have labels (`htmlFor`).
- Buttons have accessible names (no icon-only without `aria-label`).
- Focus rings visible (`focus-visible:ring-2`).
- Touch targets ≥ 44×44.
- Heading hierarchy correct (one `<h1>` per page).
- Images have meaningful `alt` text.

---

## 34. Responsive Design Rules

Breakpoints (Tailwind defaults):
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

Rules:
- Design mobile-first, layer up.
- No horizontal scroll on any width.
- Test at 320px, 768px, 1280px, 1920px.
- Hide non-essential decoration on mobile (`hidden md:block`).
- Stack columns on mobile (`flex-col md:flex-row`).

---

## 35. Tailwind Implementation Notes

In `tailwind.config.js`:

```js
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { primary: '#1E5AA8', primaryDark: '#163F75', accent: '#F5B400' },
        ink:   { 900: '#0F172A', 700: '#334155', 500: '#64748B', 300: '#CBD5E1' },
        surface: { 100: '#F8FAFC', white: '#FFFFFF' },
        sidebar: { bg: '#0B1220', text: '#E2E8F0', active: '#F5B400' },
      },
      borderRadius: { xl: '12px' },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

Load fonts via `<link>` in `index.html` from Google Fonts or self-host.

---

## 36. Components to Build

Layout / common:
- `Navbar` / `Footer` / `AdminLayout` / `ProtectedRoute` / `WhatsAppFAB`
- `Button` / `Input` / `Textarea` / `Select` / `Checkbox` / `Toggle`
- `LoadingSpinner` / `Skeleton` / `EmptyState` / `ErrorMessage`
- `Modal` / `Drawer` / Toaster (via react-hot-toast)

Domain:
- `CourseCard` / `CourseFilters`
- `BlogCard` / `BlogPagination`
- `DashboardCard` (admin stat card)
- `ImageUploader` (admin)
- `BlogEditor` wrapper around react-quill

---

**End of UI/UX Design Brief.**
