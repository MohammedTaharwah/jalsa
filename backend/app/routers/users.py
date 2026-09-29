from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserOut, UserUpdate, UserBalanceUpdate
from app.core.security import get_password_hash
from app.core.deps import get_current_user, require_admin

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/", response_model=List[UserOut])
def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Protected Admin route: List users with pagination."""
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.get("/{user_id}", response_model=UserOut)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Protected route: Get specific user details by ID (Self or Admin only)."""
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="غير مصرح لك باستعراض بيانات مستخدم آخر"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="المستخدم غير موجود")
    return user


@router.put("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Protected route: Update user profile (Self or Admin only)."""
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="غير مصرح لك بتعديل بيانات مستخدم آخر"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="المستخدم غير موجود")

    # Check for conflicts if username or email is being modified
    if user_in.username and user_in.username != user.username:
        existing = db.query(User).filter(User.username == user_in.username).first()
        if existing and existing.id != user.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="اسم المستخدم مسجل مسبقاً")
        user.username = user_in.username

    if user_in.email and user_in.email != user.email:
        existing = db.query(User).filter(User.email == user_in.email).first()
        if existing and existing.id != user.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="البريد الإلكتروني مسجل مسبقاً")
        user.email = user_in.email

    if user_in.password:
        user.hashed_password = get_password_hash(user_in.password)

    # Balance modification is strictly restricted to Admins
    if user_in.balance is not None:
        if current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="تعديل الرصيد يتطلب صلاحيات المدير"
            )
        user.balance = user_in.balance

    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}/balance", response_model=UserOut)
def update_user_balance(
    user_id: int,
    balance_in: UserBalanceUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Protected Admin route: Modify player points/balance."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="المستخدم غير موجود")

    new_balance = user.balance + balance_in.points_delta
    if new_balance < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="الرصيد غير كافٍ (Insufficient balance/points)"
        )

    user.balance = new_balance
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Protected route: Delete user account (Self or Admin only)."""
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="غير مصرح لك بحذف هذا الحساب"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="المستخدم غير موجود")

    if user.role == "admin" and current_user.id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="لا يمكن حذف حساب المدير"
        )

    db.delete(user)
    db.commit()
    return None
