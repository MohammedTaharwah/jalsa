from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class PromoCode(Base):
    __tablename__ = "promocodes"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    global_limit = Column(Integer, default=20, nullable=False)  # أقصى عدد للمستخدمين المختلفين
    current_uses = Column(Integer, default=0, nullable=False)   # كم شخص استخدمه حتى الآن
    games_reward = Column(Integer, default=2, nullable=False)   # عدد الألعاب التي يمنحها للمستخدم
    max_games = Column(Integer, default=2, nullable=False)      # للتوافقية
    used_games = Column(Integer, default=0, nullable=False)     # للتوافقية
    is_active = Column(Boolean, default=True, nullable=False)   # حالة الكود
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    usages = relationship("UserPromoUsage", back_populates="promo", cascade="all, delete-orphan")


class UserPromoUsage(Base):
    __tablename__ = "user_promo_usage"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    promo_id = Column(Integer, ForeignKey("promocodes.id", ondelete="CASCADE"), nullable=False, index=True)
    used_at = Column(DateTime(timezone=True), server_default=func.now())

    promo = relationship("PromoCode", back_populates="usages")

    __table_args__ = (
        UniqueConstraint("user_id", "promo_id", name="uq_user_promo"),
    )
