from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class CategoryBase(BaseModel):
    name: str
    section: Optional[str] = "عام"
    description: Optional[str] = None
    image_url: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    section: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None


class CategoryOut(CategoryBase):
    id: int
    created_at: Optional[datetime] = None
    questions_count: Optional[int] = 0

    class Config:
        from_attributes = True
