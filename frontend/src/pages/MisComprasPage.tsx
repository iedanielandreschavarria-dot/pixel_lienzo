import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listarMisTransacciones, obtenerCheckoutWompi } from "../api/transacciones";
import { obtenerObra, urlPreviewObra } from "../api/obras";
import { BadgeEstadoPago } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { formatearFecha, formatearMoneda } from "../lib/formato";
import { useToast } from "../context/ToastContext";
import { obtenerMensajeError } from "../api/client";
import type { Transaccion } from "../types";

function FilaTransaccion({ transaccion }: { transaccion: Transaccion }) {
  const { notificar } = useToast();
  const [continuando, setContinuando] = useState(false);
  const { data: obra } = useQuery({
    queryKey: ["obra", transaccion.id_obra],
    queryFn: () => obtenerObra(transaccion.id_obra),
  });

  const continuarPago = async () => {
    setContinuando(true);
    try {
      const { checkout_url } = await obtenerCheckoutWompi(transaccion.id_transaccion);
      window.location.href = checkout_url;
    } catch (error) {
      notificar(obtenerMensajeError(error, "No fue posible continuar el pago"), "error");
      setContinuando(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-antracita-suave bg-antracita p-4 sm:flex-row sm:items-center">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-carbon">
        {obra && <img src={urlPreviewObra(obra.id_obra)} alt={obra.titulo} className="h-full w-full object-cover" />}
      </div>
      <div className="flex-1">
        <p className="font-[var(--font-display)] text-lg text-marfil">{obra?.titulo ?? `Obra #${transaccion.id_obra}`}</p>
        <p className="text-xs text-marfil-suave/70">{formatearFecha(transaccion.fecha_pago)}</p>
        <p className="mt-1 text-sm font-semibold text-ocre">{formatearMoneda(transaccion.monto_total)}</p>
      </div>
      <div className="flex flex-col items-start gap-2 sm:items-end">
        <BadgeEstadoPago estado={transaccion.estado_pago} />
        {transaccion.estado_pago === "Procesando" && (
          <Button variante="contorno" onClick={continuarPago} cargando={continuando} className="!px-4 !py-1.5 text-xs">
            Continuar pago
          </Button>
        )}
        {transaccion.estado_pago === "Rechazado" && obra && (
          <Link to={`/obras/${obra.id_obra}`} className="text-xs font-medium text-ocre hover:underline">
            Intentar de nuevo
          </Link>
        )}
      </div>
    </div>
  );
}

export function MisComprasPage() {
  const { data: transacciones, isLoading, isError } = useQuery({
    queryKey: ["mis-transacciones"],
    queryFn: listarMisTransacciones,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-[var(--font-display)] text-3xl font-medium text-marfil">Mis compras</h1>

      {isLoading && <Spinner etiqueta="Cargando tus compras…" />}
      {isError && <p className="mt-6 text-terracota">No fue posible cargar tu historial de compras.</p>}
      {transacciones && transacciones.length === 0 && (
        <div className="mt-10 text-center text-marfil-suave">
          <p>Todavía no has realizado ninguna compra.</p>
          <Link to="/" className="mt-2 inline-block text-ocre underline">
            Explorar el catálogo
          </Link>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-4">
        {transacciones
          ?.slice()
          .sort((a, b) => new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime())
          .map((t) => <FilaTransaccion key={t.id_transaccion} transaccion={t} />)}
      </div>
    </div>
  );
}
