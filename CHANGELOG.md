# GlobeTrotter Changelog

All notable changes to this project are documented here, organized by build phase.
See [`GLOBETROTTER_BUILD_PLAN.md`](GLOBETROTTER_BUILD_PLAN.md) for the full 7-phase roadmap.

---

## Phase 1 — Foundation: Data Model, Auth & API Contracts

**Goal:** Stable schema, working authentication, and a written API contract that later phases can build against without waiting on live implementations.

**Branch:** `phase-1-auth`

### Database & migrations

- Added Alembic migration [`backend/alembic/versions/652dc7509b3d_initial_schema.py`](backend/alembic/versions/652dc7509b3d_initial_schema.py) creating all core tables:
  - `users` — account identity, profile fields, admin flag
  - `trips` — trip container (name, dates, description, cover, visibility, budget cap)
  - `cities` — destination catalog metadata (cost index, popularity, image)
  - `activities` — per-city experiences (category, cost, duration, description)
  - `stops` — ordered cities within a trip (dates, `order_index`)
  - `trip_activities` — scheduled activities on a stop (date, time, cost override)
  - `trip_shares` — public share slugs (schema only; handlers stubbed)
- Indexed foreign keys on `user_id`, `trip_id`, `city_id`, and `email`.

### User model & auth API

- Extended `User` with signup/profile fields: `first_name`, `last_name`, `phone`, `city`, `country`, `bio`, `photo`, `language_pref`, `is_admin`.
- Implemented JWT authentication (bcrypt password hashing, Bearer token):
  - `POST /api/v1/auth/signup` — creates user, returns access token; duplicate email → **409**
  - `POST /api/v1/auth/login` — returns access token; bad credentials → **401**
  - `POST /api/v1/auth/forgot-password` — always **200** with a message (no email send yet)
  - `GET /api/v1/auth/me` — returns authenticated user profile
- Added `get_current_user` dependency in [`backend/app/core/deps.py`](backend/app/core/deps.py) for protected routes.
- Stubbed `GET/PATCH /api/v1/users/me` contract (profile updates deferred to Phase 7).

### API contract

- Published OpenAPI spec at [`docs/openapi.yaml`](docs/openapi.yaml) defining endpoint shapes for auth, trips, cities, activities, stops, trip-activities, shares, and users — including shared error and pagination schemas.

### Seed data

- [`backend/scripts/seed.py`](backend/scripts/seed.py) — idempotent seed script:
  - Demo admin user: `alex@globetrotter.app` / `globetrotter` (Alex Rivera)
  - Six cities: Paris, Tokyo, Rome, Bali, New York City, Barcelona (with `image_url`, cost index, popularity)
  - Six starter activities across Paris, Tokyo, Rome, and Bali
  - One sample trip: **European Summer** (no stops yet)

### Backend tests

- [`backend/tests/api/test_health.py`](backend/tests/api/test_health.py) — `GET /health` returns `{ "status": "ok" }`
- [`backend/tests/api/test_auth.py`](backend/tests/api/test_auth.py) — signup, login, `/me`, duplicate email 409

### Frontend — design system & auth UI

- Migrated to **Tailwind CSS v4** (`@tailwindcss/vite`) with refined design tokens in [`frontend/src/styles.css`](frontend/src/styles.css) (Plus Jakarta Sans, GlobeTrotter color palette).
- Ported shadcn-style UI primitives (JSX): `button`, `input`, `label`, `checkbox`, `progress`, `textarea`, `sonner`, `card`, `avatar`, `dropdown-menu`, `sheet`.
- Added utilities: [`frontend/src/lib/utils.js`](frontend/src/lib/utils.js) (`cn()`), [`frontend/src/lib/apiClient.js`](frontend/src/lib/apiClient.js) (JWT-aware fetch).
- **Login** — pixel port of refined login form ([`frontend/src/components/gt/login-form.jsx`](frontend/src/components/gt/login-form.jsx)):
  - Email/password validation, show/hide password, remember-me (localStorage vs sessionStorage)
  - Forgot-password toast via API
  - Demo credentials pre-filled (`alex@globetrotter.app` / `globetrotter`)
