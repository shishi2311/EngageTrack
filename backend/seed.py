"""Seed script — full implementation in later phase."""
from app import create_app
from app.extensions import db

app = create_app()

with app.app_context():
    print("Seed script placeholder — implement in Phase 2.")
