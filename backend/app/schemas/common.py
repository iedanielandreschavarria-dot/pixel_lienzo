from pydantic import BaseModel


class Msg(BaseModel):
    """Respuesta genérica de confirmación."""

    mensaje: str
