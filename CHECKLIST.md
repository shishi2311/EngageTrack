# EngageTrack — Build Checklist

> Updated after each completed step. Check off items as they are finished.

---

## Backend

- [x] **Step 1 — Models + Migration**
  - [x] `Client` model (UUID PK, name unique, contact_email, industry, status Enum, timestamps)
  - [x] `Project` model (client_id FK, status Enum, start/target/actual dates, health_score)
  - [x] `Milestone` model (project_id FK, status Enum, due_date, completed_at, sort_order)
  - [x] `Approval` model (milestone_id FK, approved_by, decision Enum, comments)
  - [x] `StatusUpdate` model (project_id FK, content, update_type Enum)
  - [x] `models/__init__.py` exports all models
  - [x] Alembic migration generated and applied (`flask db upgrade`)
  - [x] All tables verified in SQLite

- [x] **Step 2 — Error Handling + Request Middleware**
  - [x] `AppError` hierarchy: `NotFoundError`, `ValidationError`, `BusinessRuleError`
  - [x] Consistent JSON envelope: `{"error": {"code", "message", "details", "request_id"}}`
  - [x] Catch-all `Exception` handler (logs traceback, returns safe 500)
  - [x] `setup_logging()` — JSON formatter on root logger
  - [x] `before_request` → UUID `request_id` + start timer
  - [x] `after_request` → logs method/path/status/duration_ms
  - [x] Both wired into `create_app()`

- [x] **Step 3 — Marshmallow Schemas**
  - [x] `ClientCreateSchema` / `ClientUpdateSchema` / `ClientResponseSchema` (+ project_count)
  - [x] `ProjectCreateSchema` (UUID check, date-order cross-validation) / `ProjectUpdateSchema` / `ProjectResponseSchema` (+ client_name, health_breakdown)
  - [x] `MilestoneCreateSchema` / `MilestoneResponseSchema` (+ valid_transitions, latest_approval)
  - [x] `StatusUpdateCreateSchema` / `StatusUpdateResponseSchema`
  - [x] `load_or_raise()` helper converts marshmallow errors → `AppValidationError` with field-level details

- [x] **Step 4 — Service Layer**
  - [x] `health_calculator.calculate_health()` — 40/35/25 weighted formula with proportional overdue deduction
  - [x] `health_calculator.get_health_breakdown()` — per-component scores for UI cards
  - [x] `milestone_service.VALID_TRANSITIONS` state machine
  - [x] `milestone_service.transition_status()` — guards all gates, auto-sets completed_at, recalcs health, logs
  - [x] `milestone_service.get_valid_transitions()` — drives UI button visibility
  - [x] `project_service.check_engagement_cap()` — max 3 active projects per client
  - [x] `project_service.update_project_status()` — blocks completion with open milestones
  - [x] `project_service.recalculate_health()` — logs on score change

- [x] **Step 5 — Routes (thin, delegate to services)**
  - [x] `GET/POST /api/clients`, `GET/PATCH /api/clients/:id`
  - [x] `GET/POST /api/projects` (`?status=`, `?client_id=`, `?health=`), `GET/PATCH /api/projects/:id`
  - [x] `GET /api/projects/:id` — embeds milestones + last 10 status updates
  - [x] `GET/POST /api/projects/:id/milestones`
  - [x] `PATCH /api/milestones/:id` — field edits only, rejects status changes
  - [x] `POST /api/milestones/:id/transition` — drives state machine
  - [x] `POST /api/milestones/:id/request-approval`
  - [x] `POST /api/milestones/:id/approve`
  - [x] `GET/POST /api/projects/:id/status-updates`
  - [x] `GET /api/dashboard/summary` — includes health_distribution + recent_updates

- [x] **Step 6 — Backend Tests — 63/63 passing**
  - [x] `conftest.py` — in-memory DB, `sample_client/project/milestone/project_with_milestones` fixtures
  - [x] `test_clients.py` — CRUD, email validation, status filter, 404s, project_count
  - [x] `test_projects.py` — CRUD, date validation, health/status/client_id filters, dashboard shape
  - [x] `test_milestones.py` — create, sort_order, transitions, approval record, latest_approval in response
  - [x] `test_business_rules.py` — full approval workflow, rejection, engagement cap (3 variants), completion block, milestone-to-closed-project block
  - [x] `test_health_score.py` — no milestones, all on-time, overdue deduction, blocker stacking, clamp, recalc on transition/blocker
  - [x] All tests pass: `make test` → **63 passed in 0.46s**

---

## Frontend

- [x] **Step 7 — CSS Design System**
  - [x] `globals.css` — all CSS variables (colors, spacing, radius, transitions, typography)
  - [x] `globals.css` — scrollbar styling, `::selection` color added
  - [x] `index.html` — Google Fonts (DM Sans + JetBrains Mono)
  - [x] Keyframe animations: `fadeInUp`, `shimmer`, `pulse-red`, staggered cards
  - [x] `tailwind.config.js` — CSS variable color/shadow/font tokens wired into Tailwind theme

- [x] **Step 8 — Shared Components**
  - [x] `HealthRing.tsx` — SVG arc animation, count-up number, 3 size variants, glow effect
  - [x] `StatusBadge.tsx` — dot + pill, all status colors from CSS vars
  - [x] `Skeleton.tsx` — text/circle/card variants, shimmer animation, multi-line support
  - [x] `Toast.tsx` — `ToastContainer` + `ToastItem`, slide-in, auto-dismiss 4s, progress bar, success/error
  - [x] `Modal.tsx` — portal, backdrop blur, scale-in animation, Escape key close
  - [x] `EmptyState.tsx` — geometric SVG icon, heading, subtitle, CTA button
  - [x] `ProgressBar.tsx` — gradient fill by health range, mount animation

