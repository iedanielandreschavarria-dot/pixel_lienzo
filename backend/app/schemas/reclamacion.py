from pydantic import BaseModel, ConfigDict


class ReclamacionCreate(BaseModel):
    id_envio: int
    descripcion_daño: str
    evidencias_fotos_url: str


class ReclamacionEstadoUpdate(BaseModel):
    estado_resolucion: str  # Evaluación | Aprobado Seguro | Devolución Dinero | Rechazado


class ReclamacionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_reclamacion: int
    id_envio: int
    descripcion_daño: str
    evidencias_fotos_url: str
    estado_resolucion: str
