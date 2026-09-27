from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class PromoApplyRequest(BaseModel):
    code: str = Field(..., description="رمز البرومو كود المراد تفعيله")
    user_id: Optional[int] = Field(None, description="معرف المستخدم (اختياري عند تسجيل الدخول)")


class PromoApplyResponse(BaseModel):
    success: bool
    message: str
    code: str
    games_reward: int
    new_balance: int


class PromoCodeCreate(BaseModel):
    code: str = Field(..., min_length=3, max_length=50, description="نص الكود الترويجي")
    global_limit: int = Field(20, ge=1, description="أقصى عدد للمستخدمين المختلفين")
    games_reward: int = Field(2, ge=1, description="عدد الألعاب المجانية الممنوحة")
    is_active: bool = True


class PromoCodeOut(BaseModel):
    id: int
    code: str
    global_limit: int
    current_uses: int
    games_reward: int
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
