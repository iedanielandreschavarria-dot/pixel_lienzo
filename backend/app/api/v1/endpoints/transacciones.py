"""
Módulo 3: Motor de Pago y Liquidación — Checkout y Split Payment.

La confirmación del pago llega de forma asíncrona vía el webhook de Wompi
(`POST /transacciones/webhook/wompi`, ver app/services/wompi_service.py).
El PATCH manual de estado se conserva como respaldo administrativo (p. ej.
para dispersión de fondos o para corregir manualmente un caso excepcional).
"""
import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import ROL_ADMINISTRADOR, ROL_ARTISTA, ROL_COMPRADOR, get_current_user, require_roles
from app.core.config import settings
from app.core.database import get_db
from app.db.seed import PORCENTAJE_COMISION_GALERIA_DEFAULT
from app.models.configuracion_sistema import ConfiguracionSistema
from app.models.envio_logistica import EnvioLogistica
from app.models.historial_trazabilidad import HistorialTrazabilidad
from app.models.obra_arte import ObraArte
from app.models.transaccion import Transaccion
from app.models.usuario import Usuario
from app.schemas.transaccion import (
    CheckoutWompiOut,
    ComisionOut,
    ComisionUpdate,
    TransaccionCreadaOut,
    TransaccionCreate,
    TransaccionEstadoUpdate,
    TransaccionOut,
    WebhookRespuesta,
)
from app.services.audit_service import ACCION_CONFIG_COMISION, ACCION_DISPERSION_PAGO, log_action
from app.services.email_service import enviar_notificacion_dispersion, enviar_notificacion_venta
from app.services.pagos_service import reembolsar_transaccion
from app.services.wompi_service import (
    checkout_configurado,
    construir_url_checkout,
    generar_referencia,
    id_transaccion_desde_referencia,
    verificar_firma_evento,
)

logger = logging.getLogger("pixel_lienzo.wompi")

router = APIRouter()


def _obtener_configuracion(db: Session) -> ConfiguracionSistema:
    """Devuelve la fila única de configuración (id_configuracion = 1),
    creándola con los valores por defecto si por alguna razón el seed
    automático (app/db/seed.py) todavía no corrió."""
    configuracion = db.query(ConfiguracionSistema).first()
    if configuracion is None:
        configuracion = ConfiguracionSistema(porcentaje_comision_galeria=PORCENTAJE_COMISION_GALERIA_DEFAULT)
        db.add(configuracion)
        db.commit()
        db.refresh(configuracion)
    return configuracion


@router.get("/config/comision", response_model=ComisionOut, dependencies=[Depends(require_roles(ROL_ADMINISTRADOR))])
def obtener_comision(db: Session = Depends(get_db)):
    configuracion = _obtener_configuracion(db)
    return ComisionOut(porcentaje=configuracion.porcentaje_comision_galeria, actualizado_en=configuracion.actualizado_en)


@router.patch("/config/comision", response_model=ComisionOut, dependencies=[Depends(require_roles(ROL_ADMINISTRADOR))])
def actualizar_comision(
    payload: ComisionUpdate,
    admin: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """RF 1.3.2 — Configuración de la comisión fija de la galería. Persiste
    en la tabla `configuracion_sistema` (sobrevive reinicios y se comparte
    entre workers, a diferencia de la variable en memoria anterior)."""
    configuracion = _obtener_configuracion(db)
    anterior = configuracion.porcentaje_comision_galeria
    configuracion.porcentaje_comision_galeria = payload.porcentaje
    configuracion.actualizado_por = admin.id_usuario
    db.commit()
    db.refresh(configuracion)

    log_action(
        db,
        id_usuario=admin.id_usuario,
        accion=ACCION_CONFIG_COMISION,
        detalles=f"Comisión global: {anterior}% -> {payload.porcentaje}%",
        tabla="configuracion_sistema",
    )
    return ComisionOut(porcentaje=configuracion.porcentaje_comision_galeria, actualizado_en=configuracion.actualizado_en)


def _url_retorno_frontend(id_transaccion: int) -> str:
    return f"{settings.FRONTEND_URL}/compras/{id_transaccion}/resultado"


def _exigir_pasarela_configurada() -> None:
    if not checkout_configurado():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "La pasarela de pago no está configurada. Define WOMPI_PUBLIC_KEY y "
                "WOMPI_INTEGRITY_SECRET en el archivo .env del backend."
            ),
        )


