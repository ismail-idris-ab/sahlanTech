# About Page Redesign + Social Icons — Design Spec

**Date:** 2026-06-06
**Status:** Approved

---

## Summary

Redesign the public About page to a document-style layout (dark navy header bars + white content panels per section), with fully dynamic sections editable from the admin backend. Update social icons to use platform brand colors. Fix the `ALLOWED_KEYS` backend blocker that prevents `hero_categories` and new `about_sections` from being saved.

---

## 1. About Page Frontend (`sahlearn-web/src/pages/public/About.jsx`)

### Layout

Replace all existing sections (bio, credentials, testimonials, what-we-teach, CTA) with:

1. **Breadcrumb + page title strip** — white background, same styling as current hero strip. Shows page title from the first section or a static "About Sahlearn" fallback.

2. **Dynamic document sections** — loop over `about_sections` array fetched from backend. Each section renders as:
   - Full-width dark navy bar (`bg-[#013F4A]`) with white bold uppercase centered title, letter-spacing wide
   - White content panel directly below, inside a single bordered card (`border border-gray-200 rounded-lg overflow-hidden`)
   - Content rendered with paragraph support: split on `\n\n` for `<p>` tags, `\n` for `<br/>` within paragraphs
   - Subtle shadow on the card, margin between cards

3. **Social strip** — below the last document section. Shows "Follow us" label, then icon buttons with platform brand colors (see Social Icons section). Only renders icons where the env var URL is set.

### Default content (fallback when nothing saved)

```js
const DEFAULT_SECTIONS = [
  { title: 'Introduction', content: 'Sahlearn Technology is an educative institution...' },
  { title: 'Our Goals', content: '1. To empower you by making you self-employed...\n2. To educate people on computer and IT technologies...\n3. To make people able to solve society problems...' },
  { title: 'Our Departments', content: 'Sahlearn Technology is made up of the following departments:\n\n1. Training Department: In charge of teaching computer skills.\n2. Business Department: In charge of buying and selling.' },
]
```

### Data fetching

```js
useEffect(() => {
  getContent('about_sections')
    .then((data) => { if (Array.isArray(data) && data.length > 0) setSections(data); })
    .catch(() => {});
}, []);
```

---

## 2. Social Icons (`sahlearn-web/src/pages/public/About.jsx`)

Platform brand colors on circular buttons (40px, `rounded-full`). White icons. Hover: slight lift (`hover:-translate-y-0.5`) + shadow.

| Platform  | Background color        |
|-----------|------------------------|
| Facebook  | `#1877F2`              |
| LinkedIn  | `#0077B5`              |
| Twitter/X | `#000000`              |
| YouTube   | `#FF0000`              |
| Instagram | gradient `from #f09433 via #dc2743 to #bc1888` |
| GitHub    | `#24292e`              |

Icons only render if their corresponding `VITE_*_URL` env var is set. No change to the `SocialIcons.jsx` SVG component — only the wrapper `<a>` tag background changes in About.jsx.

Social strip placement: bottom of the page, inside a white section below the last document card. Label "Follow us on:" in small uppercase text above the icon row.

---

## 3. Backend Controller (`sahlearn-api/src/controllers/siteContent.controller.js`)

Add `'hero_categories'` and `'about_sections'` to `ALLOWED_KEYS`:

```js
const ALLOWED_KEYS = ['about', 'faq', 'testimonials', 'hero_categories', 'about_sections'];
```

This unblocks:
- The `hero_categories` key wired up in the previous session (Home page "What You'll Learn" cards)
- The new `about_sections` key for this redesign

No other backend changes needed — the existing `GET /api/content/:key` and `PUT /api/content/:key` routes handle all keys generically.

---

## 4. Admin Editor (`sahlearn-web/src/pages/admin/SiteContent.jsx`)

New **"About Sections"** tab. Component: `AboutSectionsEditor`.

### Behaviour
- Fetches `about_sections` on mount alongside existing keys
- List of items, each with:
  - **Title** — single-line text input (becomes the dark navy header bar label)
  - **Content** — multiline textarea (rendered with paragraph/line-break support on frontend)
- Controls per item: move up / move down / delete — same `ListItemCard` pattern already used for FAQ and Testimonials
- Add button at bottom: adds `{ title: '', content: '' }` item
- Save button: PUT to `about_sections`

### Tab order (updated)
`About Page` · `FAQ` · `Testimonials` · `Home Categories` · `About Sections`

### State additions
```js
const [aboutSectionsData, setAboutSectionsData] = useState(null);
```
Fetched in the same `Promise.all` as other keys.

---

## 5. Out of Scope

- The existing `about` key (instructor bio, credentials, CTA) is no longer rendered on the public About page. The admin "About Page" tab can stay in the UI for now — it just won't affect the public page until a future phase repurposes it, or it can be removed in a cleanup pass.
- No changes to `SocialIcons.jsx` SVG paths.
- No changes to any other page.

---

## Acceptance Criteria

- [ ] About page shows dynamic document sections with dark navy header bars
- [ ] Sections fall back to defaults when nothing is saved in DB
- [ ] Admin "About Sections" tab: add/rename/reorder/delete sections, save persists to DB and reflects on public page on reload
- [ ] Social icons show platform brand colors, only render when URL env var is set
- [ ] `hero_categories` PUT/GET no longer returns 404 (backend ALLOWED_KEYS fix)
- [ ] `about_sections` PUT/GET works correctly
