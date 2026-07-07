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
