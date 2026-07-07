from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class CategoriaArte(Base):
    __tablename__ = "categoria_arte"

    id_categoria: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nombre_categoria: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)

    obras: Mapped[list["ObraArte"]] = relationship(back_populates="categoria")
