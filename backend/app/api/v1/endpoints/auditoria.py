"""
Módulo 1.5: Registro de Auditoría — Logs de seguridad inmutables.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import ROL_ADMINISTRADOR, require_roles
from app.core.database import get_db
from app.models.log_auditoria import LogAuditoria
from app.schemas.auditoria import LogAuditoriaOut

router = APIRouter()


@router.get("", response_model=list[LogAuditoriaOut], dependencies=[Depends(require_roles(ROL_ADMINISTRADOR))])
def listar_logs(db: Session = Depends(get_db)):
    """RF 1.5.1 — Consulta de logs de actividad. Los registros nunca se editan/eliminan (RF 1.5.2)."""
    return db.query(LogAuditoria).order_by(LogAuditoria.fecha_hora.desc()).all()
