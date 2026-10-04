import logging
from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.five_seconds import FiveSecondsQuestion
from app.models.user import User
from app.core.deps import require_admin

logger = logging.getLogger("qna_backend.five_seconds")

router = APIRouter(prefix="/api/five-seconds", tags=["Five Seconds Game"])


class FiveSecondsQuestionCreate(BaseModel):
    category: str = Field(default="عام", description="فئة السؤال")
    prompt: str = Field(..., min_length=5, description="نص التحدي (مثال: اذكر 3 دول...)")


class FiveSecondsQuestionOut(BaseModel):
    id: int
    category: str
    prompt: str

    class Config:
        from_attributes = True


class FiveSecondsBulkImport(BaseModel):
    questions: List[FiveSecondsQuestionCreate]


# -------------------------------------------------------------
# Public Endpoint: Get all questions for playing
# -------------------------------------------------------------
@router.get("/questions", response_model=List[FiveSecondsQuestionOut])
def get_all_five_seconds_questions(db: Session = Depends(get_db)):
    """جلب كافة أسئلة تحدي الـ 5 ثواني للعب."""
    return db.query(FiveSecondsQuestion).order_by(FiveSecondsQuestion.id.asc()).all()


# -------------------------------------------------------------
# Admin Endpoints: Add, Bulk Upload, Delete
# -------------------------------------------------------------
@router.post("/questions", response_model=FiveSecondsQuestionOut, status_code=status.HTTP_201_CREATED)
def create_five_seconds_question(
    payload: FiveSecondsQuestionCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """إضافة سؤال تحدي 5 ثواني جديد من لوحة تحكم المدير."""
    new_q = FiveSecondsQuestion(
        category=payload.category.strip() or "عام",
        prompt=payload.prompt.strip()
    )
    db.add(new_q)
    db.commit()
    db.refresh(new_q)
    return new_q


@router.post("/questions/bulk", response_model=dict, status_code=status.HTTP_201_CREATED)
def bulk_import_five_seconds_questions(
    payload: FiveSecondsBulkImport,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """رفع واستيراد دفعة أسئلة مجمعة لتحدي الـ 5 ثواني."""
    added_count = 0
    for q_data in payload.questions:
        prompt_clean = q_data.prompt.strip()
        if prompt_clean:
            db.add(FiveSecondsQuestion(
                category=q_data.category.strip() or "عام",
                prompt=prompt_clean
            ))
            added_count += 1
    db.commit()
    return {"success": True, "added_count": added_count, "message": f"تم رفع {added_count} سؤال بنجاح!"}


@router.delete("/questions/{question_id}", response_model=dict)
def delete_five_seconds_question(
    question_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """حذف سؤال من تحدي الـ 5 ثواني."""
    q = db.query(FiveSecondsQuestion).filter(FiveSecondsQuestion.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="السؤال غير موجود")
    db.delete(q)
    db.commit()
    return {"success": True, "message": "تم حذف السؤال بنجاح"}
