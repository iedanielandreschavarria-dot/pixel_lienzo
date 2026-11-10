"""
Módulo 5: Motor de Confianza / Trust Engine — Certificación de autenticidad.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.api.deps import ROL_ADMINISTRADOR, ROL_COMPRADOR, ROL_CURADOR, get_current_user, require_roles
from app.core.database import get_db
from app.models.certificado_autenticidad import CertificadoAutenticidad
from app.models.envio_logistica import EnvioLogistica
from app.models.obra_arte import ObraArte
from app.models.transaccion import Transaccion
from app.models.usuario import Usuario
from app.schemas.certificado import (
    CertificadoCreate,
    CertificadoOut,
    CertificadoVerificacionOut,
    ObraCertificadaOut,
)
from app.schemas.obra import ObraOut
from app.services.audit_service import ACCION_EMISION_CERTIFICADO, log_action
from app.services.trust_engine import (
    generar_imagen_qr_png,
    generar_sello_sha256,
    url_validacion_certificado,
)

router = APIRouter()


@router.post(
    "/{id_obra}",
    response_model=CertificadoOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(ROL_CURADOR))],
)
def emitir_certificado(
    id_obra: int,
    payload: CertificadoCreate,
    curador: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Emite el certificado tras la aprobación curatorial.

    El Trust Engine calcula un sello SHA-256 que combina la ficha técnica de
    la obra con la firma digital del curador: cualquier alteración posterior
    de esos datos produciría un sello distinto, permitiendo detectar
    manipulaciones. Ese sello es, a su vez, el código que se codifica en el
    QR de validación pública del certificado.
    """
    obra = db.get(ObraArte, id_obra)
    if obra is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Obra no encontrada")
    if db.query(CertificadoAutenticidad).filter(CertificadoAutenticidad.id_obra == id_obra).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="La obra ya posee un certificado")

    sello = generar_sello_sha256(obra, payload.firma_digital_curador)
    certificado = CertificadoAutenticidad(
        id_obra=id_obra,
        codigo_qr_validacion=sello,
        **payload.model_dump(),
    )
    db.add(certificado)
    db.commit()
    db.refresh(certificado)

    log_action(
        db,
        id_usuario=curador.id_usuario,
        accion=ACCION_EMISION_CERTIFICADO,
        detalles=f"Certificado emitido para obra {id_obra} (sello {sello[:12]}...)",
        tabla="certificado_autenticidad",
    )
    return certificado


@router.get(
    "/pendientes",
    response_model=list[ObraOut],
    dependencies=[Depends(require_roles(ROL_CURADOR))],
)
def listar_obras_sin_certificado(db: Session = Depends(get_db)):
    """Obras que ya superaron la curaduría pero aún no tienen certificado.

    Se declara antes de `/{id_obra}` porque ese parámetro es `int` y una ruta
    literal posterior nunca alcanzaría a resolverse.
    """
    return (
        db.query(ObraArte)
        .filter(ObraArte.estado_obra != "Pendiente", ~ObraArte.certificado.has())
        .order_by(ObraArte.id_obra.desc())
        .all()
    )


@router.get("/verificar/{sello}", response_model=CertificadoVerificacionOut)
def verificar_certificado(sello: str, db: Session = Depends(get_db)):
    """Verificación pública de un certificado a partir de su sello SHA-256.

    Es el destino del QR de validación del Trust Engine (ver
    `trust_engine.url_validacion_certificado`), que codifica
    `{FRONTEND_URL}/verificar/{sello}`.

    Además de localizar el certificado, recalcula el sello con la ficha técnica
    actual de la obra y la firma del curador: si el resultado no coincide con el
    sello almacenado, significa que algún dato certificado se modificó después
    de la emisión y `sello_valido` viaja en `false`.
    """
    certificado = (
        db.query(CertificadoAutenticidad)
        .filter(CertificadoAutenticidad.codigo_qr_validacion == sello)
        .first()
    )
    if certificado is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No existe ningún certificado con este sello de autenticidad",
        )

    obra = db.get(ObraArte, certificado.id_obra)
    if obra is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Obra no encontrada")

    sello_recalculado = generar_sello_sha256(obra, certificado.firma_digital_curador)
    return CertificadoVerificacionOut(
        sello_valido=sello_recalculado == certificado.codigo_qr_validacion,
        certificado=CertificadoOut.model_validate(certificado),
        obra=ObraCertificadaOut.model_validate(obra),
    )


@router.get("/{id_obra}/descargar", response_model=CertificadoOut)
def descargar_certificado_comprador(
    id_obra: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """RF 5.2.2 — Descarga definitiva del Certificado de Autenticidad para el
    comprador, habilitada únicamente después de confirmar la recepción física
    de la obra y el cierre del proceso logístico (`estado_envio = 'Entregado'`)."""
    certificado = db.query(CertificadoAutenticidad).filter(CertificadoAutenticidad.id_obra == id_obra).first()
    if certificado is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificado no encontrado")

    rol_usuario = usuario.rol.nombre_rol
    if rol_usuario == ROL_COMPRADOR:
        envio_entregado = (
            db.query(EnvioLogistica)
            .join(Transaccion, EnvioLogistica.id_transaccion == Transaccion.id_transaccion)
            .filter(
                Transaccion.id_obra == id_obra,
                Transaccion.id_comprador == usuario.id_usuario,
                Transaccion.estado_pago.in_(("Confirmado", "Dispersado")),
                EnvioLogistica.estado_envio == "Entregado",
            )
            .first()
        )
        if envio_entregado is None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El certificado definitivo solo puede descargarse tras confirmar la recepción física de la obra ('Entregado') (RF 5.2.2)",
            )
    elif rol_usuario not in (ROL_CURADOR, ROL_ADMINISTRADOR):
        obra = db.get(ObraArte, id_obra)
        if obra is None or obra.id_artista != usuario.id_usuario:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene permiso para descargar este certificado")

    return certificado


@router.get("/{id_obra}", response_model=CertificadoOut)
def obtener_certificado(id_obra: int, db: Session = Depends(get_db)):
    """Consulta pública del certificado de autenticidad de una obra."""
    certificado = db.query(CertificadoAutenticidad).filter(CertificadoAutenticidad.id_obra == id_obra).first()
    if certificado is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificado no encontrado")
    return certificado


@router.get("/{id_obra}/qr", response_class=Response, responses={200: {"content": {"image/png": {}}}})
def obtener_qr_certificado(id_obra: int, db: Session = Depends(get_db)):
    """Renderiza como imagen PNG el QR de validación pública del certificado."""
    certificado = db.query(CertificadoAutenticidad).filter(CertificadoAutenticidad.id_obra == id_obra).first()
    if certificado is None or not certificado.codigo_qr_validacion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificado no encontrado")
    url = url_validacion_certificado(certificado.codigo_qr_validacion)
    return Response(content=generar_imagen_qr_png(url), media_type="image/png")
