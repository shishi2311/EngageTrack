# EngageTrack — Client Engagement Tracker

EngageTrack is a project health monitoring tool for software consultancies — it tracks client projects, milestone progress, and engagement health scores across your entire portfolio. It enforces real business rules: milestone state machines, client engagement caps, and computed health scores that degrade when milestones slip or blockers accumulate.

---

## Quick Start

**With Docker (recommended):**
```bash
docker-compose up --build
# In a separate terminal, after the backend is running:
docker-compose exec backend python seed.py
```
Open http://localhost:5173

**Without Docker:**
```bash
make setup          # create venv, install deps
make db-upgrade     # run migrations (creates SQLite dev.db)
make seed           # load demo data

# Terminal 1
cd backend && source venv/bin/activate && flask run --port 5001

# Terminal 2
cd frontend && npm run dev
```
Open http://localhost:5173

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Backend API | Flask 3.1, Python 3.11 | Lightweight, explicit, fast to test |
| ORM | SQLAlchemy 2.x + Flask-Migrate | Mature, full-featured, Alembic migrations |
| Validation | Marshmallow 3.x | Battle-tested, clean schema/model separation |
| Frontend | React 19, TypeScript strict | Type safety across API boundaries |
| Build | Vite 8 + `@tailwindcss/vite` | Sub-second HMR, no PostCSS config |
| Styling | Tailwind CSS 4 + CSS custom properties | Design tokens in CSS vars, utility classes for layout |
| Testing | pytest (backend), Vitest + Testing Library (frontend) | Fast, isolated, no browser required |
| Database | SQLite (dev) / PostgreSQL 15 (Docker/prod) | Zero-setup locally, production-grade in Docker |

---

## Architecture

```
HTTP Request
    │
    ▼
Route Handler          ← thin: validate input, call service, serialize output
    │
    ▼
Marshmallow Schema     ← load_or_raise() converts errors to consistent JSON envelope
    │
    ▼
Service Layer          ← ALL business logic lives here
    │  ├── health_calculator.py   (compute health score)
    │  ├── milestone_service.py   (state machine, approval gates)
    │  └── project_service.py     (engagement cap, status transitions)
    ▼
SQLAlchemy Models      ← relationships, Enum types, UUID PKs
    │
    ▼
SQLite / PostgreSQL
```

Every API error returns a consistent envelope:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed.",
    "details": { "contact_email": ["Not a valid email address."] },
    "request_id": "3f2a1b..."
  }
}
```

---

## Key Technical Decisions

**Service layer pattern over fat routes**
All business logic lives in `backend/app/services/`. Routes are intentionally thin — they validate input, call a service function, and serialize the result. This made the 63 backend tests fast and self-contained: services are tested directly without spinning up HTTP.

**Health score is stored but recomputed on writes**
`health_score` is a column on the `Project` table (denormalized for read performance — the dashboard aggregates across many projects). It's never manually set; `recalculate_health()` is called after every milestone transition and status update. The risk is stale scores if a code path skips the recalculation, but the test suite covers every mutation path.

**Marshmallow schemas are split: Create/Update/Response**
Input schemas (`ClientCreateSchema`, `ProjectUpdateSchema`) are plain `marshmallow.Schema` subclasses — they produce clean dicts from `load()` with no ORM entanglement. Response schemas use `Method` fields for computed properties (`project_count`, `health_breakdown`, `valid_transitions`). This keeps serialization logic co-located with the data shape.

**Milestone state machine as single source of truth**
`VALID_TRANSITIONS` in `milestone_service.py` is the only place transition rules are defined. The frontend reads `valid_transitions` from the API response and shows/hides buttons accordingly — no transition logic is duplicated in the UI.

**Dark editorial design**
The entire color system is CSS custom properties in `globals.css`. Components use `var(--accent-primary)` etc. — zero hardcoded hex values. This means the design is consistently applied and a single variable change propagates everywhere.

---

## Business Rules

### Milestone State Machine
```
pending → in_progress → pending_approval → approved → completed
                ↑               │
                └───────────────┘  (rejection returns to in_progress)
```
- Transitions are validated server-side in `milestone_service.transition_status()`
- Moving to `pending_approval` requires a subsequent `POST /api/milestones/:id/approve`
- Rejection (decision=rejected) returns the milestone to `in_progress`
- `completed_at` timestamp is set automatically on completion

### Engagement Cap
A client may have at most **3 active projects** simultaneously (`planning` or `in_progress` status). Creating a 4th returns HTTP 422 with `BUSINESS_RULE_VIOLATION`. `on_hold`, `completed`, and `cancelled` projects do not count toward the cap.

### Health Score Formula
```
health_score = round(
    completion_score × 0.40
  + on_time_score    × 0.35
  + blocker_score    × 0.25
)
```
- **Completion (40%)**: `completed_milestones / total_milestones × 100`. No milestones → 100.
- **On-Time (35%)**: per milestone — on-time completion → 1.0; late completion → 0.0; not yet due → 1.0 (optimistic); overdue incomplete → `max(0, 1 − days_overdue / 30)`.
- **Blockers (25%)**: starts at 100, −15 per blocker `StatusUpdate`. Applies even with no milestones.
- Final score is clamped to `[0, 100]`.

---

## Running Tests

```bash
# Backend — 63 tests
make test
# or: cd backend && python -m pytest -v

