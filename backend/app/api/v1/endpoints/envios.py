"""
Módulo 4: Logística Integrada y Seguros — Embalaje, despacho y seguimiento.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import ROL_ADMINISTRADOR, ROL_CURADOR, require_roles
from app.core.database import get_db
from app.models.envio_logistica import EnvioLogistica
from app.models.transaccion import Transaccion
from app.schemas.envio import EnvioCreate, EnvioEstadoUpdate, EnvioOut

router = APIRouter()


@router.post(
    "",
    response_model=EnvioOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(ROL_ADMINISTRADOR, ROL_CURADOR))],
)
def crear_envio(payload: EnvioCreate, db: Session = Depends(get_db)):
    """Genera la guía de envío tras la confirmación del pago."""
    transaccion = db.get(Transaccion, payload.id_transaccion)
    if transaccion is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transacción no encontrada")

    envio = EnvioLogistica(estado_envio="Empacado", **payload.model_dump())
    db.add(envio)
    db.commit()
    db.refresh(envio)
    return envio


@router.get("/{id_envio}", response_model=EnvioOut)
def obtener_envio(id_envio: int, db: Session = Depends(get_db)):
    envio = db.get(EnvioLogistica, id_envio)
    if envio is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Envío no encontrado")
    return envio


@router.patch(
    "/{id_envio}/estado",
    response_model=EnvioOut,
    dependencies=[Depends(require_roles(ROL_ADMINISTRADOR, ROL_CURADOR))],
)
def actualizar_estado_envio(id_envio: int, payload: EnvioEstadoUpdate, db: Session = Depends(get_db)):
    """Actualiza el tracking: Empacado -> En Camino -> ... -> Entregado."""
    envio = db.get(EnvioLogistica, id_envio)
    if envio is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Envío no encontrado")

    for campo, valor in payload.model_dump(exclude_unset=True).items():
        setattr(envio, campo, valor)
    db.commit()
    db.refresh(envio)
    return envio
