"""
Integración con Wompi (pasarela de pago, Colombia) mediante Web Checkout:
un formulario/redirect hospedado por Wompi. El backend nunca recibe ni
procesa datos de tarjeta — solo genera la URL de pago (firmada) y, después,
recibe un webhook cuando el pago se resuelve.

Referencia: https://docs.wompi.co/docs/colombia/widget-checkout-web/
            https://docs.wompi.co/docs/colombia/eventos/

Flujo:
  1. `POST /transacciones` crea la Transaccion en estado 'Procesando' y
     devuelve `checkout_url` (construida aquí) para que el frontend
     redirija al comprador.
  2. El comprador paga en el checkout hospedado de Wompi.
  3. Wompi notifica el resultado a `POST /transacciones/webhook/wompi`.
     Verificamos la firma del evento y, si fue aprobado, confirmamos la
     Transaccion (mismo efecto que el PATCH manual de un Administrador).

La `reference` que enviamos a Wompi codifica nuestro propio `id_transaccion`
(prefijo "pyl-") + un sufijo aleatorio (para permitir reintentos: cada nuevo
intento de pago de la misma transacción usa una reference distinta). Esto
evita tener que persistir un mapeo adicional en base de datos: el webhook
se autoexplica.
"""
import hashlib
import hmac
import secrets
import urllib.parse
from datetime import datetime, timedelta, timezone

from app.core.config import settings


def checkout_configurado() -> bool:
    """Indica si hay credenciales suficientes para generar un pago válido.

    Sin ellas, `construir_url_checkout` produciría una URL con la llave
    pública vacía y una firma calculada con un secreto vacío: Wompi la
    rechazaría y el comprador vería una página de error de la pasarela, sin
    pista de qué falló. Es preferible detectarlo antes de reservar la obra.
    """
    return bool(settings.WOMPI_PUBLIC_KEY and settings.WOMPI_INTEGRITY_SECRET)


def generar_referencia(id_transaccion: int) -> str:
    return f"pyl-{id_transaccion}-{secrets.token_hex(4)}"


def id_transaccion_desde_referencia(referencia: str) -> int | None:
    partes = (referencia or "").split("-")
    if len(partes) >= 2 and partes[0] == "pyl":
        try:
            return int(partes[1])
        except ValueError:
            return None
    return None


def _firma_integridad(
    referencia: str,
    monto_en_centavos: int,
    moneda: str,
    expiration_time: str | None = None,
) -> str:
    if expiration_time:
        cadena = f"{referencia}{monto_en_centavos}{moneda}{expiration_time}{settings.WOMPI_INTEGRITY_SECRET}"
    else:
        cadena = f"{referencia}{monto_en_centavos}{moneda}{settings.WOMPI_INTEGRITY_SECRET}"
    return hashlib.sha256(cadena.encode("utf-8")).hexdigest()


def generar_expiration_time(minutos: int | None = None) -> str:
    """Genera timestamp ISO-8601 UTC de expiración para el Web Checkout de Wompi."""
    ttl = minutos if minutos is not None else settings.CHECKOUT_RESERVATION_EXPIRE_MINUTES
    expira = datetime.now(timezone.utc) + timedelta(minutes=ttl)
    return expira.strftime("%Y-%m-%dT%H:%M:%S.000Z")


def construir_url_checkout(
    referencia: str,
    monto_en_centavos: int,
    redirect_url: str,
    correo_comprador: str,
    moneda: str = "COP",
    expiration_time: str | None = None,
) -> str:
    """Construye la URL de Web Checkout de Wompi con la firma de integridad
    y tiempo de expiración (`expiration-time`) para evitar reservas eternas si
    el comprador abandona la pestaña de pago."""
    exp_str = expiration_time or generar_expiration_time()
    firma = _firma_integridad(referencia, monto_en_centavos, moneda, exp_str)
    params = {
        "public-key": settings.WOMPI_PUBLIC_KEY,
        "currency": moneda,
        "amount-in-cents": str(monto_en_centavos),
        "reference": referencia,
        "signature:integrity": firma,
        "expiration-time": exp_str,
        "redirect-url": redirect_url,
        "customer-data:email": correo_comprador,
    }
    return f"{settings.WOMPI_CHECKOUT_URL}?{urllib.parse.urlencode(params)}"


def _resolver_ruta(datos: dict, ruta: str):
    valor = datos
    for parte in ruta.split("."):
        if not isinstance(valor, dict):
            return None
        valor = valor.get(parte)
    return valor


def verificar_firma_evento(payload: dict) -> bool:
    """Valida la firma de un evento webhook de Wompi (evita que un tercero
    falsifique una notificación de pago aprobado).

    Algoritmo (documentado por Wompi): concatenar los valores de
    `signature.properties` (rutas dentro de `data`), luego el `timestamp`
    del evento, luego el secreto de eventos, y aplicar SHA-256. El resultado
    debe coincidir con `signature.checksum`.
    """
    try:
        firma = payload["signature"]
        propiedades = firma["properties"]
        checksum_recibido = str(firma["checksum"])
        timestamp = payload["timestamp"]
        datos = payload["data"]
    except (KeyError, TypeError):
        return False

    if not settings.WOMPI_EVENTS_SECRET:
        return False

    valores = [str(_resolver_ruta(datos, propiedad)) for propiedad in propiedades]
    cadena = "".join(valores) + str(timestamp) + settings.WOMPI_EVENTS_SECRET
    checksum_calculado = hashlib.sha256(cadena.encode("utf-8")).hexdigest()

    return hmac.compare_digest(checksum_calculado, checksum_recibido)
