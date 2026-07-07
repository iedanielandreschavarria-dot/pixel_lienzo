from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class PreferenciaComprador(Base):
    __tablename__ = "preferencia_comprador"

    id_comprador: Mapped[int] = mapped_column(
        ForeignKey("usuario.id_usuario", ondelete="CASCADE"), primary_key=True
    )
    id_categoria: Mapped[int] = mapped_column(
        ForeignKey("categoria_arte.id_categoria", ondelete="CASCADE"), primary_key=True
    )
