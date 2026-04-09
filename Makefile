.PHONY: setup backend-run frontend-run test test-frontend test-coverage seed db-migrate db-upgrade db-reset lint clean

setup:
	cd backend && python3 -m venv venv && . venv/bin/activate && pip install -r requirements.txt
	cd backend && cp -n .env.example .env || true
	cd frontend && npm install
	cd frontend && cp -n .env.example .env || true
	@echo "Setup complete. Run 'make db-upgrade' then 'make seed' to initialize the database."

backend-run:
	cd backend && . venv/bin/activate && flask run --debug --port 5000

frontend-run:
	cd frontend && npm run dev

test:
	cd backend && . venv/bin/activate && python -m pytest -v

test-frontend:
	cd frontend && npm test

test-coverage:
	cd backend && . venv/bin/activate && python -m pytest -v --tb=short

seed:
	cd backend && . venv/bin/activate && python seed.py

db-migrate:
	cd backend && . venv/bin/activate && flask db migrate -m "$(msg)"

db-upgrade:
	cd backend && . venv/bin/activate && flask db upgrade

db-reset:
	cd backend && . venv/bin/activate && flask db downgrade base && flask db upgrade && python seed.py

clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete 2>/dev/null || true
	rm -f backend/*.db