- **Signup** — pixel port ([`frontend/src/features/auth/pages/SignupPage.jsx`](frontend/src/features/auth/pages/SignupPage.jsx)):
  - Full profile fields, password strength meter, photo picker (client preview), terms checkbox
  - Posts to `POST /auth/signup`, auto-login on success
- **Auth layout** — split hero + form chrome ([`frontend/src/components/gt/auth-layout.jsx`](frontend/src/components/gt/auth-layout.jsx)).
- **Auth context** — [`frontend/src/hooks/useAuth.jsx`](frontend/src/hooks/useAuth.jsx): bootstrap from stored token, login/signup/logout, `/me` refresh.

### Frontend — app shell

- Ported [`frontend/src/components/gt/app-shell.jsx`](frontend/src/components/gt/app-shell.jsx):
  - Collapsible sidebar, mobile bottom nav, search affordance, notifications bell
  - Avatar dropdown with Profile, Settings, Logout
  - Admin nav link when `user.is_admin`
- Thin authenticated `/dashboard` placeholder (greeting only; full dashboard deferred to Phase 2).
- Routes: `/login`, `/signup`, `/dashboard`; unauthenticated users redirected to login.

### Phase 1 deliverable

Migrated + seeded database, working signup/login, JWT session, OpenAPI contract, and refined auth UI — ready for parallel work on trips, catalog, and itinerary phases.

---

## Phase 2 — Trip Management

**Goal:** Create and manage the trip “container” (CRUD, list, dashboard) independent of itinerary builder or budget engine.

**Branch:** `phase-2-trips`

### Backend — trip CRUD

