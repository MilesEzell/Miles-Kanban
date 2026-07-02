"""Seed initial admin user on first boot if env vars are set."""
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models import User
from app.auth import hash_password
from app.config import settings


def seed():
    if not settings.admin_username or not settings.admin_password:
        return
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.username == settings.admin_username).first()
        if existing:
            return
        admin = User(
            username=settings.admin_username,
            password_hash=hash_password(settings.admin_password),
            is_admin=True,
            created_at=datetime.utcnow(),
        )
        db.add(admin)
        db.commit()
        print(f"Seeded admin user: {settings.admin_username}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
