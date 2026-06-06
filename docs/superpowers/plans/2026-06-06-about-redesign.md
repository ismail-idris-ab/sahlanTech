# About Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the public About page to a document-style layout (dark navy header bars + white content panels), add dynamic sections editable from admin, fix platform brand-color social icons, and unblock the `hero_categories` + `about_sections` backend keys.

**Architecture:** Three targeted file edits — backend controller (1-line ALLOWED_KEYS fix), frontend About page (full replacement with document layout), admin SiteContent page (new AboutSectionsEditor tab). No new files, no new routes, no schema changes.

**Tech Stack:** React 18 + Vite, Tailwind CSS, Express.js, MongoDB/Mongoose, existing `SiteContent` model + routes.

---

## File Map

| Action | File | Change |
|--------|------|--------|
| Modify | `sahlearn-api/src/controllers/siteContent.controller.js` | Add `'hero_categories'` and `'about_sections'` to `ALLOWED_KEYS` |
| Modify | `sahlearn-web/src/pages/public/About.jsx` | Full replacement — document-style layout, dynamic sections, brand-color socials |
| Modify | `sahlearn-web/src/pages/admin/SiteContent.jsx` | Add `AboutSectionsEditor` component + tab + state wiring |

---

## Task 1: Fix Backend ALLOWED_KEYS

**Files:**
- Modify: `sahlearn-api/src/controllers/siteContent.controller.js:4`

- [ ] **Step 1.1 — Open and verify current state**

  Read `sahlearn-api/src/controllers/siteContent.controller.js`. Confirm line 4 reads:
  ```js
  const ALLOWED_KEYS = ['about', 'faq', 'testimonials'];
  ```

- [ ] **Step 1.2 — Add the two new keys**

  Replace that line with:
  ```js
  const ALLOWED_KEYS = ['about', 'faq', 'testimonials', 'hero_categories', 'about_sections'];
  ```

- [ ] **Step 1.3 — Verify with curl**

  With the API running (`node src/server.js` or `npm run dev` in `sahlearn-api`):
  ```bash
  curl http://localhost:5000/api/content/hero_categories
  ```
  Expected: `{"status":"success","data":{}}` (or existing data — not a 404).

  ```bash
  curl http://localhost:5000/api/content/about_sections
  ```
  Expected: `{"status":"success","data":{}}` — not a 404.

- [ ] **Step 1.4 — Commit**

  ```bash
  git add sahlearn-api/src/controllers/siteContent.controller.js
  git commit -m "fix(api): add hero_categories and about_sections to SiteContent ALLOWED_KEYS"
  ```

---

## Task 2: Redesign About.jsx

**Files:**
- Modify: `sahlearn-web/src/pages/public/About.jsx` (full replacement)

