"""
Servicio de auditoría (Módulo 1.5 — Registro de Auditoría / Logs de Seguridad).

RF 1.5.1: registrar cada acción administrativa sensible.
RF 1.5.2: los registros son inmutables (nunca se exponen endpoints de
edición/borrado sobre Log_Auditoria — ver app/api/v1/endpoints/auditoria.py).

Los nombres de `accion_realizada` para las acciones críticas se mantienen
EXACTAMENTE iguales a los valores que ya filtra la vista SQL existente
`auditoria_critica_view` (incluye el typo histórico "COMOSION" en vez de
"COMISION", preservado a propósito para que la vista siga funcionando):
    - 'CONFIGURACION_COMOSION_GLOBAL'
    - 'INHABILITACION_CUENTA'
    - 'DISPERSION_PAGO'
"""
from sqlalchemy.orm import Session

from app.models.log_auditoria import LogAuditoria

# Acciones reconocidas por `auditoria_critica_view` (no renombrar sin migrar la vista).
ACCION_CONFIG_COMISION = "CONFIGURACION_COMOSION_GLOBAL"
ACCION_INHABILITACION_CUENTA = "INHABILITACION_CUENTA"
ACCION_DISPERSION_PAGO = "DISPERSION_PAGO"

# Otras acciones propias del sistema, de uso informativo/genérico.
ACCION_CAMBIO_ROL = "CAMBIO_ROL_USUARIO"
ACCION_VALIDACION_ARTISTA = "VALIDACION_ARTISTA"
ACCION_VALIDACION_OBRA = "VALIDACION_OBRA"
ACCION_EMISION_CERTIFICADO = "EMISION_CERTIFICADO"
ACCION_LOGIN_FALLIDO = "LOGIN_FALLIDO"


def log_action(
    db: Session,
    *,
    id_usuario: int | None,
    accion: str,
    detalles: str | None = None,
    tabla: str | None = None,
) -> LogAuditoria:
    """Inserta un registro de auditoría. No hace commit por sí solo si se le
    pasa una sesión que el caller ya está manejando; aquí sí confirmamos
    porque el log de seguridad debe persistir incluso si el resto de la
    operación de negocio (fuera de esta función) llegara a fallar después."""
    entrada = LogAuditoria(
        id_usuario=id_usuario,
        accion_realizada=accion,
        detalles=detalles,
        tabla_afectada=tabla,
    )
    db.add(entrada)
    db.commit()
    db.refresh(entrada)
    return entrada
