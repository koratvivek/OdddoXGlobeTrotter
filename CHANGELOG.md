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

## Phase 4 — Itinerary Builder

**Goal:** Allow users to build out a trip by adding stops and scheduling activities within those stops.

**Branch:** `phase-4-itinerary`

### Backend — Itinerary API

- Implemented `app/services/stops.py` with CRUD for stops (`GET /stops/{id}`, `PATCH`, `DELETE`).
- Re-index logic on stop deletion to maintain `order_index`.
- Implemented `app/services/trip_activities.py` for `TripActivity` CRUD:
  - `POST /trip-activities` to schedule an activity at a stop.
  - `PATCH /trip-activities/{id}` to update date/time or cost.
  - `DELETE /trip-activities/{id}` to remove an activity.
- Updated endpoints in `stops.py` and `trip_activities.py`.

### Frontend — Itinerary UI

- Created `frontend/src/features/trips/TripItineraryPage.jsx` with full drag-and-drop or ordered list to view days, stops, and activities.
- Allows adding activities from the catalog to specific stops and days.
- Allows reordering stops and activities.

### Phase 4 deliverable
Full trip itinerary builder functionality, enabling users to schedule days and book activities to stops.

---

## Phase 5 — Budget & Cost Engine

**Goal:** Integrate a real-time budget calculator comparing `budget_cap` with actual expenses from activities, accommodation, transport, and meals.

**Branch:** `phase-5-budget`

### Backend — Budget API

- Implemented `app/services/budget.py` (`calculate_trip_cost`) aggregating:
  - **Activities**: Sum of `cost_override` or `activity.cost`.
  - **Accommodation**: `city.cost_index * nights`.
  - **Transport**: Base fee * number of stops.
  - **Meals**: Base daily fee * duration days.
- Added `GET /trips/{id}/budget` returning a `TripBudgetResponse` with categories, total cost, remaining budget, and average per day.
- Auth protected; owner-only access.

### Frontend — Budget UI

- Created `frontend/src/features/budget/TripBudgetPage.jsx`.
- Uses `BudgetDonut` widget to visualize the breakdown of expenses.
- Displays over-budget warnings and remaining budget.

### Phase 5 deliverable
A fully operational, dynamic budget calculator that reacts to itinerary changes in real-time.

---

## Phase 7 — Profile, Settings & Admin Analytics

**Goal:** Implement user profile management, settings, a persistent saved destinations list, account deletion, and an admin analytics dashboard.

**Branch:** `phase-7-profile-admin-analytics`

### Backend — Profile & Admin APIs

- **Profile & Saved Destinations:**
  - `SavedDestination` join table created with unique constraint `(user_id, city_id)`.
  - `GET /users/me/saved-destinations`, `POST`, `DELETE` endpoints for authoritative persistence.
  - `DELETE /users/me` endpoint to permanently delete the user's account and all associated data.
  - User model includes `saved_destinations` relationship (cascade delete).
- **Admin Dashboard:**
  - Added `get_current_admin` dependency ensuring `is_admin = True`.
  - Admin endpoints: `/admin/overview`, `/admin/users`, `/admin/stats/trips`, `/admin/stats/cities`, `/admin/stats/activities`.
  - Computes active user stats, trip funnels, popular cities (by stop count), and popular activities (by usage count).
  - Updated `UserRead` schema to include dynamic `trip_count` for admin users view.

### Frontend — Settings & Dashboard

- **Profile & Settings:**
  - `ProfilePage.jsx` to view/edit user bio, location, and name.
  - `SettingsPage.jsx` to manage email and language preferences.
  - Warning added about email change (no verification infrastructure built yet).
  - Both pages include a "Danger Zone" for account deletion.
- **Saved Destinations:**
  - Re-wrote `useSavedDestinations.js` hook to synchronize with backend when authenticated, falling back to `localStorage` for guests.
- **Admin Dashboard:**
  - `AdminDashboardPage.jsx` implemented displaying key KPIs, popular destinations/activities tables, and a searchable user management table.
  - Admin view protected by frontend routing and backend 403 blocks.

### Phase 7 deliverable
Complete user profile management, persistent saved content, and a comprehensive admin analytics suite.

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

### Global Theme Toggle
- Created [`frontend/src/hooks/useTheme.jsx`](frontend/src/hooks/useTheme.jsx) providing a React context for binary `'light'` / `'dark'` theme state, returning current theme and `toggleTheme` helper.
- Persisted theme settings to `localStorage` under key `'gt_theme'`, defaulting to `'light'`.
- Wrapped root React tree in [`frontend/src/app/App.jsx`](frontend/src/app/App.jsx) with `ThemeProvider`.
- Implemented a global dark/light mode toggle `Button` in the header bar next to the search action inside [`frontend/src/components/gt/app-shell.jsx`](frontend/src/components/gt/app-shell.jsx) utilizing Lucide's `Sun` and `Moon` icons.

