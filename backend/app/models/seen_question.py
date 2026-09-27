from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from app.database import Base


class UserSeenQuestions(Base):
    """
    جدول تتبع الأسئلة المستهلكة (UserSeenQuestions) لمنع تكرار الأسئلة لكل مستخدم.
    """
    __tablename__ = "user_seen_questions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    seen_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "question_id", name="uq_user_seen_question"),
    )