def _liberar_reservas_vencidas(db: Session) -> int:
    """Libera automáticamente las obras cuyas transacciones en estado
    'Procesando' superaron `CHECKOUT_RESERVATION_EXPIRE_MINUTES` sin pago
    confirmado (checkout abandonado)."""
    ttl = timedelta(minutes=settings.CHECKOUT_RESERVATION_EXPIRE_MINUTES)
    ahora_naive = datetime.now()
    ahora_utc = datetime.now(timezone.utc)

    pendientes = db.query(Transaccion).filter(Transaccion.estado_pago == "Procesando").all()
    liberadas = 0
    for tx in pendientes:
        if tx.fecha_pago is None:
            continue
        ahora_ref = ahora_utc if tx.fecha_pago.tzinfo is not None else ahora_naive
        if (ahora_ref - tx.fecha_pago) > ttl:
            tx.estado_pago = "Rechazado"
            obra = db.get(ObraArte, tx.id_obra)
            if obra and obra.estado_obra == "Reservado":
                obra.estado_obra = "Publicado"
            liberadas += 1
    if liberadas > 0:
        db.commit()
    return liberadas


@router.post(
    "/liberar-vencidas",
    dependencies=[Depends(require_roles(ROL_ADMINISTRADOR))],
)
def liberar_reservas_vencidas_endpoint(db: Session = Depends(get_db)):
    """Endpoint administrativo manual para liberar reservas de checkout vencidas."""
    liberadas = _liberar_reservas_vencidas(db)
    return {"liberadas": liberadas}


