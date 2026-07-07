from datetime import datetime

from sqlalchemy import ForeignKey, TIMESTAMP, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class HistorialTrazabilidad(Base):
    """Línea de tiempo inalterable de dueños (Provenance)."""

    __tablename__ = "historial_trazabilidad"

    id_trazabilidad: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id_obra: Mapped[int] = mapped_column(
        ForeignKey("obra_arte.id_obra", ondelete="CASCADE"), nullable=False
    )
    id_propietario_anterior: Mapped[int | None] = mapped_column(
        ForeignKey("usuario.id_usuario", ondelete="RESTRICT"), nullable=True
    )
    id_propietario_nuevo: Mapped[int] = mapped_column(
        ForeignKey("usuario.id_usuario", ondelete="RESTRICT"), nullable=False
    )
    id_transaccion: Mapped[int | None] = mapped_column(
        ForeignKey("transaccion.id_transaccion", ondelete="SET NULL"), nullable=True
    )
    fecha_cambio: Mapped[datetime | None] = mapped_column(TIMESTAMP, server_default=func.now())
