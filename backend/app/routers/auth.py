import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    Token,
    LoginRequest,
    OTPVerifyRequest,
    OTPResendRequest,
    RegisterResponse
)
from app.schemas.user import UserCreate, UserOut
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])
logger = logging.getLogger("qna_backend.auth")


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    تسجيل مستخدم جديد وتفعيل الحساب مباشرة بدون تحقق بريد إلكتروني.
    """
    logger.info("Registration request received for %s", user_in.email)

    # Check if username or email already exists
    existing_user = db.query(User).filter(
        or_(User.username == user_in.username, User.email == user_in.email)
    ).first()

    if existing_user:
        if existing_user.username == user_in.username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="اسم المستخدم مسجل مسبقاً (Username already taken)"
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="البريد الإلكتروني مسجل مسبقاً (Email already registered)"
        )

    hashed_pw = get_password_hash(user_in.password)
    new_user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed_pw,
        balance=user_in.balance or 0,
        games_balance=1,  # Default 1 free game session on signup
        is_verified=True,
        otp_code=None,
        otp_expires_at=None
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(subject=new_user.id)

    return RegisterResponse(
        message="تم إنشاء الحساب بنجاح. أهلاً بك في منصة جلسة.",
        user=new_user,
        access_token=token,
        requires_otp=False,
    )


@router.post("/verify-otp", response_model=Token)
def verify_otp(otp_data: OTPVerifyRequest, db: Session = Depends(get_db)):
    """
    التحقق من كود الـ OTP وتفعيل حساب المستخدم (is_verified = True).
    """
    user = db.query(User).filter(User.email == otp_data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="المستخدم غير موجود بهذا البريد الإلكتروني"
        )

    if user.is_verified:
        token = create_access_token(subject=user.id)
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": user
        }

    # Verify code and expiration
    now_utc = datetime.now(timezone.utc)
    if not user.otp_code or user.otp_code != otp_data.otp_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="رمز التحقق غير صحيح، يرجى التأكد وإعادة المحاولة"
        )

    if user.otp_expires_at and user.otp_expires_at < now_utc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="انتهت صلاحية رمز التحقق (أكثر من 15 دقيقة)، يرجى طلب رمز جديد"
        )

    # Mark as verified and clear OTP
    user.is_verified = True
    user.otp_code = None
    user.otp_expires_at = None
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/resend-otp")
def resend_otp(resend_data: OTPResendRequest, db: Session = Depends(get_db)):
    """
    إعادة توليد وإرسال رمز OTP جديد للمستخدم.
    """
    user = db.query(User).filter(User.email == resend_data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="المستخدم غير موجود بهذا البريد الإلكتروني"
        )

    if user.is_verified:
        return {"message": "الحساب مفعل بالفعل ولا يحتاج لرمز تحقق.", "is_verified": True}

    if not settings.RESEND_API_KEY or not settings.RESEND_FROM_EMAIL:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="خدمة البريد غير مهيأة. أضف RESEND_API_KEY وRESEND_FROM_EMAIL في Render."
        )

    # Generate new OTP
    otp_code = f"{random.randint(100000, 999999)}"
    user.otp_code = otp_code
    user.otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    db.commit()

    try:
        send_otp_email(user.email, otp_code)
    except EmailDeliveryError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc)
        ) from exc

    return {
        "success": True,
        "message": "تم إرسال رمز تحقق جديد إلى بريدك الإلكتروني.",
    }


@router.post("/login", response_model=Token)
def login(login_req: LoginRequest, db: Session = Depends(get_db)):
    """تسجيل الدخول وإرجاع التوكن ومعلومات الحساب والتحقق."""
    user = db.query(User).filter(
        or_(
            User.username == login_req.username_or_email,
            User.email == login_req.username_or_email
        )
    ).first()

    if not user or not verify_password(login_req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="اسم المستخدم أو كلمة المرور غير صحيحة",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(subject=user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/token", response_model=Token)
def login_for_swagger(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Standard OAuth2 form login for Swagger UI authorization button."""
    user = db.query(User).filter(
        or_(
            User.username == form_data.username,
            User.email == form_data.username
        )
    ).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(subject=user.id)
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    """Protected route: Retrieve profile of currently authenticated user."""
    return current_user
