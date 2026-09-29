import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Header
from pydantic import BaseModel
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
from app.core.deps import get_current_user, require_admin
from app.core.security import decode_access_token

class ConsumeGameRequest(BaseModel):
    user_id: Optional[int] = None

logger = logging.getLogger("qna_backend.promo")
router = APIRouter(prefix="/promo", tags=["Promo Codes"])


@router.post("/apply", response_model=PromoApplyResponse)
def apply_promo_code(
    payload: PromoApplyRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    تطبيق برومو كود وإضافة الرصيد مباشرة لحساب المستخدم المسجل مع التحقق من الهوية والأحقية.
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

    if promo.global_limit and promo.current_uses >= promo.global_limit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="عذراً، وصل هذا البرومو كود للحد الأقصى المسموح به من الاستخدامات."
        )

    # Strictly resolve authenticated user from Bearer Token
    user = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1].strip()
        jwt_payload = decode_access_token(token)
        if jwt_payload and jwt_payload.get("sub"):
            try:
                user = db.query(User).filter(User.id == int(jwt_payload["sub"])).first()
            except (ValueError, TypeError):
                pass

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="يرجى تسجيل الدخول أولاً لتفعيل البرومو كود في حسابك."
        )

    # Check if user already used this promo code
    existing_usage = db.query(UserPromoUsage).filter(
        UserPromoUsage.user_id == user.id,
        UserPromoUsage.promo_id == promo.id
    ).first()

    if existing_usage:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="لقد قمت باستخدام هذا البرومو كود مسبقاً على هذا الحساب!"
        )

    # Record usage
    usage = UserPromoUsage(user_id=user.id, promo_id=promo.id)
    db.add(usage)

    # Increment promo usage
    promo.current_uses += 1
    promo.used_games += 1

    # Add games reward directly to THIS user's balance
    user.games_balance += promo.games_reward
    db.commit()
    db.refresh(user)

    logger.info(f"🎉 Promo code {promo.code} applied for user {user.id} ({user.email}). New games_balance: {user.games_balance}")

    return PromoApplyResponse(
        success=True,
        message=f"تم تفعيل الكود بنجاح! تم إضافة {promo.games_reward} ألعاب مجانية إلى رصيدك.",
        code=promo.code,
        games_reward=promo.games_reward,
        new_balance=user.games_balance
    )


@router.post("/consume-game")
def consume_game_session(
    payload: Optional[ConsumeGameRequest] = None,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    استهلاك لعبة واحدة عند بدء جولة، مع التحقق الصارم من هوية المستخدم ومنع استنزاف حسابات الآخرين.
    """
    user = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1].strip()
        jwt_payload = decode_access_token(token)
        if jwt_payload and jwt_payload.get("sub"):
            try:
                user = db.query(User).filter(User.id == int(jwt_payload["sub"])).first()
            except (ValueError, TypeError):
                pass

    # Allow Admin to optionally target another user for debugging/support
    if payload and payload.user_id and user and user.role == "admin":
        target = db.query(User).filter(User.id == payload.user_id).first()
        if target:
            user = target

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="يرجى تسجيل الدخول للتحقق من رصيد الألعاب وبدء الجولة."
        )

    if user.games_balance <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="نفد رصيدك من الألعاب! يرجى شحن الرصيد لتتمكن من خوض جولة جديدة."
        )

    user.games_balance -= 1
    db.commit()
    db.refresh(user)
    return {"success": True, "remaining_games": user.games_balance}


# ================= ADMIN ROUTES =================

@router.get("/admin/list", response_model=List[PromoCodeOut])
def admin_list_promos(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """جلب جميع البرومو كودز المتاحة مع إحصائيات الاستخدام للوحة التحكم (Admin Only)."""
    return db.query(PromoCode).order_by(PromoCode.id.desc()).all()


@router.post("/admin/create", response_model=PromoCodeOut, status_code=status.HTTP_201_CREATED)
def admin_create_promo(
    promo_in: PromoCodeCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """إنشاء برومو كود جديد مع تحديد الحد الأقصى للمستخدمين وعدد الألعاب المجانية (Admin Only)."""
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
def admin_toggle_promo(
    promo_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """تفعيل أو تعطيل البرومو كود (Admin Only)."""
    promo = db.query(PromoCode).filter(PromoCode.id == promo_id).first()
    if not promo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الكود غير موجود")

    promo.is_active = not promo.is_active
    db.commit()
    db.refresh(promo)
    return promo


@router.delete("/admin/{promo_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_promo(
    promo_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """حذف برومو كود نهائياً (Admin Only)."""
    promo = db.query(PromoCode).filter(PromoCode.id == promo_id).first()
    if not promo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الكود غير موجود")

    db.delete(promo)
    db.commit()
    return None
