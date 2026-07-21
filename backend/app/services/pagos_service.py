"""
Lógica de pagos compartida entre el Motor de Pago (Módulo 3) y Logística
(Módulo 4): una reclamación resuelta como "Devolución Dinero" dispara
exactamente el mismo reembolso que un Administrador aplicaría manualmente
desde `PATCH /transacciones/{id}/estado`, así que ambos flujos reusan esta
única función para no duplicar (y desincronizar) la regla de negocio.
"""
from sqlalchemy.orm import Session

from app.models.obra_arte import ObraArte
from app.models.transaccion import Transaccion


def reembolsar_transaccion(db: Session, transaccion: Transaccion) -> Transaccion:
    """Marca la transacción como reembolsada y libera la obra de vuelta al
    catálogo público (vuelve a estar disponible para la venta)."""
    transaccion.estado_pago = "Reembolsado"
    obra = db.get(ObraArte, transaccion.id_obra)
    if obra is not None:
        obra.estado_obra = "Publicado"
    db.commit()
    db.refresh(transaccion)
    return transaccion
