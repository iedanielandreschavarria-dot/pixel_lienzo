"""
Módulo 5 — Motor de Confianza (Trust Engine) y Motor de Códigos QR.

Genera:
  1. El sello criptográfico SHA-256 que amarra la ficha técnica de la obra
     con la firma digital del curador, de forma que cualquier alteración
     posterior de esos datos invalidaría el sello (integridad verificable).
  2. Los códigos/URLs cortos que se codifican en los QR físicos y digitales.
     Los campos de BD (`obra_arte.codigo_qr_obra`,
     `certificado_autenticidad.codigo_qr_validacion`) son VARCHAR(500), por
     lo que se guarda el código/URL, no la imagen. La imagen PNG del QR se
     renderiza bajo demanda (ver endpoints `/obras/{id}/qr` y
     `/certificados/{id_obra}/qr`).
"""
import hashlib
import io

import qrcode

from app.core.config import settings
from app.models.obra_arte import ObraArte


def generar_sello_sha256(obra: ObraArte, firma_digital_curador: str) -> str:
    """Hash SHA-256 (hexdigest, 64 caracteres) de la ficha técnica + firma."""
    payload = "|".join(
        [
            obra.uid,
            obra.titulo,
            obra.tecnica,
            obra.dimensiones,
            str(obra.peso),
            str(obra.anio_creacion or ""),
            str(obra.precio_venta),
            str(obra.id_artista),
            firma_digital_curador,
        ]
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def url_publica_obra(uid: str) -> str:
    """URL de la ficha técnica pública de la obra (destino del QR físico junto
    a la pieza, RF del 'QR Engine')."""
    return f"{settings.FRONTEND_URL}/obras/{uid}"


def url_validacion_certificado(sello: str) -> str:
    """URL de verificación pública del certificado de autenticidad (destino
    del QR de validación del Trust Engine)."""
    return f"{settings.FRONTEND_URL}/verificar/{sello}"


def generar_imagen_qr_png(data: str) -> bytes:
    """Renderiza un código QR como imagen PNG (bytes) a partir de un texto/URL."""
    imagen = qrcode.make(data)
    buffer = io.BytesIO()
    imagen.save(buffer, format="PNG")
    return buffer.getvalue()
