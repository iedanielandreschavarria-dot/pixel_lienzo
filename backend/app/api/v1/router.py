"""
Router agregador de la versión 1 de la API. Cada sub-router corresponde a
un módulo funcional descrito en la documentación de requisitos.
"""
from fastapi import APIRouter

from app.api.v1.endpoints import (
    archivos,
    artistas,
    auditoria,
    auth,
    categorias,
    certificados,
    envios,
    obras,
    reclamaciones,
    transacciones,
    trazabilidad,
    usuarios,
)

api_router = APIRouter()

# Módulo 1: Identidad y Seguridad
api_router.include_router(auth.router, prefix="/auth", tags=["Autenticación"])
api_router.include_router(usuarios.router, prefix="/usuarios", tags=["Usuarios (RBAC)"])
api_router.include_router(auditoria.router, prefix="/auditoria", tags=["Auditoría"])

# Módulo 2: Curaduría y Catálogo
api_router.include_router(artistas.router, prefix="/artistas", tags=["Artistas"])
api_router.include_router(categorias.router, prefix="/categorias", tags=["Categorías"])
api_router.include_router(obras.router, prefix="/obras", tags=["Obras / Catálogo"])
api_router.include_router(archivos.router, prefix="/archivos", tags=["Archivos"])

# Módulo 5: Motor de Confianza (Trust Engine)
api_router.include_router(certificados.router, prefix="/certificados", tags=["Certificados de Autenticidad"])
api_router.include_router(trazabilidad.router, prefix="/trazabilidad", tags=["Trazabilidad (Provenance)"])

# Módulo 3: Motor de Pago
api_router.include_router(transacciones.router, prefix="/transacciones", tags=["Transacciones"])

# Módulo 4: Logística Integrada
api_router.include_router(envios.router, prefix="/envios", tags=["Logística"])
api_router.include_router(reclamaciones.router, prefix="/reclamaciones", tags=["Reclamaciones"])
