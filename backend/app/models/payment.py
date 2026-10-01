from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from app.database import Base


class PaymentOrder(Base):
    __tablename__ = "payment_orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    paypal_order_id = Column(String(100), unique=True, index=True, nullable=False)
    paypal_capture_id = Column(String(100), nullable=True, index=True)
    package_id = Column(String(100), nullable=False)
    package_name = Column(String(150), nullable=False)
    games_count = Column(Integer, nullable=False, default=0)
    amount = Column(Float, nullable=False, default=0.0)
    currency = Column(String(10), default="USD", nullable=False)
    status = Column(String(50), default="COMPLETED", index=True, nullable=False)  # COMPLETED, PENDING, FAILED
    payment_method = Column(String(50), default="paypal", nullable=False)
    is_manual = Column(Boolean, default=False, nullable=False)  # False = Real PayPal, True = Admin manual grant
    created_at = Column(DateTime(timezone=True), server_default=func.now())
