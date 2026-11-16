from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

ESTADOS_OBRA_LITERAL = Literal[
    "Pendiente",
    "Publicado",
    "Reservado",
    "Vendido",
    "En Préstamo",
    "Mantenimiento",
]


class ObraCreate(BaseModel):
    titulo: str = Field(min_length=1)
    tecnica: str = Field(min_length=1)
    dimensiones: str = Field(min_length=1)
    peso: Decimal = Field(gt=0)
    anio_creacion: int | None = None
    precio_venta: Decimal = Field(gt=0)
    fotografia_hd_url: str = Field(min_length=1)
    id_categoria: int
    es_patrimonio_historico: bool = False


class ObraUpdate(BaseModel):
    titulo: str | None = None
    tecnica: str | None = None
    dimensiones: str | None = None
    peso: Decimal | None = None
    anio_creacion: int | None = None
    precio_venta: Decimal | None = None
    fotografia_hd_url: str | None = None
    id_categoria: int | None = None
    es_patrimonio_historico: bool | None = None


class ObraEstadoUpdate(BaseModel):
    estado_obra: ESTADOS_OBRA_LITERAL
    motivo: str | None = None


class ObraOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_obra: int
    uid: str
    titulo: str
    tecnica: str
    dimensiones: str
    peso: Decimal
    anio_creacion: int | None
    precio_venta: Decimal
    fotografia_hd_url: str
    codigo_qr_obra: str | None
    estado_obra: str
    es_patrimonio_historico: bool
    id_artista: int
    id_categoria: int
