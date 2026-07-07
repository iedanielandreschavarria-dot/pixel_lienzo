"""
Módulo 1: Identidad y Seguridad — Autenticación y gestión de sesiones.

Cubre: onboarding diferenciado (Comprador/Artista), verificación de correo,
login, MFA real (código de un solo uso por correo, obligatorio para
Administrador/Curador), refresh/revocación de tokens y recuperación de
contraseña con token firmado de un solo uso.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.api.deps import ROL_ARTISTA, ROL_COMPRADOR, get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    create_password_reset_token,
    decode_token,
    hash_password,
    revoke_token,
    verify_password,
    verify_password_reset_token,
)
from app.models.perfil_artista import PerfilArtista
from app.models.preferencia_comprador import PreferenciaComprador
from app.models.rol import Rol
from app.models.usuario import Usuario
from app.schemas.auth import (
    EmailVerificationRequest,
    LoginRequest,
    LogoutRequest,
    MfaVerifyRequest,
    PasswordRecoveryRequest,
    PasswordResetRequest,
    RefreshRequest,
    RegistroArtista,
    RegistroComprador,
    TokenResponse,
)
from app.schemas.common import Msg
from app.schemas.usuario import UsuarioOut
from app.services import otp_service
from app.services.audit_service import ACCION_LOGIN_FALLIDO, log_action
from app.services.crypto_service import encrypt_text
from app.services.email_service import (
    enviar_codigo_mfa,
    enviar_codigo_verificacion_email,
    enviar_enlace_recuperacion,
)

router = APIRouter()

# Roles que, según RF 1.4.2, requieren MFA obligatorio por manejar
# información institucional y financiera sensible.
ROLES_CON_MFA_OBLIGATORIO = {"Administrador", "Curador"}

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def _get_rol_or_404(db: Session, nombre_rol: str) -> Rol:
    rol = db.query(Rol).filter(Rol.nombre_rol == nombre_rol).first()
    if rol is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Rol '{nombre_rol}' no está inicializado en la base de datos",
        )
    return rol


def _emitir_tokens(usuario: Usuario) -> TokenResponse:
    access_token = create_access_token(usuario.id_usuario, {"rol": usuario.rol.nombre_rol})
    refresh_token = create_refresh_token(usuario.id_usuario)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/registro/comprador", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
def registrar_comprador(payload: RegistroComprador, db: Session = Depends(get_db)):
    """RF 1.1.2 — Registro de Comprador. RF 1.1.6 — categorías de interés.
    RF 1.1.7 — envío de código de verificación de correo."""
    if db.query(Usuario).filter(Usuario.correo_electronico == payload.correo_electronico).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El correo ya está registrado")

    rol = _get_rol_or_404(db, ROL_COMPRADOR)
    nuevo_usuario = Usuario(
        correo_electronico=payload.correo_electronico,
        contrasenia=hash_password(payload.contrasenia),
        id_rol=rol.id_rol,
    )
    db.add(nuevo_usuario)
    db.flush()

    for id_categoria in set(payload.categorias_interes):
        db.add(PreferenciaComprador(id_comprador=nuevo_usuario.id_usuario, id_categoria=id_categoria))

    db.commit()
    db.refresh(nuevo_usuario)

    codigo = otp_service.generar_codigo(
        otp_service.NS_EMAIL_VERIFICATION, payload.correo_electronico, settings.EMAIL_VERIFICATION_EXPIRE_MINUTES
    )
    enviar_codigo_verificacion_email(payload.correo_electronico, codigo)

    return nuevo_usuario


@router.post("/registro/artista", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
def registrar_artista(payload: RegistroArtista, db: Session = Depends(get_db)):
    """RF 1.1.3 / 1.1.4 — Onboarding de Artista (queda en estado 'Pendiente').
    La información bancaria se cifra antes de persistirse."""
    if db.query(Usuario).filter(Usuario.correo_electronico == payload.correo_electronico).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El correo ya está registrado")

    rol = _get_rol_or_404(db, ROL_ARTISTA)
    nuevo_usuario = Usuario(
        correo_electronico=payload.correo_electronico,
        contrasenia=hash_password(payload.contrasenia),
        id_rol=rol.id_rol,
    )
    db.add(nuevo_usuario)
    db.flush()

    perfil = PerfilArtista(
        id_artista=nuevo_usuario.id_usuario,
        biografia_profesional=payload.biografia_profesional,
        documento_identidad_url=payload.documento_identidad_url,
        informacion_bancaria=encrypt_text(payload.informacion_bancaria) if payload.informacion_bancaria else None,
        estado_validacion="Pendiente",
    )
    db.add(perfil)
    db.commit()
    db.refresh(nuevo_usuario)

    codigo = otp_service.generar_codigo(
        otp_service.NS_EMAIL_VERIFICATION, payload.correo_electronico, settings.EMAIL_VERIFICATION_EXPIRE_MINUTES
    )
    enviar_codigo_verificacion_email(payload.correo_electronico, codigo)

    return nuevo_usuario


@router.post("/verificar-email", response_model=Msg)
def verificar_email(payload: EmailVerificationRequest):
    """RF 1.1.7 — Confirmación de la dirección de correo mediante código único."""
    if not otp_service.verificar_codigo(
        otp_service.NS_EMAIL_VERIFICATION, payload.correo_electronico, payload.codigo
    ):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Código inválido o expirado")
    return Msg(mensaje="Correo verificado correctamente")


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """RF 1.4.1 — Autenticación por correo/contraseña.
    RF 1.4.2 — MFA obligatorio para Administrador/Curador: en vez de emitir
    tokens de una vez, se envía un código de un solo uso por correo y el
    cliente debe completar `/auth/mfa/verificar` para obtener los tokens."""
    usuario = db.query(Usuario).filter(Usuario.correo_electronico == payload.correo_electronico).first()
    if usuario is None or not verify_password(payload.contrasenia, usuario.contrasenia):
        log_action(
            db,
            id_usuario=usuario.id_usuario if usuario else None,
            accion=ACCION_LOGIN_FALLIDO,
            detalles=f"Intento de login fallido para {payload.correo_electronico}",
            tabla="usuario",
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")
    if usuario.estado_cuenta != "Activo":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cuenta inhabilitada")

    requiere_mfa = usuario.mfa_activado or usuario.rol.nombre_rol in ROLES_CON_MFA_OBLIGATORIO
    if requiere_mfa:
        codigo = otp_service.generar_codigo(otp_service.NS_MFA, usuario.correo_electronico, settings.MFA_CODE_EXPIRE_MINUTES)
        enviar_codigo_mfa(usuario.correo_electronico, codigo)
        return TokenResponse(access_token="", refresh_token="", requiere_mfa=True)

    return _emitir_tokens(usuario)


@router.post("/mfa/verificar", response_model=TokenResponse)
def verificar_mfa(payload: MfaVerifyRequest, db: Session = Depends(get_db)):
    """RF 1.4.2 — Completa el segundo factor y emite los tokens definitivos."""
    usuario = db.query(Usuario).filter(Usuario.correo_electronico == payload.correo_electronico).first()
    if usuario is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")

    if not otp_service.verificar_codigo(otp_service.NS_MFA, usuario.correo_electronico, payload.codigo):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Código MFA inválido o expirado")

    return _emitir_tokens(usuario)


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(payload: RefreshRequest, db: Session = Depends(get_db)):
    try:
        data = decode_token(payload.refresh_token)
        if data.get("type") != "refresh":
            raise ValueError("Token inválido")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token inválido o expirado")

    usuario = db.get(Usuario, int(data["sub"]))
    if usuario is None or usuario.estado_cuenta != "Activo":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario inválido o inhabilitado")

    # Rotación de refresh token: el anterior se revoca para que no pueda reutilizarse.
    revoke_token(payload.refresh_token)
    return _emitir_tokens(usuario)


@router.post("/logout", response_model=Msg)
def logout(
    payload: LogoutRequest,
    token: str | None = Depends(oauth2_scheme),
    usuario: Usuario = Depends(get_current_user),
):
    """RF 1.4.4 — Cierre de sesión: revoca el access token actual y, si se
    envía, también el refresh token asociado, para que no puedan reutilizarse
    aunque no hayan expirado todavía."""
    if token:
        revoke_token(token)
    if payload.refresh_token:
        revoke_token(payload.refresh_token)
    return Msg(mensaje="Sesión cerrada correctamente")


@router.post("/password/recuperar", response_model=Msg)
def solicitar_recuperacion(payload: PasswordRecoveryRequest, db: Session = Depends(get_db)):
    """RF 1.4.3 — Envío de un token firmado (JWT de un solo propósito, expira
    en `PASSWORD_RESET_EXPIRE_MINUTES`) para restablecer la contraseña."""
    usuario = db.query(Usuario).filter(Usuario.correo_electronico == payload.correo_electronico).first()
    # Respuesta idéntica exista o no el correo, para no filtrar qué correos están registrados.
    if usuario is not None:
        token = create_password_reset_token(usuario.correo_electronico)
        enviar_enlace_recuperacion(usuario.correo_electronico, token)
    return Msg(mensaje="Si el correo existe, se enviará un enlace de recuperación")


@router.post("/password/restablecer", response_model=Msg)
def restablecer_password(payload: PasswordResetRequest, db: Session = Depends(get_db)):
    correo = verify_password_reset_token(payload.token)
    if correo is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token inválido o expirado")

    usuario = db.query(Usuario).filter(Usuario.correo_electronico == correo).first()
    if usuario is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    usuario.contrasenia = hash_password(payload.nueva_contrasenia)
    db.commit()
    revoke_token(payload.token)
    return Msg(mensaje="Contraseña restablecida correctamente")


@router.get("/me", response_model=UsuarioOut)
def obtener_perfil_actual(usuario: Usuario = Depends(get_current_user)):
    return usuario
