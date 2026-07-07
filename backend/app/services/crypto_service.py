"""
Cifrado simétrico (Fernet/AES) para datos sensibles en reposo — en
particular `Perfil_Artista.informacion_bancaria` (ver Doc/bd_pixel_lienzo.txt:
"Almacena información cifrada").

La clave se deriva determinísticamente de `settings.SECRET_KEY` mediante
SHA-256, para no exigir una variable de entorno adicional en desarrollo.
En producción, usar una clave dedicada (rotable independientemente del
SECRET_KEY de JWT) es recomendable.
"""
import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import settings


def _get_fernet() -> Fernet:
    digest = hashlib.sha256(settings.SECRET_KEY.encode("utf-8")).digest()
    key = base64.urlsafe_b64encode(digest)
    return Fernet(key)


def encrypt_text(plain_text: str) -> str:
    """Cifra un texto plano y devuelve el token cifrado (str, seguro para BD)."""
    if not plain_text:
        return plain_text
    return _get_fernet().encrypt(plain_text.encode("utf-8")).decode("utf-8")


def decrypt_text(token: str) -> str | None:
    """Descifra un token generado por `encrypt_text`. Devuelve None si es inválido
    (por ejemplo, datos legados que se guardaron sin cifrar antes de este cambio)."""
    if not token:
        return token
    try:
        return _get_fernet().decrypt(token.encode("utf-8")).decode("utf-8")
    except (InvalidToken, ValueError):
        return None
