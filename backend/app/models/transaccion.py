from datetime import datetime

from sqlalchemy import CheckConstraint, DECIMAL, ForeignKey, String, TIMESTAMP, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

# 'Rechazado' cubre cualquier motivo de fallo de la pasarela (DECLINED /
# VOIDED / ERROR de Wompi): para el negocio son la misma cosa ("no se
# vendió"). Ver app/api/v1/endpoints/transacciones.py::webhook_wompi.
ESTADOS_PAGO_VALIDOS = ("Procesando", "Confirmado", "Dispersado", "Reembolsado", "Rechazado")


class Transaccion(Base):
    __tablename__ = "transaccion"
    __table_args__ = (
        CheckConstraint(
            f"estado_pago IN {ESTADOS_PAGO_VALIDOS}",
            name="chk_estado_pago",
        ),
    )

    id_transaccion: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id_comprador: Mapped[int] = mapped_column(
        ForeignKey("usuario.id_usuario", ondelete="RESTRICT"), nullable=False
    )
    id_obra: Mapped[int] = mapped_column(
        ForeignKey("obra_arte.id_obra", ondelete="RESTRICT"), nullable=False
    )
    fecha_pago: Mapped[datetime | None] = mapped_column(TIMESTAMP, server_default=func.now())
    monto_total: Mapped[float] = mapped_column(DECIMAL(12, 2), nullable=False)
    porcentaje_comision_galeria: Mapped[float] = mapped_column(DECIMAL(5, 2), nullable=False)
    monto_neto_artista: Mapped[float] = mapped_column(DECIMAL(12, 2), nullable=False)
    monto_comision_galeria: Mapped[float] = mapped_column(DECIMAL(12, 2), nullable=False)
    impuestos_retenciones: Mapped[float] = mapped_column(DECIMAL(12, 2), nullable=False)
    estado_pago: Mapped[str | None] = mapped_column(String(20), server_default="Procesando")
    # Última `reference` de Wompi usada para intentar pagar esta transacción
    # (ver app/services/wompi_service.py). Útil para soporte/reconciliación;
    # la correlación real con el webhook se hace parseando el id_transaccion
    # codificado en la propia reference, no comparando esta columna.
    referencia_pasarela: Mapped[str | None] = mapped_column(String(80))

    envio: Mapped["EnvioLogistica | None"] = relationship(
        back_populates="transaccion", uselist=False, cascade="all, delete-orphan"
    )