- Implemented [`backend/app/services/trips.py`](backend/app/services/trips.py) and [`backend/app/api/v1/endpoints/trips.py`](backend/app/api/v1/endpoints/trips.py):
  - All routes require authentication; owner-only access (other user's trip → **404**)
  - `GET /api/v1/trips` — **paginated** list with query params:
    - `page` (default 1), `page_size` (default 20, max 100)
    - `q` — name search
    - `status` — `all` | `upcoming` | `ongoing` | `completed` (derived from dates vs today)
    - `sort` — `date` | `name` | `budget`
  - `POST /api/v1/trips` — create; validates `end_date >= start_date`
  - `GET /api/v1/trips/{id}` — single trip with enriched `stop_count` and `stops[]` summary
  - `PATCH /api/v1/trips/{id}` — partial update
  - `DELETE /api/v1/trips/{id}` — **204**; cascades stops and trip-activities
- Shared pagination envelope via [`backend/app/schemas/common.py`](backend/app/schemas/common.py):

  ```json
  { "items": [], "page": 1, "page_size": 20, "total": 0, "total_pages": 0 }
  ```

### Backend — cities (read-only)

- Implemented [`backend/app/services/cities.py`](backend/app/services/cities.py) and paginated `GET /api/v1/cities`:
  - Optional `q` search on name/country
  - Default sort: `popularity_score` desc, then name asc
  - `GET /api/v1/cities/{id}` — single city
  - Admin POST/PATCH/DELETE remain **501**

### Backend — stops (minimal, for create wizard)

- Implemented [`backend/app/services/stops.py`](backend/app/services/stops.py):
  - `GET /api/v1/stops?trip_id=` — paginated, ordered by `order_index` (owner-only)
  - `POST /api/v1/stops` — create stop on owned trip; validates dates and city exists
  - GET/PATCH/DELETE by `stop_id` stubbed (**501**) — completed in Phase 4 plan

### Seed updates

- Added stable Unsplash `image_url` values for all six seed cities.
- Sample trip **European Summer** includes cover photo and `budget_cap` of 3500.

### Backend tests

- [`backend/tests/api/test_trips.py`](backend/tests/api/test_trips.py):
  - Empty paginated list
  - Full create → list → get → patch → delete lifecycle
  - Pagination with `page_size=1`
  - Unauthorized **401**
  - Cross-user access **404**
  - Paginated cities list

### Frontend — shared components & utilities

- Ported from refined UI ([`frontend/src/components/gt/cards.jsx`](frontend/src/components/gt/cards.jsx)):
  - `TripCard`, `DestinationCard`, `StatCard`, `EmptyState`, `StatusBadge`, `LoadingGrid`
- Ported budget donut widget ([`frontend/src/components/gt/budget.jsx`](frontend/src/components/gt/budget.jsx)) — uses `budget_cap` as planned spend; category slices stay **0** until Phase 5.
- Trip helpers ([`frontend/src/lib/trip-utils.js`](frontend/src/lib/trip-utils.js)):
  - `currency`, `formatRange`, `formatDate`, `tripDays`, `tripStatus`, `tripProgress`, `budgetTotal`, `normalizeTrip`
- City metadata ([`frontend/src/lib/city-meta.js`](frontend/src/lib/city-meta.js)):
  - Region/description overlays for seed cities, `normalizeCity`, `clampCostIndex` (1–5 for cost display)
- Saved destinations hook ([`frontend/src/hooks/useSavedDestinations.js`](frontend/src/hooks/useSavedDestinations.js)) — `localStorage` until Phase 7.
- API layer ([`frontend/src/lib/trips-api.js`](frontend/src/lib/trips-api.js)): `fetchTrips`, `fetchTrip`, `createTrip`, `updateTrip`, `deleteTrip`, `createStop`, `fetchCitiesPage`, `fetchAllCities`, `fetchStops`.
- New shadcn JSX ports: `alert-dialog`, `select`, `tabs`, `switch`, `badge`, `skeleton`, `pagination`.

### Frontend — screens (refined UI ports)

| Route | Component | Notes |
|---|---|---|
| `/dashboard` | [`DashboardPage.jsx`](frontend/src/features/dashboard/DashboardPage.jsx) | Featured hero, stat cards, upcoming trips (page_size=6), recommended destinations, budget highlights |
| `/trips` | [`TripsListPage.jsx`](frontend/src/features/trips/TripsListPage.jsx) | Tabs (all/upcoming/ongoing/completed), search, sort, grid/list toggle, pagination, delete confirm dialog |
| `/trips/new` | [`CreateTripPage.jsx`](frontend/src/features/trips/CreateTripPage.jsx) | 3-step wizard: basics → dates → destinations; creates trip + optional stops with even date split |
| `/trips/:id/edit` | [`EditTripPage.jsx`](frontend/src/features/trips/EditTripPage.jsx) | Edit name, dates, description, cover |
| `/trips/:id` | [`TripOverviewPage.jsx`](frontend/src/features/trips/TripOverviewPage.jsx) | Thin overview: cover, stats, read-only stop list, Edit + “Plan itinerary” CTA (full builder = Phase 4) |

### Phase 2 deliverable

Full trip CRUD against the live API, paginated list endpoints, dashboard and trip management screens matching the refined design, and a thin trip overview so “View Trip” links work before the itinerary builder lands.

---

## Phase 3 — Destination & Activity Catalog

**Goal:** Searchable browse-and-filter UI for cities and activities, testable without any trip context.

**Branch:** (integrated on `main` / `phase-2-trips` follow-up)

### Backend — activities (read-only list)

- Implemented basic `GET /api/v1/activities` in [`backend/app/api/v1/endpoints/activities.py`](backend/app/api/v1/endpoints/activities.py):
  - Returns all activities (flat array; pagination envelope planned for Phase 4 catalog picker)
  - Admin POST/PATCH/DELETE remain **501**
- Cities catalog already served by Phase 2 paginated `GET /api/v1/cities`.

### Frontend — Explore / catalog screen

- **Route:** `/explore` → [`CatalogPage.jsx`](frontend/src/features/catalog/CatalogPage.jsx) inside app shell.
- Ported refined explore layout with:
  - **Search bar** — filters cities and activities by name, country, description (client-side)
  - **Region filter** — derived from city metadata (`CITY_META` regions: Europe, Asia, North America)
  - **Category filter** — Sightseeing, Food, Adventure, Culture, Relax, Nightlife
  - **Popular destinations** — top 3 by popularity score
  - **Recommended for you** — next 3 cities (layout matches refined; not yet personalized from saved list server-side)
  - **Popular activities** — up to 8 filtered activity cards
  - **Travel inspiration** — 3 cheapest activities with city thumbnails
  - Empty state with “Clear filters” when no results match
- Heart/save on destination cards via [`frontend/src/lib/store.jsx`](frontend/src/lib/store.jsx) (`gt_saved_destinations` in `localStorage`).
- **ActivityCard** component added to [`cards.jsx`](frontend/src/components/gt/cards.jsx):
  - Name, category badge, description, city, duration, cost, optional “Add to Trip” button (toast only — wiring to itinerary builder deferred to Phase 4).

### Data loading

- Catalog fetches `GET /cities?page_size=100` and `GET /activities` on mount.
- Cities normalized with region/description from `city-meta.js` where API fields are sparse.

### Phase 3 deliverable

Working Explore screen with city and activity search/filter against seed data, destination save-to-shortlist (local), and activity browse cards — demoable without creating a trip.

---

## Cross-phase notes

| Area | Status after Phase 3 |
|---|---|
| Itinerary builder (`/trips/:id` full UI) | Placeholder — **Phase 4** |
| Day-by-day itinerary view | Placeholder — **Phase 4** |
| Budget & cost engine | Placeholder — **Phase 5** |
| Calendar / timeline / public share | Placeholder — **Phase 6** |
| Profile, settings, admin analytics | Placeholder — **Phase 7** |
| Activity catalog pagination & filters on server | Partial — full pagination in **Phase 4** backend plan |
| Stop PATCH/DELETE/reorder API | Stubbed — **Phase 4** |
| Trip-activity CRUD API | Stubbed — **Phase 4** |
---

## Hotfixes & UI Polish (Sidebar & Brand Logo)

**Goal:** Resolve missing utility imports, fix ESLint on build output, configure the official logo brand assets, and implement collapsible sidebar navigation for desktop and mobile screen sizes.

### Brand Logo & Favicon
- Created [`frontend/public/logo.svg`](frontend/public/logo.svg) matching the brand's custom wavy earth logo.
- Updated [`frontend/index.html`](frontend/index.html) to link `/logo.svg` as the application favicon.
- Refactored the `Logo` component in [`frontend/src/components/gt/app-shell.jsx`](frontend/src/components/gt/app-shell.jsx) to load `/logo.svg` directly and align it horizontally with sidebar navigation items.

### Collapsible Desktop Sidebar
- Made the desktop sidebar collapsible, toggling between `w-64` and `w-20` (narrow view).
- Hidden label descriptions and centered icons vertically when collapsed.
- Added a floating `Button` toggle on the right edge of the sidebar border, centered vertically on the viewport (`top-1/2 -translate-y-1/2`), displaying `<` and `>` arrow icons.
- Persisted the collapsed state in `localStorage` under `gt_sidebar_collapsed` to survive page/route changes and refreshes.
- Custom styled CSS tooltips with pointer indicators are added to show icon names immediately on hover when collapsed.

### Mobile Navigation Toggles & Backdrop
- Replaced the mobile slide-out `Sheet` dialog component with a custom off-canvas collapsible sidebar layout.
- Used a standard `Menu` (hamburger) icon in the header for expanding, and a `ChevronLeft` arrow inside the panel for collapsing.
- Changed the overlay backdrop class from `bg-background/80` to `bg-black/40` so the underlying dashboard page remains visible when the mobile sidebar is active.

### Build & Lint fixes
- Created missing [`frontend/src/lib/utils.js`](frontend/src/lib/utils.js) defining the class merger `cn(...)` utility.
- Created missing [`frontend/src/lib/apiClient.js`](frontend/src/lib/apiClient.js) implementing authenticated `fetch` wrapper and JWT session token storage.
- Configured ESLint in [`frontend/eslint.config.js`](frontend/eslint.config.js) to ignore `dist/` and `node_modules/` folders.

---

## How to run (current)

```bash
# Database
docker compose up -d
cd backend && alembic upgrade head && python scripts/seed.py

# Backend
cd backend && uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend && npm install && npm run dev
```

Demo login: **alex@globetrotter.app** / **globetrotter**
