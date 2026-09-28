import logging
from contextlib import asynccontextmanager
from typing import List

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import engine, init_db
from app.config import settings
from app.routers import (
    auth_router,
    users_router,
    categories_router,
    questions_router,
    powerups_router,
    admin_router,
    webhooks_router,
    promo_router,
    game_router,
    payment_router,
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("qna_backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database tables
    logger.info("Initializing database tables...")
    init_db()
    yield
    # Shutdown
    logger.info("Shutting down application...")


app = FastAPI(
    title="Jalsah - Multiplayer Q&A Platform API",
    description="Backend API with PostgreSQL, SQLAlchemy, JWT Authentication, and WebSockets.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
origins = [
    origin.strip()
    for origin in (settings.CORS_ORIGINS or settings.FRONTEND_URL).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc):
    logger.exception("Unhandled error while processing %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "حدث خطأ داخلي في الخادم. راجع سجلات Backend."},
    )

# Include API Routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(categories_router)
app.include_router(questions_router)
app.include_router(powerups_router)
app.include_router(admin_router)
app.include_router(webhooks_router)
app.include_router(promo_router)
app.include_router(game_router)
app.include_router(payment_router)


# -------------------------------------------------------------
# WebSocket Manager for Multiplayer Q&A Sessions
# -------------------------------------------------------------
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.warning(f"Error sending message to client: {e}")


manager = ConnectionManager()


@app.api_route("/", methods=["GET", "HEAD"], tags=["System"])
def read_root():
    return {
        "status": "online",
        "service": "Jalsah Multiplayer Q&A API",
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "endpoints": [
            "/auth",
            "/users",
            "/categories",
            "/questions",
            "/powerups",
            "/health",
            "/ws/{client_id}"
        ]
    }


@app.api_route("/health", methods=["GET", "HEAD"], tags=["System"])
def health_check():
    """Verify backend and database connectivity."""
    db_status = "disconnected"
    if engine:
        try:
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
                db_status = "connected"
        except Exception as e:
            logger.error(f"Healthcheck DB connection failed: {e}")
            db_status = f"error: {str(e)}"

    return {
        "status": "healthy",
        "database": db_status
    }


@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket)
    await manager.broadcast(f"Player [{client_id}] has joined the session.")
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(f"[{client_id}]: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast(f"Player [{client_id}] left the session.")
