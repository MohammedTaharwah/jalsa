from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow",
    )

    PROJECT_NAME: str = "Multiplayer Q&A Platform (Jalsah)"
    DATABASE_URL: str
    DATABASE_SSL_MODE: str = "require"
    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    N8N_WEBHOOK_URL: str = "http://n8n:5678/webhook/generate-questions"
    N8N_WEBHOOK_SECRET: str = "change-me-in-production"
    BACKEND_RECEIVE_WEBHOOK_URL: str = "http://backend:8000/api/webhooks/n8n-receive"
    FRONTEND_URL: str = "http://localhost:5173"
    CORS_ORIGINS: str = ""

    # PayPal Payment Gateway Configuration
    PAYPAL_CLIENT_ID: str = ""
    PAYPAL_CLIENT_SECRET: str = ""
    PAYPAL_ENVIRONMENT: str = "sandbox"

    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = ""

    # Brevo (Sendinblue) HTTP API Configuration
    BREVO_API_KEY: str = ""
    BREVO_SENDER_EMAIL: str = ""
    BREVO_SENDER_NAME: str = "منصة جلسة"


settings = Settings()
