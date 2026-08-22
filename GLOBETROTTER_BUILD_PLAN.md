# GlobeTrotter — 7-Phase Build Plan (Parallel-Friendly)

Based on the GlobeTrotter hackathon spec (`GlobeTrotter.pdf`). A personalized,
collaborative multi-city travel planning app: create itineraries, add stops/cities/

activities, auto-estimate budgets, visualize timelines, and share plans.

**Assumed stack** (swap freely): React (frontend) + FastAPI (API) + PostgreSQL
(relational data: users, trips, stops, activities, costs) + JWT auth.

## How independence works here

Only **Phase 1** is a hard prerequisite (schema + auth contract everything else reads/writes
against). Phases 2–7 are designed so a different person can build each one in parallel:
every phase consumes a **fixed, agreed-upon API contract** from Phase 1 and, where it would
otherwise depend on another phase's output, works against **seeded/mock data** instead of
a live integration. Wiring the phases together into one seamless flow is a short
integration pass at the end, not an ongoing dependency during development.

| Phase | Depends on (contract only) | Can be built/tested standalone via |
|---|---|---|
| 1. Foundation & Auth | — | itself |
| 2. Trip Management | Phase 1 auth + `trips` schema | seeded user, no other phase needed |
| 3. Destination & Activity Catalog | Phase 1 schema only | seeded `cities`/`activities`, no trips needed |
| 4. Itinerary Builder | Phase 1 schema (`stops`, `trip_activities`) | mock trip + mock catalog rows |
| 5. Budget & Cost Engine | Phase 1 schema only | mock itinerary JSON fixture (no live builder needed) |
| 6. Visualization & Sharing | Phase 1 schema only | mock itinerary + mock cost-breakdown JSON |
| 7. Profile & Admin Analytics | Phase 1 auth only | seeded users/trips fixture |

---

## Phase 1 — Foundation: Data Model, Auth, API Contracts

Goal: everything downstream reads/writes against a stable schema and auth layer, so it can
be treated as a fixed dependency rather than shifting ground.

1. **Database schema**
   - `users` (id, name, email, password_hash, photo, language_pref, is_admin, created_at)
   - `trips` (id, user_id, name, start_date, end_date, description, cover_photo, is_public,
     budget_cap)
   - `cities` (id, name, country, cost_index, popularity_score, image_url)
   - `activities` (id, city_id, name, type/category, cost, duration, description, image_url)
   - `stops` (id, trip_id, city_id, start_date, end_date, order_index)
   - `trip_activities` (id, stop_id, activity_id, scheduled_date, scheduled_time, cost_override)
   - `trip_shares` (id, trip_id, public_slug, created_at)
   - Indexes on `trip_id`, `city_id`, `user_id`.
2. **Auth: Login / Signup Screen**
   - Email+password signup/login, bcrypt hashing, JWT session, "forgot password" stub,
     client-side validation.
3. **API contracts** (write these down before other phases start, e.g. an OpenAPI/README
   stub) — endpoint shapes for trips, cities, activities, stops, trip_activities, shares,
   users — even before every handler is implemented, so Phases 2–7 can code against a
   fixed shape.
4. **Seed data**
   - A handful of cities + activities (for Phase 3/4/5 fixtures) and 1–2 demo users +
     trips (for Phase 2/6/7 fixtures).

**Deliverable:** migrated + seeded DB, working signup/login, and a written API contract
every other phase can build against without waiting on live implementation.

---

## Phase 2 — Trip Management

Goal: create and manage the trip "container," independent of what's inside it.

1. **Dashboard / Home Screen** — welcome message, recent trips list, "Plan New Trip" CTA,
   recommended destinations, budget highlights.
2. **Create Trip Screen** — name, start/end date, description, optional cover photo, save.
3. **My Trips (Trip List) Screen** — trip cards (name, date range, stop count,
   edit/view/delete).

Depends only on Phase 1's `trips` table + auth. Does not need the itinerary builder,
catalog, or budget engine to exist — stop/destination counts can render as zero until
Phase 4 lands.

**Deliverable:** full CRUD on trips, usable standalone against a seeded user account.

---

## Phase 3 — Destination & Activity Catalog

Goal: a searchable catalog, independent of any specific trip.

1. **City Search** — search bar, filter by country/region, meta info (country, cost
   index, popularity), "Add to Trip" button (emits an event/callback the Itinerary Builder
   will consume in Phase 4 — not built here).
