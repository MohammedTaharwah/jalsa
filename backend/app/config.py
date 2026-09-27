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

    # SMTP — Brevo (smtp-relay.brevo.com) or Gmail (smtp.gmail.com)
    SMTP_SERVER: str = ""
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    MAIL_FROM: str = "no-reply@jalsah.com"
    MAIL_FROM_NAME: str = "منصة جلسة"
    SMTP_USE_SSL: bool = False
    EMAILS_FROM_EMAIL: str = ""
    EMAILS_FROM_NAME: str = ""

    @property
    def smtp_hostname(self) -> str:
        return (self.SMTP_SERVER or self.SMTP_HOST or "").strip()

    @property
    def mail_from_address(self) -> str:
        return (self.MAIL_FROM or self.EMAILS_FROM_EMAIL or "no-reply@jalsah.com").strip()

    @property
    def mail_from_name(self) -> str:
        return (self.MAIL_FROM_NAME or self.EMAILS_FROM_NAME or "منصة جلسة").strip()

    @property
    def is_smtp_configured(self) -> bool:
        return bool(self.smtp_hostname and self.SMTP_USER and self.SMTP_PASSWORD)


settings = Settings()
