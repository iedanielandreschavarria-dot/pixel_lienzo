import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { obtenerTransaccion } from "../api/transacciones";
import { obtenerObra, urlPreviewObra } from "../api/obras";
import { Spinner } from "../components/ui/Spinner";
import { Button } from "../components/ui/Button";
import { formatearMoneda } from "../lib/formato";

const INTERVALO_POLL_MS = 4000;
const MAX_INTENTOS = 30; // ~2 minutos, algunos medios de pago (PSE) tardan en confirmar

export function CheckoutResultadoPage() {
  const { idTransaccion } = useParams<{ idTransaccion: string }>();
  const id = Number(idTransaccion);
  const [intentos, setIntentos] = useState(0);

  const { data: transaccion, isLoading } = useQuery({
    queryKey: ["transaccion", id],
    queryFn: () => obtenerTransaccion(id),
    enabled: !Number.isNaN(id),
    refetchInterval: (query) => {
      const estado = query.state.data?.estado_pago;
      if (estado === "Procesando" && intentos < MAX_INTENTOS) return INTERVALO_POLL_MS;
      return false;
    },
  });

  const { data: obra } = useQuery({
    queryKey: ["obra", transaccion?.id_obra],
    queryFn: () => obtenerObra(transaccion!.id_obra),
    enabled: !!transaccion,
  });

  useEffect(() => {
    if (transaccion?.estado_pago === "Procesando") {
      const timer = setTimeout(() => setIntentos((n) => n + 1), INTERVALO_POLL_MS);
      return () => clearTimeout(timer);
    }
  }, [transaccion, intentos]);

  if (isLoading) return <Spinner etiqueta="Consultando el estado de tu pago…" />;
  if (!transaccion) {
    return (
      <div className="py-20 text-center text-terracota">
        No se encontró información de esta transacción.
      </div>
    );
  }

  const agotoIntentos = transaccion.estado_pago === "Procesando" && intentos >= MAX_INTENTOS;

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center sm:px-6">
      {transaccion.estado_pago === "Confirmado" || transaccion.estado_pago === "Dispersado" ? (
        <>
          <CheckCircle2 size={56} className="text-ocre" />
          <h1 className="mt-4 font-[var(--font-display)] text-3xl font-medium text-marfil">¡Pago confirmado!</h1>
          <p className="mt-2 text-marfil-suave">Tu compra fue procesada exitosamente. Pronto recibirás noticias sobre el envío.</p>
        </>
      ) : transaccion.estado_pago === "Rechazado" ? (
        <>
          <XCircle size={56} className="text-terracota" />
          <h1 className="mt-4 font-[var(--font-display)] text-3xl font-medium text-marfil">El pago no se completó</h1>
          <p className="mt-2 text-marfil-suave">La pasarela de pago rechazó o canceló la transacción. Puedes intentarlo de nuevo.</p>
        </>
      ) : (
        <>
          {agotoIntentos ? <Clock size={56} className="text-ocre" /> : <Spinner etiqueta="" />}
          <h1 className="mt-4 font-[var(--font-display)] text-3xl font-medium text-marfil">
            {agotoIntentos ? "Seguimos esperando confirmación" : "Confirmando tu pago…"}
          </h1>
          <p className="mt-2 text-marfil-suave">
            {agotoIntentos
              ? "Algunos medios de pago (como PSE) pueden tardar unos minutos en confirmarse. Revisa \"Mis compras\" más tarde."
              : "Estamos esperando la confirmación de Wompi. Esto puede tardar unos segundos."}
          </p>
        </>
      )}

      {obra && (
        <div className="mt-8 flex items-center gap-4 rounded-lg border border-antracita-suave bg-antracita p-4 text-left">
          <img src={urlPreviewObra(obra.id_obra)} alt={obra.titulo} className="h-16 w-16 rounded-md object-cover" />
          <div>
            <p className="font-medium text-marfil">{obra.titulo}</p>
            <p className="text-sm text-ocre">{formatearMoneda(transaccion.monto_total)}</p>
          </div>
        </div>
      )}

      <div className="mt-8 flex gap-3">
        <Link to="/mis-compras">
          <Button variante="contorno">Ir a mis compras</Button>
        </Link>
        {transaccion.estado_pago === "Rechazado" && obra && (
          <Link to={`/obras/${obra.id_obra}`}>
            <Button>Intentar de nuevo</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
