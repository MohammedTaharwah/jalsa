import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.social import SocialLink
from app.models.user import User
from app.core.deps import require_admin
from app.schemas.social import SocialLinkCreate, SocialLinkUpdate, SocialLinkOut

logger = logging.getLogger("qna_backend.social")

router = APIRouter(tags=["Social Media Links (صفحات التواصل الاجتماعي)"])


def seed_default_social_links_if_needed(db: Session):
    """Seed initial popular social links (Instagram, Kick, etc.) if empty."""
    try:
        count = db.query(func.count(SocialLink.id)).scalar() or 0
        if count > 0:
            return

        defaults = [
            {
                "platform": "instagram",
                "title": "إنستغرام جلسة",
                "url": "https://instagram.com",
                "icon_name": "Instagram",
                "is_active": True,
                "sort_order": 1
            },
            {
                "platform": "kick",
                "title": "قناة كيك (Kick)",
                "url": "https://kick.com",
                "icon_name": "Flame",
                "is_active": True,
                "sort_order": 2
            },
            {
                "platform": "tiktok",
                "title": "تيك توك",
                "url": "https://tiktok.com",
                "icon_name": "Video",
                "is_active": True,
                "sort_order": 3
            },
            {
                "platform": "twitter",
                "title": "منصة X (تويتر)",
                "url": "https://x.com",
                "icon_name": "Twitter",
                "is_active": True,
                "sort_order": 4
            }
        ]

        for d in defaults:
            link = SocialLink(**d)
            db.add(link)
        db.commit()
        logger.info("Successfully seeded default social media links.")
    except Exception as e:
        db.rollback()
        logger.warning(f"Could not seed default social links: {e}")


# =====================================================================
# PUBLIC ENDPOINTS
# =====================================================================

@router.get("/api/social-links", response_model=List[SocialLinkOut])
def get_public_social_links(db: Session = Depends(get_db)):
    """Fetch all active social media links for footer display."""
    seed_default_social_links_if_needed(db)
    links = (
        db.query(SocialLink)
        .filter(SocialLink.is_active == True)
        .order_by(SocialLink.sort_order.asc(), SocialLink.id.asc())
        .all()
    )
    return links


# =====================================================================
# ADMIN ENDPOINTS
# =====================================================================

@router.get("/api/admin/social-links", response_model=List[SocialLinkOut])
def admin_get_all_social_links(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    """Admin: Fetch all social links including disabled ones."""
    seed_default_social_links_if_needed(db)
    links = db.query(SocialLink).order_by(SocialLink.sort_order.asc(), SocialLink.id.asc()).all()
    return links


@router.post("/api/admin/social-links", response_model=SocialLinkOut, status_code=status.HTTP_201_CREATED)
def admin_create_social_link(
    payload: SocialLinkCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    """Admin: Create a new social media link."""
    link = SocialLink(
        platform=payload.platform.strip().lower(),
        title=payload.title.strip(),
        url=payload.url.strip(),
        icon_name=payload.icon_name or "Globe",
        is_active=payload.is_active if payload.is_active is not None else True,
        sort_order=payload.sort_order if payload.sort_order is not None else 0
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


@router.put("/api/admin/social-links/{link_id}", response_model=SocialLinkOut)
def admin_update_social_link(
    link_id: int,
    payload: SocialLinkUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    """Admin: Update an existing social media link."""
    link = db.query(SocialLink).filter(SocialLink.id == link_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="رابط التواصل غير موجود")

    if payload.platform is not None:
        link.platform = payload.platform.strip().lower()
    if payload.title is not None:
        link.title = payload.title.strip()
    if payload.url is not None:
        link.url = payload.url.strip()
    if payload.icon_name is not None:
        link.icon_name = payload.icon_name
    if payload.is_active is not None:
        link.is_active = payload.is_active
    if payload.sort_order is not None:
        link.sort_order = payload.sort_order

    db.commit()
    db.refresh(link)
    return link


@router.delete("/api/admin/social-links/{link_id}", status_code=status.HTTP_200_OK)
def admin_delete_social_link(
    link_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin)
):
    """Admin: Delete a social media link."""
    link = db.query(SocialLink).filter(SocialLink.id == link_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="رابط التواصل غير موجود")

    db.delete(link)
    db.commit()
    return {"message": "تم حذف الرابط بنجاح"}