2. **Activity Search** — filter by type/cost/duration, add/remove buttons, quick preview
   (description + image).

Depends only on Phase 1's `cities`/`activities` tables. Fully testable as a standalone
browse-and-filter UI against seed data, with no trip context required.

**Deliverable:** working city and activity search/filter screens, demoable in isolation.

---

## Phase 4 — Itinerary Builder

Goal: assemble stops and activities into a trip.

1. **Itinerary Builder Screen** — "Add Stop" button, assign city + travel dates per stop,
   reorder stops, assign activities to each stop.

Integrates Phase 2 (trip container) and Phase 3 (catalog) at the data-model level, but can
be built and demoed against **mock trip + mock catalog fixtures** without either of those
UIs being finished — it only needs the Phase 1 schema and seed rows.

**Deliverable:** a trip can be populated with ordered stops and per-stop activities.

---

## Phase 5 — Budget & Cost Engine

Goal: turn itinerary data into a cost breakdown — as a standalone calculation service.

1. **Trip Budget & Cost Breakdown Screen** — cost breakdown by transport/stay/
   activities/meals, pie/bar charts, average cost per day, overbudget alerts.
2. **`calculateTripCost(tripId)` service** — sums activity costs + estimated stay
   (city cost_index × nights) + flat transport estimate; single source of truth reused
   by Dashboard highlights, Trip List, and this screen.

Build and unit-test this against a **fixture itinerary JSON** (mock stops + activities +
costs) — it never needs the live Itinerary Builder UI to exist, only data shaped like its
output.

**Deliverable:** a tested cost-calculation service + budget screen, pluggable into any
trip once real itinerary data exists.

---

## Phase 6 — Visualization, Calendar & Sharing

Goal: present and share a finished itinerary.

1. **Itinerary View Screen** — day-wise layout, city headers, activity blocks with
   time/cost, calendar/list toggle.
2. **Trip Calendar / Timeline Screen** — calendar or vertical timeline, expandable days,
   drag-to-reorder, inline quick edit.
3. **Shared/Public Itinerary View Screen** — public slug via `trip_shares`, read-only
   render, "Copy Trip" (clones trip/stops/trip_activities), basic social sharing.

Depends only on Phase 1 schema shape; build/test against a **mock itinerary fixture**
(same shape Phase 4 will eventually produce) so this phase doesn't block on the builder
being done.

**Deliverable:** any well-formed itinerary (real or mock) renders as a visual timeline
and can be published/copied via a public link.

---

## Phase 7 — Profile & Admin Analytics

Goal: account management and platform-level insight — fully separate surface area.

1. **User Profile / Settings Screen** — editable name/photo/email, language preference,
   saved destinations list, delete account.
2. **Admin / Analytics Dashboard (optional)** — trips-created trends, top cities/
   activities, engagement stats, user management; gated by `is_admin`.

Depends only on Phase 1 auth + a seeded users/trips fixture for the analytics queries —
no dependency on the itinerary/budget/sharing phases being complete.

**Deliverable:** users can manage their own account; admins get a usage dashboard.

---

## Integration Pass (after all 7 phases)

Short final step, not a phase: replace each phase's mock/seed fixture with the live data
from the other phases (e.g. Itinerary Builder's real output feeding the Budget Engine and
Visualization screens), run the full golden path end-to-end (signup → create trip → add
stops/activities → view budget/calendar → share publicly → copy trip), and deploy.

---

## Feature Checklist (cross-reference to spec screens)

- [x] 1. Login / Signup Screen — Phase 1
- [x] 2. Dashboard / Home Screen — Phase 2
- [x] 3. Create Trip Screen — Phase 2
- [x] 4. My Trips (Trip List) Screen — Phase 2
- [x] 5. Itinerary Builder Screen — Phase 4
- [x] 6. Itinerary View Screen — Phase 6
- [x] 7. City Search — Phase 3
- [x] 8. Activity Search — Phase 3
- [x] 9. Trip Budget & Cost Breakdown Screen — Phase 5
- [x] 10. Trip Calendar / Timeline Screen — Phase 6
- [x] 11. Shared/Public Itinerary View Screen — Phase 6
- [x] 12. User Profile / Settings Screen — Phase 7
- [x] 13. Admin / Analytics Dashboard (optional) — Phase 7

Mockup reference: https://link.excalidraw.com/l/65VNwvy7c4X/6CzbTgEeSr1
