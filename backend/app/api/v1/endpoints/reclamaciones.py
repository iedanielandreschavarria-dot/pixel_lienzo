"""
Módulo 4: Logística Integrada y Seguros — Reclamaciones por daños en el envío.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import ROL_ADMINISTRADOR, require_roles
from app.core.database import get_db
from app.models.envio_logistica import EnvioLogistica
from app.models.reclamacion import Reclamacion
from app.schemas.reclamacion import ReclamacionCreate, ReclamacionEstadoUpdate, ReclamacionOut

router = APIRouter()


@router.post("", response_model=ReclamacionOut, status_code=status.HTTP_201_CREATED)
def crear_reclamacion(payload: ReclamacionCreate, db: Session = Depends(get_db)):
    """El comprador reporta daños/incidencias sobre una obra recibida."""
    envio = db.get(EnvioLogistica, payload.id_envio)
    if envio is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Envío no encontrado")

    reclamacion = Reclamacion(**payload.model_dump())
    envio.estado_envio = "En Reclamación"
    db.add(reclamacion)
    db.commit()
    db.refresh(reclamacion)
    return reclamacion


@router.get("", response_model=list[ReclamacionOut], dependencies=[Depends(require_roles(ROL_ADMINISTRADOR))])
def listar_reclamaciones(db: Session = Depends(get_db)):
    return db.query(Reclamacion).all()


@router.patch(
    "/{id_reclamacion}/estado",
    response_model=ReclamacionOut,
    dependencies=[Depends(require_roles(ROL_ADMINISTRADOR))],
)
def resolver_reclamacion(id_reclamacion: int, payload: ReclamacionEstadoUpdate, db: Session = Depends(get_db)):
    reclamacion = db.get(Reclamacion, id_reclamacion)
    if reclamacion is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reclamación no encontrada")

    reclamacion.estado_resolucion = payload.estado_resolucion
    db.commit()
    db.refresh(reclamacion)
    return reclamacion
