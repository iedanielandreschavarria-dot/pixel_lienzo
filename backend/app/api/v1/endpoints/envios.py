"""
Módulo 4: Logística Integrada y Seguros — Embalaje, despacho y seguimiento.
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import (
    ROL_ADMINISTRADOR,
    ROL_ARTISTA,
    ROL_COMPRADOR,
    ROL_CURADOR,
    get_current_user,
    require_roles,
)
from app.core.database import get_db
from app.models.envio_logistica import EnvioLogistica
from app.models.obra_arte import ObraArte
from app.models.transaccion import Transaccion
from app.models.usuario import Usuario
from app.schemas.envio import EnvioConfirmarRecepcion, EnvioCreate, EnvioEstadoUpdate, EnvioOut
from app.services.email_service import enviar_actualizacion_envio, enviar_confirmacion_envio

router = APIRouter()


def _generar_guia_transporte() -> str:
    """Genera un número de guía único (Motor de Logística)."""
    return f"PYL-{uuid.uuid4().hex[:10].upper()}"


def _verificar_acceso(envio: EnvioLogistica, usuario: Usuario, db: Session) -> Transaccion:
    """El Comprador solo puede ver/gestionar sus propios envíos; el Artista
    los de sus propias obras (RF 4.2.1); Administrador y Curador cualquiera."""
    transaccion = db.get(Transaccion, envio.id_transaccion)
    rol_usuario = usuario.rol.nombre_rol
    if rol_usuario == ROL_COMPRADOR and (
        transaccion is None or transaccion.id_comprador != usuario.id_usuario
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene acceso a este envío")
    if rol_usuario == ROL_ARTISTA:
        obra = db.get(ObraArte, transaccion.id_obra) if transaccion else None
        if obra is None or obra.id_artista != usuario.id_usuario:
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
    """Comprador: solo sus envíos. Artista (RF 4.2.1): envíos de sus obras.
    Administrador/Curador: todos (cola de logística)."""
    query = db.query(EnvioLogistica)
    rol_usuario = usuario.rol.nombre_rol
    if rol_usuario == ROL_COMPRADOR:
        query = query.join(Transaccion).filter(Transaccion.id_comprador == usuario.id_usuario)
    elif rol_usuario == ROL_ARTISTA:
        query = (
            query.join(Transaccion)
            .join(ObraArte, Transaccion.id_obra == ObraArte.id_obra)
            .filter(ObraArte.id_artista == usuario.id_usuario)
        )
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


@router.post(
    "/{id_envio}/confirmar-recepcion",
    response_model=EnvioOut,
    dependencies=[Depends(require_roles(ROL_COMPRADOR))],
)
def confirmar_recepcion_comprador(
    id_envio: int,
    payload: EnvioConfirmarRecepcion,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """RF 4.4.1 / RF 4.4.2 — El Comprador confirma la recepción satisfactoria
    de la obra física adjuntando fotografía de recepción y/o su firma digital,
    habilitando la descarga del Certificado de Autenticidad (RF 5.2.2) y la
    posterior dispersión de fondos al artista (RF 3.5.1)."""
    envio = db.get(EnvioLogistica, id_envio)
    if envio is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Envío no encontrado")

    transaccion = _verificar_acceso(envio, usuario, db)
    if not (payload.foto_recepcion_url or payload.firma_digital_comprador):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debe adjuntar foto_recepcion_url o firma_digital_comprador para confirmar la recepción (RF 4.4.2)",
        )

    if payload.foto_recepcion_url:
        envio.foto_recepcion_url = payload.foto_recepcion_url
    if payload.firma_digital_comprador:
        envio.firma_digital_comprador = payload.firma_digital_comprador
    envio.estado_envio = "Entregado"
    db.commit()
    db.refresh(envio)

    if transaccion:
        obra = db.get(ObraArte, transaccion.id_obra)
        if obra:
            enviar_actualizacion_envio(usuario.correo_electronico, obra.titulo, envio.estado_envio)
    return envio
