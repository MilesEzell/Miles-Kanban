from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from app.config import settings
from app.routes import auth, users, boards, cards

app = FastAPI(title="Kanban API", docs_url="/api/docs", redoc_url=None)

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.secret_key,
    session_cookie="kanban_session",
    max_age=settings.session_max_age,
    same_site="lax",
    https_only=False,
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(boards.router)
app.include_router(cards.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
