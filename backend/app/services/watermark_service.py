"""
Marca de agua para la previsualización pública de las obras (RF 2.1.1).

La fotografía en alta resolución (`obra_arte.fotografia_hd_url`) se conserva
intacta para uso curatorial/certificación; el catálogo público debe mostrar
en su lugar una versión con marca de agua, generada bajo demanda a partir de
esa misma imagen (patrón ya usado por los QR: no se guarda un archivo nuevo
por obra, se calcula al vuelo — ver `GET /obras/{id}/preview`).
"""
import io
import urllib.request

from fastapi import HTTPException, status
from PIL import Image, ImageDraw, ImageFont

from app.services.storage_service import resolver_ruta_local

TEXTO_MARCA_AGUA = "PIXEL Y LIENZO — VISTA PREVIA"


def _cargar_imagen(url_o_ruta: str) -> Image.Image:
    ruta_local = resolver_ruta_local(url_o_ruta)
    try:
        if ruta_local is not None:
            return Image.open(ruta_local).convert("RGBA")
        with urllib.request.urlopen(url_o_ruta, timeout=10) as resp:
            return Image.open(io.BytesIO(resp.read())).convert("RGBA")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="No se pudo cargar la fotografía de la obra para generar la previsualización",
        )


def generar_preview_con_marca_agua(url_o_ruta: str) -> bytes:
    """Devuelve los bytes JPEG de la imagen con una marca de agua diagonal
    repetida, del estilo típico de bancos de imágenes (protege la fotografía
    en alta resolución mientras la obra no ha sido comprada)."""
    imagen = _cargar_imagen(url_o_ruta)
    ancho, alto = imagen.size

    capa_marca = Image.new("RGBA", imagen.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(capa_marca)

    tamanio_fuente = max(18, min(ancho, alto) // 18)
    try:
        fuente = ImageFont.truetype("arial.ttf", tamanio_fuente)
    except OSError:
        fuente = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), TEXTO_MARCA_AGUA, font=fuente)
    texto_ancho = bbox[2] - bbox[0]
    texto_alto = bbox[3] - bbox[1]

    paso_x = texto_ancho + tamanio_fuente * 4
    paso_y = texto_alto + tamanio_fuente * 4
    for y in range(-alto, alto * 2, paso_y):
        for x in range(-ancho, ancho * 2, paso_x):
            draw.text((x, y), TEXTO_MARCA_AGUA, font=fuente, fill=(255, 255, 255, 110))

    capa_marca = capa_marca.rotate(30, expand=False)
    resultado = Image.alpha_composite(imagen, capa_marca.resize(imagen.size)).convert("RGB")

    buffer = io.BytesIO()
    resultado.save(buffer, format="JPEG", quality=85)
    return buffer.getvalue()
