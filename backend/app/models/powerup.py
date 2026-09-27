from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base


class PowerUp(Base):
    __tablename__ = "powerups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    cost = Column(Integer, default=50, nullable=False)  # Cost in player balance/points
    created_at = Column(DateTime(timezone=True), server_default=func.now())
