from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.question import Question
from app.models.category import Category
from app.models.user import User
from app.schemas.question import QuestionCreate, QuestionUpdate, QuestionOut
from app.core.deps import require_admin

router = APIRouter(prefix="/questions", tags=["Questions"])


@router.get("/", response_model=List[QuestionOut])
def get_questions(
    category_id: Optional[int] = Query(None, description="Filter by category"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (e.g. active)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Public route: Retrieve list of questions with optional category and status filters."""
    query = db.query(Question)
    if category_id is not None:
        query = query.filter(Question.category_id == category_id)
    if status_filter is not None:
        query = query.filter(Question.status == status_filter)

    return query.offset(skip).limit(limit).all()


@router.get("/{question_id}", response_model=QuestionOut)
def get_question(question_id: int, db: Session = Depends(get_db)):
    """Public route: Retrieve question details by ID."""
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    return q


@router.post("/", response_model=QuestionOut, status_code=status.HTTP_201_CREATED)
def create_question(
    question_in: QuestionCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Admin route: Create a new question (Requires admin privileges)."""
    # Verify that the referenced category exists
    cat = db.query(Category).filter(Category.id == question_in.category_id).first()
    if not cat:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category with ID {question_in.category_id} does not exist"
        )

    new_question = Question(
        category_id=question_in.category_id,
        question_text=question_in.question_text,
        options_json=question_in.options_json,
        correct_answer=question_in.correct_answer,
        points_level=question_in.points_level or 100,
        media_url=question_in.media_url,
        status=question_in.status or "active"
    )
    db.add(new_question)
    db.commit()
    db.refresh(new_question)
    return new_question


@router.put("/{question_id}", response_model=QuestionOut)
def update_question(
    question_id: int,
    question_in: QuestionUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Admin route: Update an existing question (Requires admin privileges)."""
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    if question_in.category_id is not None:
        cat = db.query(Category).filter(Category.id == question_in.category_id).first()
        if not cat:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category with ID {question_in.category_id} does not exist"
            )
        q.category_id = question_in.category_id

    if question_in.question_text is not None:
        q.question_text = question_in.question_text
    if question_in.options_json is not None:
        q.options_json = question_in.options_json
    if question_in.correct_answer is not None:
        q.correct_answer = question_in.correct_answer
    if question_in.points_level is not None:
        q.points_level = question_in.points_level
    if question_in.media_url is not None:
        q.media_url = question_in.media_url
    if question_in.status is not None:
        q.status = question_in.status

    db.commit()
    db.refresh(q)
    return q


@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Admin route: Delete a question (Requires admin privileges)."""
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    db.delete(q)
    db.commit()
    return None
