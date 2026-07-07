from sqlalchemy import Boolean, DECIMAL, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ObraArte(Base):
    __tablename__ = "obra_arte"

    id_obra: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    uid: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    titulo: Mapped[str] = mapped_column(String(255), nullable=False)
    tecnica: Mapped[str] = mapped_column(String(100), nullable=False)
    dimensiones: Mapped[str] = mapped_column(String(50), nullable=False)
    peso: Mapped[float] = mapped_column(DECIMAL(10, 2), nullable=False)
    anio_creacion: Mapped[int | None] = mapped_column(Integer, nullable=True)
    precio_venta: Mapped[float] = mapped_column(DECIMAL(12, 2), nullable=False)
    fotografia_hd_url: Mapped[str] = mapped_column(String(500), nullable=False)
    codigo_qr_obra: Mapped[str | None] = mapped_column(String(500), nullable=True)
    estado_obra: Mapped[str | None] = mapped_column(String(30), server_default="Pendiente")
    es_patrimonio_historico: Mapped[bool | None] = mapped_column(Boolean, server_default="0")
    id_artista: Mapped[int] = mapped_column(
        ForeignKey("perfil_artista.id_artista", ondelete="RESTRICT"), nullable=False
    )
    id_categoria: Mapped[int] = mapped_column(
        ForeignKey("categoria_arte.id_categoria", ondelete="RESTRICT"), nullable=False
    )

    artista: Mapped["PerfilArtista"] = relationship(back_populates="obras")
    categoria: Mapped["CategoriaArte"] = relationship(back_populates="obras")
    certificado: Mapped["CertificadoAutenticidad | None"] = relationship(
        back_populates="obra", uselist=False, cascade="all, delete-orphan"
    )
