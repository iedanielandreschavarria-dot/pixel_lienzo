"""
Configuración central de la aplicación.

Los valores se cargan desde variables de entorno (archivo .env en la raíz
de /backend). Ver `.env.example` para la lista completa de variables.
"""
import json
from functools import lru_cache
from typing import List
from typing_extensions import Annotated

from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    # Información general del proyecto
    PROJECT_NAME: str = "Pixel y Lienzo API"
    PROJECT_DESCRIPTION: str = (
        "API REST para la Galería Digital del Palacio Nacional: gestión de "
        "identidad (RBAC), curaduría y catálogo de obras, motor de pago "
        "(split payment), logística integrada y motor de confianza "
        "(certificación de autenticidad y trazabilidad)."
    )
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # Base de datos (MySQL / MariaDB 8.0+)
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "pixel_lienzo_db"

    @property
    def DATABASE_URL(self) -> str:
        # `charset=utf8mb4` es obligatorio: sin especificarlo, pymysql negocia
        # su charset por defecto con el servidor y corrompe (mojibake) los
        # acentos/ñ almacenados, aunque la base de datos use utf8mb4.
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"
        )

    # Seguridad / JWT
    SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    PASSWORD_RESET_EXPIRE_MINUTES: int = 30
    MFA_CODE_EXPIRE_MINUTES: int = 10
    EMAIL_VERIFICATION_EXPIRE_MINUTES: int = 60 * 24

    # Correo saliente (SMTP). Si SMTP_HOST queda vacío, el servicio de correo
    # cae automáticamente a "modo consola" (imprime el mensaje en el log) para
    # poder desarrollar sin depender de un servidor SMTP real.
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_USE_TLS: bool = True
    SMTP_FROM_EMAIL: str = "no-responder@pixelylienzo.com"
    SMTP_FROM_NAME: str = "Pixel y Lienzo"

    # URL base del frontend en React, usada para construir enlaces (recuperación
    # de contraseña, páginas de verificación del Trust Engine, ficha pública
    # de la obra referenciada por el QR físico, etc.)
    FRONTEND_URL: str = "http://localhost:5173"

    # URL pública en la que corre ESTE backend, usada para construir las URLs
    # de los archivos servidos desde /static (fotografías de obras, previews
    # con marca de agua, documentos de identidad de artistas).
    BACKEND_BASE_URL: str = "http://localhost:8000"

    # Almacenamiento de archivos subidos (fotografías de obras, documentos de
    # identidad). En este entorno se guardan en disco local bajo UPLOAD_DIR y
    # se sirven vía StaticFiles en `/static` (ver app/main.py). Para producción
    # con múltiples instancias, migrar a almacenamiento compartido (S3/Azure Blob).
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 10

    # Pasarela de pago: Wompi (Colombia). Usamos el "Web Checkout" (redirect
    # hospedado por Wompi, ver app/services/wompi_service.py): el backend
    # nunca toca datos de tarjeta. Llaves de prueba/producción en el
    # dashboard de comercios de Wompi (https://comercios.wompi.co).
    WOMPI_PUBLIC_KEY: str = ""
    WOMPI_PRIVATE_KEY: str = ""
    # "Firma de integridad": protege reference/amount/currency del checkout.
    WOMPI_INTEGRITY_SECRET: str = ""
    # "Secreto de eventos": valida la firma de los webhooks entrantes.
    WOMPI_EVENTS_SECRET: str = ""
    WOMPI_CHECKOUT_URL: str = "https://checkout.wompi.co/p/"
    # Sandbox por defecto; cambiar a https://production.wompi.co/v1 en vivo.
    WOMPI_API_BASE_URL: str = "https://sandbox.wompi.co/v1"
    # Minutos máximos que una obra permanece en estado 'Reservado' mientras la
    # transacción sigue en 'Procesando' sin confirmación del webhook de Wompi.
    CHECKOUT_RESERVATION_EXPIRE_MINUTES: int = 30

    # CORS: orígenes permitidos para el frontend en React
    # (Create React App usa :3000, Vite usa :5173 por defecto)
    # `NoDecode` evita que pydantic-settings intente un json.loads() automático
    # sobre el valor crudo del .env antes de que corra nuestro validador,
    # permitiendo aceptar tanto formato JSON como lista separada por comas.
    BACKEND_CORS_ORIGINS: Annotated[List[AnyHttpUrl], NoDecode] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("["):
                return json.loads(v)
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


@lru_cache
def get_settings() -> "Settings":
    return Settings()


settings = get_settings()
