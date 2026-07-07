from datetime import datetime

from pydantic import BaseModel, ConfigDict


class LogAuditoriaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_log: int
    id_usuario: int | None
    accion_realizada: str
    detalles: str | None
    tabla_afectada: str | None
    fecha_hora: datetime
