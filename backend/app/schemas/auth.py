from pydantic import BaseModel, EmailStr, Field


class RegistroComprador(BaseModel):
    correo_electronico: EmailStr
    contrasenia: str = Field(min_length=8)
    categorias_interes: list[int] = []


class RegistroArtista(BaseModel):
    correo_electronico: EmailStr
    contrasenia: str = Field(min_length=8)
    biografia_profesional: str | None = None
    documento_identidad_url: str
    informacion_bancaria: str | None = None


class LoginRequest(BaseModel):
    correo_electronico: EmailStr
    contrasenia: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    requiere_mfa: bool = False


class RefreshRequest(BaseModel):
    refresh_token: str


class MfaVerifyRequest(BaseModel):
    correo_electronico: EmailStr
    codigo: str


class PasswordRecoveryRequest(BaseModel):
    correo_electronico: EmailStr


class PasswordResetRequest(BaseModel):
    token: str
    nueva_contrasenia: str = Field(min_length=8)


class EmailVerificationRequest(BaseModel):
    correo_electronico: EmailStr
    codigo: str


class LogoutRequest(BaseModel):
    refresh_token: str | None = None


class GoogleLoginRequest(BaseModel):
    """Inicio de sesión con Google Identity Services (RF 1.1.2)."""

    credential: str


class GoogleRegistroComprador(BaseModel):
    """Registro de Comprador con Google (el correo proviene del token de Google)."""

    credential: str
    categorias_interes: list[int] = []


class GoogleRegistroArtista(BaseModel):
    """Registro de Artista con Google: pide únicamente los datos básicos del
    artista (biografía y documento de identidad), evitando pedir correo,
    contraseña e información bancaria (la cual se configura en el panel)."""

    credential: str
    biografia_profesional: str | None = None
    documento_identidad_url: str

