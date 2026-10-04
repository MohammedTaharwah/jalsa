from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base


class FiveSecondsQuestion(Base):
    __tablename__ = "five_seconds_questions"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(100), index=True, default="عام")
    prompt = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
