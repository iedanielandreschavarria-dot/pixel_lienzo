"""
Módulo 1.3: Control de Acceso Basado en Roles (RBAC) — Gestión de usuarios.

Reservado al Administrador: listado global, cambio de rol y activación/
inhabilitación de cuentas (RF 1.3.1, 1.3.7).
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import ROL_ADMINISTRADOR, get_current_user, require_roles
from app.core.database import get_db
from app.models.usuario import Usuario
from app.schemas.common import Msg
from app.schemas.usuario import UsuarioEstadoUpdate, UsuarioOut, UsuarioRolUpdate
from app.services.audit_service import ACCION_CAMBIO_ROL, ACCION_INHABILITACION_CUENTA, log_action

router = APIRouter()


@router.get("", response_model=list[UsuarioOut], dependencies=[Depends(require_roles(ROL_ADMINISTRADOR))])
def listar_usuarios(db: Session = Depends(get_db)):
    """RF 1.3.1 — Directorio maestro de usuarios (solo Administrador)."""
    return db.query(Usuario).all()


@router.patch(
    "/{id_usuario}/rol",
    response_model=UsuarioOut,
    dependencies=[Depends(require_roles(ROL_ADMINISTRADOR))],
)
def actualizar_rol(
    id_usuario: int,
    payload: UsuarioRolUpdate,
    admin: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """RF 1.3.1 — Asignación/modificación de roles de usuarios internos."""
    usuario = db.get(Usuario, id_usuario)
    if usuario is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    rol_anterior = usuario.id_rol
    usuario.id_rol = payload.id_rol
    db.commit()
    db.refresh(usuario)

    log_action(
        db,
        id_usuario=admin.id_usuario,
        accion=ACCION_CAMBIO_ROL,
        detalles=f"Usuario {id_usuario}: rol {rol_anterior} -> {payload.id_rol}",
        tabla="usuario",
    )
    return usuario


@router.patch(
    "/{id_usuario}/estado",
    response_model=UsuarioOut,
    dependencies=[Depends(require_roles(ROL_ADMINISTRADOR))],
)
def actualizar_estado_cuenta(
    id_usuario: int,
    payload: UsuarioEstadoUpdate,
    admin: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """RF 1.3.7 — Revocación inmediata de acceso ante infracción de políticas.

    Nota: al inhabilitar, los tokens ya emitidos para ese usuario seguirán
    siendo técnicamente válidos hasta expirar (no hay una denylist por
    usuario, solo por token individual vía logout), PERO `get_current_user`
    rechaza cualquier request de una cuenta con `estado_cuenta != 'Activo'`,
    así que el acceso queda bloqueado de inmediato en la práctica.
    """
    usuario = db.get(Usuario, id_usuario)
    if usuario is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    usuario.estado_cuenta = payload.estado_cuenta
    db.commit()
    db.refresh(usuario)

    if payload.estado_cuenta == "Inhabilitado":
        log_action(
            db,
            id_usuario=admin.id_usuario,
            accion=ACCION_INHABILITACION_CUENTA,
            detalles=f"Cuenta {id_usuario} ({usuario.correo_electronico}) inhabilitada",
            tabla="usuario",
        )
    return usuario
