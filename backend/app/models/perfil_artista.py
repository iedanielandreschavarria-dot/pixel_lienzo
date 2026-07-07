from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class PerfilArtista(Base):
    __tablename__ = "perfil_artista"

    id_artista: Mapped[int] = mapped_column(
        ForeignKey("usuario.id_usuario", ondelete="CASCADE"), primary_key=True
    )
    biografia_profesional: Mapped[str | None] = mapped_column(Text, nullable=True)
    documento_identidad_url: Mapped[str] = mapped_column(String(500), nullable=False)
    informacion_bancaria: Mapped[str | None] = mapped_column(Text, nullable=True)  # cifrada
    estado_validacion: Mapped[str | None] = mapped_column(String(20), server_default="Pendiente")
    motivos_rechazo: Mapped[str | None] = mapped_column(Text, nullable=True)

    usuario: Mapped["Usuario"] = relationship(back_populates="perfil_artista")
    obras: Mapped[list["ObraArte"]] = relationship(back_populates="artista")
