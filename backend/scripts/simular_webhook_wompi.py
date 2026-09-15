"""Simula un evento `transaction.updated` de Wompi contra el webhook local.

Wompi solo puede notificar a URLs públicas, así que en desarrollo la
confirmación del pago normalmente exige exponer el backend con un túnel
(ngrok/cloudflared). Este script evita ese requisito: como conocemos
`WOMPI_EVENTS_SECRET`, podemos firmar un evento idéntico al que enviaría
Wompi y entregarlo directamente a `POST /transacciones/webhook/wompi`.

Sirve para probar el camino completo (confirmar la venta, marcar la obra como
'Vendido', notificar al artista) y también los casos de rechazo.

Uso, desde /backend con el entorno virtual activo:

    python scripts/simular_webhook_wompi.py 12
    python scripts/simular_webhook_wompi.py 12 --estado DECLINED
    python scripts/simular_webhook_wompi.py 12 --monto-en-centavos 999  # firma válida, monto alterado

No sustituye una prueba real contra el sandbox de Wompi: valida nuestro lado
de la integración (firma, idempotencia, efectos en base de datos), no que la
pasarela acepte el checkout que construimos.
"""
import argparse
import hashlib
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.config import settings  # noqa: E402
from app.core.database import SessionLocal  # noqa: E402
from app.models.obra_arte import ObraArte  # noqa: E402
from app.models.transaccion import Transaccion  # noqa: E402

# Propiedades que Wompi firma en los eventos de transacción.
PROPIEDADES_FIRMADAS = ["transaction.id", "transaction.status", "transaction.amount_in_cents"]


def construir_evento(referencia: str, estado: str, monto_en_centavos: int, firma_valida: bool = True) -> dict:
    transaccion = {
        "id": f"sim-{int(time.time())}",
        "status": estado,
        "amount_in_cents": monto_en_centavos,
        "reference": referencia,
        "currency": "COP",
    }
    timestamp = int(time.time())

    # Mismo algoritmo que valida el backend: valores de `properties` en orden,
    # luego el timestamp, luego el secreto de eventos, todo bajo SHA-256.
    cadena = (
        f"{transaccion['id']}{transaccion['status']}{transaccion['amount_in_cents']}"
        f"{timestamp}{settings.WOMPI_EVENTS_SECRET}"
    )
    checksum = hashlib.sha256(cadena.encode("utf-8")).hexdigest()
    if not firma_valida:
        checksum = "0" * 64

    return {
        "event": "transaction.updated",
        "data": {"transaction": transaccion},
        "environment": "test",
        "signature": {"properties": PROPIEDADES_FIRMADAS, "checksum": checksum},
        "timestamp": timestamp,
        "sent_at": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime()),
    }


def enviar(evento: dict) -> tuple[int, str]:
    url = f"{settings.BACKEND_BASE_URL}{settings.API_V1_STR}/transacciones/webhook/wompi"
    peticion = urllib.request.Request(
        url,
        data=json.dumps(evento).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "X-Event-Checksum": evento["signature"]["checksum"],
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(peticion) as respuesta:
            return respuesta.status, respuesta.read().decode("utf-8")
    except urllib.error.HTTPError as error:
        return error.code, error.read().decode("utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("id_transaccion", type=int, help="Transacción a notificar")
    parser.add_argument(
        "--estado",
        default="APPROVED",
        choices=["APPROVED", "DECLINED", "VOIDED", "ERROR", "PENDING"],
        help="Estado que reportaría Wompi (por defecto APPROVED)",
    )
    parser.add_argument(
        "--monto-en-centavos",
        type=int,
        help="Fuerza un monto distinto al real, para probar la defensa contra manipulación",
    )
    parser.add_argument(
        "--firma-invalida",
        action="store_true",
        help="Envía un checksum incorrecto: el webhook debe responder 400 y no aplicar nada",
    )
    args = parser.parse_args()

    if not settings.WOMPI_EVENTS_SECRET:
        print("WOMPI_EVENTS_SECRET no está definido en .env: el backend rechazará cualquier firma.")
        return 1

    db = SessionLocal()
    try:
        transaccion = db.get(Transaccion, args.id_transaccion)
        if transaccion is None:
            print(f"No existe la transacción {args.id_transaccion}.")
            return 1
        if not transaccion.referencia_pasarela:
            print("La transacción no tiene referencia de pasarela: créala vía POST /transacciones.")
            return 1

        monto = args.monto_en_centavos or int(transaccion.monto_total * 100)
        print(f"Transacción {transaccion.id_transaccion} · obra {transaccion.id_obra}")
        print(f"  estado previo: {transaccion.estado_pago}")
        print(f"  referencia:    {transaccion.referencia_pasarela}")
        firma = "inválida (a propósito)" if args.firma_invalida else "válida"
        print(f"  enviando:      {args.estado} por {monto} centavos, firma {firma}")

        evento = construir_evento(
            transaccion.referencia_pasarela, args.estado, monto, firma_valida=not args.firma_invalida
        )
        codigo, cuerpo = enviar(evento)
        print(f"\nRespuesta del webhook: HTTP {codigo} {cuerpo}")

        # MySQL usa REPEATABLE READ: sin cerrar la transacción de lectura, esta
        # sesión seguiría viendo el snapshot anterior al commit del webhook.
        db.rollback()
        transaccion = db.get(Transaccion, args.id_transaccion)
        obra = db.get(ObraArte, transaccion.id_obra)
        print(f"  estado posterior: {transaccion.estado_pago}")
        print(f"  estado de la obra: {obra.estado_obra if obra else 'obra no encontrada'}")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
