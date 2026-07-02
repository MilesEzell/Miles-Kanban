# Kanban Board

A self-hosted Kanban board with drag-and-drop, multiple user accounts, dark mode, and one-command Docker deployment.

## Quick start

```bash
cp .env.example .env
# Edit .env — set SECRET_KEY and ADMIN_PASSWORD at minimum
docker compose up --build
```

Then open http://localhost:8080.

## Features

- **Boards, columns, cards** — drag to reorder within and between columns, drag columns left/right
- **Card details** — title, description, color label, due date
- **Multiple accounts** — each user sees only their own boards
- **Dark / light / system theme** — saved per account, no flash on load
- **One-command deploy** — two containers (FastAPI + Nginx), SQLite file on a named volume

## Configuration

All config via environment variables (or a `.env` file):

| Variable | Default | Description |
|---|---|---|
| `SECRET_KEY` | `change_me_…` | Session signing key — **must change** for any real deployment |
| `ALLOW_REGISTRATION` | `true` | Set `false` to disable self-registration |
| `ADMIN_USERNAME` | `admin` | Username of the admin account seeded on first boot |
| `ADMIN_PASSWORD` | `admin1234` | Password for that admin account — **must change** |
| `PORT` | `8080` | Host port the app listens on |

## Development

**Backend:**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
DATABASE_URL=sqlite:///./dev.db alembic upgrade head
DATABASE_URL=sqlite:///./dev.db python seed.py
DATABASE_URL=sqlite:///./dev.db uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev   # proxies /api to localhost:8000
```

## Architecture

```
Browser → Nginx (port 8080)
            ├── static files  (React SPA)
            └── /api/*        → FastAPI (port 8000, internal)
                                  └── SQLite (/data/kanban.db, named volume)
```

Two Docker services. No external database process. Data survives container restarts via the `db_data` named volume.

## Security notes

- Passwords hashed with bcrypt
- HTTP-only session cookies, `SameSite=Lax`
- Every board/column/card operation verifies ownership — 404 if not yours
- For internet-facing deployments: put a TLS-terminating reverse proxy (Caddy, Traefik, Nginx) in front
