"""
Módulo 4: Logística Integrada y Seguros — Embalaje, despacho y seguimiento.
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import ROL_ADMINISTRADOR, ROL_COMPRADOR, ROL_CURADOR, get_current_user, require_roles
from app.core.database import get_db
from app.models.envio_logistica import EnvioLogistica
from app.models.obra_arte import ObraArte
from app.models.transaccion import Transaccion
from app.models.usuario import Usuario
from app.schemas.envio import EnvioCreate, EnvioEstadoUpdate, EnvioOut
from app.services.email_service import enviar_actualizacion_envio, enviar_confirmacion_envio

router = APIRouter()


def _generar_guia_transporte() -> str:
    """Genera un número de guía único (Motor de Logística)."""
    return f"PYL-{uuid.uuid4().hex[:10].upper()}"


def _verificar_acceso(envio: EnvioLogistica, usuario: Usuario, db: Session) -> Transaccion:
    """El Comprador solo puede ver/gestionar sus propios envíos; Administrador
    y Curador (logística) pueden acceder a cualquiera."""
    transaccion = db.get(Transaccion, envio.id_transaccion)
    if usuario.rol.nombre_rol == ROL_COMPRADOR and (
        transaccion is None or transaccion.id_comprador != usuario.id_usuario
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene acceso a este envío")
    return transaccion


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
    if transaccion.estado_pago != "Confirmado":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Solo se puede despachar una transacción con pago 'Confirmado'",
        )
    if db.query(EnvioLogistica).filter(EnvioLogistica.id_transaccion == payload.id_transaccion).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Esta transacción ya tiene un envío asociado")

    datos = payload.model_dump()
    if datos.get("valor_seguro") is None:
        datos["valor_seguro"] = transaccion.monto_total

    envio = EnvioLogistica(estado_envio="Empacado", guia_transporte=_generar_guia_transporte(), **datos)
    db.add(envio)
    db.commit()
    db.refresh(envio)

    comprador = db.get(Usuario, transaccion.id_comprador)
    obra = db.get(ObraArte, transaccion.id_obra)
    if comprador and obra:
        enviar_confirmacion_envio(comprador.correo_electronico, obra.titulo, envio.guia_transporte, envio.tipo_envio)
    return envio


@router.get("", response_model=list[EnvioOut])
def listar_envios(
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Comprador: solo sus envíos. Administrador/Curador: todos (cola de logística)."""
    query = db.query(EnvioLogistica)
    if usuario.rol.nombre_rol == ROL_COMPRADOR:
        query = query.join(Transaccion).filter(Transaccion.id_comprador == usuario.id_usuario)
    return query.all()


@router.get("/{id_envio}", response_model=EnvioOut)
def obtener_envio(
    id_envio: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    envio = db.get(EnvioLogistica, id_envio)
    if envio is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Envío no encontrado")
    _verificar_acceso(envio, usuario, db)
    return envio


@router.patch(
    "/{id_envio}/estado",
    response_model=EnvioOut,
    dependencies=[Depends(require_roles(ROL_ADMINISTRADOR, ROL_CURADOR))],
)
def actualizar_estado_envio(id_envio: int, payload: EnvioEstadoUpdate, db: Session = Depends(get_db)):
    """Actualiza el tracking: Empacado -> En Camino -> ... -> Entregado.

    Al marcar como 'Entregado' se exige constancia de recepción
    (`foto_recepcion_url` y/o `firma_digital_comprador`), como prueba de
    entrega física de la obra.
    """
    envio = db.get(EnvioLogistica, id_envio)
    if envio is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Envío no encontrado")

    datos = payload.model_dump(exclude_unset=True)
    if datos.get("estado_envio") == "Entregado" and not (
        datos.get("foto_recepcion_url") or envio.foto_recepcion_url or datos.get("firma_digital_comprador") or envio.firma_digital_comprador
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Para marcar como 'Entregado' se requiere foto_recepcion_url o firma_digital_comprador",
        )

    for campo, valor in datos.items():
        setattr(envio, campo, valor)
    db.commit()
    db.refresh(envio)

    transaccion = db.get(Transaccion, envio.id_transaccion)
    if transaccion:
        comprador = db.get(Usuario, transaccion.id_comprador)
        obra = db.get(ObraArte, transaccion.id_obra)
        if comprador and obra:
            enviar_actualizacion_envio(comprador.correo_electronico, obra.titulo, envio.estado_envio)
    return envio
