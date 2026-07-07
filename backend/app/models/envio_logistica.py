from sqlalchemy import DECIMAL, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class EnvioLogistica(Base):
    __tablename__ = "envio_logistica"

    id_envio: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id_transaccion: Mapped[int] = mapped_column(
        ForeignKey("transaccion.id_transaccion", ondelete="RESTRICT"), nullable=False, unique=True
    )
    tipo_envio: Mapped[str] = mapped_column(String(20), nullable=False)  # Estándar | Express
    costo_envio: Mapped[float] = mapped_column(DECIMAL(10, 2), nullable=False)
    valor_seguro: Mapped[float] = mapped_column(DECIMAL(10, 2), nullable=False)
    guia_transporte: Mapped[str | None] = mapped_column(String(100), nullable=True)
    estado_envio: Mapped[str | None] = mapped_column(String(30), server_default="Empacado")
    foto_recepcion_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    firma_digital_comprador: Mapped[str | None] = mapped_column(Text, nullable=True)

    transaccion: Mapped["Transaccion"] = relationship(back_populates="envio")
    reclamacion: Mapped["Reclamacion | None"] = relationship(
        back_populates="envio", uselist=False, cascade="all, delete-orphan"
    )
