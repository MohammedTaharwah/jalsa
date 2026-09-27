from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    balance = Column(Integer, default=0, nullable=False)  # Points / balance for multiplayer sessions
    games_balance = Column(Integer, default=1, nullable=False)  # Free games balance (starts with 1 free game)
    is_verified = Column(Boolean, default=False, nullable=False)  # Email OTP verification status
    role = Column(String(50), default="player", nullable=False)  # 'admin' or 'player'
    otp_code = Column(String(6), nullable=True)  # 6-digit verification code
    otp_expires_at = Column(DateTime(timezone=True), nullable=True)  # OTP expiry timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())
