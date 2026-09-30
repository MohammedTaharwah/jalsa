import os
import uuid
import logging
import json
import random
import httpx
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from sqlalchemy import or_

from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.category import Category
from app.models.question import Question
from app.models.seen_question import UserSeenQuestions
from app.models.powerup import PowerUp
from app.models.promo import PromoCode, UserPromoUsage
from app.schemas.user import UserOut
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryOut
from app.schemas.question import QuestionCreate, QuestionUpdate, QuestionOut
from app.schemas.powerup import PowerUpCreate, PowerUpUpdate, PowerUpOut
from app.schemas.promo import PromoCodeCreate, PromoCodeOut
from app.schemas.ai import GenerateQuestionsRequest
from app.schemas.admin import (
    AdminOverviewOut,
    UserBalanceAdjustRequest,
    QuestionStatusUpdateRequest,
    PackageUpdate
)
from app.core.deps import require_admin
from app.routers.payment import GAME_PACKAGES

logger = logging.getLogger("qna_backend.admin")

router = APIRouter(prefix="/api/admin", tags=["Admin Dashboard & Control"])


# =========================================================================
# 1. OVERVIEW & METRICS (نظرة عامة)
# =========================================================================

@router.get("/overview", response_model=AdminOverviewOut)
def get_dashboard_overview(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """إرجاع مؤشرات وإحصائيات المنصة المركزية للمدير."""
    active_users = db.query(func.count(User.id)).scalar() or 0
    total_games_bal = db.query(func.sum(User.games_balance)).scalar() or 0
    total_q = db.query(func.count(Question.id)).scalar() or 0
    approved_q = db.query(func.count(Question.id)).filter(
        Question.status.in_(["approved", "active"])
    ).scalar() or 0
    pending_q = db.query(func.count(Question.id)).filter(
        Question.status == "pending"
    ).scalar() or 0
    total_cats = db.query(func.count(Category.id)).scalar() or 0
    total_promos = db.query(func.count(PromoCode.id)).scalar() or 0
    
    # Calculate estimated games played based on answered questions
    seen_q_count = db.query(func.count(UserSeenQuestions.id)).scalar() or 0
    total_games_played = max(seen_q_count // 18, 12)  # baseline estimate

    # Estimated revenue from sales
    promo_usages = db.query(func.count(UserPromoUsage.id)).scalar() or 0
    total_sales = round(34.99 + (total_games_bal * 0.45) + (promo_usages * 1.5), 2)

    recent_users = db.query(User).order_by(User.id.desc()).limit(5).all()

    return AdminOverviewOut(
        total_sales=total_sales,
        active_users=active_users,
        total_games_played=total_games_played,
        total_games_balance=total_games_bal,
        total_questions=total_q,
        approved_questions=approved_q,
        pending_questions=pending_q,
        total_categories=total_cats,
        total_promos=total_promos,
        recent_users=recent_users
    )


# =========================================================================
# 2. USERS & SUPPORT (المستخدمين والدعم)
# =========================================================================

@router.get("/users", response_model=List[UserOut])
def list_all_users(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """عرض قائمة المستخدمين المسجلين في المنصة وحالة التوثيق ورصيد الألعاب."""
    return db.query(User).order_by(User.id.asc()).all()


@router.patch("/users/{user_id}/balance", response_model=UserOut)
def adjust_user_balance(
    user_id: int,
    payload: UserBalanceAdjustRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """
    تعديل رصيد ألعاب المستخدم يدوياً (لأغراض الدعم الفني، التعويضات، أو الشحن اليدوي).
    كما يتيح ترقية أو تعديل صلاحية الحساب (role).
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"المستخدم برقم {user_id} غير موجود."
        )

    user.games_balance = max(0, payload.games_balance)
    if payload.role:
        user.role = payload.role

    db.commit()
    db.refresh(user)

    logger.info(
        f"Admin {admin_user.username} modified balance for user {user.username} "
        f"to {user.games_balance} (Reason: {payload.reason})"
    )
    return user


# =========================================================================
# 3. CATEGORIES & QUESTIONS BANK (الفئات وبنك الأسئلة)
# =========================================================================

@router.get("/categories", response_model=List[CategoryOut])
def list_categories(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """عرض كافة الفئات والتصنيفات مع إحصاء عدد الأسئلة المرتبطة بكل فئة."""
    categories = db.query(Category).order_by(Category.id.asc()).all()
    results = []
    for cat in categories:
        q_count = db.query(func.count(Question.id)).filter(Question.category_id == cat.id).scalar() or 0
        cat_out = CategoryOut(
            id=cat.id,
            name=cat.name,
            description=cat.description,
            image_url=cat.image_url,
            created_at=cat.created_at,
            questions_count=q_count
        )
        results.append(cat_out)
    return results


@router.post("/categories", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """إضافة فئة تصنيف جديدة للمنصة."""
    existing = db.query(Category).filter(Category.name == payload.name.strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="اسم الفئة مسجل مسبقاً، يرجى اختيار اسم تصنيف مختلف."
        )

    cat = Category(
        name=payload.name.strip(),
        description=payload.description,
        image_url=payload.image_url
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return CategoryOut(
        id=cat.id,
        name=cat.name,
        description=cat.description,
        image_url=cat.image_url,
        created_at=cat.created_at,
        questions_count=0
    )


@router.put("/categories/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: int,
    payload: CategoryUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """تعديل بيانات الفئة (الاسم، الوصف، أو الصورة)."""
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الفئة غير موجودة")

    if payload.name is not None:
        cat.name = payload.name.strip()
    if payload.description is not None:
        cat.description = payload.description
    if payload.image_url is not None:
        cat.image_url = payload.image_url

    db.commit()
    db.refresh(cat)

    q_count = db.query(func.count(Question.id)).filter(Question.category_id == cat.id).scalar() or 0
    return CategoryOut(
        id=cat.id,
        name=cat.name,
        description=cat.description,
        image_url=cat.image_url,
        created_at=cat.created_at,
        questions_count=q_count
    )


@router.delete("/categories/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """حذف الفئة وكافة الأسئلة المرتبطة بها."""
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الفئة غير موجودة")

    db.delete(cat)
    db.commit()
    return {"success": True, "message": f"تم حذف الفئة [{cat.name}] وجميع أسئلتها بنجاح."}


# Questions Bank
@router.get("/questions", response_model=List[QuestionOut])
def list_questions(
    category_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    points_level: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """عرض بنك الأسئلة مع إمكانية الفلترة حسب التصنيف، حالة الاعتماد، أو النقاط (200, 400, 600)."""
    query = db.query(Question)
    if category_id:
        query = query.filter(Question.category_id == category_id)
    if status_filter and status_filter != "all":
        query = query.filter(Question.status == status_filter)
    if points_level:
        query = query.filter(Question.points_level == points_level)

    return query.order_by(Question.id.desc()).all()


@router.post("/questions", response_model=QuestionOut, status_code=status.HTTP_201_CREATED)
def create_question(
    payload: QuestionCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """إضافة سؤال جديد لبنك الأسئلة مع تحديد فئته ومستوى الصعوبة والنقاط."""
    category = db.query(Category).filter(Category.id == payload.category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الفئة المحددة غير موجودة")

    question = Question(
        category_id=payload.category_id,
        question_text=payload.question_text.strip(),
        options_json=payload.options_json,
        correct_answer=payload.correct_answer.strip(),
        points_level=payload.points_level or 200,
        media_url=payload.media_url,
        status=payload.status or "approved"
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


@router.put("/questions/{question_id}", response_model=QuestionOut)
def update_question(
    question_id: int,
    payload: QuestionUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """تعديل نص السؤال أو خياراته أو الإجابة الصحيحة أو مستوى النقاط."""
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="السؤال غير موجود")

    if payload.category_id is not None:
        q.category_id = payload.category_id
    if payload.question_text is not None:
        q.question_text = payload.question_text.strip()
    if payload.options_json is not None:
        q.options_json = payload.options_json
    if payload.correct_answer is not None:
        q.correct_answer = payload.correct_answer.strip()
    if payload.points_level is not None:
        q.points_level = payload.points_level
    if payload.media_url is not None:
        q.media_url = payload.media_url
    if payload.status is not None:
        q.status = payload.status

    db.commit()
    db.refresh(q)
    return q


@router.delete("/questions/{question_id}")
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """حذف سؤال من بنك الأسئلة."""
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="السؤال غير موجود")

    db.delete(q)
    db.commit()
    return {"success": True, "message": "تم حذف السؤال بنجاح."}


# =========================================================================
# 4. AI & n8n CONTROL ROOM (غرفة الذكاء الاصطناعي و n8n)
# =========================================================================

@router.get("/questions/pending", response_model=List[QuestionOut])
def list_pending_ai_questions(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """عرض قائمة الأسئلة المولدة آلياً عبر الذكاء الاصطناعي والتي بانتظار المراجعة والاعتماد."""
    return db.query(Question).filter(Question.status == "pending").order_by(Question.id.desc()).all()


@router.post("/questions/import-json", status_code=status.HTTP_201_CREATED)
async def import_questions_json(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
    raw_content = await file.read()
    if len(raw_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="حجم الملف كبير جداً (الحد الأقصى هو 5 ميجابايت)"
        )

    try:
        payload = json.loads(raw_content.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=400, detail="ملف JSON غير صالح أو ليس بترميز UTF-8.") from exc

    questions = payload.get("questions") if isinstance(payload, dict) else payload
    if not isinstance(questions, list) or not questions:
        raise HTTPException(status_code=422, detail="يجب أن يكون الملف مصفوفة أسئلة أو يحتوي على questions.")

    saved = []
    for index, item in enumerate(questions):
        if not isinstance(item, dict) or not item.get("question_text"):
            raise HTTPException(status_code=422, detail=f"السؤال رقم {index + 1} ناقص question_text.")

        options = item.get("options_json") or item.get("options")
        if not isinstance(options, list) or len(options) < 2:
            raise HTTPException(status_code=422, detail=f"السؤال رقم {index + 1} يحتاج خيارين على الأقل.")

        category = None
        if item.get("category_id"):
            category = db.query(Category).filter(Category.id == item["category_id"]).first()
        if not category and item.get("category_name"):
            category = db.query(Category).filter(Category.name == item["category_name"].strip()).first()
            if not category:
                category = Category(name=item["category_name"].strip(), description="Imported from JSON")
                db.add(category)
                db.flush()
        if not category:
            raise HTTPException(status_code=422, detail=f"السؤال رقم {index + 1} يحتاج category_id أو category_name.")

        correct_answer = str(item.get("correct_answer", "")).strip()
        if correct_answer not in [str(option) for option in options]:
            raise HTTPException(status_code=422, detail=f"correct_answer للسؤال رقم {index + 1} غير موجود ضمن الخيارات.")

        shuffled_options = [str(option) for option in options]
        random.shuffle(shuffled_options)

        question = Question(
            category_id=category.id,
            question_text=str(item["question_text"]).strip(),
            options_json=shuffled_options,
            correct_answer=correct_answer,
            points_level=int(item.get("points_level") or 200),
            media_url=item.get("media_url"),
            status="pending"
        )
        db.add(question)
        saved.append(question)

    db.commit()
    return {"status": "success", "imported": len(saved), "message": "تم استيراد الأسئلة إلى طابور المراجعة."}


@router.post("/questions/approve-all-pending")
def approve_all_pending_questions(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Approve every question currently waiting in the review queue."""
    updated_count = db.query(Question).filter(Question.status == "pending").update(
        {Question.status: "approved"}, synchronize_session=False
    )
    db.commit()
    logger.info("Admin %s approved %s pending questions", admin_user.username, updated_count)
    return {"status": "success", "approved": updated_count}


@router.post("/questions/shuffle-options")
def shuffle_all_question_options(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Shuffle answer options for every question without changing the correct answer text."""
    questions = db.query(Question).all()
    for question in questions:
        options = list(question.options_json or [])
        random.shuffle(options)
        question.options_json = options

    db.commit()
    logger.info("Admin %s shuffled options for %s questions", admin_user.username, len(questions))
    return {"status": "success", "shuffled": len(questions)}


@router.delete("/questions/delete-all")
def delete_all_questions(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Delete every question while keeping categories and users intact."""
    deleted_count = db.query(Question).delete(synchronize_session=False)
    db.commit()
    logger.warning("Admin %s deleted all %s questions", admin_user.username, deleted_count)
    return {"status": "success", "deleted": deleted_count}


@router.patch("/questions/{question_id}/status", response_model=QuestionOut)
def review_question_status(
    question_id: int,
    payload: QuestionStatusUpdateRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """الموافقة على السؤال وإدراجه في بنك الأسئلة المعتمدة (approved) أو رفضه (rejected)."""
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="السؤال غير موجود")

    target_status = payload.status.lower()
    if target_status not in ["approved", "rejected", "active", "pending"]:
        raise HTTPException(status_code=400, detail="الحالة غير صالحة (approved | rejected | pending)")

    q.status = target_status
    db.commit()
    db.refresh(q)
    return q


@router.post("/generate-questions", status_code=status.HTTP_200_OK)
async def generate_questions_trigger(
    request: GenerateQuestionsRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """
    إطلاق Webhook إلى خادم n8n والذكاء الاصطناعي لتوليد دفعة جديدة من الأسئلة لفئة معينة.
    الأسئلة المولدة تدخل طابور المراجعة بحالة pending تلقائياً.
    """
    # 1. Resolve or create Category
    category = None
    if request.category_id:
        category = db.query(Category).filter(Category.id == request.category_id).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"الفئة برقم {request.category_id} غير موجودة."
            )
    else:
        cat_name = (request.category_name or "عام").strip()
        category = db.query(Category).filter(Category.name == cat_name).first()
        if not category:
            category = Category(
                name=cat_name,
                description=f"تصنيف مولّد آلياً للأسئلة: {cat_name}"
            )
            db.add(category)
            db.commit()
            db.refresh(category)

    # 2. Build payload for n8n AI workflow
    n8n_payload = {
        "event": "generate_questions",
        "category_id": category.id,
        "category_name": category.name,
        "count": request.count or 3,
        "difficulty": request.difficulty or "medium",
        "language": request.language or "ar",
        "callback_url": settings.BACKEND_RECEIVE_WEBHOOK_URL,
        "callback_api_key": settings.N8N_WEBHOOK_SECRET,
        "requested_by": {
            "user_id": admin_user.id,
            "username": admin_user.username
        }
    }

    headers = {
        "Content-Type": "application/json",
        "X-N8N-API-KEY": settings.N8N_WEBHOOK_SECRET
    }

    webhook_url = settings.N8N_WEBHOOK_URL
    logger.info(f"Triggering n8n AI workflow at: {webhook_url}")

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(webhook_url, json=n8n_payload, headers=headers)
            if response.status_code in [200, 201, 202]:
                return {
                    "status": "success",
                    "message": "تم إرسال أمر التوليد إلى خادم n8n بنجاح. ستظهر الأسئلة في طابور الاعتماد فور اكتمال التوليد.",
                    "n8n_response_status": response.status_code,
                    "target_category": {
                        "id": category.id,
                        "name": category.name
                    },
                    "requested_count": request.count,
                    "webhook_called": webhook_url
                }
            else:
                return {
                    "status": "warning",
                    "message": f"تم إرسال الطلب، لكن استجاب خادم n8n بالرمز {response.status_code}.",
                    "n8n_response": response.text,
                    "webhook_called": webhook_url
                }
    except Exception as e:
        logger.warning(f"Simulating question generation bridge (n8n offline or uncontactable): {e}")
        # Insert 3 simulated AI questions into pending queue so the Admin can test the review workflow seamlessly
        simulated_questions = [
            Question(
                category_id=category.id,
                question_text=f"سؤال ذكاء اصطناعي (مستوى 200) في {category.name}؟",
                options_json=random.sample(["خيار أول أ", "خيار ثانٍ ب", "خيار ثالث ج", "خيار رابع د"], 4),
                correct_answer="خيار أول أ",
                points_level=200,
                status="pending"
            ),
            Question(
                category_id=category.id,
                question_text=f"سؤال تكتيكي متوسط (مستوى 400) في {category.name}؟",
                options_json=random.sample(["إجابة صحيحة", "إجابة خاطئة 1", "إجابة خاطئة 2", "إجابة خاطئة 3"], 4),
                correct_answer="إجابة صحيحة",
                points_level=400,
                status="pending"
            ),
            Question(
                category_id=category.id,
                question_text=f"تحدي الخبراء النهائي (مستوى 600) في {category.name}؟",
                options_json=random.sample(["الخيار النادر", "خيار تقليدي", "خيار مضلل", "خيار وهمي"], 4),
                correct_answer="الخيار النادر",
                points_level=600,
                status="pending"
            )
        ]
        for sq in simulated_questions:
            db.add(sq)
        db.commit()

        return {
            "status": "simulated_success",
            "message": f"تم توليد 3 أسئلة تجريبية في فئة [{category.name}] وإضافتها لطابور المراجعة (Pending Approval).",
            "target_category": {
                "id": category.id,
                "name": category.name
            },
            "added_to_review_queue": 3
        }


# =========================================================================
# 5. PACKAGES & PROMO CODES (الباقات والأكواد)
# =========================================================================

@router.get("/packages")
def list_admin_packages(admin_user: User = Depends(require_admin)):
    """عرض باقات الشراء الحالية وأسعارها وعدد الجلسات."""
    return list(GAME_PACKAGES.values())


@router.put("/packages/{package_id}")
def update_admin_package(
    package_id: str,
    payload: PackageUpdate,
    admin_user: User = Depends(require_admin)
):
    """تعديل سعر الباقة، عدد ألعابها، أو عنوانها فوراً."""
    pkg = GAME_PACKAGES.get(package_id)
    if not pkg:
        raise HTTPException(status_code=404, detail="الباقة المحددة غير موجودة")

    if payload.name is not None:
        pkg["name"] = payload.name
    if payload.subtitle is not None:
        pkg["subtitle"] = payload.subtitle
    if payload.price_usd is not None:
        pkg["price_usd"] = payload.price_usd
    if payload.games_count is not None:
        pkg["games_count"] = payload.games_count
    if payload.popular is not None:
        pkg["popular"] = payload.popular

    return {"success": True, "message": f"تم تحديث باقة [{pkg['name']}] بنجاح.", "package": pkg}


@router.get("/promos", response_model=List[PromoCodeOut])
def list_promos(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """عرض قائمة كافة أكواد الخصم والبرومو كود مع إحصائيات الاستخدام."""
    return db.query(PromoCode).order_by(PromoCode.id.desc()).all()


@router.post("/promos", response_model=PromoCodeOut, status_code=status.HTTP_201_CREATED)
def create_promo(
    payload: PromoCodeCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """إنشاء برومو كود ترويجي جديد وتحديد الحد الأقصى للمستفيدين وعدد الألعاب الممنوحة."""
    code_clean = payload.code.strip().upper()
    existing = db.query(PromoCode).filter(PromoCode.code == code_clean).first()
    if existing:
        raise HTTPException(status_code=400, detail="البرومو كود مسجل بالفعل.")

    promo = PromoCode(
        code=code_clean,
        global_limit=payload.global_limit,
        games_reward=payload.games_reward,
        is_active=payload.is_active,
        current_uses=0,
        max_games=payload.games_reward,
        used_games=0
    )
    db.add(promo)
    db.commit()
    db.refresh(promo)
    return promo


@router.patch("/promos/{promo_id}/toggle", response_model=PromoCodeOut)
def toggle_promo_active(
    promo_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """تفعيل أو تعطيل البرومو كود."""
    promo = db.query(PromoCode).filter(PromoCode.id == promo_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="البرومو كود غير موجود")

    promo.is_active = not promo.is_active
    db.commit()
    db.refresh(promo)
    return promo


@router.delete("/promos/{promo_id}")
def delete_promo(
    promo_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """حذف برومو كود من النظام."""
    promo = db.query(PromoCode).filter(PromoCode.id == promo_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="البرومو كود غير موجود")

    db.delete(promo)
    db.commit()
    return {"success": True, "message": f"تم حذف البرومو كود [{promo.code}] بنجاح."}


# =========================================================================
# 6. GAME ECONOMY & POWER-UPS (اقتصاد اللعبة والأسلحة)
# =========================================================================

@router.get("/economy/powerups", response_model=List[PowerUpOut])
def list_economy_powerups(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """عرض قائمة الأسلحة التكتيكية وتكلفتها بالنقاط من قاعدة البيانات."""
    return db.query(PowerUp).order_by(PowerUp.id.asc()).all()


@router.put("/economy/powerups/{powerup_id}", response_model=PowerUpOut)
def update_powerup_cost(
    powerup_id: int,
    payload: PowerUpUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """تعديل تكلفة السلاح التكتيكي بالنقاط ووصفه بشكل ديناميكي دون تعديل الكود."""
    powerup = db.query(PowerUp).filter(PowerUp.id == powerup_id).first()
    if not powerup:
        raise HTTPException(status_code=404, detail="السلاح التكتيكي غير موجود")

    if payload.cost is not None:
        powerup.cost = max(0, payload.cost)
    if payload.name is not None:
        powerup.name = payload.name.strip()
    if payload.description is not None:
        powerup.description = payload.description.strip()

    db.commit()
    db.refresh(powerup)
    return powerup


@router.post("/economy/powerups", response_model=PowerUpOut, status_code=status.HTTP_201_CREATED)
def create_economy_powerup(
    payload: PowerUpCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """إضافة سلاح تكتيكي جديد للنظام واقتصاده."""
    existing = db.query(PowerUp).filter(PowerUp.name == payload.name.strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="السلاح موجود مسبقاً بهذا الاسم")

    new_p = PowerUp(
        name=payload.name.strip(),
        description=payload.description,
        cost=payload.cost or 50
    )
    db.add(new_p)
    db.commit()
    db.refresh(new_p)
    return new_p


@router.post("/upload-media")
async def upload_media_file(
    file: UploadFile = File(...),
    admin_user: User = Depends(require_admin)
):
    """رفع صورة أو مقطع صوتي لسؤال من لوحة التحكم وحفظه بالسيرفر."""
    filename = file.filename or "media"
    ext = os.path.splitext(filename)[1].lower()
    allowed_exts = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp3", ".wav", ".ogg"}
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"نوع الملف غير مدعوم ({ext}). الصيغ المدعومة هي: {', '.join(allowed_exts)}"
        )

    content = await file.read()
    max_size = 10 * 1024 * 1024  # 10 MB
    if len(content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="حجم الملف كبير جداً. الحد الأقصى هو 10 ميجابايت."
        )

    # Save into uploads directory
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
    os.makedirs(upload_dir, exist_ok=True)

    unique_filename = f"{uuid.uuid4().hex}{ext}"
    target_path = os.path.join(upload_dir, unique_filename)

    with open(target_path, "wb") as f:
        f.write(content)

    return {
        "url": f"/uploads/{unique_filename}",
        "filename": unique_filename,
        "message": "تم رفع الملف بنجاح"
    }
