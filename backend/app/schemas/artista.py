from pydantic import BaseModel, ConfigDict


class PerfilArtistaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_artista: int
    biografia_profesional: str | None = None
    documento_identidad_url: str
    estado_validacion: str
    motivos_rechazo: str | None = None


class PerfilArtistaUpdate(BaseModel):
    biografia_profesional: str | None = None
    informacion_bancaria: str | None = None


class ValidacionArtistaRequest(BaseModel):
    aprobar: bool
    motivos_rechazo: str | None = None