# Frontend — 44 tests
make test-frontend
# or: cd frontend && npm test
```

**Backend coverage:**
- `test_clients.py` — CRUD, email validation, status filter, project_count
- `test_projects.py` — CRUD, date validation, filters, dashboard shape
- `test_milestones.py` — create, sort_order, transitions, approval record
- `test_business_rules.py` — full approval workflow, rejection, engagement cap, completion block
- `test_health_score.py` — all scoring scenarios, edge cases, recalculation on events

**Frontend coverage:**
- `HealthRing` — correct color per score range, size variants
- `StatusBadge` — label text, color per status, dot-only variant
- `MilestoneTimeline/MilestoneCard` — valid buttons per state, disabled with tooltip, overdue
- `ApprovalDialog` — approver name required, approve/reject API calls, error handling
- `ProjectCard` — renders name/client/progress, navigation, overdue label

---

## File Structure

```
EngageTrack/
├── backend/
│   ├── app/
│   │   ├── models/         # SQLAlchemy models (Client, Project, Milestone, Approval, StatusUpdate)
│   │   ├── schemas/        # Marshmallow Create/Update/Response schemas + load_or_raise()
│   │   ├── services/       # Business logic (health_calculator, milestone_service, project_service)
│   │   ├── routes/         # Thin Flask blueprints (clients, projects, milestones, dashboard)
│   │   ├── errors.py       # AppError hierarchy + JSON error handlers
│   │   └── logging_config.py  # Structured JSON logging + request middleware
│   ├── migrations/         # Alembic migration history
│   ├── tests/              # pytest test suite (63 tests)
│   ├── seed.py             # Demo data (3 clients, 4 projects, mixed milestone states)
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/            # Typed API client (endpoint functions)
│   │   ├── components/
│   │   │   ├── layout/     # AppShell, Sidebar, PageHeader
│   │   │   ├── shared/     # HealthRing, StatusBadge, Skeleton, Toast, Modal, EmptyState, ProgressBar, ProjectCard
│   │   │   ├── milestones/ # MilestoneTimeline, ApprovalDialog
│   │   │   ├── status/     # StatusFeed (with inline StatusForm)
│   │   │   └── clients/    # ClientList, ClientForm
│   │   ├── hooks/          # useApi (generic fetch hook with refetch)
│   │   ├── pages/          # Dashboard, ProjectDetailPage, ClientsPage, NotFound
│   │   ├── styles/         # globals.css (CSS design token system)
│   │   ├── test/           # Vitest test suite (44 tests)
│   │   └── types/          # TypeScript domain interfaces
│   └── Dockerfile
├── docker-compose.yml
├── Makefile
└── CHECKLIST.md
```

---

## Tradeoffs & Limitations

- **No authentication.** Scoped out for time. In production this would use JWT + refresh tokens with role-based access (PM, client, admin).
- **Simplified health formula.** The current formula treats all milestones equally. A real version would weight recent milestones more heavily and factor in project stage (a slip in week 1 is less serious than week 11).
- **No real-time updates.** The UI refetches on every mutation but doesn't push changes across browser sessions. WebSocket or Server-Sent Events would fix this.
- **Engagement cap is per-client, not global.** A single PM could be overloaded across many clients — a real system would track capacity at the person level.
- **Health score history not tracked.** The current `health_score` column is overwritten on each recalculation. A time-series table would enable trend charts.

---

## What I'd Add Next

1. **Auth + RBAC** — JWT auth with PM / client / admin roles
2. **Email notifications** — alert on milestone transitions, approaching due dates, blocker added
3. **Audit trail** — append-only event log for all state changes
4. **Health score history graph** — sparkline showing score over time on the detail page
5. **Project templates** — reusable milestone sets for common engagement types
6. **Time tracking** — log hours against milestones, surface budget burn rate
7. **Client portal view** — read-only external view for clients, no internal notes visible

---

## AI Usage

This project was built with Claude Code (Anthropic's AI coding assistant) as a pair-programming tool. The AI generated the initial structure, boilerplate, and most of the implementation. My contributions:

- **Specification and direction**: I defined all business rules, the data model, the health score formula, and the UX design system before writing any code.
- **Review and debugging**: I caught and fixed several bugs introduced during generation — most notably the health calculator's early-return that ignored blockers on projects with no milestones, and the Python `logging` reserved key conflict (`message`/`name` in `extra={}`) that turned every 422 into a 500.
- **Architectural decisions**: I chose the service layer pattern, the schema split, and the milestone state machine structure. The AI implemented them to spec.
- **Test design**: I wrote the test specifications before the AI implemented them, ensuring coverage of edge cases (engagement cap variants, blocker stacking, overdue scoring).

The AI was most useful for: repetitive boilerplate (schemas, route handlers), CSS/styling work, and React component structure. It was less reliable for: cross-cutting concerns (error handling propagation), subtle Python behavior (logging reserved keys), and business rule edge cases — those required careful review.
