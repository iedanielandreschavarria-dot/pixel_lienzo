"""Agrega configuracion_sistema y referencia_pasarela

Revision ID: 817ed02299d7
Revises: ffa7c8980f6f
Create Date: 2026-07-08 22:36:12.940434

Cambios:
  - Nueva tabla `configuracion_sistema` (fila única) para persistir la
    comisión de galería configurable, que hasta ahora vivía en memoria del
    proceso de Python (se perdía al reiniciar, no se compartía entre
    workers). Se siembra automáticamente con el valor por defecto (ver
    app/db/seed.py::seed_configuracion_sistema).
  - Nueva columna `transaccion.referencia_pasarela`: guarda la última
    `reference` de Wompi usada para intentar pagar la transacción (soporte
    y reconciliación).
  - `chk_estado_pago` amplía sus valores permitidos con 'Rechazado', para
    poder representar un pago DECLINED/VOIDED/ERROR de la pasarela sin
    dejar la transacción indefinidamente en 'Procesando'.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '817ed02299d7'
down_revision: Union[str, None] = 'ffa7c8980f6f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

ESTADOS_PAGO_ANTERIORES = "('Procesando','Confirmado','Dispersado','Reembolsado')"
ESTADOS_PAGO_NUEVOS = "('Procesando','Confirmado','Dispersado','Reembolsado','Rechazado')"


def upgrade() -> None:
    op.create_table(
        'configuracion_sistema',
        sa.Column('id_configuracion', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('porcentaje_comision_galeria', sa.DECIMAL(precision=5, scale=2), server_default='20.00', nullable=False),
        sa.Column('actualizado_por', sa.Integer(), nullable=True),
        sa.Column('actualizado_en', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(
            ['actualizado_por'], ['usuario.id_usuario'], ondelete='SET NULL', name='fk_configuracion_usuario'
        ),
        sa.PrimaryKeyConstraint('id_configuracion'),
    )
    op.add_column('transaccion', sa.Column('referencia_pasarela', sa.String(length=80), nullable=True))

    # MySQL no soporta ALTER/DROP de un CHECK sin nombrarlo explícitamente;
    # `chk_estado_pago` es el nombre real ya existente en pixel_lienzo_db.
    op.execute("ALTER TABLE transaccion DROP CHECK chk_estado_pago")
    op.execute(f"ALTER TABLE transaccion ADD CONSTRAINT chk_estado_pago CHECK (estado_pago IN {ESTADOS_PAGO_NUEVOS})")


def downgrade() -> None:
    op.execute("ALTER TABLE transaccion DROP CHECK chk_estado_pago")
    op.execute(f"ALTER TABLE transaccion ADD CONSTRAINT chk_estado_pago CHECK (estado_pago IN {ESTADOS_PAGO_ANTERIORES})")

    op.drop_column('transaccion', 'referencia_pasarela')
    op.drop_table('configuracion_sistema')
