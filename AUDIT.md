# Kirana Konnect — Application Audit & Remediation Report

**Date:** July 2026 · **Scope:** full application (Flask backend `app.py`, 27 templates, mobile shell) ·
**Method:** static cross-reference of every frontend call vs. backend route, live endpoint
exercising against a real database, and real-browser (Chromium) drives of every key page,
including submitting forms end-to-end.

---

## 1. Purpose & verdict

Kirana Konnect is a mobile-first POS + inventory + credit-ledger app for Indian kirana
(neighbourhood grocery) stores. The UI is polished and covers the right workflows for the
audience — but before this audit, **most core shopkeeper actions silently did nothing**:
the frontend was largely a high-fidelity demo wired to a real backend for only a few flows.
The gap between "looks finished" and "is finished" was the app's central problem.

After remediation (section 3), every core shopkeeper flow now round-trips to the database
and has been verified end-to-end.

## 2. Findings (as found, before fixes)

### Critical — features that looked functional but were fake or broken

| # | Flow | What actually happened |
|---|------|------------------------|
| 1 | **Add product** (Add Item page) | `addItem()` logged to console, showed "successfully added!", redirected. **Nothing was saved.** |
| 2 | **Delete product** (Inventory) | Removed the card from the DOM only; the API call was commented out ("In a real app, this would call an API"). Product reappeared on refresh. |
| 3 | **Refill stock** (both refill pages) | Built the payload, `console.log`-ed it, showed a success popup. **No save.** |
| 4 | **Inventory list** | `renderProducts()` targeted `#inventory-items`, but the container is `#inventory-list` → the render **always threw**, so the page only ever showed hard-coded demo cards, never live data. Also both loaders read the `/api/products` response as an array when it returns `{products: [...]}`. |
| 5 | **Billing → stock** | Bills saved, but **inventory was never decremented** — stock counts were fiction after the first sale. |
| 6 | **Cart customer picker** | Called `GET /api/search-customers` and `GET /api/customer/<id>` — **neither endpoint existed** (404s), so attaching a customer to a sale was broken. |
| 7 | **Customer balances** | Every *cash* sale auto-recorded a payment that was subtracted from the balance while the (paid) bill wasn't counted → balances went **negative** after normal sales. |
| 8 | `/splash` | Linked from 3 pages, no route → 404. |

### High — correctness / robustness

- `Product.stock_quantity` was `Integer`, but weight-based goods (rice, oil) are sold in
  fractional kg/litre.
- `product_id` was captured when adding to cart but **discarded** in the cart page
  (replaced with `Date.now()+random`), severing the product↔bill link.
- No global error handlers: unknown API paths returned HTML 404s to `fetch()` callers;
  500s leaked stack traces (debug mode).
