"""
Módulo 5: Motor de Confianza / Trust Engine — Certificación de autenticidad.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.api.deps import ROL_CURADOR, get_current_user, require_roles
from app.core.database import get_db
from app.models.certificado_autenticidad import CertificadoAutenticidad
from app.models.obra_arte import ObraArte
from app.models.usuario import Usuario
from app.schemas.certificado import CertificadoCreate, CertificadoOut
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


@router.get("/{id_obra}", response_model=CertificadoOut)
def obtener_certificado(id_obra: int, db: Session = Depends(get_db)):
    """Descarga/consulta pública del certificado de autenticidad de una obra."""
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