- [x] **Step 9 — API Client (typed)**
  - [x] `api/client.ts` — full typed endpoint functions for all resources
  - [x] `hooks/useApi.ts` — `useApi<T>(fetchFn)` with loading/error/data/refetch
  - [x] `types/index.ts` — complete domain interfaces + request payloads + ApiError
  - [x] `AppShell.tsx` — responsive sidebar (220px ↔ 60px), sticky, max-width 1400px
  - [x] `Sidebar.tsx` — nav icons, active indicator bar, collapse toggle
  - [x] `PageHeader.tsx` — title/subtitle/actions slot
  - [x] `App.tsx` — route transition animation on pathname change

- [x] **Step 10 — Dashboard Page**
  - [x] 4 summary stat cards (Total Clients, Active Projects, Avg Health, Overdue Milestones)
  - [x] "Overdue" value pulses red if > 0
  - [x] Projects grid (auto-fill, min 300px per card)
  - [x] `ProjectCard` — HealthRing, progress bar, meta row, StatusBadge, stagger entrance
  - [x] Skeleton loading state for both stat cards and project grid
  - [x] Empty state if no active projects

- [x] **Step 11 — Project Detail Page**
  - [x] Back link "← Back to Projects"
  - [x] Project header card — large HealthRing (lg), name, client, date range, StatusBadge
  - [x] Health breakdown — 3 mini stat cards (Completion, On-Time, Blockers)
  - [x] 60/40 two-column layout (stacks on mobile)
  - [x] `MilestoneTimeline` — vertical line, colored status dots, pulse on in_progress
  - [x] `MilestoneCard` — overdue highlighting, 3px status border, valid action buttons only
  - [x] `ApprovalDialog` — modal, approver name required, approve/reject, reject note
  - [x] `StatusFeed` — type dot + badge, relative timestamps, blocker red border
  - [x] `StatusForm` — slide-down animation, type selector pills, validation
  - [x] Skeleton loading for header + both columns

- [x] **Step 12 — Clients Page**
  - [x] Premium table — bg-tertiary header, uppercase, hover rows
  - [x] "Add Client" button → `ClientForm` modal
  - [x] Row name click → navigate to /?client_id=xxx
  - [x] `ClientForm` — inline field errors, API error toasts
  - [x] Skeleton loading rows + empty state with CTA

- [ ] **Step 13 — Animations + Polish**
  - [ ] Page transitions (`fadeInUp` on route change)
  - [ ] Staggered card entrance on Dashboard
  - [ ] HealthRing arc draws on mount
  - [ ] Health score counts up (0 → target)
  - [ ] Sidebar active indicator
  - [ ] Button press scale feedback
  - [ ] Responsive: sidebar collapses <1024px, grid 1-col <768px

- [x] **Step 14 — Frontend Tests — 34/34 passing**
  - [x] `HealthRing.test.tsx` — correct color per score range, size variants, showLabel toggle
  - [x] `MilestoneCard.test.tsx` — valid action buttons per state, disabled buttons, overdue, count badge
  - [x] `ApprovalDialog.test.tsx` — requires approver name, approve/reject API calls, error toast
  - [x] `StatusBadge.test.tsx` — correct label + color per status, dot-only variant, unknown fallback
  - [x] Vitest + Testing Library configured; `make test-frontend` target added

---

## Final Steps

- [x] **Step 13 — Seed Data** (merged into Step 15 slot)
  - [x] 3 clients: Meridian Health, Volt Energy, NovaPay
  - [x] 4 projects with varied health (82, 50, 36, 70)
  - [x] Milestones in mixed states (completed with approvals, in_progress, overdue, pending_approval)
  - [x] 4–5 status updates per project including blockers
  - [x] Realistic approval records (including one rejected + re-approved)
  - [x] Health scores recalculated after seed
  - [x] `make seed` runs cleanly

- [ ] **Step 16 — Docker**
  - [ ] Backend `Dockerfile`
  - [ ] Frontend `Dockerfile`
  - [ ] `docker-compose up --build` starts everything
  - [ ] Migrations run automatically on backend start
  - [ ] `docker-compose exec backend python seed.py` works

- [ ] **Step 17 — README**
  - [ ] What this is (2 sentences)
  - [ ] Quick start (`docker-compose up`)
  - [ ] Technical decisions
  - [ ] Architecture diagram (Route → Schema → Service → Model → DB)
  - [ ] Key business rules documented
  - [ ] Design philosophy section
  - [ ] AI usage section

---

## Final Checklist (pre-submission)

- [ ] `docker-compose up` starts everything cleanly
- [ ] All backend tests pass (`make test`)
- [ ] Frontend builds without errors (`npm run build`)
- [ ] Seed data loads and dashboard looks realistic
- [ ] Health score recalculates on milestone/blocker changes
- [ ] Milestone state machine rejects all invalid transitions
- [ ] Engagement cap blocks 4th active project
- [ ] No hardcoded hex colors in frontend components
- [ ] Skeleton loaders show while data fetches
- [ ] Empty states on all list views
- [ ] Toast notifications for success/error on all mutations
- [ ] Animations are smooth (HealthRing, card entrance, page transitions)
- [ ] `claude.md` and `AGENTS.md` at repo root ✅
