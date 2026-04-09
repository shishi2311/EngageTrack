# Agent Constraints

## Before Writing Code
1. Read the existing service layer before modifying business logic
2. Check the milestone state machine before touching transitions
3. Run existing tests: `cd backend && python -m pytest`

## After Writing Code
1. Run full test suite
2. New business rule = new test in test_business_rules.py
3. New endpoint = consistent error format (see errors.py)
4. New UI component = uses CSS variables from globals.css, not hardcoded colors

## Forbidden Actions
- Do NOT modify health_score directly
- Do NOT skip the state machine
- Do NOT add dependencies without documenting why
- Do NOT create abstract base classes
- Do NOT change the color system — all colors go through CSS variables
