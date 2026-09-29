import json
import logging
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.deps import require_admin
from app.database import get_db
from app.models.spy import SpyCategory, SpyWord
from app.models.user import User
from app.schemas.spy import (
    SpyBulkCategoryImport,
    SpyCategoryCreate,
    SpyCategoryOut,
    SpyCategoryUpdate,
    SpyCategoryWithWords,
    SpyWordCreate,
    SpyWordOut,
)

logger = logging.getLogger("qna_backend.spy")

router = APIRouter(tags=["Spy Game (مين الدسوس)"])


def seed_default_spy_data_if_needed(db: Session):
    """Seed default spy categories and words if table is empty."""
    try:
        count = db.query(func.count(SpyCategory.id)).scalar() or 0
        if count > 0:
            return

        json_path = Path(__file__).resolve().parent.parent / "data" / "spy_default_data.json"
        if not json_path.exists():
            return

        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        for cat_data in data:
            cat = SpyCategory(
                name=cat_data.get("name"),
                name_ar=cat_data.get("name_ar") or cat_data.get("name"),
                icon=cat_data.get("icon", "Sparkles"),
                description=cat_data.get("description", "")
            )
            db.add(cat)
            db.flush()

            for w_str in cat_data.get("words", []):
                w_clean = str(w_str).strip()
                if w_clean:
                    w = SpyWord(category_id=cat.id, word=w_clean)
                    db.add(w)

        db.commit()
        logger.info("Successfully seeded default Spy Game categories and words.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding default spy data: {e}")


# =========================================================================
# PUBLIC ENDPOINTS (Game Play)
# =========================================================================

@router.get("/api/spy/categories", response_model=List[SpyCategoryOut])
def get_spy_categories(db: Session = Depends(get_db)):
    """جلب فئات لعبة 'مين الدسوس' المتاحة للاعبين مع عدد الكلمات في كل فئة."""
    seed_default_spy_data_if_needed(db)
    categories = db.query(SpyCategory).order_by(SpyCategory.id.asc()).all()

    result = []
    for cat in categories:
        w_count = db.query(func.count(SpyWord.id)).filter(SpyWord.category_id == cat.id).scalar() or 0
        result.append(
            SpyCategoryOut(
                id=cat.id,
                name=cat.name,
                name_ar=cat.name_ar,
                icon=cat.icon,
                description=cat.description,
                words_count=w_count,
                created_at=cat.created_at
            )
        )
    return result


@router.get("/api/spy/full-categories", response_model=List[SpyCategoryWithWords])
def get_full_spy_categories_with_words(
    category_ids: Optional[str] = Query(None, description="Comma-separated category IDs"),
    db: Session = Depends(get_db)
):
    """جلب الفئات مع كامل كلماتها لبدء لعبة الجاسوس في المتصفح بسرعة وسلاسة."""
    seed_default_spy_data_if_needed(db)
    query = db.query(SpyCategory)

    if category_ids:
        try:
            ids = [int(i.strip()) for i in category_ids.split(",") if i.strip()]
            if ids:
                query = query.filter(SpyCategory.id.in_(ids))
        except ValueError:
            pass

    categories = query.order_by(SpyCategory.id.asc()).all()
    return categories


# =========================================================================
# ADMIN ENDPOINTS (إدارة لعبة مين الدسوس)
# =========================================================================

