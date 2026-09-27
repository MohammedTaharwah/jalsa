from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class PowerUpBase(BaseModel):
    name: str
    description: Optional[str] = None
    cost: Optional[int] = 50


class PowerUpCreate(PowerUpBase):
    pass


class PowerUpUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    cost: Optional[int] = None


class PowerUpOut(PowerUpBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
