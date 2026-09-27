from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.categories import router as categories_router
from app.routers.questions import router as questions_router
from app.routers.powerups import router as powerups_router
from app.routers.admin import router as admin_router
from app.routers.webhooks import router as webhooks_router
from app.routers.promo import router as promo_router
from app.routers.game import router as game_router
from app.routers.payment import router as payment_router

__all__ = [
    "auth_router",
    "users_router",
    "categories_router",
    "questions_router",
    "powerups_router",
    "admin_router",
    "webhooks_router",
    "promo_router",
    "game_router",
    "payment_router"
]
