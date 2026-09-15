"""
Módulo 2: Curaduría y Catálogo — Subida de archivos.

Flujo de dos pasos (desacoplado, similar a un upload pre-firmado de S3): el
cliente sube el archivo aquí, recibe una URL pública, y esa URL es la que se
envía en el JSON de `POST /obras`, `PATCH /obras/{id}` o
`POST /auth/registro/artista`. Esto evita mezclar `multipart/form-data` con
los payloads JSON de esos endpoints.
"""
from fastapi import APIRouter, Depends, UploadFile, File, status

from app.api.deps import ROL_ARTISTA, ROL_CURADOR, require_roles
from app.schemas.common import ArchivoSubidoOut
from app.services.storage_service import CONTENT_TYPES_DOCUMENTO, CONTENT_TYPES_IMAGEN, guardar_archivo

router = APIRouter()


@router.post(
    "/obra",
    response_model=ArchivoSubidoOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(ROL_ARTISTA))],
)
def subir_fotografia_obra(archivo: UploadFile = File(...)):
    """RF 2.1.1 — Sube la fotografía en alta resolución de una obra.
    Solo Artista. Devuelve la URL a usar como `fotografia_hd_url`."""
    url = guardar_archivo(archivo, subcarpeta="obras", permitidos=CONTENT_TYPES_IMAGEN)
    return ArchivoSubidoOut(url=url)


@router.post(
    "/certificado",
    response_model=ArchivoSubidoOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(ROL_CURADOR))],
)
def subir_pdf_certificado(archivo: UploadFile = File(...)):
    """Sube el PDF del certificado de autenticidad firmado. Solo Curador.
    Devuelve la URL a usar como `pdf_certificado_url` en
    `POST /certificados/{id_obra}`."""
    url = guardar_archivo(archivo, subcarpeta="certificados", permitidos=CONTENT_TYPES_DOCUMENTO)
    return ArchivoSubidoOut(url=url)


@router.post("/documento-identidad", response_model=ArchivoSubidoOut, status_code=status.HTTP_201_CREATED)
def subir_documento_identidad(archivo: UploadFile = File(...)):
    """RF 1.1.3 — Sube el documento de identidad para el onboarding de
    artista. Es público (sin autenticación) porque se usa ANTES de que la
    cuenta exista, como paso previo a `POST /auth/registro/artista`. Devuelve
    la URL a usar como `documento_identidad_url`."""
    url = guardar_archivo(archivo, subcarpeta="documentos", permitidos=CONTENT_TYPES_DOCUMENTO)
    return ArchivoSubidoOut(url=url)
