"""
Módulo 5: Trust Engine — Historial de trazabilidad / Provenance.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.historial_trazabilidad import HistorialTrazabilidad
from app.schemas.trazabilidad import TrazabilidadOut

router = APIRouter()


@router.get("/{id_obra}", response_model=list[TrazabilidadOut])
def obtener_trazabilidad_obra(id_obra: int, db: Session = Depends(get_db)):
    """Línea de tiempo pública e inalterable de propietarios de la obra."""
    return (
        db.query(HistorialTrazabilidad)
        .filter(HistorialTrazabilidad.id_obra == id_obra)
        .order_by(HistorialTrazabilidad.fecha_cambio.asc())
        .all()
    )
