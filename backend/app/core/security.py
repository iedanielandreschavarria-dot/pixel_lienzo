"""
Utilidades de seguridad: hashing de contraseñas y generación/validación
de tokens JWT (autenticación de Usuario, RBAC y soporte para MFA).
"""
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Denylist en memoria de `jti` (JWT ID) revocados por logout o revocación de
# acceso administrativa (RF 1.3.7 / 1.4.4). Igual que app/services/otp_service.py,
# esto es apto para un solo proceso; en producción con múltiples workers debería
# vivir en Redis con TTL igual a la expiración del token.
_revoked_jti: set[str] = set()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(subject: str | int, extra_claims: dict[str, Any] | None = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode: dict[str, Any] = {"sub": str(subject), "exp": expire, "type": "access", "jti": uuid.uuid4().hex}
    if extra_claims:
        to_encode.update(extra_claims)
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(subject: str | int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": str(subject), "exp": expire, "type": "refresh", "jti": uuid.uuid4().hex}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    if payload.get("jti") in _revoked_jti:
        raise JWTError("Token revocado")
    return payload


def revoke_token(token: str) -> None:
    """Añade el `jti` del token a la denylist (logout / revocación de sesión)."""
    try:
        # No verificamos expiración aquí: aunque el token ya haya expirado,
        # revocar su jti es una operación inofensiva e idempotente.
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM], options={"verify_exp": False}
        )
    except JWTError:
        return
    jti = payload.get("jti")
    if jti:
        _revoked_jti.add(jti)


# --- Tokens de un solo propósito, con expiración corta, firmados con el mismo
# SECRET_KEY pero con un `type` distintivo para que no puedan reutilizarse
# como access/refresh tokens ni viceversa. ---


def create_password_reset_token(correo_electronico: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.PASSWORD_RESET_EXPIRE_MINUTES)
    to_encode = {"sub": correo_electronico, "exp": expire, "type": "password_reset", "jti": uuid.uuid4().hex}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_password_reset_token(token: str) -> str | None:
    """Devuelve el correo electrónico asociado si el token es válido, o None."""
    try:
        payload = decode_token(token)
    except JWTError:
        return None
    if payload.get("type") != "password_reset":
        return None
    return payload.get("sub")
