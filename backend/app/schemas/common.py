from pydantic import BaseModel


class Msg(BaseModel):
    """Respuesta genérica de confirmación."""

    mensaje: str


class ArchivoSubidoOut(BaseModel):
    """Respuesta de los endpoints de subida de archivos: URL pública lista
    para usarse en los campos `fotografia_hd_url` / `documento_identidad_url`."""

    url: str
