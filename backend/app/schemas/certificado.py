from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CertificadoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_certificado: int
    id_obra: int
    sello_tiempo: datetime
    codigo_qr_validacion: str | None
    pdf_certificado_url: str


class CertificadoCreate(BaseModel):
    firma_digital_curador: str
    pdf_certificado_url: str


class ObraCertificadaOut(BaseModel):
    """Datos de la obra que acompañan a la verificación pública del sello.

    Deliberadamente NO incluye el precio ni la fotografía en alta resolución:
    esta respuesta es pública y su único fin es confirmar qué pieza amparó el
    certificado que se está verificando.
    """

    model_config = ConfigDict(from_attributes=True)

    id_obra: int
    uid: str
    titulo: str
    tecnica: str
    dimensiones: str
    anio_creacion: int | None
    id_artista: int


class CertificadoVerificacionOut(BaseModel):
    """Resultado de resolver un sello SHA-256 contra el certificado emitido."""

    sello_valido: bool
    certificado: CertificadoOut
    obra: ObraCertificadaOut
