from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Reclamacion(Base):
    __tablename__ = "reclamacion"

    id_reclamacion: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id_envio: Mapped[int] = mapped_column(
        ForeignKey("envio_logistica.id_envio", ondelete="RESTRICT"), nullable=False, unique=True
    )
    descripcion_daño: Mapped[str] = mapped_column(Text, nullable=False)
    evidencias_fotos_url: Mapped[str] = mapped_column(String(500), nullable=False)
    estado_resolucion: Mapped[str | None] = mapped_column(String(30), server_default="Evaluación")

    envio: Mapped["EnvioLogistica"] = relationship(back_populates="reclamacion")
