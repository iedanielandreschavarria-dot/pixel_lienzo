"""
Entorno de ejecución de Alembic para Pixel y Lienzo.

En lugar de leer `sqlalchemy.url` desde `alembic.ini` (credenciales en
duro), la tomamos dinámicamente de `app.core.config.settings.DATABASE_URL`,
que a su vez se construye a partir de las variables de entorno del `.env`.
"""
import sys
from logging.config import fileConfig
from pathlib import Path

from sqlalchemy import engine_from_config, pool

from alembic import context

# Permite `from app...` al ejecutar Alembic desde la carpeta backend/
sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.core.config import settings  # noqa: E402
from app.core.database import Base  # noqa: E402

# Importa el paquete de modelos completo para que SQLAlchemy registre todas
# las tablas en `Base.metadata` antes de que Alembic compare el esquema
# (soporte de `--autogenerate`). Ver app/models/__init__.py.
import app.models  # noqa: E402, F401

# Objeto de configuración de Alembic, da acceso a los valores del .ini en uso.
config = context.config

# Inyecta la URL real de la base de datos (nunca hardcodeada en alembic.ini)
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Interpreta el archivo de configuración para logging de Python.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Metadata de nuestros modelos, usada por 'autogenerate' para detectar
# diferencias entre el código (ORM) y el esquema real de la base de datos.
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Ejecuta las migraciones en modo 'offline' (solo genera el SQL)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def _seed_datos_maestros(connection) -> None:
    """Inserta los datos maestros obligatorios (roles) apenas se aplica la migración.

    Se ejecuta con la misma conexión ya usada por Alembic, en una transacción
    aparte. Es completamente idempotente (ver app/db/seed.py), por lo que es
    seguro que corra en cada `alembic upgrade` / `alembic downgrade`.
    """
    from sqlalchemy.orm import Session

    from app.db.seed import seed_roles

    session = Session(bind=connection)
    try:
        creados = seed_roles(session)
        if creados:
            print(f"[seed] Roles insertados automáticamente: {[r.nombre_rol for r in creados]}")
    except Exception as exc:  # tabla Rol puede no existir tras un downgrade, por ejemplo
        session.rollback()
        print(f"[seed] Aviso: no se pudo aplicar el seed de roles ({exc})")
    finally:
        session.close()


def run_migrations_online() -> None:
    """Ejecuta las migraciones en modo 'online' (conexión real a MySQL)."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()

        _seed_datos_maestros(connection)


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
