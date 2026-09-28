import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, func

from app.database import get_db
from app.models.question import Question
from app.models.category import Category
from app.models.seen_question import UserSeenQuestions
from app.models.user import User
from app.schemas.question import QuestionOut
from app.schemas.seen_question import (
    RecordSeenQuestionsRequest,
    SeenQuestionsResponse,
    BoardFetchRequest,
    BoardCategoryOut,
    BoardTileOut
)

logger = logging.getLogger("qna_backend.game")
router = APIRouter(prefix="/game", tags=["Game Engine & Seen Questions"])


KEY_TO_NAME_MAP = {
    "sports": "رياضة ولياقة",
    "history": "تاريخ وحضارات",
    "science": "علوم وفضاء",
    "cinema": "أفلام وسينما",
    "general": "ثقافة عامة",
    "tech": "تكنولوجيا واختراعات",
    "geography": "جغرافيا وسفر",
    "arts": "فنون وأدب",
}


def _fetch_board_categories_logic(
    category_ids: List[Any],
    user_id: Optional[int],
    db: Session
) -> List[BoardCategoryOut]:
    """
    منطق الترشيح الموجه (Filtered Randomness) لجلب لوحة الأسئلة من قاعدة البيانات:
    - لكل فئة من الفئات المختارة:
      * سحب سؤالين عشوائيين بمستوى 200 نقطة لم يسبق للمستخدم مشاهدتها.
      * سحب سؤالين عشوائيين بمستوى 400 نقطة لم يسبق للمستخدم مشاهدتها.
      * سحب سؤالين عشوائيين بمستوى 600 نقطة لم يسبق للمستخدم مشاهدتها.
    - يدعم الاستعلام بالمفتاح النصي (مثل 'sports') أو المعرف الرقمي (مثل 1).
    """
    seen_subquery = None
    if user_id:
        seen_subquery = (
            select(UserSeenQuestions.question_id)
            .where(UserSeenQuestions.user_id == user_id)
        )

    board_output: List[BoardCategoryOut] = []

    for raw_cat_id in category_ids:
        cat = None
        # Try integer ID
        if isinstance(raw_cat_id, int) or (isinstance(raw_cat_id, str) and raw_cat_id.isdigit()):
            cat = db.query(Category).filter(Category.id == int(raw_cat_id)).first()

        # Try key mapping
        if not cat and str(raw_cat_id) in KEY_TO_NAME_MAP:
            target_name = KEY_TO_NAME_MAP[str(raw_cat_id)]
            cat = db.query(Category).filter(Category.name == target_name).first()

        # Try name likeness
        if not cat:
            cat = db.query(Category).filter(Category.name.ilike(f"%{raw_cat_id}%")).first()

        # Fallback to any category
        if not cat:
            cat = db.query(Category).first()

        actual_cat_id = cat.id if cat else 1
        cat_name = cat.name if cat else f"فئة {raw_cat_id}"

        tiles: List[BoardTileOut] = []

        # Difficulty tiers: 200, 400, 600 (each tier gets 2 questions -> 6 questions total)
        for pts in [200, 400, 600]:
            q_query = db.query(Question).filter(
                Question.category_id == actual_cat_id,
                Question.points_level == pts
            )

            # Exclude already seen questions for this user
            if seen_subquery is not None:
                q_query = q_query.filter(Question.id.not_in(seen_subquery))

            # Filtered randomness: Fetch 2 random questions for this difficulty tier (LIMIT 2)
            selected_questions = q_query.order_by(func.random()).limit(2).all()

            for q in selected_questions:
                tiles.append(
                    BoardTileOut(
                        points=pts,
                        is_available=True,
                        question=q,
                        message=None
                    )
                )

            # Fallback: if fewer than 2 questions are available in this tier
            for _ in range(2 - len(selected_questions)):
                tiles.append(
                    BoardTileOut(
                        points=pts,
                        is_available=False,
                        question=None,
                        message=f"نفدت الأسئلة غير المستهلكة لمستوى {pts} نقطة في فئة {cat_name}"
                    )
                )

        # Sort the 6 questions ascending: 200, 200, 400, 400, 600, 600
        tiles.sort(key=lambda t: t.points)

        board_output.append(
            BoardCategoryOut(
                category_id=raw_cat_id,
                category_name=cat_name,
                tiles=tiles
            )
        )

    return board_output


