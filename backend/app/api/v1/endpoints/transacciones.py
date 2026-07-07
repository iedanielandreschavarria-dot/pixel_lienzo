"""
Módulo 3: Motor de Pago y Liquidación — Checkout y Split Payment.
"""
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import ROL_ADMINISTRADOR, ROL_COMPRADOR, get_current_user, require_roles
from app.core.database import get_db
from app.models.historial_trazabilidad import HistorialTrazabilidad
from app.models.obra_arte import ObraArte
from app.models.transaccion import Transaccion
from app.models.usuario import Usuario
from app.schemas.transaccion import (
    ComisionOut,
    ComisionUpdate,
    TransaccionCreate,
    TransaccionEstadoUpdate,
    TransaccionOut,
)
from app.services.audit_service import ACCION_CONFIG_COMISION, ACCION_DISPERSION_PAGO, log_action
from app.services.email_service import enviar_notificacion_dispersion, enviar_notificacion_venta

router = APIRouter()

# Comisión fija de la galería (RF 1.3.2), configurable en caliente por el
# Administrador vía PATCH /transacciones/config/comision. Se guarda en
# memoria de proceso (no en una tabla dedicada, que no existe en el esquema
# actual): vuelve al valor por defecto si el servidor se reinicia. Para que
# persista entre reinicios, migrar a una tabla `configuracion_sistema`.
_comision_actual = Decimal("20.00")


def _obtener_comision_actual() -> Decimal:
    return _comision_actual


@router.get("/config/comision", response_model=ComisionOut, dependencies=[Depends(require_roles(ROL_ADMINISTRADOR))])
def obtener_comision():
    return ComisionOut(porcentaje=_obtener_comision_actual())


@router.patch("/config/comision", response_model=ComisionOut, dependencies=[Depends(require_roles(ROL_ADMINISTRADOR))])
def actualizar_comision(
    payload: ComisionUpdate,
    admin: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """RF 1.3.2 — Configuración de la comisión fija de la galería."""
    global _comision_actual
    anterior = _comision_actual
    _comision_actual = payload.porcentaje

    log_action(
        db,
        id_usuario=admin.id_usuario,
        accion=ACCION_CONFIG_COMISION,
        detalles=f"Comisión global: {anterior}% -> {payload.porcentaje}%",
        tabla="transaccion",
    )
    return ComisionOut(porcentaje=_comision_actual)


@router.post(
    "",
    response_model=TransaccionOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(ROL_COMPRADOR))],
)
def crear_transaccion(
    payload: TransaccionCreate,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Checkout: procesa el pago y aplica control de concurrencia real sobre
    la obra (pieza única, RF de concurrencia). Se usa un bloqueo pesimista de
    fila (`SELECT ... FOR UPDATE`) para que, si dos compradores intentan
    comprar la misma obra al mismo tiempo, el segundo request espere a que el
    primero confirme o falle, en vez de que ambos lean 'Publicado' y generen
    dos transacciones para la misma pieza."""
    obra = db.query(ObraArte).filter(ObraArte.id_obra == payload.id_obra).with_for_update().first()
    if obra is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Obra no encontrada")
    if obra.estado_obra != "Publicado":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="La obra no está disponible para la venta (ya fue reservada/vendida)",
        )

    # Nota: aquí es donde se integraría una pasarela de pago externa real
    # (ePayco/MercadoPago/Stripe). Al no contar con credenciales de un
    # proveedor en este entorno, la confirmación del pago queda modelada
    # como un paso manual/administrativo posterior (`PATCH /{id}/estado`),
    # que es el que dispara el split payment y la dispersión.
    porcentaje_comision = _obtener_comision_actual()
    comision = obra.precio_venta * (porcentaje_comision / 100)
    transaccion = Transaccion(
        id_comprador=usuario.id_usuario,
        id_obra=obra.id_obra,
        monto_total=obra.precio_venta,
        porcentaje_comision_galeria=porcentaje_comision,
        monto_comision_galeria=comision,
        monto_neto_artista=obra.precio_venta - comision,
        impuestos_retenciones=0,
        estado_pago="Procesando",
    )
    obra.estado_obra = "Reservado"
    db.add(transaccion)
    db.flush()

    db.add(
        HistorialTrazabilidad(
            id_obra=obra.id_obra,
            id_propietario_nuevo=usuario.id_usuario,
            id_transaccion=transaccion.id_transaccion,
        )
    )
    db.commit()
    db.refresh(transaccion)
    return transaccion


@router.get("", response_model=list[TransaccionOut])
def listar_mis_transacciones(
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Historial de compras del comprador autenticado."""
    return db.query(Transaccion).filter(Transaccion.id_comprador == usuario.id_usuario).all()


@router.get("/{id_transaccion}", response_model=TransaccionOut)
def obtener_transaccion(
    id_transaccion: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    transaccion = db.get(Transaccion, id_transaccion)
    if transaccion is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transacción no encontrada")
    return transaccion


@router.patch(
    "/{id_transaccion}/estado",
    response_model=TransaccionOut,
    dependencies=[Depends(require_roles(ROL_ADMINISTRADOR))],
)
def actualizar_estado_transaccion(
    id_transaccion: int,
    payload: TransaccionEstadoUpdate,
    admin: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Autorización manual de dispersión de fondos (RF panel de Administrador)."""
    transaccion = db.get(Transaccion, id_transaccion)
    if transaccion is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transacción no encontrada")

    transaccion.estado_pago = payload.estado_pago
    obra = db.get(ObraArte, transaccion.id_obra)

    if payload.estado_pago == "Confirmado" and obra:
        obra.estado_obra = "Vendido"
    elif payload.estado_pago == "Reembolsado" and obra:
        # Libera la obra para que vuelva a estar disponible en el catálogo.
        obra.estado_obra = "Publicado"

    db.commit()
    db.refresh(transaccion)

    artista_usuario = db.get(Usuario, obra.id_artista) if obra else None
    if obra and artista_usuario:
        monto_str = f"${transaccion.monto_neto_artista:,.2f}"
        if payload.estado_pago == "Confirmado":
            enviar_notificacion_venta(artista_usuario.correo_electronico, obra.titulo, monto_str)
        elif payload.estado_pago == "Dispersado":
            enviar_notificacion_dispersion(artista_usuario.correo_electronico, obra.titulo, monto_str)

    if payload.estado_pago == "Dispersado":
        log_action(
            db,
            id_usuario=admin.id_usuario,
            accion=ACCION_DISPERSION_PAGO,
            detalles=f"Transacción {id_transaccion}: dispersión de {transaccion.monto_neto_artista}",
            tabla="transaccion",
        )
    return transaccion
