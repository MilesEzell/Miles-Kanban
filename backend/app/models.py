import uuid
from datetime import datetime, date
from sqlalchemy import String, Boolean, Integer, ForeignKey, Text, Date, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


def new_uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    username: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    theme: Mapped[str] = mapped_column(String, default="system")
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    boards: Mapped[list["Board"]] = relationship("Board", back_populates="owner", cascade="all, delete-orphan")


class Board(Base):
    __tablename__ = "boards"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    owner_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    owner: Mapped["User"] = relationship("User", back_populates="boards")
    columns: Mapped[list["Column"]] = relationship(
        "Column", back_populates="board", cascade="all, delete-orphan",
        order_by="Column.position"
    )


class Column(Base):
    __tablename__ = "columns"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    board_id: Mapped[str] = mapped_column(String, ForeignKey("boards.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    board: Mapped["Board"] = relationship("Board", back_populates="columns")
    cards: Mapped[list["Card"]] = relationship(
        "Card", back_populates="column", cascade="all, delete-orphan",
        order_by="Card.position"
    )


class Card(Base):
    __tablename__ = "cards"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    column_id: Mapped[str] = mapped_column(String, ForeignKey("columns.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    label: Mapped[str | None] = mapped_column(String, nullable=True)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    column: Mapped["Column"] = relationship("Column", back_populates="cards")
