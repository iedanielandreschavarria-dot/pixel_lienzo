from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

ESTADOS_RESOLUCION_LITERAL = Literal[
    "Evaluación",
    "Aprobado Seguro",
    "Devolución Dinero",
    "Rechazado",
]


class ReclamacionCreate(BaseModel):
    id_envio: int
    descripcion_daño: str = Field(min_length=1)
    evidencias_fotos_url: str = Field(min_length=1)


class ReclamacionEstadoUpdate(BaseModel):
    estado_resolucion: ESTADOS_RESOLUCION_LITERAL


class ReclamacionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_reclamacion: int
    id_envio: int
    descripcion_daño: str
    evidencias_fotos_url: str
    estado_resolucion: str
