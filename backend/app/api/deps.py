"""
Dependencias comunes de la API: sesión de base de datos, usuario autenticado
actual y verificación de roles (RBAC) según lo definido en el módulo de
Identidad y Seguridad.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.security import decode_token
from app.models.usuario import Usuario

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# Nombres de rol tal como se insertan en la tabla `Rol` (ver bd_pixel_lienzo.txt)
ROL_ADMINISTRADOR = "Administrador"
ROL_CURADOR = "Curador"
ROL_ARTISTA = "Artista"
ROL_COMPRADOR = "Comprador"


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Usuario:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise credentials_exception
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    usuario = (
        db.query(Usuario)
        .options(joinedload(Usuario.rol))
        .filter(Usuario.id_usuario == int(user_id))
        .first()
    )
    if usuario is None:
        raise credentials_exception
    if usuario.estado_cuenta != "Activo":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cuenta inhabilitada")
    return usuario


def require_roles(*roles_permitidos: str):
    """Factory de dependencia para restringir un endpoint a ciertos roles (RBAC)."""

    def _checker(usuario: Usuario = Depends(get_current_user)) -> Usuario:
        if usuario.rol.nombre_rol not in roles_permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene permisos suficientes para esta operación",
            )
        return usuario

    return _checker
