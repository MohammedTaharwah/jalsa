from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class SpyCategory(Base):
    __tablename__ = "spy_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    name_ar = Column(String(100), nullable=True)
    icon = Column(String(50), default="Sparkles")
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Cascade delete words when category is deleted
    words = relationship(
        "SpyWord",
        back_populates="category",
        cascade="all, delete-orphan",
        passive_deletes=True
    )


class SpyWord(Base):
    __tablename__ = "spy_words"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("spy_categories.id", ondelete="CASCADE"), nullable=False, index=True)
    word = Column(String(150), nullable=False)
    hint = Column(String(150), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    category = relationship("SpyCategory", back_populates="words")
