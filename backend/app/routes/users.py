from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import UserOut, UpdateMeRequest
from app.auth import get_current_user

router = APIRouter(prefix="/api", tags=["users"])


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserOut)
def update_me(
    body: UpdateMeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.theme is not None:
        current_user.theme = body.theme
    db.commit()
    db.refresh(current_user)
    return current_user
