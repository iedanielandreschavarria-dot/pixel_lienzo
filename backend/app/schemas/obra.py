from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class ObraCreate(BaseModel):
    titulo: str
    tecnica: str
    dimensiones: str
    peso: Decimal
    anio_creacion: int | None = None
    precio_venta: Decimal
    fotografia_hd_url: str
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
    estado_obra: str  # Pendiente | Publicado | Reservado | Vendido | En Préstamo | Mantenimiento
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