- [ ] **Step 2.1 — Replace the entire file**

  Write `sahlearn-web/src/pages/public/About.jsx` with:

  ```jsx
  import { useEffect, useState } from 'react';
  import { Link } from 'react-router-dom';
  import {
    FacebookIcon,
    LinkedinIcon,
    TwitterXIcon,
    YoutubeIcon,
    InstagramIcon,
    GithubIcon,
  } from '../../components/common/SocialIcons';
  import SEO from '../../components/common/SEO';
  import { getContent } from '../../services/siteContent.service';

  const WA_NUM = import.meta.env.VITE_WHATSAPP_NUMBER;

  const SOCIALS = [
    { icon: FacebookIcon, href: import.meta.env.VITE_FACEBOOK_URL, label: 'Facebook', bg: '#1877F2' },
    { icon: LinkedinIcon, href: import.meta.env.VITE_LINKEDIN_URL, label: 'LinkedIn', bg: '#0077B5' },
    { icon: TwitterXIcon, href: import.meta.env.VITE_TWITTER_URL, label: 'X (Twitter)', bg: '#000000' },
    { icon: YoutubeIcon, href: import.meta.env.VITE_YOUTUBE_URL, label: 'YouTube', bg: '#FF0000' },
    { icon: InstagramIcon, href: import.meta.env.VITE_INSTAGRAM_URL, label: 'Instagram', bg: 'instagram' },
    { icon: GithubIcon, href: import.meta.env.VITE_GITHUB_URL, label: 'GitHub', bg: '#24292e' },
  ];

  const DEFAULT_SECTIONS = [
    {
      title: 'Introduction',
      content: 'Sahlearn Technology is an educative institution that is officially established on 22nd August 2012 by its CEO Aliyu Saleh Muhammad Ajajah. It is currently located inside Tilden Fulani central primary school, Tilde, Toro LGA Bauchi State.',
    },
    {
      title: 'Our Goals',
      content: 'Sahlearn Technology is established to achieve the following goals;\n1. To empower you by making you self employed and self-reliance with best skills and attitude.\n2. To educate people on computer and it technologies using the simplest and fastest method.\n3. To make people able to solve the society problems by applying their thought knowledge, think critically and act smartly.\n\nWith these, we make our motto to "Set to benefit humanity" and make our theme to "impossible is what we do best"',
    },
    {
      title: 'Our Departments',
      content: 'Sahlearn Technology is made up of the following important departments:\n\n1. Training department: This department is in charge of teaching the computer skills and knowledge for the interested students.\n\n2. Business department: This department is in charge of buying and selling of computer related items and accessories.',
    },
  ];

  function renderContent(text) {
    return (text || '').split(/\n\n+/).map((para, i) => (
      <p key={i} className="text-ink-700 leading-relaxed">
        {para.split('\n').map((line, j, arr) => (
          <span key={j}>
            {line}
            {j < arr.length - 1 && <br />}
          </span>
        ))}
      </p>
    ));
  }

  function socialBg(bg) {
    if (bg === 'instagram') {
      return 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)';
    }
    return bg;
  }

  export default function About() {
    const [sections, setSections] = useState(DEFAULT_SECTIONS);

    useEffect(() => {
      getContent('about_sections')
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) setSections(data);
        })
        .catch(() => {});
    }, []);

    const visibleSocials = SOCIALS.filter((s) => s.href);

    return (
      <>
        <SEO
          title="About"
          description="Learn about Sahlearn — our mission, our instructor, and the digital skills we teach across Nigeria."
          url="/about"
        />

        {/* Breadcrumb + page title */}
        <section className="bg-white border-b border-ink-300/30 py-10 md:py-14">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="text-sm text-ink-500 mb-3">
              <Link to="/" className="hover:text-brand-primary">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-ink-900">About</span>
            </nav>
            <h1 className="text-3xl md:text-4xl font-bold text-ink-900 font-display">
              About Sahlearn
            </h1>
          </div>
        </section>

        {/* Document sections */}
        <section className="py-10 md:py-14">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            {sections.map((sec, i) => (
              <div key={i} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <div className="bg-[#013F4A] px-6 py-4 text-center">
                  <span className="text-white font-bold tracking-widest uppercase text-sm">
                    {sec.title}
                  </span>
                </div>
                <div className="bg-white px-6 py-5 space-y-3 border-t border-gray-200">
                  {renderContent(sec.content)}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Social strip */}
        {visibleSocials.length > 0 && (
          <section className="py-10 border-t border-ink-300/30">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <p className="text-xs font-semibold text-ink-500 uppercase tracking-widest mb-4">
                Follow us on:
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                {visibleSocials.map(({ icon: Icon, href, label, bg }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
                    style={{ background: socialBg(bg) }}
                  >
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}
      </>
    );
  }
  ```

- [ ] **Step 2.2 — Verify in browser**

  Run `npm run dev` in `sahlearn-web`, open `http://localhost:5173/about`.

  Check:
  - Three dark navy header bars visible: INTRODUCTION, OUR GOALS, OUR DEPARTMENTS
  - White content panels below each with correct text
  - No old sections (bio cards, credential grid, testimonials, CTA banner) present
  - Social icons section only shows if env vars are set; icons are coloured circles not grey outlines

