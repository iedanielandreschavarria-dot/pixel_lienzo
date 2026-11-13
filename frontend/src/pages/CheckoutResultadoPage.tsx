import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Check, Clock } from "lucide-react";
import clsx from "clsx";
import { obtenerTransaccion } from "../api/transacciones";
import { obtenerObra, urlPreviewObra } from "../api/obras";
import { obtenerCertificado } from "../api/certificados";
import { useAuth } from "../context/AuthContext";
import { Ambiente } from "../components/escena/Ambiente";
import { Button } from "../components/ui/Button";
import { SelloCertificado } from "../components/ui/SelloCertificado";
import { PageProgressBar, Skeleton } from "../components/ui/Skeleton";
import { formatearFecha, formatearMoneda } from "../lib/formato";
import { NotFoundPage } from "./NotFoundPage";

const INTERVALO_POLL_MS = 4000;
const MAX_INTENTOS = 30;

/**
 * 6.9 Resultado de checkout (Nivel 1):
 * Contenido centrado de 640 px con icono de 48 px, H1, texto, resumen de la compra
 * (obra, monto, fecha y referencia), aviso "Enviamos el comprobante a [correo]." y acciones.
 * Si la referencia no existe, 404.
 * Cuando un pago pendiente pasa a aprobado, la página se actualiza sola y el sello aparece con
 * un fundido de 800 ms.
 */
