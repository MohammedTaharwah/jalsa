import logging
from typing import List, Any, Union, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.question import Question
from app.models.category import Category
from app.core.deps import verify_n8n_webhook_key

logger = logging.getLogger("qna_backend.webhooks")

router = APIRouter(prefix="/api/webhooks", tags=["Webhooks & Integrations"])


@router.post(
    "/n8n-receive",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(verify_n8n_webhook_key)]
)
async def receive_n8n_questions(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Webhook Receiver: Receives generated questions JSON from n8n AI Agent.
    - Security: Protected by custom 'X-N8N-API-KEY' header.
    - Behavior: Validates and saves each question into PostgreSQL with status='pending'.
    """
    try:
        body_data = await request.json()
    except Exception as e:
        logger.error(f"Malformed JSON from n8n webhook: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON payload provided"
        )

    # 1. Normalize input into a list of questions and general metadata
    questions_list: List[Dict[str, Any]] = []
    top_level_category_id = None
    top_level_category_name = None

    if isinstance(body_data, list):
        questions_list = body_data
    elif isinstance(body_data, dict):
        top_level_category_id = body_data.get("category_id")
        top_level_category_name = body_data.get("category_name")

        if "questions" in body_data and isinstance(body_data["questions"], list):
            questions_list = body_data["questions"]
        elif "items" in body_data and isinstance(body_data["items"], list):
            questions_list = body_data["items"]
        elif "question_text" in body_data:
            # Single question payload
            questions_list = [body_data]
        else:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Payload must contain a 'questions' list or array of question items."
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Unsupported payload structure."
        )

    if not questions_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No questions found in the received payload."
        )

    # 2. Process and save each question
    saved_questions = []

    for idx, item in enumerate(questions_list):
        if not isinstance(item, dict):
            logger.warning(f"Skipping non-dict question item at index {idx}: {item}")
            continue

        q_text = item.get("question_text")
        if not q_text:
            logger.warning(f"Missing question_text at item {idx}")
            continue

        options = item.get("options_json") or item.get("options") or []
        correct_ans = item.get("correct_answer")
        points = item.get("points_level", 100)
        media_url = item.get("media_url")

        # Resolve category
        item_cat_id = item.get("category_id") or top_level_category_id
        item_cat_name = item.get("category_name") or top_level_category_name

        resolved_category_id = None
        if item_cat_id:
            cat_obj = db.query(Category).filter(Category.id == item_cat_id).first()
            if cat_obj:
                resolved_category_id = cat_obj.id

        if not resolved_category_id and item_cat_name:
            cat_obj = db.query(Category).filter(Category.name == item_cat_name).first()
            if not cat_obj:
                cat_obj = Category(name=item_cat_name, description="تم الإنشاء آلياً عبر n8n AI Agent")
                db.add(cat_obj)
                db.commit()
                db.refresh(cat_obj)
            resolved_category_id = cat_obj.id

        # Fallback to first existing category or default "عام"
        if not resolved_category_id:
            fallback_cat = db.query(Category).first()
            if not fallback_cat:
                fallback_cat = Category(name="أسئلة عامة", description="تصنيف عام افتراضي")
                db.add(fallback_cat)
                db.commit()
                db.refresh(fallback_cat)
            resolved_category_id = fallback_cat.id

        # Create new Question with status='pending'
        new_question = Question(
            category_id=resolved_category_id,
            question_text=q_text,
            options_json=options,
            correct_answer=str(correct_ans) if correct_ans is not None else "",
            points_level=int(points) if points else 100,
            media_url=media_url,
            status="pending"  # Explicit requirement: default status is pending
        )
        db.add(new_question)
        saved_questions.append(new_question)

    db.commit()

    for q in saved_questions:
        db.refresh(q)

    logger.info(f"Successfully saved {len(saved_questions)} questions from n8n webhook with status 'pending'.")

    return {
        "status": "success",
        "message": f"تم استلام وحفظ {len(saved_questions)} سؤالاً بنجاح بالحالة الافتراضية 'pending'.",
        "saved_count": len(saved_questions),
        "questions": [
            {
                "id": q.id,
                "category_id": q.category_id,
                "question_text": q.question_text,
                "options": q.options_json,
                "correct_answer": q.correct_answer,
                "points_level": q.points_level,
                "media_url": q.media_url,
                "status": q.status,
                "created_at": q.created_at
            }
            for q in saved_questions
        ]
    }