- [ ] **Step 2.3 — Commit**

  ```bash
  git add sahlearn-web/src/pages/public/About.jsx
  git commit -m "feat(web): redesign About page to document-style layout with dynamic sections"
  ```

---

## Task 3: Add AboutSectionsEditor to Admin

**Files:**
- Modify: `sahlearn-web/src/pages/admin/SiteContent.jsx`

- [ ] **Step 3.1 — Add the `AboutSectionsEditor` component**

  In `sahlearn-web/src/pages/admin/SiteContent.jsx`, add this component directly before the `// ─── Main page ───` comment (after the existing `CategoriesEditor` component):

  ```jsx
  // ─── About sections editor ────────────────────────────────────────────────────

  function AboutSectionsEditor({ initial, onSave, saving }) {
    const [items, setItems] = useState(initial && initial.length > 0 ? initial : []);

    useEffect(() => { setItems(initial && initial.length > 0 ? initial : []); }, [initial]);

    const add = () => setItems((prev) => [...prev, { title: '', content: '' }]);
    const update = (i, field, value) =>
      setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));
    const remove = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));
    const move = (i, dir) => {
      const next = [...items];
      const swap = i + dir;
      if (swap < 0 || swap >= next.length) return;
      [next[i], next[swap]] = [next[swap], next[i]];
      setItems(next);
    };

    const inputCls = 'w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary';

    return (
      <form onSubmit={(e) => { e.preventDefault(); onSave(items); }} className="space-y-4">
        <p className="text-xs text-ink-500 bg-surface-50 border border-surface-200 rounded-xl px-4 py-3">
          Each section shows as a dark navy header bar + content panel on the public About page. Order controls display order. Leave empty to show built-in defaults.
        </p>

        {items.length === 0 && (
          <div className="text-center py-12 text-ink-400 text-sm bg-white rounded-2xl border border-surface-200">
            No sections yet. Add one below — or leave empty to use the built-in defaults.
          </div>
        )}

        {items.map((item, i) => (
          <ListItemCard key={i} index={i} total={items.length} label="Section"
            onMoveUp={() => move(i, -1)} onMoveDown={() => move(i, 1)} onRemove={() => remove(i)}>
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1">
                Section Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={item.title}
                onChange={(e) => update(i, 'title', e.target.value)}
                placeholder="e.g. Introduction, Our Goals, Our Departments"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1">Content</label>
              <textarea
                value={item.content}
                onChange={(e) => update(i, 'content', e.target.value)}
                rows={5}
                placeholder="Write the section content here. Use a blank line to separate paragraphs."
                className={`${inputCls} resize-none`}
              />
              <p className="text-[10px] text-ink-400 mt-1">
                Blank line = new paragraph. Single line break = line break within paragraph.
              </p>
            </div>
          </ListItemCard>
        ))}

        <AddButton onClick={add} label="Add section" />
        <SaveButton saving={saving} label="Save About Sections" />
      </form>
    );
  }
  ```

- [ ] **Step 3.2 — Add tab to `TABS` array**

  Find the `TABS` constant in `SiteContent.jsx`:
  ```js
  const TABS = [
    { key: 'about', label: 'About Page' },
    { key: 'faq', label: 'FAQ' },
    { key: 'testimonials', label: 'Testimonials' },
    { key: 'hero_categories', label: 'Home Categories' },
  ];
  ```

  Replace with:
  ```js
  const TABS = [
    { key: 'about', label: 'About Page' },
    { key: 'faq', label: 'FAQ' },
    { key: 'testimonials', label: 'Testimonials' },
    { key: 'hero_categories', label: 'Home Categories' },
    { key: 'about_sections', label: 'About Sections' },
  ];
  ```