@router.post("/board-fetch", response_model=List[BoardCategoryOut])
def fetch_game_board_post(
    payload: BoardFetchRequest,
    db: Session = Depends(get_db)
):
    """
    جلب أسئلة اللوحة الرئيسية بنظام العشوائية الموجهة (Filtered Randomness) عبر POST من قاعدة البيانات.
    """
    return _fetch_board_categories_logic(payload.category_ids, payload.user_id, db)


@router.get("/board-fetch", response_model=List[BoardCategoryOut])
def fetch_game_board_get(
    category_ids: List[str] = Query(..., description="معرفات أو مفاتيح الفئات"),
    user_id: Optional[int] = Query(None, description="معرف المستخدم"),
    db: Session = Depends(get_db)
):
    """
    جلب أسئلة اللوحة الرئيسية بنظام العشوائية الموجهة (Filtered Randomness) عبر GET.
    """
    return _fetch_board_categories_logic(category_ids, user_id, db)


@router.get("/questions/unseen", response_model=List[QuestionOut])
def get_unseen_questions_for_category(
    category_id: int,
    user_id: Optional[int] = Query(None, description="معرف المستخدم لاستبعاد الأسئلة التي شاهدها مسبقاً"),
    limit: int = Query(3, ge=1, le=20),
    db: Session = Depends(get_db)
):
    """
    جلب أسئلة فئة معينة مع استثناء (Exclude) أي سؤال موجود في جدول UserSeenQuestions الخاص بالمستخدم.
    إذا نفدت الأسئلة الجديدة بالكامل، يعيد الـ API خطأ 404 مع رسالة واضحة.
    """
    cat = db.query(Category).filter(Category.id == category_id).first()
    cat_name = cat.name if cat else f"فئة رقم {category_id}"

    query = db.query(Question).filter(Question.category_id == category_id)

    if user_id:
        seen_subquery = (
            select(UserSeenQuestions.question_id)
            .where(UserSeenQuestions.user_id == user_id)
        )
        query = query.filter(Question.id.not_in(seen_subquery))

    total_in_cat = db.query(Question).filter(Question.category_id == category_id).count()
    if total_in_cat == 0:
        return []

    unseen_questions = query.limit(limit).all()

    if not unseen_questions:
        logger.warning(f"All questions exhausted for category '{cat_name}' and user {user_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"لقد استهلكت جميع أسئلة هذه الفئة! اختر فئة أخرى أو قم بتوليد أسئلة جديدة."
        )

    return unseen_questions


@router.post("/record-seen", response_model=SeenQuestionsResponse)
def record_seen_questions(
    payload: RecordSeenQuestionsRequest,
    db: Session = Depends(get_db)
):
    """
    تسجيل الأسئلة التي تم عرضها واستخدامها في الجلسة الحالية لمنع تكرارها لنفس المستخدم.
    """
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        user = db.query(User).order_by(User.id.asc()).first()
        if not user:
            return SeenQuestionsResponse(
                success=True,
                recorded_count=0,
                message="تم تخطي الحفظ لعدم وجود مستخدم مسجل"
            )

    valid_db_questions = set(
        qid[0] for qid in db.query(Question.id).filter(Question.id.in_(payload.question_ids)).all()
    )

    recorded_count = 0
    for q_id in payload.question_ids:
        if q_id not in valid_db_questions:
            continue

        exists = db.query(UserSeenQuestions).filter(
            and_(
                UserSeenQuestions.user_id == user.id,
                UserSeenQuestions.question_id == q_id
            )
        ).first()

        if not exists:
            seen_entry = UserSeenQuestions(user_id=user.id, question_id=q_id)
            db.add(seen_entry)
            recorded_count += 1

    db.commit()
    logger.info(f"Recorded {recorded_count} seen questions for user {user.id}")

    return SeenQuestionsResponse(
        success=True,
        recorded_count=recorded_count,
        message=f"تم تسجيل {recorded_count} سؤال في قائمة الأسئلة المستهلكة بنجاح."
    )


@router.post("/reset-seen")
def reset_user_seen_history(
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    إعادة تصفير سجل الأسئلة المستهلكة للمستخدم في حال رغب بإعادة لعب كافة الأسئلة.
    """
    deleted = db.query(UserSeenQuestions).filter(
        UserSeenQuestions.user_id == user_id
    ).delete()
    db.commit()

    return {
        "success": True,
        "message": f"تم تصفير سجل الأسئلة المستهلكة ({deleted} سؤال) بنجاح."
    }
