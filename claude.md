# EngageTrack — AI Development Guide

## Project Context
Agency-style client project tracker. Small codebase — prioritize clarity over abstraction.

## Architecture Rules
- Service layer owns all business logic. Routes are thin.
- Health score is COMPUTED, never manually set.
- Milestone state machine is the core invariant — always go through MilestoneService.transition_status().

## Code Style
- Python: snake_case, type hints, docstrings on public methods
- TypeScript: strict mode, no `any`, interfaces for domain objects
- Max function length: 30 lines
- Comments explain WHY, not WHAT

## Frontend Rules
- Use the CSS variables defined in globals.css for ALL colors — never hardcode hex values in components
- Every interactive element needs hover + active states
- Loading states use Skeleton components, not spinners
- Empty states always have a CTA guiding the user
- Animations: use CSS transitions for simple state changes, CSS keyframes for complex sequences

## Error Handling
- Service layer raises custom exceptions
- Route layer catches and maps to HTTP responses
- Frontend shows Toast for all API errors

## What NOT to Do
- Don't add authentication
- Don't use localStorage for state management
- Don't over-abstract
- Don't use generic fonts — stick to DM Sans + JetBrains Mono
