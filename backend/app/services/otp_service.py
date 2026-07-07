"""
Códigos de un solo uso (OTP) para MFA y verificación de correo electrónico.

Implementación en memoria (diccionario + expiración), suficiente para un
solo proceso de desarrollo/demo. Si el backend se despliega con múltiples
workers/procesos o se reinicia, los códigos pendientes se pierden.

Para producción con múltiples workers, reemplazar `_store` por Redis
(mismo contrato de funciones: generate/verify/invalidate) sin tocar los
endpoints que lo consumen.
"""
import random
import threading
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone


@dataclass
class _OtpEntry:
    codigo: str
    expira: datetime
    intentos: int = 0

MAX_INTENTOS = 5

_store: dict[str, _OtpEntry] = {}
_lock = threading.Lock()


def _key(namespace: str, identificador: str) -> str:
    return f"{namespace}:{identificador}"


def generar_codigo(namespace: str, identificador: str, expire_minutes: int) -> str:
    """Genera y guarda un código numérico de 6 dígitos, sobrescribiendo cualquier
    código previo pendiente para la misma clave (namespace + identificador)."""
    codigo = f"{random.randint(0, 999999):06d}"
    expira = datetime.now(timezone.utc) + timedelta(minutes=expire_minutes)
    with _lock:
        _store[_key(namespace, identificador)] = _OtpEntry(codigo=codigo, expira=expira)
    return codigo


def verificar_codigo(namespace: str, identificador: str, codigo: str) -> bool:
    """Verifica el código y lo invalida (uso único) si es correcto o si se
    agotaron los intentos permitidos."""
    clave = _key(namespace, identificador)
    with _lock:
        entrada = _store.get(clave)
        if entrada is None:
            return False
        if datetime.now(timezone.utc) > entrada.expira:
            del _store[clave]
            return False

        entrada.intentos += 1
        es_valido = entrada.codigo == codigo

        if es_valido or entrada.intentos >= MAX_INTENTOS:
            del _store[clave]

        return es_valido


def invalidar(namespace: str, identificador: str) -> None:
    with _lock:
        _store.pop(_key(namespace, identificador), None)


# Namespaces usados por la aplicación (evitan colisiones entre distintos flujos)
NS_MFA = "mfa"
NS_EMAIL_VERIFICATION = "email_verification"
