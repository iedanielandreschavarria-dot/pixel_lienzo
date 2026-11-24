"""
Integración con Stripe Checkout (tarjetas internacionales, Apple Pay, Google Pay)
mediante Stripe Checkout Sessions API (REST estándar sin requerir dependencias
externas adicionales) y validación de firma criptográfica HMAC-SHA256 en el
header `Stripe-Signature`.

Flujo:
  1. `POST /transacciones` con `pasarela="stripe"` (o `GET /transacciones/{id}/checkout-stripe`)
     crea una sesión de Stripe Checkout o, si `STRIPE_SECRET_KEY` está en modo
     desarrollo sin llave, genera una URL de retorno firmada en modo sandbox local.
  2. Stripe redirige al comprador a su formulario hospedado seguro.
  3. Al completarse el pago, Stripe envía `checkout.session.completed` a
     `POST /transacciones/webhook/stripe`, donde verificamos la firma HMAC
     y confirmamos la transacción + trazabilidad de la obra.
"""
import hashlib
import hmac
import json
import secrets
import time
import urllib.parse
import urllib.request

from app.core.config import settings


def stripe_configurado() -> bool:
    return bool(settings.STRIPE_SECRET_KEY)


def generar_referencia_stripe(id_transaccion: int) -> str:
    return f"stripe-pyl-{id_transaccion}-{secrets.token_hex(4)}"


def id_transaccion_desde_referencia_stripe(referencia: str) -> int | None:
    partes = (referencia or "").split("-")
    # Acepta tanto "stripe-pyl-{id}-{hex}" como "pyl-{id}-{hex}"
    if len(partes) >= 3 and partes[0] == "stripe" and partes[1] == "pyl":
        try:
            return int(partes[2])
        except ValueError:
            return None
    if len(partes) >= 2 and partes[0] == "pyl":
        try:
            return int(partes[1])
        except ValueError:
            return None
    return None


def crear_sesion_checkout_stripe(
    *,
    referencia: str,
    titulo_obra: str,
    monto_en_centavos: int,
    correo_comprador: str,
    success_url: str,
    cancel_url: str,
    moneda: str | None = None,
) -> str:
    """
    Crea una sesión real de Stripe Checkout (`POST https://api.stripe.com/v1/checkout/sessions`)
    cuando `STRIPE_SECRET_KEY` está configurada en `.env`, y devuelve la URL
    de pago hospedada por Stripe (`session.url`).
    Si no hay llave secreta configurada en entorno local, devuelve la URL de
    resultado en modo simulación de desarrollo para no bloquear pruebas de UI.
    """
    currency = (moneda or settings.STRIPE_CURRENCY or "cop").lower()

    if not stripe_configurado():
        params_sim = urllib.parse.urlencode(
            {
                "pasarela": "stripe",
                "referencia": referencia,
                "modo": "sandbox",
            }
        )
        return f"{success_url}?{params_sim}"

    payload_form = {
        "mode": "payment",
        "client_reference_id": referencia,
        "customer_email": correo_comprador,
        "success_url": f"{success_url}?pasarela=stripe&session_id={{CHECKOUT_SESSION_ID}}",
        "cancel_url": cancel_url,
        "line_items[0][quantity]": "1",
        "line_items[0][price_data][currency]": currency,
        "line_items[0][price_data][unit_amount]": str(monto_en_centavos),
        "line_items[0][price_data][product_data][name]": f"Obra: {titulo_obra} · Galería Palacio Nacional",
        "metadata[referencia]": referencia,
    }

    data_bytes = urllib.parse.urlencode(payload_form).encode("utf-8")
    req = urllib.request.Request(
        "https://api.stripe.com/v1/checkout/sessions",
        data=data_bytes,
        headers={
            "Authorization": f"Bearer {settings.STRIPE_SECRET_KEY}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        method="POST",
    )

    with urllib.request.urlopen(req, timeout=12) as resp:
        respuesta = json.loads(resp.read().decode("utf-8"))
        checkout_url = respuesta.get("url")
        if not checkout_url:
            raise RuntimeError("Stripe no devolvió una URL de checkout válida.")
        return str(checkout_url)


def verificar_firma_webhook_stripe(
    raw_body: bytes,
    stripe_signature_header: str | None,
    tolerancia_segundos: int = 300,
) -> bool:
    """
    Valida la cabecera `Stripe-Signature` (`t=timestamp,v1=hmac_sha256`) usando
    `settings.STRIPE_WEBHOOK_SECRET`.
    """
    if not stripe_signature_header or not settings.STRIPE_WEBHOOK_SECRET:
        return False

    pares = {}
    firmas_v1: list[str] = []
    for elemento in stripe_signature_header.split(","):
        if "=" not in elemento:
            continue
        k, v = elemento.strip().split("=", 1)
        if k == "t":
            pares["t"] = v
        elif k == "v1":
            firmas_v1.append(v)

    timestamp_str = pares.get("t")
    if not timestamp_str or not firmas_v1:
        return False

    try:
        timestamp_int = int(timestamp_str)
    except ValueError:
        return False

    if abs(int(time.time()) - timestamp_int) > tolerancia_segundos:
        return False

    mensaje_firmado = f"{timestamp_str}.".encode("utf-8") + raw_body
    firma_esperada = hmac.new(
        settings.STRIPE_WEBHOOK_SECRET.encode("utf-8"),
        mensaje_firmado,
        hashlib.sha256,
    ).hexdigest()

    return any(hmac.compare_digest(firma_esperada, f) for f in firmas_v1)

