"""
Servicio de validación de tokens de Google Identity Services (OAuth2 / OIDC)
para cumplir con RF 1.1.2 (inicio de sesión y registro mediante proveedor de
identidad externo Google).
"""
from __future__ import annotations

import httpx
from fastapi import HTTPException, status

from app.core.config import settings

GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"


def verificar_google_id_token(credential: str) -> dict:
    """Valida el `id_token` (`credential`) emitido por Google Identity Services
    contra el endpoint oficial `tokeninfo` de Google y devuelve sus claims
    verificados (incluyendo `email`, `sub`, `name`, `picture`)."""
    if not credential or not credential.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El token de Google es obligatorio",
        )

    try:
        resp = httpx.get(
            GOOGLE_TOKENINFO_URL,
            params={"id_token": credential.strip()},
            timeout=8.0,
        )
    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No fue posible contactar con el servidor de autenticación de Google",
        )

    if resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de Google inválido o expirado",
        )

    datos = resp.json()

    if settings.GOOGLE_CLIENT_ID and datos.get("aud") != settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="El token de Google no corresponde a esta aplicación (aud inválido)",
        )

    email = datos.get("email")
    email_verified = str(datos.get("email_verified", "")).lower() == "true"
    if not email or not email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La cuenta de Google no posee un correo electrónico verificado",
        )

    return {
        "email": email,
        "google_sub": datos.get("sub"),
        "nombre": datos.get("name"),
    }

