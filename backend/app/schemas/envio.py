from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class EnvioCreate(BaseModel):
    id_transaccion: int
    tipo_envio: str  # Estándar | Express
    costo_envio: Decimal
    valor_seguro: Decimal


class EnvioEstadoUpdate(BaseModel):
    estado_envio: str  # Empacado | En Camino | En Centro de Distribución | Entregado | En Reclamación
    guia_transporte: str | None = None


class EnvioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_envio: int
    id_transaccion: int
    tipo_envio: str
    costo_envio: Decimal
    valor_seguro: Decimal
    guia_transporte: str | None
    estado_envio: str
