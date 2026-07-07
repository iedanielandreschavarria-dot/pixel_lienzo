from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class TransaccionCreate(BaseModel):
    id_obra: int


class TransaccionEstadoUpdate(BaseModel):
    estado_pago: str  # Procesando | Confirmado | Dispersado | Reembolsado


class ComisionUpdate(BaseModel):
    porcentaje: Decimal = Field(gt=0, le=100)


class ComisionOut(BaseModel):
    porcentaje: Decimal


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