- [ ] **Step 3.3 — Add state variable**

  Find the state block in `export default function SiteContent()`:
  ```js
  const [categoriesData, setCategoriesData] = useState(null);
  ```

  Add immediately after:
  ```js
  const [aboutSectionsData, setAboutSectionsData] = useState(null);
  ```

- [ ] **Step 3.4 — Add to the `Promise.all` fetch**

  Find the `Promise.all` call:
  ```js
  Promise.all([
    getContent('about'),
    getContent('faq'),
    getContent('testimonials'),
    getContent('hero_categories'),
  ])
    .then(([about, faq, testimonials, categories]) => {
      setAboutData(about || {});
      setFaqData(Array.isArray(faq) ? faq : []);
      setTestimonialsData(Array.isArray(testimonials) ? testimonials : []);
      setCategoriesData(Array.isArray(categories) ? categories : []);
    })
    .catch(() => {
      setAboutData({});
      setFaqData([]);
      setTestimonialsData([]);
      setCategoriesData([]);
    })
  ```

  Replace with:
  ```js
  Promise.all([
    getContent('about'),
    getContent('faq'),
    getContent('testimonials'),
    getContent('hero_categories'),
    getContent('about_sections'),
  ])
    .then(([about, faq, testimonials, categories, aboutSections]) => {
      setAboutData(about || {});
      setFaqData(Array.isArray(faq) ? faq : []);
      setTestimonialsData(Array.isArray(testimonials) ? testimonials : []);
      setCategoriesData(Array.isArray(categories) ? categories : []);
      setAboutSectionsData(Array.isArray(aboutSections) ? aboutSections : []);
    })
    .catch(() => {
      setAboutData({});
      setFaqData([]);
      setTestimonialsData([]);
      setCategoriesData([]);
      setAboutSectionsData([]);
    })
  ```

- [ ] **Step 3.5 — Add tab render**

  Find the last tab render block:
  ```jsx
  {tab === 'hero_categories' && (
    <CategoriesEditor initial={categoriesData} onSave={(d) => save('hero_categories', d, setCategoriesData)} saving={saving} />
  )}
  ```

  Add immediately after it:
  ```jsx
  {tab === 'about_sections' && (
    <AboutSectionsEditor initial={aboutSectionsData} onSave={(d) => save('about_sections', d, setAboutSectionsData)} saving={saving} />
  )}
  ```

- [ ] **Step 3.6 — Verify in browser**

  Open admin dashboard → Site Content → "About Sections" tab.

  Check:
  - Tab appears and renders the empty-state message
  - Clicking "Add section" adds a row with Title input + Content textarea
  - Fill in a title ("Introduction") and content, click "Save About Sections"
  - No error toast — success toast appears
  - Reload `/about` on the public site — the saved section replaces the default

- [ ] **Step 3.7 — Test add / reorder / delete**

  - Add 3 sections, save, verify all 3 appear on `/about` in correct order
  - Move middle section up, save, verify order changed on `/about`
  - Delete a section, save, verify it's gone from `/about`
  - Delete ALL sections, save — verify `/about` falls back to the 3 built-in defaults

- [ ] **Step 3.8 — Commit**

  ```bash
  git add sahlearn-web/src/pages/admin/SiteContent.jsx
  git commit -m "feat(admin): add About Sections editor tab to SiteContent page"
  ```

---

## Acceptance Criteria Checklist

- [ ] `GET /api/content/hero_categories` returns 200 (not 404)
- [ ] `GET /api/content/about_sections` returns 200 (not 404)
- [ ] `/about` shows dark navy header bars with white uppercase section titles
- [ ] `/about` shows white content panels below each section
- [ ] `/about` falls back to 3 built-in default sections when DB has no `about_sections` data
- [ ] Social icons (where env var URLs set) show platform brand colors as circle backgrounds
- [ ] Admin "About Sections" tab: add / rename / reorder / delete sections
- [ ] Saving in admin reflects on `/about` after page reload
- [ ] Saving empty sections list causes `/about` to show built-in defaults
