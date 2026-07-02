from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload
from app.database import get_db
from app.models import User, Board, Column
from app.schemas import BoardCreate, BoardUpdate, BoardOut, BoardDetailOut, ColumnCreate, ColumnOut, ColumnUpdate
from app.auth import get_current_user

router = APIRouter(prefix="/api", tags=["boards"])

POSITION_GAP = 1000


def _own_board(board_id: str, user: User, db: Session) -> Board:
    board = db.query(Board).filter(Board.id == board_id, Board.owner_id == user.id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    return board


@router.get("/boards", response_model=list[BoardOut])
def list_boards(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Board).filter(Board.owner_id == current_user.id).order_by(Board.created_at).all()


@router.post("/boards", response_model=BoardOut, status_code=status.HTTP_201_CREATED)
def create_board(body: BoardCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    board = Board(owner_id=current_user.id, name=body.name)
    db.add(board)
    db.commit()
    db.refresh(board)
    return board


@router.get("/boards/{board_id}", response_model=BoardDetailOut)
def get_board(board_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    board = (
        db.query(Board)
        .options(selectinload(Board.columns).selectinload(Column.cards))
        .filter(Board.id == board_id, Board.owner_id == current_user.id)
        .first()
    )
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    return board


@router.patch("/boards/{board_id}", response_model=BoardOut)
def update_board(
    board_id: str,
    body: BoardUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    board = _own_board(board_id, current_user, db)
    board.name = body.name
    db.commit()
    db.refresh(board)
    return board


@router.delete("/boards/{board_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_board(board_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    board = _own_board(board_id, current_user, db)
    db.delete(board)
    db.commit()


# Columns
@router.post("/boards/{board_id}/columns", response_model=ColumnOut, status_code=status.HTTP_201_CREATED)
def create_column(
    board_id: str,
    body: ColumnCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    board = _own_board(board_id, current_user, db)
    max_pos = db.query(Column).filter(Column.board_id == board.id).count()
    col = Column(board_id=board.id, name=body.name, position=(max_pos + 1) * POSITION_GAP)
    db.add(col)
    db.commit()
    db.refresh(col)
    return col


@router.patch("/columns/{column_id}", response_model=ColumnOut)
def update_column(
    column_id: str,
    body: ColumnUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    col = db.get(Column, column_id)
    if not col:
        raise HTTPException(status_code=404, detail="Column not found")
    _own_board(col.board_id, current_user, db)
    if body.name is not None:
        col.name = body.name
    if body.position is not None:
        col.position = body.position
    db.commit()
    db.refresh(col)
    return col


@router.delete("/columns/{column_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_column(column_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    col = db.get(Column, column_id)
    if not col:
        raise HTTPException(status_code=404, detail="Column not found")
    _own_board(col.board_id, current_user, db)
    db.delete(col)
    db.commit()
