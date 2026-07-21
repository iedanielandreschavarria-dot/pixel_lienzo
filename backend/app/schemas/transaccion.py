from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class TransaccionCreate(BaseModel):
    id_obra: int


class TransaccionEstadoUpdate(BaseModel):
    estado_pago: str  # Procesando | Confirmado | Dispersado | Reembolsado | Rechazado


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
    """Respuesta de `POST /transacciones`: incluye la URL de pago de Wompi
    a la que el frontend debe redirigir al comprador."""

    checkout_url: str


class CheckoutWompiOut(BaseModel):
    checkout_url: str
    referencia: str


class WebhookRespuesta(BaseModel):
    mensaje: str