### Create & Edit Trip Layout Improvements
- Updated page header title in [`frontend/src/features/trips/CreateTripPage.jsx`](frontend/src/features/trips/CreateTripPage.jsx) to `"Create Trip"`.
- Indented `Label` components using padding class `pl-1` to align cleaner with the input text values.
- Enforced strict trip end date validation (`endDate <= startDate` throws error) in Step 2.
- Refactored cover photo selection to uniquely identify preset cards by their respective city IDs.
- Added client-side search, page-size limit dropdown (10, 20, 50), and frontend pagination inside Step 3, synchronizing state with URL search query params.
- Implemented local storage auto-save and manual saving for draft trips under `'gt_trip_draft'`, reloading saved progress automatically upon route initialization, and removing the bottom Cancel button.
- Added dirty state checks and React Router `useBlocker` route listener to throw warning notifications and prevent navigation if the user attempts to switch sidebar tabs with unsaved draft changes.
- Added `min` datepicker constraint disabling prior start dates in the end date field, and auto-cleared invalid end dates if start date shifts.
- Wrapped Step 3's destinations grid in a max-height container (`max-h-[380px]`) with vertical scrolling to eliminate the outer page scrollbar and keep actions fixed.
- Added exact path matching (`end` prop) on sidebar NavLinks in [`frontend/src/components/gt/app-shell.jsx`](frontend/src/components/gt/app-shell.jsx) to prevent multiple sidebar menu highlights when creating a new trip.
- Styled the "Edit" button in [`frontend/src/features/trips/TripOverviewPage.jsx`](frontend/src/features/trips/TripOverviewPage.jsx) to use primary filled styling instead of outline.
- Extracted cover selection into a reusable [`frontend/src/components/gt/CoverPhotoSelector.jsx`](frontend/src/components/gt/CoverPhotoSelector.jsx) component complete with client-side text filtering, pagination grid, and custom file uploads.
- Refactored [`frontend/src/features/trips/EditTripPage.jsx`](frontend/src/features/trips/EditTripPage.jsx) to feature a responsive two-column grid placing Trip Basics and Dates & Budget side-by-side, enforcing min end dates, and loading the new `CoverPhotoSelector` component.
- Optimized draft restoration in [`frontend/src/features/trips/CreateTripPage.jsx`](frontend/src/features/trips/CreateTripPage.jsx) by parsing `localStorage` values inside the initial state hook setup, removing the initial 500ms blank field rendering.
- Implemented pulsey skeleton card loaders inside Step 1 (cover selections) and Step 3 (destination picker grids) while the cities list resolves asynchronously from the backend database.
- Integrated automatic pre-filling of Create Trip wizard variables (setting trip name and pre-selecting target destination) when clicking the "Add to Trip" buttons on recommended destination cards inside [`frontend/src/features/dashboard/DashboardPage.jsx`](frontend/src/features/dashboard/DashboardPage.jsx) and [`frontend/src/features/catalog/CatalogPage.jsx`](frontend/src/features/catalog/CatalogPage.jsx).
- Enforced input filtering constraints on planned budget inputs to restrict inputs to positive integers of maximum length 7 digits inside [`frontend/src/features/trips/CreateTripPage.jsx`](frontend/src/features/trips/CreateTripPage.jsx) and [`frontend/src/features/trips/EditTripPage.jsx`](frontend/src/features/trips/EditTripPage.jsx).
- Refactored [`frontend/src/components/gt/CoverPhotoSelector.jsx`](frontend/src/components/gt/CoverPhotoSelector.jsx) to display 3 randomly shuffled preset photo choices (guaranteeing currently selected photo is one of them) alongside custom upload and a "View more" button card.
- Implemented an overlays search dialog modal inside `CoverPhotoSelector` displaying the full searchable presets list with scrollbar constraints, auto-closing upon photo selection.
- Refactored [`frontend/src/components/gt/cards.jsx`](frontend/src/components/gt/cards.jsx) to make `TripCard` height stretch equally across layout rows (`flex h-full flex-col`) and pinned the "View Trip" button row to the bottom of all cards (`mt-auto`) to solve unequal height shifting issues when rendering trip progress indicators.
- Created premium custom skeleton components (`TripCardSkeleton`, `DestinationCardSkeleton`, and `BudgetDonutSkeleton`) inside [`frontend/src/components/gt/cards.jsx`](frontend/src/components/gt/cards.jsx) matching the geometry of loaded cards.
- Integrated `DestinationCardSkeleton` and `BudgetDonutSkeleton` inside [`frontend/src/features/dashboard/DashboardPage.jsx`](frontend/src/features/dashboard/DashboardPage.jsx) to show custom skeletons for recommended destinations and budget highlights while loading.
- Implemented `EditTripFormSkeleton` inside [`frontend/src/features/trips/EditTripPage.jsx`](frontend/src/features/trips/EditTripPage.jsx) to display a detailed form skeleton during load.
- Implemented `TripOverviewSkeleton` inside [`frontend/src/features/trips/TripOverviewPage.jsx`](frontend/src/features/trips/TripOverviewPage.jsx) to show proper banner and stops list skeleton indicators during load.
- Resolved double-nested AppShell layout bug by mapping `<TripBudgetPage />` directly on the `/trips/:id/budget` route inside [`frontend/src/routes/index.jsx`](frontend/src/routes/index.jsx) (removing duplicate `PlaceholderWithShell` wrapper), which eliminates the duplicate header and aligns search/account actions correctly in the center layout.
- Implemented `TripBudgetSkeleton` inside [`frontend/src/features/budget/TripBudgetPage.jsx`](frontend/src/features/budget/TripBudgetPage.jsx) mimicking budget details, charts, cost grids, and calculation guides.
- Created `ActivityCardSkeleton` inside [`frontend/src/components/gt/cards.jsx`](frontend/src/components/gt/cards.jsx) mimicking the layout of activity items.
- Integrated `DestinationCardSkeleton`, `ActivityCardSkeleton`, and custom inspiration loaders inside the Explore tab [`frontend/src/features/catalog/CatalogPage.jsx`](frontend/src/features/catalog/CatalogPage.jsx) to display proper skeleton screens for popular destinations, recommendations, popular activities, and travel inspiration while loading.
- Resolved merge conflict in `CatalogPage.jsx` using `useSavedDestinations` Hook bookmarks sync and route `navigate` redirects.

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
