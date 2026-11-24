from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

ESTADOS_PAGO_LITERAL = Literal[
    "Procesando",
    "Confirmado",
    "Dispersado",
    "Reembolsado",
    "Rechazado",
]


PASARELAS_PAGO_LITERAL = Literal["wompi", "stripe"]


class TransaccionCreate(BaseModel):
    id_obra: int
    pasarela: PASARELAS_PAGO_LITERAL = "wompi"


class TransaccionEstadoUpdate(BaseModel):
    estado_pago: ESTADOS_PAGO_LITERAL


class ComisionUpdate(BaseModel):
    porcentaje: Decimal = Field(gt=0, le=100)


class ComisionOut(BaseModel):
    porcentaje: Decimal
    actualizado_en: datetime | None = None


class TransaccionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_transaccion: int
    id_comprador: int
    id_obra: int
    fecha_pago: datetime
    monto_total: Decimal
    porcentaje_comision_galeria: Decimal
    monto_neto_artista: Decimal
    monto_comision_galeria: Decimal
    impuestos_retenciones: Decimal
    estado_pago: str
    referencia_pasarela: str | None = None


class TransaccionCreadaOut(TransaccionOut):
    """Respuesta de `POST /transacciones`: incluye la URL de pago (Wompi o Stripe)
    a la que el frontend debe redirigir al comprador."""

    checkout_url: str
    pasarela: PASARELAS_PAGO_LITERAL = "wompi"


class CheckoutWompiOut(BaseModel):
    checkout_url: str
    referencia: str


class CheckoutStripeOut(BaseModel):
    checkout_url: str
    referencia: str


class WebhookRespuesta(BaseModel):
    mensaje: str
