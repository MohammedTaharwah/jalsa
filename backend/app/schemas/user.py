from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: Optional[str] = "player"


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    balance: Optional[int] = None
    role: Optional[str] = None


class UserBalanceUpdate(BaseModel):
    points_delta: int  # Can be positive (earn points) or negative (spend on powerups)


class UserOut(UserBase):
    id: int
    balance: int
    games_balance: int = 1
    is_verified: bool = False
    role: str = "player"
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
