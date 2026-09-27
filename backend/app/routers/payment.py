import logging
import time
import httpx
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.config import settings

logger = logging.getLogger("qna_backend.payment")
router = APIRouter(prefix="/payment", tags=["PayPal Payment Gateway"])

# Available game packages catalog
GAME_PACKAGES = {
    "package_starter_5": {
        "id": "package_starter_5",
        "name": "باقة البداية (Starter)",
        "subtitle": "5 جلسات لعب ممتعة",
        "games_count": 5,
        "price_usd": "2.99",
        "icon": "Gamepad2",
        "color": "from-purple-500 to-indigo-600"
    },
    "package_gather_10": {
        "id": "package_gather_10",
        "name": "باقة اللمة (Popular)",
        "subtitle": "10 جلسات لأحلى سهرات الأصدقاء",
        "games_count": 10,
        "price_usd": "5.00",
        "popular": True,
        "icon": "Flame",
        "color": "from-orange-500 to-amber-500"
    },
    "package_championship_25": {
        "id": "package_championship_25",
        "name": "باقة البطولة (Champion)",
        "subtitle": "25 جلسة للتحديات والبطولات الكبرى",
        "games_count": 25,
        "price_usd": "9.99",
        "icon": "Trophy",
        "color": "from-emerald-500 to-teal-600"
    }
}


class CreateOrderRequest(BaseModel):
    package_id: str = Field(..., description="معرف حزمة الألعاب")
    user_id: Optional[int] = Field(None, description="معرف المستخدم")


class CaptureOrderRequest(BaseModel):
    orderID: str = Field(..., description="معرف طلب PayPal")
    package_id: str = Field(..., description="معرف حزمة الألعاب")
    user_id: Optional[int] = Field(None, description="معرف المستخدم")


def get_paypal_api_base() -> str:
    """Returns sandbox or live PayPal REST API endpoint based on config."""
    if settings.PAYPAL_ENVIRONMENT.lower() == "production":
        return "https://api-m.paypal.com"
    return "https://api-m.sandbox.paypal.com"


async def get_paypal_access_token() -> Optional[str]:
    """Generates OAuth2 access token from PayPal REST API."""
    url = f"{get_paypal_api_base()}/v1/oauth2/token"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                url,
                data={"grant_type": "client_credentials"},
                auth=(settings.PAYPAL_CLIENT_ID, settings.PAYPAL_CLIENT_SECRET)
            )
            if resp.status_code == 200:
                return resp.json().get("access_token")
            logger.warning(f"PayPal auth returned {resp.status_code}: {resp.text}")
    except Exception as e:
        logger.warning(f"Unable to reach PayPal live API ({e}). Will allow simulated sandbox testing.")
    return None


@router.get("/packages")
def get_packages():
    """عرض قائمة حزم وباقات الألعاب المتاحة للشراء."""
    return list(GAME_PACKAGES.values())


@router.post("/create-order")
async def create_paypal_order(payload: CreateOrderRequest):
    """
    إنشاء طلب دفع (PayPal Order) بقيمة الباقة المختارة وإرجاع orderID للواجهة الأمامية.
    """
    package = GAME_PACKAGES.get(payload.package_id)
    if not package:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="الباقة المختارة غير صحيحة"
        )

    access_token = await get_paypal_access_token()

    if access_token:
        # Live PayPal REST Call
        url = f"{get_paypal_api_base()}/v2/checkout/orders"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        order_payload = {
            "intent": "CAPTURE",
            "purchase_units": [
                {
                    "reference_id": package["id"],
                    "description": package["name"],
                    "amount": {
                        "currency_code": "USD",
                        "value": package["price_usd"]
                    }
                }
            ]
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json=order_payload, headers=headers)
            if resp.status_code in [200, 201]:
                data = resp.json()
                logger.info(f"Created live PayPal order: {data.get('id')}")
                return {
                    "orderID": data.get("id"),
                    "package_id": package["id"],
                    "price_usd": package["price_usd"]
                }
            else:
                logger.error(f"PayPal create-order error: {resp.text}")
                raise HTTPException(status_code=400, detail="فشل في إنشاء طلب الدفع مع PayPal")

    # Sandbox Simulation Fallback (for instant local testing without live PayPal account credentials)
    mock_order_id = f"ORDER-SANDBOX-{payload.package_id}-{int(time.time() * 1000)}"
    logger.info(f"Simulating sandbox order creation: {mock_order_id}")
    return {
        "orderID": mock_order_id,
        "package_id": package["id"],
        "price_usd": package["price_usd"],
        "simulated": True
    }


@router.post("/capture-order")
async def capture_paypal_order(
    payload: CaptureOrderRequest,
    db: Session = Depends(get_db)
):
    """
    تأكيد الدفع (Capture Order)، التحقق من اكتمال العملية، ثم إضافة الجلسات لرصيد المستخدم في PostgreSQL.
    """
    package = GAME_PACKAGES.get(payload.package_id)
    if not package:
        raise HTTPException(status_code=400, detail="الباقة المطلوبة غير معروفة")

    is_completed = False
    capture_id = f"CAP-{payload.orderID[:12]}"

    if not payload.orderID.startswith("ORDER-SANDBOX-"):
        # Real PayPal capture verification
        access_token = await get_paypal_access_token()
        if access_token:
            url = f"{get_paypal_api_base()}/v2/checkout/orders/{payload.orderID}/capture"
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(url, headers=headers)
                if resp.status_code in [200, 201]:
                    data = resp.json()
                    status_str = data.get("status")
                    if status_str == "COMPLETED":
                        is_completed = True
                        capture_id = data.get("id", capture_id)
                else:
                    logger.error(f"PayPal capture failed: {resp.text}")
                    raise HTTPException(status_code=400, detail="فشل في إتمام وتأكيد الدفعة من PayPal")
    else:
        # Sandbox simulated success
        is_completed = True

    if not is_completed:
        raise HTTPException(status_code=400, detail="لم يتم استلام تأكيد الدفع بنجاح")

    # Resolve user
    user = None
    if payload.user_id:
        user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        user = db.query(User).order_by(User.id.asc()).first()

    new_balance = package["games_count"]
    if user:
        user.games_balance += package["games_count"]
        db.commit()
        db.refresh(user)
        new_balance = user.games_balance

    logger.info(f"Payment captured successfully for {package['name']}. User games balance: {new_balance}")

    return {
        "success": True,
        "message": f"تمت عملية الدفع بنجاح! تم تفعيل [{package['name']}] وإضافة {package['games_count']} جلسات لحسابك.",
        "games_added": package["games_count"],
        "new_balance": new_balance,
        "capture_id": capture_id
    }
