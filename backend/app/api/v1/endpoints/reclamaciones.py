"""
Módulo 4: Logística Integrada y Seguros — Reclamaciones por daños en el envío.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import ROL_ADMINISTRADOR, ROL_COMPRADOR, get_current_user, require_roles
from app.core.database import get_db
from app.models.envio_logistica import EnvioLogistica
from app.models.obra_arte import ObraArte
from app.models.reclamacion import Reclamacion
from app.models.transaccion import Transaccion
from app.models.usuario import Usuario
from app.schemas.reclamacion import ReclamacionCreate, ReclamacionEstadoUpdate, ReclamacionOut
from app.services.audit_service import log_action
from app.services.email_service import enviar_resultado_reclamacion
from app.services.pagos_service import reembolsar_transaccion

router = APIRouter()

ACCION_RESOLUCION_RECLAMACION = "RESOLUCION_RECLAMACION"


@router.post(
    "",
    response_model=ReclamacionOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(ROL_COMPRADOR))],
)
def crear_reclamacion(
    payload: ReclamacionCreate,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """El comprador reporta daños/incidencias sobre una obra recibida.
    Solo puede reclamar sobre envíos de sus propias compras."""
    envio = db.get(EnvioLogistica, payload.id_envio)
    if envio is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Envío no encontrado")

    transaccion = db.get(Transaccion, envio.id_transaccion)
    if transaccion is None or transaccion.id_comprador != usuario.id_usuario:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No puede reclamar sobre este envío")

    if db.query(Reclamacion).filter(Reclamacion.id_envio == payload.id_envio).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Este envío ya tiene una reclamación")

    reclamacion = Reclamacion(**payload.model_dump())
    envio.estado_envio = "En Reclamación"
    db.add(reclamacion)
    db.commit()
    db.refresh(reclamacion)
    return reclamacion


@router.get("", response_model=list[ReclamacionOut], dependencies=[Depends(require_roles(ROL_ADMINISTRADOR))])
def listar_reclamaciones(db: Session = Depends(get_db)):
    return db.query(Reclamacion).all()


@router.get("/{id_reclamacion}", response_model=ReclamacionOut)
def obtener_reclamacion(
    id_reclamacion: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """El comprador dueño de la reclamación o el Administrador pueden consultarla."""
    reclamacion = db.get(Reclamacion, id_reclamacion)
    if reclamacion is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reclamación no encontrada")

    if usuario.rol.nombre_rol == ROL_COMPRADOR:
        envio = db.get(EnvioLogistica, reclamacion.id_envio)
        transaccion = db.get(Transaccion, envio.id_transaccion) if envio else None
        if transaccion is None or transaccion.id_comprador != usuario.id_usuario:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene acceso a esta reclamación")
    elif usuario.rol.nombre_rol != ROL_ADMINISTRADOR:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene acceso a esta reclamación")
    return reclamacion


@router.patch(
    "/{id_reclamacion}/estado",
    response_model=ReclamacionOut,
    dependencies=[Depends(require_roles(ROL_ADMINISTRADOR))],
)
def resolver_reclamacion(
    id_reclamacion: int,
    payload: ReclamacionEstadoUpdate,
    admin: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Resuelve la reclamación. Si el resultado es 'Devolución Dinero', se
    dispara automáticamente el reembolso de la transacción asociada (misma
    lógica que `PATCH /transacciones/{id}/estado`)."""
    reclamacion = db.get(Reclamacion, id_reclamacion)
    if reclamacion is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reclamación no encontrada")

    reclamacion.estado_resolucion = payload.estado_resolucion
    db.commit()
    db.refresh(reclamacion)

    envio = db.get(EnvioLogistica, reclamacion.id_envio)
    transaccion = db.get(Transaccion, envio.id_transaccion) if envio else None

    if payload.estado_resolucion == "Devolución Dinero" and transaccion:
        reembolsar_transaccion(db, transaccion)

    if transaccion:
        comprador = db.get(Usuario, transaccion.id_comprador)
        obra = db.get(ObraArte, transaccion.id_obra)
        if comprador and obra:
            enviar_resultado_reclamacion(comprador.correo_electronico, obra.titulo, payload.estado_resolucion)

    log_action(
        db,
        id_usuario=admin.id_usuario,
        accion=ACCION_RESOLUCION_RECLAMACION,
        detalles=f"Reclamación {id_reclamacion} -> {payload.estado_resolucion}",
        tabla="reclamacion",
    )
    return reclamacion
