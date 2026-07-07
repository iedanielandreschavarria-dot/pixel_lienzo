"""
Servicio de correo saliente.

Si `settings.SMTP_HOST` está vacío (por defecto en desarrollo), el envío
cae a "modo consola": el mensaje se imprime en el log del servidor en vez
de enviarse de verdad. Esto permite desarrollar y probar todos los flujos
(verificación de correo, MFA, recuperación de contraseña, notificaciones
de curaduría) sin depender de un servidor SMTP real.

En producción, basta con configurar SMTP_HOST/SMTP_USER/SMTP_PASSWORD en
el .env para que los correos se envíen de verdad — el código de los
endpoints no cambia.
"""
import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger("pixel_lienzo.email")


def send_email(to: str, subject: str, body: str) -> None:
    if not settings.SMTP_HOST:
        logger.info(
            "\n"
            "==================== 📧 EMAIL (modo consola / dev) ====================\n"
            f"Para:     {to}\n"
            f"Asunto:   {subject}\n"
            f"--------------------------------------------------------------------\n"
            f"{body}\n"
            "========================================================================"
        )
        return

    message = EmailMessage()
    message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            if settings.SMTP_USER:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(message)
    except Exception:
        logger.exception(f"No se pudo enviar el correo a {to} (asunto: {subject!r})")


def enviar_codigo_verificacion_email(to: str, codigo: str) -> None:
    send_email(
        to=to,
        subject="Verifica tu correo — Pixel y Lienzo",
        body=(
            f"Tu código de verificación es: {codigo}\n\n"
            f"Ingresa este código en la plataforma para confirmar tu dirección "
            f"de correo electrónico. Expira en {settings.EMAIL_VERIFICATION_EXPIRE_MINUTES} minutos."
        ),
    )


def enviar_codigo_mfa(to: str, codigo: str) -> None:
    send_email(
        to=to,
        subject="Tu código de acceso (MFA) — Pixel y Lienzo",
        body=(
            f"Tu código de doble factor de autenticación es: {codigo}\n\n"
            f"Expira en {settings.MFA_CODE_EXPIRE_MINUTES} minutos. Si no intentaste "
            f"iniciar sesión, ignora este mensaje."
        ),
    )


def enviar_enlace_recuperacion(to: str, token: str) -> None:
    send_email(
        to=to,
        subject="Recupera tu contraseña — Pixel y Lienzo",
        body=(
            f"Usa el siguiente token para restablecer tu contraseña desde la "
            f"plataforma:\n\n{token}\n\n"
            f"Expira en {settings.PASSWORD_RESET_EXPIRE_MINUTES} minutos. Si no "
            f"solicitaste este cambio, ignora este mensaje."
        ),
    )


def enviar_resultado_validacion_artista(to: str, aprobado: bool, motivos_rechazo: str | None = None) -> None:
    if aprobado:
        body = (
            "¡Felicidades! Tu perfil de artista fue verificado por nuestro equipo "
            "de curaduría. Ya puedes iniciar sesión y comenzar a cargar tus obras."
        )
    else:
        body = (
            "Tu solicitud de vinculación como artista fue revisada y no fue "
            "aprobada en esta ocasión.\n\n"
            f"Motivo: {motivos_rechazo or 'No especificado'}\n\n"
            "Puedes actualizar tu perfil y volver a postularte."
        )
    send_email(to=to, subject="Resultado de tu validación como artista — Pixel y Lienzo", body=body)


def enviar_notificacion_venta(to: str, titulo_obra: str, monto_neto: str) -> None:
    send_email(
        to=to,
        subject="¡Tu obra fue vendida! — Pixel y Lienzo",
        body=(
            f"Tu obra '{titulo_obra}' fue comprada y el pago fue confirmado.\n\n"
            f"Monto neto a recibir (tras comisión de la galería): {monto_neto}\n\n"
            f"Te notificaremos cuando se realice la dispersión del pago a tu cuenta."
        ),
    )


def enviar_notificacion_dispersion(to: str, titulo_obra: str, monto_neto: str) -> None:
    send_email(
        to=to,
        subject="Pago dispersado — Pixel y Lienzo",
        body=(
            f"Se dispersó el pago correspondiente a la venta de tu obra '{titulo_obra}'.\n\n"
            f"Monto: {monto_neto}"
        ),
    )


def enviar_resultado_validacion_obra(to: str, titulo_obra: str, aprobada: bool, motivo: str | None = None) -> None:
    if aprobada:
        body = f"Tu obra '{titulo_obra}' fue aprobada por curaduría y ya está publicada en el catálogo."
    else:
        body = (
            f"Tu obra '{titulo_obra}' fue revisada y requiere ajustes antes de publicarse.\n\n"
            f"Observaciones: {motivo or 'No especificado'}"
        )
    send_email(to=to, subject="Actualización sobre tu obra — Pixel y Lienzo", body=body)
