from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, field_validator


# Auth
class RegisterRequest(BaseModel):
    username: str
    password: str

    @field_validator("username")
    @classmethod
    def username_valid(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Username must be at least 2 characters")
        if len(v) > 50:
            raise ValueError("Username must be at most 50 characters")
        return v

    @field_validator("password")
    @classmethod
    def password_valid(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class LoginRequest(BaseModel):
    username: str
    password: str


# User
class UserOut(BaseModel):
    id: str
    username: str
    theme: str
    is_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UpdateMeRequest(BaseModel):
    theme: Optional[str] = None

    @field_validator("theme")
    @classmethod
    def theme_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ("light", "dark", "system"):
            raise ValueError("theme must be light, dark, or system")
        return v


# Board
class BoardCreate(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be empty")
        return v


class BoardUpdate(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be empty")
        return v


class CardOut(BaseModel):
    id: str
    column_id: str
    title: str
    description: Optional[str]
    position: int
    label: Optional[str]
    due_date: Optional[date]
    created_at: datetime

    model_config = {"from_attributes": True}


class ColumnOut(BaseModel):
    id: str
    board_id: str
    name: str
    position: int
    cards: list[CardOut] = []

    model_config = {"from_attributes": True}


class BoardOut(BaseModel):
    id: str
    owner_id: str
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class BoardDetailOut(BaseModel):
    id: str
    owner_id: str
    name: str
    created_at: datetime
    columns: list[ColumnOut] = []

    model_config = {"from_attributes": True}


# Column
class ColumnCreate(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be empty")
        return v


class ColumnUpdate(BaseModel):
    name: Optional[str] = None
    position: Optional[int] = None


# Card
class CardCreate(BaseModel):
    title: str
    description: Optional[str] = None
    label: Optional[str] = None
    due_date: Optional[date] = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Title cannot be empty")
        return v


class CardUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    label: Optional[str] = None
    due_date: Optional[date] = None
    column_id: Optional[str] = None
    position: Optional[int] = None
