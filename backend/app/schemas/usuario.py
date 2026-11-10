from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class UsuarioBase(BaseModel):
    correo_electronico: EmailStr


class UsuarioOut(UsuarioBase):
    model_config = ConfigDict(from_attributes=True)

    id_usuario: int
    id_rol: int
    mfa_activado: bool
    estado_cuenta: str
    fecha_registro: datetime


class UsuarioRolUpdate(BaseModel):
    id_rol: int


class UsuarioEstadoUpdate(BaseModel):
    estado_cuenta: str  # "Activo" | "Inhabilitado"


class UsuarioInternoCreate(UsuarioBase):
    """RF 1.1.5 — Creación interna de cuentas (Curador / Administrador) por un Administrador."""

    contrasenia: str
    id_rol: int
    mfa_activado: bool = True

