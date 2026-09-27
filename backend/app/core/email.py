import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr

from app.config import settings

logger = logging.getLogger("qna_backend.email")


class EmailDeliveryError(Exception):
    """Raised when an OTP email cannot be delivered via SMTP."""


def send_otp_email(to_email: str, otp_code: str) -> bool:
    """
    إرسال كود التحقق OTP المكون من 6 أرقام إلى بريد المستخدم عبر SMTP الحقيقي.
    يتطلب SMTP_SERVER / SMTP_USER / SMTP_PASSWORD (Brevo أو Gmail).
    """
    if not settings.is_smtp_configured:
        raise EmailDeliveryError(
            "إعدادات SMTP غير مكتملة. أضف SMTP_SERVER و SMTP_USER و SMTP_PASSWORD في ملف .env."
        )

    sender = settings.mail_from_address
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
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = formataddr((settings.mail_from_name, sender))
        message["To"] = to_email
        message.attach(MIMEText(html_content, "html", "utf-8"))

        smtp_client = smtplib.SMTP_SSL if settings.SMTP_USE_SSL else smtplib.SMTP
        with smtp_client(settings.smtp_hostname, settings.SMTP_PORT, timeout=20) as server:
            server.ehlo()
            if not settings.SMTP_USE_SSL:
                server.starttls()
                server.ehlo()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(sender, [to_email], message.as_string())

        logger.info("OTP email sent via SMTP to %s", to_email)
        return True
    except Exception as exc:
        logger.exception("Failed to send OTP email to %s", to_email)
        raise EmailDeliveryError(
            "تعذر إرسال رسالة التحقق إلى بريدك. تحقق من إعدادات SMTP أو أعد المحاولة."
        ) from exc
