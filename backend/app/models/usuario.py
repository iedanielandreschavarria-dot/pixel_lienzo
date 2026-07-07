from datetime import datetime

from sqlalchemy import Boolean, ForeignKey, String, TIMESTAMP, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Usuario(Base):
    __tablename__ = "usuario"

    id_usuario: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    correo_electronico: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    contrasenia: Mapped[str] = mapped_column(String(255), nullable=False)
    id_rol: Mapped[int] = mapped_column(ForeignKey("rol.id_rol", ondelete="RESTRICT"), nullable=False)
    # Nullable=True porque así están definidas en la BD real (con DEFAULT pero sin NOT NULL)
    mfa_activado: Mapped[bool | None] = mapped_column(Boolean, server_default="0")
    estado_cuenta: Mapped[str | None] = mapped_column(String(20), server_default="Activo")  # Activo | Inhabilitado
    fecha_registro: Mapped[datetime | None] = mapped_column(TIMESTAMP, server_default=func.now())

    rol: Mapped["Rol"] = relationship(back_populates="usuarios")
    perfil_artista: Mapped["PerfilArtista | None"] = relationship(
        back_populates="usuario", uselist=False, cascade="all, delete-orphan"
    )
