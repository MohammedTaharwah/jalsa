import logging

import httpx

from app.config import settings

logger = logging.getLogger("qna_backend.email")


class EmailDeliveryError(Exception):
    """Raised when an OTP email cannot be delivered via the email API."""


def send_otp_email(to_email: str, otp_code: str) -> bool:
    """
    إرسال كود التحقق OTP عبر Resend HTTPS API.
    """
    logger.info("Resend configuration check: api_key_configured=%s sender=%s",
                bool(settings.RESEND_API_KEY), settings.RESEND_FROM_EMAIL)

    if not settings.RESEND_API_KEY or not settings.RESEND_FROM_EMAIL:
        raise EmailDeliveryError(
            "إعدادات خدمة البريد غير مكتملة. أضف RESEND_API_KEY و RESEND_FROM_EMAIL في Render."
        )

    subject = "رمز التحقق الخاص بك في منصة جلسة"

    html_content = f"""
    <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
        <h2 style="color: #6366f1;">أهلاً بك في منصة جلسة</h2>
        <p>رمز التحقق الخاص بك لتفعيل الحساب هو:</p>
        <h1 style="background: #e0e7ff; color: #4338ca; padding: 10px 20px; display: inline-block; border-radius: 5px; letter-spacing: 6px;">{otp_code}</h1>
        <p>هذا الرمز صالح لمدة 15 دقيقة.</p>
        <p style="font-size: 12px; color: #94a3b8;">إذا لم تطلب هذا الرمز يمكنك تجاهل الرسالة.</p>
    </div>
    """

    try:
        response = httpx.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "from": settings.RESEND_FROM_EMAIL,
                "to": [to_email],
                "subject": subject,
                "html": html_content,
            },
            timeout=20,
        )
        response.raise_for_status()

        logger.info("OTP email sent via Resend to %s", to_email)
        return True
    except Exception as exc:
        logger.exception("Failed to send OTP email via Resend to %s", to_email)
        raise EmailDeliveryError(
            "تعذر إرسال رسالة التحقق. تحقق من إعدادات Resend أو أعد المحاولة."
        ) from exc
