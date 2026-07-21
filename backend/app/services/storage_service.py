"""
Almacenamiento local de archivos subidos (fotografías de obras, documentos
de identidad de artistas). Los archivos se guardan bajo `settings.UPLOAD_DIR`
y se sirven vía `StaticFiles` montado en `/static` (ver app/main.py).

Para producción con múltiples instancias/despliegues efímeros, este servicio
debería reemplazarse por almacenamiento compartido (S3/Azure Blob/GCS) sin
cambiar la firma de `guardar_archivo`.
"""
import os
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

EXTENSIONES_POR_CONTENT_TYPE = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
}

CONTENT_TYPES_IMAGEN = {"image/jpeg", "image/png", "image/webp"}
CONTENT_TYPES_DOCUMENTO = {"image/jpeg", "image/png", "image/webp", "application/pdf"}


def _validar_content_type(content_type: str | None, permitidos: set[str]) -> str:
    if content_type not in permitidos:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Tipo de archivo no permitido: {content_type}. Permitidos: {', '.join(sorted(permitidos))}",
        )
    return content_type


def _ruta_absoluta_upload_dir() -> Path:
    return Path(settings.UPLOAD_DIR).resolve()


def guardar_archivo(archivo: UploadFile, subcarpeta: str, permitidos: set[str]) -> str:
    """Valida tipo/tamaño, guarda el archivo con un nombre único y devuelve
    su URL pública (servida por StaticFiles bajo `/static`)."""
    content_type = _validar_content_type(archivo.content_type, permitidos)

    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    contenido = archivo.file.read()
    if len(contenido) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"El archivo supera el tamaño máximo permitido ({settings.MAX_UPLOAD_SIZE_MB} MB)",
        )
    if not contenido:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El archivo está vacío")

    extension = EXTENSIONES_POR_CONTENT_TYPE[content_type]
    nombre_archivo = f"{uuid.uuid4().hex}{extension}"

    directorio = _ruta_absoluta_upload_dir() / subcarpeta
    directorio.mkdir(parents=True, exist_ok=True)

    ruta_destino = directorio / nombre_archivo
    with open(ruta_destino, "wb") as f:
        f.write(contenido)

    return f"{settings.BACKEND_BASE_URL}/static/{subcarpeta}/{nombre_archivo}"


def resolver_ruta_local(url_o_ruta: str) -> Path | None:
    """Si la URL corresponde a un archivo servido por nuestro propio /static,
    devuelve la ruta local en disco; si es una URL externa, devuelve None."""
    marcador = "/static/"
    if marcador not in url_o_ruta:
        return None
    relativo = url_o_ruta.split(marcador, 1)[1]
    ruta = (_ruta_absoluta_upload_dir() / relativo).resolve()
    # Evita path traversal: la ruta resuelta debe seguir dentro de UPLOAD_DIR.
    if os.path.commonpath([ruta, _ruta_absoluta_upload_dir()]) != str(_ruta_absoluta_upload_dir()):
        return None
    return ruta if ruta.is_file() else None
