"""
Configuración de la conexión a la base de datos mediante SQLAlchemy.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    echo=(settings.ENVIRONMENT == "development"),
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Clase base declarativa para todos los modelos ORM."""

    pass


def get_db():
    """Dependencia de FastAPI: entrega una sesión de BD por request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