@router.post("/api/admin/spy/categories", response_model=SpyCategoryOut)
def admin_create_spy_category(
    payload: SpyCategoryCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """إضافة فئة جديدة في لعبة مين الدسوس."""
    existing = db.query(SpyCategory).filter(SpyCategory.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="توجد فئة بهذا الاسم مسبقاً")

    cat = SpyCategory(
        name=payload.name,
        name_ar=payload.name_ar or payload.name,
        icon=payload.icon or "Sparkles",
        description=payload.description
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)

    return SpyCategoryOut(
        id=cat.id,
        name=cat.name,
        name_ar=cat.name_ar,
        icon=cat.icon,
        description=cat.description,
        words_count=0,
        created_at=cat.created_at
    )


@router.put("/api/admin/spy/categories/{category_id}", response_model=SpyCategoryOut)
def admin_update_spy_category(
    category_id: int,
    payload: SpyCategoryUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """تعديل بيانات فئة في لعبة مين الدسوس."""
    cat = db.query(SpyCategory).filter(SpyCategory.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="الفئة غير موجودة")

    if payload.name is not None:
        cat.name = payload.name
    if payload.name_ar is not None:
        cat.name_ar = payload.name_ar
    if payload.icon is not None:
        cat.icon = payload.icon
    if payload.description is not None:
        cat.description = payload.description

    db.commit()
    db.refresh(cat)

    w_count = db.query(func.count(SpyWord.id)).filter(SpyWord.category_id == cat.id).scalar() or 0
    return SpyCategoryOut(
        id=cat.id,
        name=cat.name,
        name_ar=cat.name_ar,
        icon=cat.icon,
        description=cat.description,
        words_count=w_count,
        created_at=cat.created_at
    )


@router.delete("/api/admin/spy/categories/{category_id}")
def admin_delete_spy_category(
    category_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """حذف فئة بالكامل وجميع الكلمات التابعة لها."""
    cat = db.query(SpyCategory).filter(SpyCategory.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="الفئة غير موجودة")

    db.delete(cat)
    db.commit()
    return {"message": "تم حذف الفئة وكلماتها بنجاح"}


@router.post("/api/admin/spy/categories/{category_id}/words", response_model=List[SpyWordOut])
def admin_add_words_to_spy_category(
    category_id: int,
    words: List[str],
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """إضافة قائمة كلمات إلى فئة معينة."""
    cat = db.query(SpyCategory).filter(SpyCategory.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="الفئة غير موجودة")

    created = []
    for w in words:
        clean = str(w).strip()
        if clean:
            # Avoid duplicate in same category
            exists = db.query(SpyWord).filter(
                SpyWord.category_id == category_id,
                SpyWord.word == clean
            ).first()
            if not exists:
                item = SpyWord(category_id=category_id, word=clean)
                db.add(item)
                created.append(item)

    db.commit()
    for item in created:
        db.refresh(item)
    return created


@router.delete("/api/admin/spy/words/{word_id}")
def admin_delete_spy_word(
    word_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """حذف كلمة معينة من لعبة مين الدسوس."""
    w = db.query(SpyWord).filter(SpyWord.id == word_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="الكلمة غير موجودة")

    db.delete(w)
    db.commit()
    return {"message": "تم حذف الكلمة بنجاح"}


@router.post("/api/admin/spy/import")
def admin_bulk_import_spy_data(
    payload: List[SpyBulkCategoryImport],
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """استيراد فئات وكلمات دفعة واحدة عبر JSON."""
    imported_cats = 0
    imported_words = 0

    for item in payload:
        cat = db.query(SpyCategory).filter(SpyCategory.name == item.name).first()
        if not cat:
            cat = SpyCategory(
                name=item.name,
                name_ar=item.name_ar or item.name,
                icon=item.icon or "Sparkles",
                description=item.description
            )
            db.add(cat)
            db.flush()
            imported_cats += 1
        else:
            if item.icon:
                cat.icon = item.icon
            if item.description:
                cat.description = item.description

        for w_str in item.words:
            clean = str(w_str).strip()
            if clean:
                exists = db.query(SpyWord).filter(
                    SpyWord.category_id == cat.id,
                    SpyWord.word == clean
                ).first()
                if not exists:
                    db.add(SpyWord(category_id=cat.id, word=clean))
                    imported_words += 1

    db.commit()
    return {
        "message": f"تم الاستيراد بنجاح: {imported_cats} فئة جديدة، و {imported_words} كلمة جديدة."
    }


@router.get("/api/admin/spy/export")
def admin_export_spy_data(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """تصدير كامل بيانات الفئات والكلمات بصيغة JSON للنسخ الاحتياطي والترجمة."""
    categories = db.query(SpyCategory).order_by(SpyCategory.id.asc()).all()
    output = []
    for cat in categories:
        words = [w.word for w in cat.words]
        output.append({
            "name": cat.name,
            "name_ar": cat.name_ar,
            "icon": cat.icon,
            "description": cat.description,
            "words": words
        })
    return output


@router.post("/api/admin/spy/seed-defaults")
def admin_reset_default_spy_data(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """إعادة ملء الفئات الافتراضية للعبة مين الدسوس."""
    seed_default_spy_data_if_needed(db)
    return {"message": "تم التحقق من الفئات الافتراضية وتحديثها بنجاح"}
