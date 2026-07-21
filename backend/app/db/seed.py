"""
Data seeding: datos maestros obligatorios para que la aplicación funcione.

Este módulo es la ÚNICA fuente de verdad para los roles del sistema
(ver Doc/bd_pixel_lienzo.txt, sección "INSERCIÓN DE DATOS MAESTROS"). Se
reutiliza en dos lugares para garantizar que los roles siempre existan:

1. Dentro de la migración inicial de Alembic (alembic/versions/..._initial_migration.py),
   justo después de crear la tabla `Rol`.
2. Como "safety-net" en el evento de startup de FastAPI (app/main.py), por si
   la base de datos fue creada/restaurada sin pasar por Alembic.

Toda función aquí es idempotente: puede ejecutarse múltiples veces sin
duplicar datos ni fallar si ya existen.
"""
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.configuracion_sistema import ConfiguracionSistema
from app.models.rol import Rol

# Comisión de galería por defecto (RF 1.3.2) al crear la fila única de
# configuración por primera vez. Editable después vía
# GET/PATCH /transacciones/config/comision (Administrador).
PORCENTAJE_COMISION_GALERIA_DEFAULT = Decimal("20.00")

# Roles obligatorios del sistema (RBAC) — ver Módulo 1 de la documentación.
ROLES_INICIALES: list[dict[str, str]] = [
    {
        "nombre_rol": "Administrador",
        "descripcion": "Control total, gestión financiera, comisiones y logs globales.",
    },
    {
        "nombre_rol": "Curador",
        "descripcion": "Auditoría de perfiles de artistas, validación de obras y emisión de certificados.",
    },
    {
        "nombre_rol": "Artista",
        "descripcion": "Carga de portafolio y obras independientes, consulta de saldos.",
    },
    {
        "nombre_rol": "Comprador",
        "descripcion": "Navegación del catálogo, adquisición de obras y descarga de certificados.",
    },
]


def seed_roles(session: Session) -> list[Rol]:
    """Inserta los 4 roles obligatorios si aún no existen. Devuelve los roles creados."""
    existentes = {r.nombre_rol for r in session.query(Rol.nombre_rol).all()}
    creados: list[Rol] = []

    for rol_data in ROLES_INICIALES:
        if rol_data["nombre_rol"] not in existentes:
            nuevo_rol = Rol(**rol_data)
            session.add(nuevo_rol)
            creados.append(nuevo_rol)

    if creados:
        session.commit()

    return creados


def seed_configuracion_sistema(session: Session) -> ConfiguracionSistema | None:
    """Crea la fila única (id_configuracion = 1) de `configuracion_sistema`
    si todavía no existe ninguna. Devuelve la fila creada, o None si ya
    existía (idempotente, igual que seed_roles)."""
    existente = session.query(ConfiguracionSistema).first()
    if existente is not None:
        return None

    nueva = ConfiguracionSistema(porcentaje_comision_galeria=PORCENTAJE_COMISION_GALERIA_DEFAULT)
    session.add(nueva)
    session.commit()
    return nueva


def run_seed() -> None:
    """Punto de entrada standalone: `python -m app.db.seed`."""
    from app.core.database import SessionLocal

    db = SessionLocal()
    try:
        creados = seed_roles(db)
        if creados:
            print(f"Roles creados: {[r.nombre_rol for r in creados]}")
        else:
            print("Los 4 roles obligatorios ya existían. Nada que hacer.")

        configuracion = seed_configuracion_sistema(db)
        if configuracion:
            print(f"Configuración del sistema creada (comisión inicial {configuracion.porcentaje_comision_galeria}%).")
        else:
            print("La fila de configuración del sistema ya existía. Nada que hacer.")
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
