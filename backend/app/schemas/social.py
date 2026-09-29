from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SocialLinkBase(BaseModel):
    platform: str
    title: str
    url: str
    icon_name: Optional[str] = "Globe"
    is_active: Optional[bool] = True
    sort_order: Optional[int] = 0


class SocialLinkCreate(SocialLinkBase):
    pass


class SocialLinkUpdate(BaseModel):
    platform: Optional[str] = None
    title: Optional[str] = None
    url: Optional[str] = None
    icon_name: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class SocialLinkOut(SocialLinkBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
