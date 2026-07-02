from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Card, Column, Board
from app.schemas import CardCreate, CardUpdate, CardOut
from app.auth import get_current_user

router = APIRouter(prefix="/api", tags=["cards"])

POSITION_GAP = 1000


def _own_column(column_id: str, user: User, db: Session) -> Column:
    col = db.get(Column, column_id)
    if not col:
        raise HTTPException(status_code=404, detail="Column not found")
    board = db.query(Board).filter(Board.id == col.board_id, Board.owner_id == user.id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Column not found")
    return col


@router.post("/columns/{column_id}/cards", response_model=CardOut, status_code=status.HTTP_201_CREATED)
def create_card(
    column_id: str,
    body: CardCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    col = _own_column(column_id, current_user, db)
    max_pos = db.query(Card).filter(Card.column_id == col.id).count()
    card = Card(
        column_id=col.id,
        title=body.title,
        description=body.description,
        label=body.label,
        due_date=body.due_date,
        position=(max_pos + 1) * POSITION_GAP,
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


@router.patch("/cards/{card_id}", response_model=CardOut)
def update_card(
    card_id: str,
    body: CardUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card = db.get(Card, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    _own_column(card.column_id, current_user, db)

    if body.title is not None:
        card.title = body.title.strip()
    if body.description is not None:
        card.description = body.description
    if body.label is not None:
        card.label = body.label
    if "label" in body.model_fields_set and body.label is None:
        card.label = None
    if body.due_date is not None:
        card.due_date = body.due_date
    if "due_date" in body.model_fields_set and body.due_date is None:
        card.due_date = None
    if body.column_id is not None:
        _own_column(body.column_id, current_user, db)
        card.column_id = body.column_id
    if body.position is not None:
        card.position = body.position

    db.commit()
    db.refresh(card)
    return card


@router.delete("/cards/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_card(card_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    card = db.get(Card, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    _own_column(card.column_id, current_user, db)
    db.delete(card)
    db.commit()
