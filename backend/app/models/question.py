from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False)
    question_text = Column(Text, nullable=False)
    options_json = Column(JSON, nullable=False)  # Stores options array e.g. ["الخيار 1", "الخيار 2", ...]
    correct_answer = Column(String(255), nullable=False)
    points_level = Column(Integer, default=100, nullable=False)
    media_url = Column(Text, nullable=True)
    status = Column(String(50), default="active", nullable=False)  # e.g., active, draft, archived
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship to parent category
    category = relationship("Category", back_populates="questions")