export function CheckoutResultadoPage() {
  const { idTransaccion } = useParams<{ idTransaccion: string }>();
  const { user } = useAuth();
  const id = Number(idTransaccion);

  const [intentos, setIntentos] = useState(0);
  const [selloVisible, setSelloVisible] = useState(false);

  const {
    data: transaccion,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["transaccion", id],
    queryFn: () => obtenerTransaccion(id),
    enabled: !Number.isNaN(id) && id > 0,
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

  const esAprobado =
    transaccion?.estado_pago === "Confirmado" ||
    transaccion?.estado_pago === "Dispersado";

  const { data: certificado } = useQuery({
    queryKey: ["certificado", transaccion?.id_obra],
    queryFn: () => obtenerCertificado(transaccion!.id_obra),
    enabled: !!transaccion && esAprobado,
    retry: false,
  });

  useEffect(() => {
    if (transaccion?.estado_pago === "Procesando") {
      const timer = window.setTimeout(() => setIntentos((n) => n + 1), INTERVALO_POLL_MS);
      return () => window.clearTimeout(timer);
    }
  }, [transaccion, intentos]);

  // Único movimiento permitido: fundido de 800 ms del sello al aprobarse el pago
  useEffect(() => {
    if (!esAprobado) {
      setSelloVisible(false);
      return;
    }
    const timer = window.setTimeout(() => setSelloVisible(true), 40);
    return () => window.clearTimeout(timer);
  }, [esAprobado]);

  useEffect(() => {
    document.title = "Resultado del pago · Pixel & Lienzo";
  }, []);

  if (isLoading) {
    return (
      <div className="relative min-h-screen py-[var(--espacio-64)]">
        <PageProgressBar etiqueta="Consultando el estado de tu pago…" />
        <Ambiente nivel={1} />
        <div className="mx-auto flex max-w-[var(--contenedor-resultado)] flex-col items-center gap-[var(--espacio-24)] px-[var(--espacio-16)]">
          <Skeleton className="h-[var(--espacio-48)] w-[var(--espacio-48)] rounded-[var(--radio-circulo)]" />
          <Skeleton className="h-[var(--espacio-48)] w-2/3" />
          <Skeleton className="h-[var(--espacio-24)] w-3/4" />
          <Skeleton className="mt-[var(--espacio-16)] h-[220px] w-full" />
        </div>
      </div>
    );
  }

  if (isError || !transaccion || Number.isNaN(id) || id <= 0) {
    return <NotFoundPage />;
  }

  const esPendiente = transaccion.estado_pago === "Procesando";
  const esRechazado = !esAprobado && !esPendiente;

  const titulo = esAprobado
    ? "Pago aprobado"
    : esPendiente
      ? "Pago en proceso"
      : "El pago no se completó";

  const textoDescripcion = esAprobado
    ? certificado
      ? "Tu certificado de autenticidad ya está disponible."
      : "Estamos generando tu certificado. Te avisaremos por correo."
    : esPendiente
      ? "Estamos esperando la confirmación de tu banco. Esto puede tardar unos minutos."
      : "La pasarela de pago no completó la transacción. Puedes intentarlo de nuevo.";

  const referenciaTexto =
    transaccion.referencia_pasarela ?? `TX-${transaccion.id_transaccion}`;

  const destinoVerCertificado = certificado?.codigo_qr_validacion
    ? `/verificar/${certificado.codigo_qr_validacion}`
    : obra
      ? `/obras/${obra.id_obra}`
      : "/mis-compras";

  return (
    <div className="relative min-h-screen py-[var(--espacio-64)]">
      <Ambiente nivel={1} />

      <div className="relative z-10 mx-auto flex w-full max-w-[var(--contenedor-resultado)] flex-col items-center px-[var(--espacio-16)] text-center">
        {/* Icono de 48 px según variante */}
        {esAprobado ? (
          <Check
            size={48}
            strokeWidth={1.5}
            className="text-[color:var(--exito)]"
            aria-hidden="true"
          />
        ) : esPendiente ? (
          <Clock
            size={48}
            strokeWidth={1.5}
            className="text-[color:var(--tinta)]"
            aria-hidden="true"
          />
        ) : (
          <span
            aria-hidden="true"
            className="inline-grid h-[var(--espacio-48)] w-[var(--espacio-48)] place-items-center rounded-[var(--radio-circulo)] border border-[color:var(--aviso)] font-[var(--fuente-poster)] text-[length:var(--text-h2)] leading-none text-[color:var(--aviso)]"
          >
            !
          </span>
        )}

        <h1 className="voz-h1 mt-[var(--espacio-24)] text-[color:var(--tinta)]">
          {titulo}
        </h1>

        <p className="voz-cuerpo mt-[var(--espacio-12)] max-w-[var(--medida-lectura)] text-[color:var(--tinta-suave)]">
          {textoDescripcion}
        </p>

        {/* Sello de certificado con fundido de 800 ms al aprobarse el pago */}
        {esAprobado && (
          <div
            className={clsx(
              "mt-[var(--espacio-32)] transition-opacity duration-[var(--duracion-momento-min)] ease-[var(--curva-base)]",
              selloVisible ? "opacity-100" : "opacity-0"
            )}
          >
            <SelloCertificado
              etiqueta="CERTIFICADO"
              codigo={certificado?.codigo_qr_validacion ?? obra?.uid ?? referenciaTexto}
              valido
            />
          </div>
        )}

        {/* Resumen de la compra: obra, monto, fecha y referencia */}
        <section
          aria-label="Resumen de la compra"
          className="mt-[var(--espacio-32)] w-full border border-[color:var(--borde-reposo)] bg-[color:var(--fondo)] p-[var(--espacio-24)] text-left shadow-[var(--sombra-tarjeta)]"
        >
          {obra && (
            <div className="mb-[var(--espacio-24)] flex items-center gap-[var(--espacio-16)] border-b border-[color:var(--divisor)] pb-[var(--espacio-24)]">
              <div className="flex h-[var(--miniatura-lista)] w-[var(--miniatura-lista)] shrink-0 items-center justify-center border border-[color:var(--divisor)] bg-[color:var(--vacio)] p-[var(--espacio-8)]">
                <img
                  src={urlPreviewObra(obra.id_obra)}
                  alt={obra.titulo}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="voz-h3 truncate text-[color:var(--tinta)]">{obra.titulo}</h2>
                <p className="voz-cursiva mt-[var(--espacio-4)] text-[color:var(--tinta-suave)]">
                  Artista N.º {obra.id_artista}
                </p>
              </div>
            </div>
          )}

          <dl className="divide-y divide-[color:var(--divisor)]">
            <div className="flex items-baseline justify-between gap-[var(--espacio-16)] py-[var(--espacio-12)]">
              <dt className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">Monto</dt>
              <dd className="precio-obra voz-cuerpo font-semibold text-[color:var(--tinta)]">
                {formatearMoneda(transaccion.monto_total)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-[var(--espacio-16)] py-[var(--espacio-12)]">
              <dt className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">Fecha</dt>
              <dd className="voz-cuerpo-pequeno font-semibold text-[color:var(--tinta)]">
                {formatearFecha(transaccion.fecha_pago)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-[var(--espacio-16)] py-[var(--espacio-12)]">
              <dt className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">Referencia</dt>
              <dd className="codigo-certificado text-[length:var(--text-cuerpo-pequeno)] text-[color:var(--tinta)]">
                {referenciaTexto}
              </dd>
            </div>
          </dl>
        </section>

        {user?.correo_electronico && (
          <p className="voz-cuerpo-pequeno mt-[var(--espacio-16)] text-[color:var(--tinta-suave)]">
            Enviamos el comprobante a {user.correo_electronico}.
          </p>
        )}

        {/* Acciones según variante */}
        <div className="mt-[var(--espacio-32)] flex flex-wrap items-center justify-center gap-[var(--espacio-16)]">
          {esAprobado && (
            <>
              <Link to={destinoVerCertificado}>
                <Button variante="primario">Ver certificado</Button>
              </Link>
              <Link to="/mis-compras">
                <Button variante="secundario">Ir a mis compras</Button>
              </Link>
            </>
          )}

          {esPendiente && (
            <Link to="/mis-compras">
              <Button variante="primario">Ir a mis compras</Button>
            </Link>
          )}

          {esRechazado && (
            <>
              <Link
                to={
                  obra
                    ? `/obras/${obra.id_obra}?checkout=1&transaccion=${transaccion.id_transaccion}`
                    : "/mis-compras"
                }
              >
                <Button variante="primario">Intentar de nuevo</Button>
              </Link>
              <Link to={obra ? `/obras/${obra.id_obra}` : "/#coleccion"}>
                <Button variante="secundario">Volver a la obra</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
