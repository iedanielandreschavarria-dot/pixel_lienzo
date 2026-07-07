from datetime import datetime

from sqlalchemy import ForeignKey, String, TIMESTAMP, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class LogAuditoria(Base):
    __tablename__ = "log_auditoria"

    id_log: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id_usuario: Mapped[int | None] = mapped_column(
        ForeignKey("usuario.id_usuario", ondelete="SET NULL"), nullable=True
    )
    accion_realizada: Mapped[str] = mapped_column(String(100), nullable=False)
    detalles: Mapped[str | None] = mapped_column(Text, nullable=True)
    tabla_afectada: Mapped[str | None] = mapped_column(String(100), nullable=True)
    fecha_hora: Mapped[datetime | None] = mapped_column(TIMESTAMP, server_default=func.now())
