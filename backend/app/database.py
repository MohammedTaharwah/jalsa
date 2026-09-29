import logging
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

logger = logging.getLogger("qna_backend.database")

db_url = settings.DATABASE_URL
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

parsed_url = urlparse(db_url)
query = dict(parse_qsl(parsed_url.query))
if parsed_url.scheme.startswith("postgresql") and "sslmode" not in query:
    is_local_database = parsed_url.hostname in {"localhost", "127.0.0.1", "postgres"}
    if not is_local_database:
        query["sslmode"] = settings.DATABASE_SSL_MODE
    db_url = urlunparse(parsed_url._replace(query=urlencode(query)))

# Create SQLAlchemy engine with pre-ping to reconnect on stale connections
engine = create_engine(
    db_url,
    pool_pre_ping=True,
    pool_recycle=1800,
    pool_size=5,
    max_overflow=5,
)

# Create session maker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base for models
Base = declarative_base()


def get_db():
    """Dependency that provides an isolated database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initializes all database tables and ensures schema updates are applied."""
    try:
        # Import models so that Base.metadata knows about them
        import app.models  # noqa: F401
        Base.metadata.create_all(bind=engine)

        # Apply schema migrations to existing users table
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_code VARCHAR(6);"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP WITH TIME ZONE;"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS games_balance INTEGER DEFAULT 1;"))
            
            # Enable Row Level Security (RLS) on all tables to satisfy Supabase security checks
            rls_tables = [
                "categories",
                "powerups",
                "promocodes",
                "user_promo_usage",
                "questions",
                "user_seen_questions",
                "social_links",
                "spy_categories",
                "spy_words",
                "users"
            ]
            for tbl in rls_tables:
                try:
                    conn.execute(text(f"ALTER TABLE IF EXISTS public.{tbl} ENABLE ROW LEVEL SECURITY;"))
                except Exception as rls_err:
                    logger.warning(f"Could not enable RLS on table {tbl}: {rls_err}")

            conn.commit()

        logger.info("Database tables, columns, and Row Level Security (RLS) initialized successfully.")
    except Exception as e:
        logger.error(f"Error initializing database tables: {e}")
