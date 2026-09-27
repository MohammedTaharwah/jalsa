from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel


class QuestionBase(BaseModel):
    category_id: int
    question_text: str
    options_json: List[Any]  # e.g., ["Option A", "Option B", "Option C", "Option D"]
    correct_answer: str
    points_level: Optional[int] = 100
    media_url: Optional[str] = None
    status: Optional[str] = "active"


class QuestionCreate(QuestionBase):
    pass


class QuestionUpdate(BaseModel):
    category_id: Optional[int] = None
    question_text: Optional[str] = None
    options_json: Optional[List[Any]] = None
    correct_answer: Optional[str] = None
    points_level: Optional[int] = None
    media_url: Optional[str] = None
    status: Optional[str] = None


class QuestionOut(QuestionBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
