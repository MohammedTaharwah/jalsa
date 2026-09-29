from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.powerup import PowerUp
from app.models.user import User
from app.schemas.powerup import PowerUpCreate, PowerUpUpdate, PowerUpOut
from app.core.deps import require_admin

router = APIRouter(prefix="/powerups", tags=["PowerUps"])


@router.get("/", response_model=List[PowerUpOut])
def get_powerups(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Public route: List available powerups and game aids for players."""
    return db.query(PowerUp).offset(skip).limit(limit).all()


@router.get("/{powerup_id}", response_model=PowerUpOut)
def get_powerup(powerup_id: int, db: Session = Depends(get_db)):
    """Public route: Retrieve specific powerup details."""
    pup = db.query(PowerUp).filter(PowerUp.id == powerup_id).first()
    if not pup:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PowerUp not found")
    return pup


@router.post("/", response_model=PowerUpOut, status_code=status.HTTP_201_CREATED)
def create_powerup(
    powerup_in: PowerUpCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Admin route: Create a new powerup (Requires admin privileges)."""
    existing = db.query(PowerUp).filter(PowerUp.name == powerup_in.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PowerUp with this name already exists"
        )

    new_pup = PowerUp(
        name=powerup_in.name,
        description=powerup_in.description,
        cost=powerup_in.cost or 50
    )
    db.add(new_pup)
    db.commit()
    db.refresh(new_pup)
    return new_pup


@router.put("/{powerup_id}", response_model=PowerUpOut)
def update_powerup(
    powerup_id: int,
    powerup_in: PowerUpUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Admin route: Update an existing powerup (Requires admin privileges)."""
    pup = db.query(PowerUp).filter(PowerUp.id == powerup_id).first()
    if not pup:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PowerUp not found")

    if powerup_in.name and powerup_in.name != pup.name:
        existing = db.query(PowerUp).filter(PowerUp.name == powerup_in.name).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="PowerUp with this name already exists"
            )
        pup.name = powerup_in.name

    if powerup_in.description is not None:
        pup.description = powerup_in.description
    if powerup_in.cost is not None:
        pup.cost = powerup_in.cost

    db.commit()
    db.refresh(pup)
    return pup


@router.delete("/{powerup_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_powerup(
    powerup_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Admin route: Delete a powerup (Requires admin privileges)."""
    pup = db.query(PowerUp).filter(PowerUp.id == powerup_id).first()
    if not pup:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="PowerUp not found")

    db.delete(pup)
    db.commit()
    return None
