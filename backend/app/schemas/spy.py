from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class SpyWordBase(BaseModel):
    word: str
    hint: Optional[str] = None


class SpyWordCreate(SpyWordBase):
    pass


class SpyWordOut(SpyWordBase):
    id: int
    category_id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SpyCategoryBase(BaseModel):
    name: str
    name_ar: Optional[str] = None
    icon: Optional[str] = "Sparkles"
    description: Optional[str] = None


class SpyCategoryCreate(SpyCategoryBase):
    pass


class SpyCategoryUpdate(BaseModel):
    name: Optional[str] = None
    name_ar: Optional[str] = None
    icon: Optional[str] = None
    description: Optional[str] = None


class SpyCategoryOut(SpyCategoryBase):
    id: int
    words_count: Optional[int] = 0
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SpyCategoryWithWords(SpyCategoryBase):
    id: int
    words: List[SpyWordOut] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SpyBulkCategoryImport(BaseModel):
    name: str
    name_ar: Optional[str] = None
    icon: Optional[str] = "Sparkles"
    description: Optional[str] = None
    words: List[str] = []
