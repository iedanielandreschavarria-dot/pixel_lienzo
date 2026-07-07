from datetime import datetime

from sqlalchemy import ForeignKey, String, TIMESTAMP, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class CertificadoAutenticidad(Base):
    __tablename__ = "certificado_autenticidad"

    id_certificado: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id_obra: Mapped[int] = mapped_column(
        ForeignKey("obra_arte.id_obra", ondelete="CASCADE"), nullable=False, unique=True
    )
    firma_digital_curador: Mapped[str] = mapped_column(Text, nullable=False)
    sello_tiempo: Mapped[datetime | None] = mapped_column(TIMESTAMP, server_default=func.now())
    codigo_qr_validacion: Mapped[str | None] = mapped_column(String(500), nullable=True)
    pdf_certificado_url: Mapped[str] = mapped_column(String(500), nullable=False)

    obra: Mapped["ObraArte"] = relationship(back_populates="certificado")
