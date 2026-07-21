from datetime import datetime

from sqlalchemy import DECIMAL, ForeignKey, TIMESTAMP, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ConfiguracionSistema(Base):
    """Tabla de una sola fila (id_configuracion = 1) con parámetros globales
    del sistema que antes vivían en memoria del proceso de Python (se
    perdían al reiniciar el servidor y no se compartían entre workers).

    Se siembra automáticamente (ver app/db/seed.py::seed_configuracion_sistema),
    igual que los roles obligatorios."""

    __tablename__ = "configuracion_sistema"

    id_configuracion: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    porcentaje_comision_galeria: Mapped[float] = mapped_column(DECIMAL(5, 2), nullable=False, server_default="20.00")
    actualizado_por: Mapped[int | None] = mapped_column(ForeignKey("usuario.id_usuario", ondelete="SET NULL"))
    actualizado_en: Mapped[datetime | None] = mapped_column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
