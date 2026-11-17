from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

TIPOS_ENVIO_LITERAL = Literal["Estándar", "Express"]
ESTADOS_ENVIO_LITERAL = Literal[
    "Empacado",
    "En Camino",
    "En Centro de Distribución",
    "Entregado",
    "En Reclamación",
]


class EnvioCreate(BaseModel):
    id_transaccion: int
    tipo_envio: TIPOS_ENVIO_LITERAL
    costo_envio: Decimal = Field(ge=0)
    # Si se omite, se autocalcula como el valor total de la obra (asegurar
    # el reemplazo completo de la pieza en caso de pérdida/daño).
    valor_seguro: Decimal | None = Field(default=None, ge=0)


class EnvioEstadoUpdate(BaseModel):
    estado_envio: ESTADOS_ENVIO_LITERAL
    guia_transporte: str | None = None
    # Comprobante de entrega: se espera al marcar el envío como 'Entregado'.
    foto_recepcion_url: str | None = None
    firma_digital_comprador: str | None = None


class EnvioConfirmarRecepcion(BaseModel):
    """RF 4.4.1 / RF 4.4.2 — Confirmación de recepción por parte del Comprador."""

    foto_recepcion_url: str | None = None
    firma_digital_comprador: str | None = None



class EnvioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_envio: int
    id_transaccion: int
    tipo_envio: str
    costo_envio: Decimal
    valor_seguro: Decimal
    guia_transporte: str | None
    estado_envio: str
    foto_recepcion_url: str | None
    firma_digital_comprador: str | None
