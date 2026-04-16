# Portal Akademik — HTML/CSS/JS Template

---

## Directory Structure

```
boilerplate/
│
├── index.html              Login page (entry point)
├── signup.html             New-account registration form
├── lobby.html              Post-registration waiting screen
│                           (append ?status=rejected for the rejected variant)
├── forgot-password.html    Password-reset request form
├── dashboard.html          Dashboard shell with sidebar + all role views
│
├── css/
│   ├── tokens.css          Design tokens (colors, fonts), CSS reset, shared utilities
│   ├── auth.css            Auth-page styles (background, card, fields, buttons)
│   ├── dashboard.css       Sidebar, topbar, nav items, main content area
│   └── components.css      Stat cards, data table, badges, modals, upload zone, pagination
│
├── js/
│   ├── auth.js             Demo user store, login/signup/forgot handlers, session helpers
│   └── dashboard.js        Sidebar builder, view switching, modals, table filter
│
├── Logo UPH.png            Logo used in auth layouts and sidebar
└── README.md
```

---

## Pages

| File | Route equivalent | Purpose |
|---|---|---|
| `index.html` | `/` | Login form; redirects to dashboard on success |
| `signup.html` | `/signup` | Registration; redirects to `lobby.html` on submit |
| `lobby.html` | `/lobby` | Pending-approval holding page; `?status=rejected` shows rejection variant |
| `forgot-password.html` | `/forgot-password` | Email-based reset request |
| `dashboard.html` | `/dashboard/*` | Full dashboard with role-specific sidebar and tab views |

---

## CSS Architecture

Each stylesheet has a single responsibility and is imported only by the pages that need it.

| File | Imported by |
|---|---|
| `tokens.css` | All pages |
| `auth.css` | `index.html`, `signup.html`, `lobby.html`, `forgot-password.html` |
| `dashboard.css` | `dashboard.html` |
| `components.css` | `dashboard.html` |

### Design Tokens (defined in `tokens.css`)

| Token | Value | Usage |
|---|---|---|
| `--blue` | `#1a2a4a` | Primary brand, headings, sidebar, field focus |
| `--red` | `#b40a1e` | CTA buttons, accent bar, active nav item |
| `--gray-bg` | `#f7f9fc` | Page background, input background |
| `--border` | `#dde3ef` | Input borders, card dividers |
| `--sidebar-w` | `256px` | Sidebar width (used as `margin-left` on main content) |

Fonts are loaded via Google Fonts:
- **Playfair Display** (700) — headings, logo, stat numbers
- **Source Sans 3** (400, 600, 700) — body, labels, buttons

Icons are provided by [Lucide](https://lucide.dev) via CDN (`unpkg.com/lucide@latest`),
the same icon set used in the Next.js project. Use `<i data-lucide="icon-name"></i>` and
call `lucide.createIcons()` after the DOM is ready.

---

## JavaScript

### `js/auth.js`

Handles all authentication-related logic.

**Exports / globals:**

| Symbol | Type | Description |
|---|---|---|
| `USERS` | Array | In-memory demo user store — replace with API calls |
| `saveSession(user)` | Function | Writes user to `sessionStorage` |
| `getSession()` | Function | Reads current session; returns `null` if not logged in |
| `clearSession()` | Function | Removes session (used by logout) |
| `handleLogin(event)` | Function | Form submit handler for `index.html` |
| `handleSignup(event)` | Function | Form submit handler for `signup.html` |
| `handleForgot(event)` | Function | Form submit handler for `forgot-password.html` |
| `fillLogin(email, pass)` | Function | Demo quick-fill helper |
| `requireAuth()` | Function | Redirects to `index.html` if no session exists |

### `js/dashboard.js`

Handles sidebar rendering, tab navigation, modals, and table search.

**Exports / globals:**

| Symbol | Type | Description |
|---|---|---|
| `NAV_CONFIG` | Object | Maps each role to its pill label, CSS class, and nav items |
| `buildSidebar(session)` | Function | Populates role pill, user info, and nav buttons |
| `showView(viewId)` | Function | Shows a `dash-view` section; updates active nav state |
| `handleLogout()` | Function | Clears session and redirects to login |
| `toggleSidebar()` | Function | Opens/closes sidebar on mobile |
| `closeSidebar()` | Function | Closes sidebar (called on view change and overlay click) |
| `openModal(id)` | Function | Removes `.hidden` from a modal overlay |
| `closeModal(id)` | Function | Adds `.hidden` to a modal overlay |
| `filterTable(input, tableId)` | Function | Live search filter for a `<table>` |
| `triggerFileInput(inputId)` | Function | Programmatically triggers a file `<input>` |

---

## Authentication Flow (demo)

Session is stored in **`sessionStorage`** (cleared when the tab closes).

```
index.html  →  handleLogin()  →  match USERS[]  →  saveSession()  →  dashboard.html
signup.html →  handleSignup() →  (success)       →  lobby.html
lobby.html  →  (back link)    →  index.html
```

`dashboard.js` calls `requireAuth()` on `DOMContentLoaded`. If no session is found the
user is immediately redirected to `index.html`.

Demo accounts (defined in `js/auth.js` → `USERS`):

| Email | Password | Role |
|---|---|---|
| admin@test.com | admin123 | ADMIN |
| kaprodi@test.com | kaprodi123 | KAPRODI |
| koordinator@test.com | koordinator123 | KOORDINATOR |
| dosen@test.com | dosen123 | DOSEN |

---

## Dashboard Roles and Views

The sidebar is built dynamically from `NAV_CONFIG` in `dashboard.js` based on the logged-in
user's role. Each role sees a different set of nav items that show/hide tab views inside
`dashboard.html`.

| Role | Nav items | Available views |
|---|---|---|
| ADMIN | Dashboard, Kelola Dokumen, Kelola Pengguna, Pengaturan | overview, documents, users, settings |
| KAPRODI | Dashboard, Review Dokumen, Permintaan, Pengaturan | overview, documents, requests, settings |
| KOORDINATOR | Dashboard, Kelola Dokumen, Pengaturan | overview, documents, settings |
| DOSEN | Dashboard, Dokumen Saya, Pengaturan | overview, documents, settings |

To add a new view:
1. Add a `<section class="dash-view" id="view-yourview">` block in `dashboard.html`.
2. Add a nav item entry to the relevant role(s) in `NAV_CONFIG` in `dashboard.js`.

---

## Customisation Checklist

- [ ] Replace `Logo UPH.png` with your organisation's logo (same filename, or update `src` in all HTML files).
- [ ] Update the institution name (`Your Organization`) in the copyright line of each auth page.
- [ ] Update page `<title>` tags with your application name.
- [ ] Replace `--blue` and `--red` in `css/tokens.css` with your brand colours.
- [ ] Replace `USERS[]` in `js/auth.js` with real API calls (`fetch`/`axios`).
- [ ] Replace `sessionStorage` session helpers with HTTP-only cookie auth when connecting to a backend.
- [ ] Remove the demo-accounts hint block from `index.html` before deploying.
- [ ] Populate tables with real data fetched from your API.
