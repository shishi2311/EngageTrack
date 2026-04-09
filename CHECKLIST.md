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

- [ ] **Step 5 — Routes (thin, delegate to services)**
  - [x] `GET/POST /api/clients`, `GET/PATCH /api/clients/:id`
  - [x] `GET/POST /api/projects`, `GET/PATCH /api/projects/:id`
  - [x] `GET/POST /api/projects/:id/milestones`
  - [x] `PATCH /api/milestones/:id`
  - [x] `POST /api/milestones/:id/request-approval`
  - [x] `POST /api/milestones/:id/approve`
  - [x] `GET/POST /api/projects/:id/status-updates`
  - [x] `GET /api/dashboard/summary`
  - [ ] Manual end-to-end API smoke test (all routes return correct shapes)

- [ ] **Step 6 — Backend Tests**
  - [ ] `conftest.py` — test DB fixture, seed helpers
  - [ ] `test_clients.py` — CRUD + email validation + 404s
  - [ ] `test_projects.py` — CRUD + engagement cap + date validation
  - [ ] `test_milestones.py` — create, state machine transitions
  - [ ] `test_business_rules.py` — approval workflow, engagement cap, completion block
  - [ ] `test_health_score.py` — no milestones, all on-time, all overdue, blocker penalty
  - [ ] All tests pass: `make test`

---

## Frontend

- [ ] **Step 7 — CSS Design System**
  - [x] `globals.css` — all CSS variables (colors, spacing, radius, transitions, typography)
  - [x] `index.html` — Google Fonts (DM Sans + JetBrains Mono)
  - [x] Keyframe animations: `fadeInUp`, `shimmer`, `pulse-red`, staggered cards
  - [ ] Verify variables render correctly in browser

- [ ] **Step 8 — Shared Components**
  - [ ] `HealthRing.tsx` — SVG arc animation, size variants, glow effect
  - [ ] `StatusBadge.tsx` — dot + pill, all status colors from CSS vars
  - [ ] `Skeleton.tsx` — shimmer animation, width/height props
  - [ ] `Toast.tsx` — slide-in, auto-dismiss 4s, progress bar, success/error styles
  - [ ] `Modal.tsx` — backdrop blur, scale-in animation
  - [ ] `EmptyState.tsx` — icon, heading, subtitle, CTA button
  - [ ] `ProgressBar.tsx` — gradient fill, mount animation

- [ ] **Step 9 — API Client (typed)**
  - [x] `api/client.ts` — `get`, `post`, `patch` wrappers
  - [x] `hooks/useApi.ts` — loading/error/data state
  - [x] `types/index.ts` — all domain interfaces
  - [ ] Test hook with real backend

- [ ] **Step 10 — Dashboard Page**
  - [ ] 4 summary stat cards (Total Clients, Active Projects, Avg Health, Overdue Milestones)
  - [ ] "Overdue" value pulses red if > 0
  - [ ] Projects grid (2-col desktop, 1-col mobile)
  - [ ] `ProjectCard` — HealthRing, progress bar, meta row, StatusBadge
  - [ ] Skeleton loading state
  - [ ] Empty state if no projects

- [ ] **Step 11 — Project Detail Page**
  - [ ] Project header — large HealthRing, dates, StatusBadge, 3 health breakdown cards
  - [ ] Milestone timeline — vertical line, status dots, due dates, overdue highlighting
  - [ ] Valid action buttons only (driven by `valid_transitions`)
  - [ ] `ApprovalDialog` — modal, approver name required, approve/reject buttons
  - [ ] Status feed panel — typed entries, relative timestamps, blocker red border
  - [ ] Add Update form — slide-down animation, type selector pills
  - [ ] Skeleton loading for both panels

- [ ] **Step 12 — Clients Page**
  - [ ] Premium table — hover rows, uppercase headers
  - [ ] "Add Client" button → modal form
  - [ ] Row click → navigate to projects filtered by client
  - [ ] Client form validation (matches backend)
  - [ ] Empty state

- [ ] **Step 13 — Animations + Polish**
  - [ ] Page transitions (`fadeInUp` on route change)
  - [ ] Staggered card entrance on Dashboard
  - [ ] HealthRing arc draws on mount
  - [ ] Health score counts up (0 → target)
  - [ ] Sidebar active indicator
  - [ ] Button press scale feedback
  - [ ] Responsive: sidebar collapses <1024px, grid 1-col <768px

- [ ] **Step 14 — Frontend Tests**
  - [ ] `HealthRing` — correct color per score range
  - [ ] `MilestoneCard` — shows only valid action buttons per state
  - [ ] `ApprovalDialog` — requires approver name
  - [ ] `StatusBadge` — correct styling per status

---

## Final Steps

- [ ] **Step 15 — Seed Data**
  - [ ] 3 clients: Meridian Health, Volt Energy, NovaPay
  - [ ] 4 projects with varied health (85, 100, 55, 72)
  - [ ] Milestones in mixed states (completed with approvals, in_progress, overdue)
  - [ ] 3–6 status updates per project including blockers
  - [ ] `make seed` runs cleanly

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
