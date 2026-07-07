from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TrazabilidadOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_trazabilidad: int
    id_obra: int
    id_propietario_anterior: int | None
    id_propietario_nuevo: int
    id_transaccion: int | None
    fecha_cambio: datetime
