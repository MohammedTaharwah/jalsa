import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.promo import PromoCode, UserPromoUsage
from app.models.user import User
from app.schemas.promo import (
    PromoApplyRequest,
    PromoApplyResponse,
    PromoCodeCreate,
    PromoCodeOut
)
from app.core.deps import get_current_user

logger = logging.getLogger("qna_backend.promo")
router = APIRouter(prefix="/promo", tags=["Promo Codes"])


@router.post("/apply", response_model=PromoApplyResponse)
def apply_promo_code(
    payload: PromoApplyRequest,
    db: Session = Depends(get_db)
):
    """
    تطبيق برومو كود والتحقق من الشروط:
    1. وجود الكود وصلاحيته (is_active = True).
    2. عدم تجاوز الحد الأقصى للمستخدمين (current_uses < global_limit).
    3. عدم استخدام نفس الكود من نفس المستخدم مسبقاً (UserPromoUsage).
    4. إضافة عدد الألعاب المجانية لرصيد المستخدم وزيادة العداد.
    """
    cleaned_code = payload.code.strip().upper()

    promo = db.query(PromoCode).filter(
        func.upper(PromoCode.code) == cleaned_code
    ).first()

    if not promo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="كود الخصم غير موجود، يرجى التأكد من كتابته بشكل صحيح"
        )

    if not promo.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="هذا البرومو كود تم إيقافه وغير مفعّل حالياً"
        )

    # Check global limit
    if promo.current_uses >= promo.global_limit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"عذراً! انتهت كمية هذا الكود حيث وصل للحد الأقصى ({promo.global_limit} مستخدم)"
        )

    # Resolve user
    user = None
    if payload.user_id:
        user = db.query(User).filter(User.id == payload.user_id).first()

    if not user:
        # Default fallback to first verified user or first user for demo convenience
        user = db.query(User).order_by(User.id.asc()).first()

    if user:
        # Check if user already used this promo code
        existing_usage = db.query(UserPromoUsage).filter(
            UserPromoUsage.user_id == user.id,
            UserPromoUsage.promo_id == promo.id
        ).first()

        if existing_usage:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="لقد قمت باستخدام هذا البرومو كود مسبقاً! كل كود متاح للاستخدام مرة واحدة لكل حساب."
            )

        # Record usage
        usage = UserPromoUsage(user_id=user.id, promo_id=promo.id)
        db.add(usage)

        # Increment counts
        promo.current_uses += 1
        promo.used_games += 1

        # Add games reward to user's balance
        user.games_balance += promo.games_reward
        db.commit()
        db.refresh(user)

        new_balance = user.games_balance
    else:
        # Guest usage increment
        promo.current_uses += 1
        promo.used_games += 1
        db.commit()
        new_balance = promo.games_reward

    logger.info(f"🎉 Promo code {promo.code} applied successfully! Reward: +{promo.games_reward} games.")

    return PromoApplyResponse(
        success=True,
        message=f"تم تفعيل الكود بنجاح! تم إضافة {promo.games_reward} ألعاب مجانية إلى رصيدك.",
        code=promo.code,
        games_reward=promo.games_reward,
        new_balance=new_balance
    )


@router.post("/consume-game")
def consume_game_session(
    user_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    استهلاك لعبة واحدة عند إنهاء أو بدء جولة، لتحديث العداد في قاعدة البيانات.
    """
    if user_id:
        user = db.query(User).filter(User.id == user_id).first()
        if user and user.games_balance > 0:
            user.games_balance -= 1
            db.commit()
            return {"success": True, "remaining_games": user.games_balance}

    return {"success": True, "message": "تم تسجيل انتهاء الجولة"}


# ================= ADMIN ROUTES =================

@router.get("/admin/list", response_model=List[PromoCodeOut])
def admin_list_promos(db: Session = Depends(get_db)):
    """جلب جميع البرومو كودز المتاحة مع إحصائيات الاستخدام للوحة التحكم."""
    return db.query(PromoCode).order_by(PromoCode.id.desc()).all()


@router.post("/admin/create", response_model=PromoCodeOut, status_code=status.HTTP_201_CREATED)
def admin_create_promo(
    promo_in: PromoCodeCreate,
    db: Session = Depends(get_db)
):
    """إنشاء برومو كود جديد مع تحديد الحد الأقصى للمستخدمين وعدد الألعاب المجانية."""
    clean_code = promo_in.code.strip().upper()

    existing = db.query(PromoCode).filter(
        func.upper(PromoCode.code) == clean_code
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="رمز البرومو كود موجود بالفعل، يرجى اختيار رمز آخر"
        )

    new_promo = PromoCode(
        code=clean_code,
        global_limit=promo_in.global_limit,
        current_uses=0,
        games_reward=promo_in.games_reward,
        max_games=promo_in.games_reward,
        used_games=0,
        is_active=promo_in.is_active
    )
    db.add(new_promo)
    db.commit()
    db.refresh(new_promo)
    return new_promo


@router.patch("/admin/{promo_id}/toggle", response_model=PromoCodeOut)
def admin_toggle_promo(promo_id: int, db: Session = Depends(get_db)):
    """تفعيل أو تعطيل البرومو كود."""
    promo = db.query(PromoCode).filter(PromoCode.id == promo_id).first()
    if not promo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الكود غير موجود")

    promo.is_active = not promo.is_active
    db.commit()
    db.refresh(promo)
    return promo


@router.delete("/admin/{promo_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_promo(promo_id: int, db: Session = Depends(get_db)):
    """حذف برومو كود نهائياً."""
    promo = db.query(PromoCode).filter(PromoCode.id == promo_id).first()
    if not promo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الكود غير موجود")

    db.delete(promo)
    db.commit()
    return None
