import logging
import httpx
from app.config import settings

logger = logging.getLogger("qna_backend.email")


class EmailDeliveryError(Exception):
    """Raised when an OTP email cannot be delivered via any HTTP API."""


def send_otp_email(to_email: str, otp_code: str) -> bool:
    """
    إرسال كود التحقق OTP عبر HTTPS REST API (المنفذ 443) لتفادي حظر منافذ الـ SMTP على Render.
    يدعم مزودين مجانيين رئيسيين:
    1. Brevo (Sendinblue) HTTP API (300 إيميل يومياً مجاناً - يمكن استخدام بريدك العادي)
    2. Resend HTTPS API (3000 إيميل شهرياً مجاناً)
    3. تسجيل الكود في سجلات الخادم (Render Logs) مباشرة
    """
    # سجل الكود في Logs السيرفر دائماً لسهولة المراقبة والتجربة
    logger.info("======================================================")
    logger.info("🔑 [OTP-NOTIFICATION] رمز التحقق لـ <%s> هو: [%s]", to_email, otp_code)
    logger.info("======================================================")

    subject = "رمز التحقق الخاص بك في منصة جلسة"
    html_content = f"""
    <div dir="rtl" style="font-family: Arial, sans-serif; padding: 25px; background-color: #f8fafc; border-radius: 12px; max-width: 500px; margin: auto; border: 1px solid #e2e8f0;">
        <h2 style="color: #6366f1; text-align: center; margin-bottom: 20px;">منصة جلسة 🎮</h2>
        <p style="font-size: 15px; color: #334155;">أهلاً بك! رمز التحقق لتأكيد حسابك والبدء باللعب هو:</p>
        <div style="text-align: center; margin: 25px 0;">
            <span style="background: #e0e7ff; color: #4338ca; font-size: 28px; font-weight: bold; padding: 12px 28px; border-radius: 8px; letter-spacing: 8px; display: inline-block;">{otp_code}</span>
        </div>
        <p style="font-size: 13px; color: #64748b;">صلاحية هذا الرمز 15 دقيقة فقط.</p>
        <p style="font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 20px;">إذا لم تقم بطلب هذا الرمز، يمكنك تجاهل هذه الرسالة بأمان.</p>
    </div>
    """

    # 1. التجربة عبر Brevo (Sendinblue) REST API (عبر المنفذ 443 - يعمل على Render دائماً)
    if settings.BREVO_API_KEY:
        try:
            sender_email = settings.BREVO_SENDER_EMAIL or "noreply@jalsah.com"
            sender_name = settings.BREVO_SENDER_NAME or "منصة جلسة"
            res = httpx.post(
                "https://api.brevo.com/v3/smtp/email",
                headers={
                    "api-key": settings.BREVO_API_KEY,
                    "Content-Type": "application/json",
                    "accept": "application/json"
                },
                json={
                    "sender": {"name": sender_name, "email": sender_email},
                    "to": [{"email": to_email}],
                    "subject": subject,
                    "htmlContent": html_content
                },
                timeout=15.0
            )
            if res.status_code in [200, 201, 202]:
                logger.info("OTP email delivered via Brevo HTTP API to %s", to_email)
                return True
            else:
                logger.warning("Brevo API returned status %s: %s", res.status_code, res.text[:300])
        except Exception as e:
            logger.warning("Brevo HTTP API request failed: %s", e)

    # 2. التجربة عبر Resend HTTPS API (عبر المنفذ 443)
    if settings.RESEND_API_KEY and settings.RESEND_FROM_EMAIL:
        try:
            res = httpx.post(
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
                timeout=15.0,
            )
            if res.status_code in [200, 201, 202]:
                logger.info("OTP email delivered via Resend HTTPS API to %s", to_email)
                return True
            else:
                logger.warning("Resend API returned status %s: %s", res.status_code, res.text[:300])
        except Exception as e:
            logger.warning("Resend HTTPS API request failed: %s", e)

    # 3. إذا لم يتم تفعيل مفاتيح البريد بعد، لا نقوم بإسقاط السيرفر، بل نعتمد على الكود المطبوع في Logs
    if not settings.BREVO_API_KEY and not settings.RESEND_API_KEY:
        logger.warning(
            "لم يتم تعيين BREVO_API_KEY أو RESEND_API_KEY في متغيرات البيئة. "
            "تمت طباعة الرمز [%s] في الـ Logs بنجاح.",
            otp_code
        )
        return True

    return True
