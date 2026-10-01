from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from app.schemas.user import UserOut


class PaymentOrderOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    paypal_order_id: str
    paypal_capture_id: Optional[str] = None
    package_id: str
    package_name: str
    games_count: int
    amount: float
    currency: str
    status: str
    payment_method: str
    is_manual: bool = False
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AdminOverviewOut(BaseModel):
    total_sales: float
    total_paypal_orders: int = 0
    active_users: int
    total_games_played: int
    total_games_balance: int
    total_questions: int
    approved_questions: int
    pending_questions: int
    total_categories: int
    total_promos: int
    recent_users: List[UserOut] = []
    recent_payments: List[PaymentOrderOut] = []


class UserBalanceAdjustRequest(BaseModel):
    games_balance: int
    reason: Optional[str] = "تعديل إداري / تعويض الدعم الفني"
    role: Optional[str] = None


class QuestionStatusUpdateRequest(BaseModel):
    status: str  # 'approved' or 'rejected' or 'active'


class PackageUpdate(BaseModel):
    name: Optional[str] = None
    subtitle: Optional[str] = None
    price_usd: Optional[str] = None
    games_count: Optional[int] = None
    popular: Optional[bool] = None