- Sales-report page JS crashed (`current-date` element doesn't exist).
- Bug fixed earlier in this branch: bill creation crashed on a nonexistent
  `include_dates` column; `outstanding_balance` property called with `()`.

### Notes — working correctly (verified)

Sales analytics (`/api/sales-data`) computes **real aggregates** from bills;
notification settings persist to a real model; notifications are DB-backed with
settings-aware creation; PDF export and receipt lookup work; the customer ledger API is real.

### Design/architecture observations (not fixed here — see roadmap)

- **No authentication**: signin/signup are static pages; every route is public. The
  deployed app is a single-tenant, unprotected instance.
- **27 standalone templates**, each embedding its own Tailwind config + CDN loads; three
  dead template variants (`inventory_clean`, `inventory_original`, `inventory_camera_fixed`,
  `bill_generate_backup`) and duplicated legacy script blocks inside `inventory.html`.
- All CSS/JS from CDNs — no offline capability for a shop with flaky connectivity.
- The bill-generate page scrapes cart items from the DOM rather than reading structured data.
- Primary color varies between template groups (`#4CAF50` vs `#2563eb` vs `#10B981`).

## 3. Remediation implemented (this branch)

**Backend (`app.py`)**
- Product APIs: `POST /api/products` (create), `GET/PUT/PATCH/DELETE /api/products/<id>`,
  `POST /api/products/<id>/refill` — with validation, rollback, and a shared serializer.
- Customer APIs: `GET /api/customer/<id>`, `GET /api/search-customers` (the
  `{customers: [...]}` shape the cart expects).
- **Billing now decrements stock** (match by `product_id`, fallback to exact name),
  clamps at zero, and triggers the low-stock notification check after commit.
- **Balance fix**: payments tied to already-paid bills are excluded, so cash sales no
  longer produce negative balances; balances floor at 0.
- `stock_quantity`/`reorder_level` are now `Float` (fractional kg/litre stock).
- `/splash` route added; global 404/500 handlers (JSON for `/api/*`, redirect for pages).

**Frontend**
- **Add Item** now actually `POST`s to `/api/products`, with validation, a disabled
  "Saving…" state, and error surfacing; redirects only on confirmed success.
- **Inventory** renders live database products (container id fixed, response shape fixed
  in both loaders) and **delete now persists**, restoring the list if the server rejects.
- **Both refill pages** persist stock additions (weight page converts g→kg first) and
  report failures honestly instead of always claiming success.
- Cart preserves `product_id` so bills can decrement exact products.
- Sales-report date crash guarded.

**Verification performed**
- Every parameterless GET route: 200/302 sweep — clean.
- API integration test: create → read → update → refill → bill (cash & credit) → stock
  decrement (50→4, low-stock flag flips) → balance math (0 → 200 → 50) → payment → delete.
- Real-browser (Chromium) drive of dashboard, inventory, cart, add-item, sales-report,
  refill, splash: **zero app-level JS errors**; Add-Item form submitted in the browser and
  the product verified present in the database and rendered in inventory.

## 4. Roadmap — status after the second remediation pass

### Implemented ✅

| Item | What was done |
|---|---|
| **Authentication (P0)** | Flask-Login with a `User` model (hashed passwords), real signup/login/logout wired into the existing signin/signup pages, a global `before_request` guard (pages redirect to signin, APIs return 401 JSON), 30-day remember-me sessions, and first-run single-shop signup (second signup blocked). Verified end-to-end in a real browser: gate redirect → signup form → authenticated dashboard. |
| **Vendored assets + unified brand (P1)** | Tailwind is now a committed static build (`static/css/tailwind.css`, built from all templates via `tailwind.config.js` with a safelist for JS-composed classes); FontAwesome, Chart.js, html2pdf and the Inter/Poppins fonts are served from `static/vendor/`. All 23 templates rewritten to local assets — **zero CDN references remain**, the app renders fully styled with no internet, and the brand palette is unified on the green scheme. |
| **Dead template cleanup (P1)** | `inventory_clean`, `inventory_original`, `inventory_camera_fixed`, `bill_generate_backup` deleted (verified unreferenced). 27 → 23 templates. |
| **Barcode lookup (P2)** | `GET /api/products?barcode=` exact-match endpoint for scanner flows. |
| **Search + pagination + indexes (P2)** | `GET /api/products?q=&page=&per_page=` (default response unchanged); indexes on `Product.name/barcode/category` (apply to newly created databases). |
| **PWA manifest (P3, partial)** | `static/manifest.json` + icons + `theme-color` linked from every page — installable via Add to Home Screen. (A service worker was deliberately not added; see below.) |

### Remaining (deliberately not done, with reasons)

| Priority | Item | Why deferred |
|---|---|---|
| P1 | Bill-generate reading cart from structured data instead of DOM scraping | The server-side name/ID fallback already decrements stock correctly; the page rewrite is invasive relative to its payoff. |
| P1 | Full shared base-template consolidation | The vendored-head rewrite already unified the `<head>` of all pages; merging 23 bodies onto one layout is a large refactor best done with visual QA on real devices. |
| P2 | Staff model + per-staff attribution | Bills already store `generated_by`; a Staff CRUD is net-new product scope, not a defect. |
| P2 | Multi-shop tenancy | The auth model is single-shop-per-instance (matches the Render deploy model). True multi-tenancy means scoping every query by shop — a schema migration project. |
| P3 | Service worker | Offline caching of authenticated pages risks stale/broken states; needs a deliberate caching strategy and device QA. Manifest-only was the safe subset. |
| P3 | Replacing all `alert()`/`confirm()` with in-app toasts | Cosmetic; touches nearly every template. |

### Deployment notes for this pass

- `requirements.txt` gains `Flask-Login`; Render installs it on next deploy.
- New `user` table is auto-created by `db.create_all()` at startup. **The deployed app will
  require signup on first visit after deploy** — the first account created owns the shop.
- Existing Postgres keeps its integer stock column and unindexed product fields (SQLAlchemy
  does not alter live tables); fresh databases get floats + indexes.
- The Android APK needs no rebuild: it loads the deployed site, which now serves login first.

## 5. Honest limitations of this audit

- Visual/styling review was limited: this environment blocks the CDNs the app styles from,
  so pages were audited functionally (real browser, JS console, DOM) but not pixel-styled.
- The weight-based product-details and receipt printing paths were exercised via API, not
  by full browser interaction.
- Deployed Postgres retains any pre-existing rows created before the balance/stock fixes;
  historical negative balances self-correct because balances are computed live.
