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
