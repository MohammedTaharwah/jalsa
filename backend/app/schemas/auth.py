from typing import Optional
from pydantic import BaseModel, EmailStr
from app.schemas.user import UserOut


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Optional[UserOut] = None


class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[int] = None


class LoginRequest(BaseModel):
    username_or_email: str
    password: str


class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp_code: str


class OTPResendRequest(BaseModel):
    email: EmailStr


class RegisterResponse(BaseModel):
    message: str
    user: UserOut
    requires_otp: bool = True