@router.post(
    "",
    response_model=TransaccionCreadaOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(ROL_COMPRADOR))],
)
def crear_transaccion(
    payload: TransaccionCreate,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Checkout: reserva la obra (control de concurrencia real, ver abajo) y
    genera la URL de pago de Wompi. Se usa un bloqueo pesimista de fila
    (`SELECT ... FOR UPDATE`) para que, si dos compradores intentan comprar
    la misma obra al mismo tiempo, el segundo request espere a que el
    primero confirme o falle, en vez de que ambos lean 'Publicado' y generen
    dos transacciones para la misma pieza.

    El frontend debe redirigir al comprador a `checkout_url`. La
    confirmación real del pago llega después, de forma asíncrona, vía
    `POST /transacciones/webhook/wompi`."""
    # Se valida antes de tocar la obra: no tiene sentido reservar una pieza
    # si después no vamos a poder cobrarla.
    _exigir_pasarela_configurada()
    _liberar_reservas_vencidas(db)

    obra = db.query(ObraArte).filter(ObraArte.id_obra == payload.id_obra).with_for_update().first()
    if obra is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Obra no encontrada")
    if obra.es_patrimonio_historico:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Las obras de Patrimonio Histórico no están disponibles para la venta (RF 2.4.1)",
        )
    if obra.estado_obra != "Publicado":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="La obra no está disponible para la venta (ya fue reservada/vendida)",
        )

    porcentaje_comision = _obtener_configuracion(db).porcentaje_comision_galeria
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

    referencia = generar_referencia(transaccion.id_transaccion)
    transaccion.referencia_pasarela = referencia
    db.commit()
    db.refresh(transaccion)

    checkout_url = construir_url_checkout(
        referencia=referencia,
        monto_en_centavos=int(transaccion.monto_total * 100),
        redirect_url=_url_retorno_frontend(transaccion.id_transaccion),
        correo_comprador=usuario.correo_electronico,
    )
    return TransaccionCreadaOut(**TransaccionOut.model_validate(transaccion).model_dump(), checkout_url=checkout_url)


@router.get("/{id_transaccion}/checkout-wompi", response_model=CheckoutWompiOut)
def obtener_checkout_wompi(
    id_transaccion: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Regenera la URL de pago de Wompi para una transacción pendiente (p.
    ej. si el comprador cerró la pestaña de pago sin completarlo). Cada
    llamada genera una nueva `reference` de Wompi, pero todas resuelven al
    mismo `id_transaccion` al recibir el webhook."""
    _exigir_pasarela_configurada()

    transaccion = db.get(Transaccion, id_transaccion)
    if transaccion is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transacción no encontrada")
    if transaccion.id_comprador != usuario.id_usuario and usuario.rol.nombre_rol != ROL_ADMINISTRADOR:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene acceso a esta transacción")
    if transaccion.estado_pago != "Procesando":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Esta transacción ya no admite pago")

    referencia = generar_referencia(transaccion.id_transaccion)
    transaccion.referencia_pasarela = referencia
    db.commit()

    checkout_url = construir_url_checkout(
        referencia=referencia,
        monto_en_centavos=int(transaccion.monto_total * 100),
        redirect_url=_url_retorno_frontend(transaccion.id_transaccion),
        correo_comprador=usuario.correo_electronico,
    )
    return CheckoutWompiOut(checkout_url=checkout_url, referencia=referencia)


@router.get("", response_model=list[TransaccionOut])
def listar_mis_transacciones(
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Listado de transacciones según el rol del usuario autenticado:
    - Administrador (RF 3.2.3): todas las transacciones de la galería.
    - Artista (RF 3.4.3): ventas asociadas a sus propias obras.
    - Comprador: historial de sus compras personales.
    """
    _liberar_reservas_vencidas(db)
    rol_usuario = usuario.rol.nombre_rol
    if rol_usuario == ROL_ADMINISTRADOR:
        return db.query(Transaccion).order_by(Transaccion.id_transaccion.desc()).all()
    if rol_usuario == ROL_ARTISTA:
        return (
            db.query(Transaccion)
            .join(ObraArte, Transaccion.id_obra == ObraArte.id_obra)
            .filter(ObraArte.id_artista == usuario.id_usuario)
            .order_by(Transaccion.id_transaccion.desc())
            .all()
        )
    return (
        db.query(Transaccion)
        .filter(Transaccion.id_comprador == usuario.id_usuario)
        .order_by(Transaccion.id_transaccion.desc())
        .all()
    )


@router.get("/{id_transaccion}", response_model=TransaccionOut)
def obtener_transaccion(
    id_transaccion: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    transaccion = db.get(Transaccion, id_transaccion)
    if transaccion is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transacción no encontrada")

    rol_usuario = usuario.rol.nombre_rol
    obra = db.get(ObraArte, transaccion.id_obra)
    es_comprador_dueno = transaccion.id_comprador == usuario.id_usuario
    es_artista_dueno = obra is not None and obra.id_artista == usuario.id_usuario
    if rol_usuario != ROL_ADMINISTRADOR and not es_comprador_dueno and not es_artista_dueno:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene acceso a esta transacción")

    return transaccion


def _confirmar_pago(db: Session, transaccion: Transaccion) -> None:
    """Efectos de un pago aprobado: vender la obra, registrar el cambio de
    titularidad en HistorialTrazabilidad (RF 5.4.1) y notificar al artista.
    Compartido entre el webhook de Wompi y el PATCH manual de respaldo."""
    transaccion.estado_pago = "Confirmado"
    obra = db.get(ObraArte, transaccion.id_obra)
    if obra:
        obra.estado_obra = "Vendido"
        existe_trazabilidad = (
            db.query(HistorialTrazabilidad)
            .filter(HistorialTrazabilidad.id_transaccion == transaccion.id_transaccion)
            .first()
        )
        if not existe_trazabilidad:
            db.add(
                HistorialTrazabilidad(
                    id_obra=obra.id_obra,
                    id_propietario_anterior=obra.id_artista,
                    id_propietario_nuevo=transaccion.id_comprador,
                    id_transaccion=transaccion.id_transaccion,
                )
            )
    db.commit()
    db.refresh(transaccion)

    artista_usuario = db.get(Usuario, obra.id_artista) if obra else None
    if obra and artista_usuario:
        enviar_notificacion_venta(
            artista_usuario.correo_electronico, obra.titulo, f"${transaccion.monto_neto_artista:,.2f}"
        )


def _rechazar_pago(db: Session, transaccion: Transaccion) -> None:
    """Un pago declinado/anulado/con error de la pasarela: la transacción
    queda marcada como 'Rechazada' (registro histórico útil para reportes)
    y la obra se libera para que el comprador pueda intentarlo de nuevo con
    una nueva transacción."""
    transaccion.estado_pago = "Rechazado"
    obra = db.get(ObraArte, transaccion.id_obra)
    if obra and obra.estado_obra == "Reservado":
        obra.estado_obra = "Publicado"
    db.commit()


@router.post("/webhook/wompi", response_model=WebhookRespuesta, include_in_schema=False)
def webhook_wompi(payload: dict = Body(...), db: Session = Depends(get_db)):
    """Endpoint público (sin autenticación, así lo exige Wompi) que recibe
    los eventos de `transaction.updated`. La autenticidad del evento se
    garantiza validando la firma criptográfica (no la ausencia de un token),
    ver app/services/wompi_service.verificar_firma_evento.

    Siempre respondemos 200 OK una vez validada la firma (incluso si el
    evento no aplica ningún cambio), para que Wompi no siga reintentando."""
    if not verificar_firma_evento(payload):
        logger.warning("Webhook de Wompi con firma inválida, ignorado: %s", payload.get("event"))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Firma inválida")

    datos_transaccion = (payload.get("data") or {}).get("transaction") or {}
    estado_wompi = datos_transaccion.get("status")
    referencia = datos_transaccion.get("reference", "")
    monto_recibido = datos_transaccion.get("amount_in_cents")

    id_transaccion = id_transaccion_desde_referencia(referencia)
    if id_transaccion is None:
        logger.info("Webhook de Wompi con referencia no reconocida: %s", referencia)
        return WebhookRespuesta(mensaje="Evento recibido (referencia no reconocida)")

    # Bloqueo pesimista: mismo mecanismo que crear_transaccion, evita procesar
    # el mismo evento dos veces si Wompi reintenta la notificación.
    transaccion = (
        db.query(Transaccion).filter(Transaccion.id_transaccion == id_transaccion).with_for_update().first()
    )
    if transaccion is None or transaccion.estado_pago != "Procesando":
        return WebhookRespuesta(mensaje="Evento recibido (sin cambios, ya procesado)")

    monto_esperado = int(transaccion.monto_total * 100)
    if monto_recibido != monto_esperado:
        logger.warning(
            "Webhook de Wompi con monto no coincidente para transacción %s: esperado=%s recibido=%s",
            id_transaccion,
            monto_esperado,
            monto_recibido,
        )
        return WebhookRespuesta(mensaje="Evento recibido (monto no coincide, ignorado)")

    if estado_wompi == "APPROVED":
        _confirmar_pago(db, transaccion)
    elif estado_wompi in ("DECLINED", "VOIDED", "ERROR"):
        _rechazar_pago(db, transaccion)
    # Otros estados (p. ej. "PENDING") no requieren ninguna acción todavía.

    return WebhookRespuesta(mensaje="Evento procesado correctamente")


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
    """Respaldo administrativo manual: dispersión de fondos, o corrección de
    un caso excepcional. La confirmación normal de un pago ('Procesando' ->
    'Confirmado') llega automáticamente vía el webhook de Wompi; este PATCH
    ya no debería ser el camino habitual para ese cambio de estado."""
    transaccion = db.get(Transaccion, id_transaccion)
    if transaccion is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transacción no encontrada")

    if payload.estado_pago == "Dispersado":
        envio = (
            db.query(EnvioLogistica)
            .filter(EnvioLogistica.id_transaccion == id_transaccion)
            .first()
        )
        if envio is None or envio.estado_envio != "Entregado":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Solo se pueden dispersar los fondos cuando la obra tenga recepción confirmada ('Entregado') (RF 3.5.1)",
            )

    if payload.estado_pago == "Reembolsado":
        # Misma lógica que dispara una reclamación resuelta como "Devolución
        # Dinero" (ver app/services/pagos_service.py): un solo lugar decide
        # qué implica reembolsar una transacción.
        reembolsar_transaccion(db, transaccion)
        obra = db.get(ObraArte, transaccion.id_obra)
    elif payload.estado_pago == "Confirmado":
        _confirmar_pago(db, transaccion)
        obra = db.get(ObraArte, transaccion.id_obra)
    elif payload.estado_pago == "Rechazado":
        _rechazar_pago(db, transaccion)
        obra = db.get(ObraArte, transaccion.id_obra)
    else:
        transaccion.estado_pago = payload.estado_pago
        obra = db.get(ObraArte, transaccion.id_obra)
        db.commit()
        db.refresh(transaccion)

    if payload.estado_pago == "Dispersado":
        artista_usuario = db.get(Usuario, obra.id_artista) if obra else None
        if obra and artista_usuario:
            enviar_notificacion_dispersion(
                artista_usuario.correo_electronico, obra.titulo, f"${transaccion.monto_neto_artista:,.2f}"
            )
        log_action(
            db,
            id_usuario=admin.id_usuario,
            accion=ACCION_DISPERSION_PAGO,
            detalles=f"Transacción {id_transaccion}: dispersión de {transaccion.monto_neto_artista}",
            tabla="transaccion",
        )
    return transaccion
