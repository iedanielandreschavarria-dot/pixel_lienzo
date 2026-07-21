"""
Punto de entrada de la API de Pixel y Lienzo (Galería Digital del Palacio
Nacional), construida con FastAPI.

Ejecutar en desarrollo:
    uvicorn app.main:app --reload
"""
import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import SessionLocal
from app.db.seed import seed_configuracion_sistema, seed_roles

# La consola de Windows suele usar una codepage heredada (p. ej. cp1252) en
# vez de UTF-8, lo que corrompe visualmente acentos/ñ en los logs (aunque los
# bytes reales que viajan por HTTP siempre son UTF-8 correcto). Forzamos
# UTF-8 en stdout/stderr para que los logs se vean bien en cualquier terminal.
for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8")

# Sin esta configuración, los `logger.info(...)` de nuestros propios módulos
# (p. ej. app.services.email_service en "modo consola") se descartan
# silenciosamente: Python solo muestra WARNING+ hasta que se configura un
# handler explícito. Uvicorn configura sus propios loggers ("uvicorn.*") de
# forma independiente, así que esto no interfiere con su salida.
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s: %(message)s")

# SQLAlchemy con `echo=True` (ver app.core.database) ya instala su propio
# handler sobre "sqlalchemy.engine"; sin este `propagate = False` cada línea
# de SQL se imprimiría duplicada (una vez por su propio handler, otra por el
# handler raíz que acabamos de configurar).
logging.getLogger("sqlalchemy.engine").propagate = False

logger = logging.getLogger("pixel_lienzo")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Safety-net de data seeding: garantiza que los 4 roles obligatorios
    # (Administrador, Curador, Artista, Comprador) existan al arrancar,
    # incluso si la BD se creó/restauró sin pasar por `alembic upgrade head`.
    # La función es idempotente, así que no duplica datos en reinicios.
    try:
        db = SessionLocal()
        try:
            seed_roles(db)
            seed_configuracion_sistema(db)
        finally:
            db.close()
    except Exception:
        logger.warning(
            "No se pudo verificar/insertar los datos maestros iniciales al arrancar "
            "(¿la base de datos está disponible y migrada?).",
            exc_info=True,
        )
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# Configuración de CORS para permitir la conexión del frontend en React
# (Vite: :5173). Ajustar BACKEND_CORS_ORIGINS en el archivo .env cuando se
# despliegue a un dominio real.
#
# `AnyHttpUrl` normaliza las URLs agregando una barra final
# (p.ej. "http://localhost:5173/"), pero la cabecera `Origin` que envía el
# navegador nunca la incluye ("http://localhost:5173") — sin el `.rstrip("/")`
# el middleware jamás encuentra coincidencia y bloquea todas las peticiones
# cross-origin reales del frontend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin).rstrip("/") for origin in settings.BACKEND_CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

# Archivos subidos (fotografías de obras, documentos de identidad) — ver
# app/services/storage_service.py. Se crea el directorio si no existe para
# que el montaje no falle en un checkout limpio del repositorio.
Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=settings.UPLOAD_DIR), name="static")


@app.get("/", tags=["Root"])
def read_root():
    return {
        "proyecto": "Pixel y Lienzo",
        "descripcion": "API de la Galería Digital del Palacio Nacional",
        "documentacion": f"{settings.API_V1_STR}/docs",
    }


@app.get("/health", tags=["Root"])
def health_check():
    return {"status": "ok"}
