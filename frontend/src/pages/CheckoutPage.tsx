import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { obtenerObra, urlPreviewObra } from "../api/obras";
import { crearTransaccion, obtenerCheckoutWompi } from "../api/transacciones";
import { useAuth } from "../context/AuthContext";
import { Ambiente } from "../components/escena/Ambiente";
import { Banner } from "../components/ui/Banner";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { PageProgressBar, Skeleton } from "../components/ui/Skeleton";
import { formatearMoneda } from "../lib/formato";
import { NotFoundPage } from "./NotFoundPage";

export interface CheckoutPageProps {
  idObraProp?: number;
}

/**
 * 6.8 Checkout (Nivel 1 — máxima sobriedad):
 * Cabecera simplificada (marca y "Volver a la obra", sin menú global ni pie).
 * Dos columnas en escritorio:
 * - Izquierda (60 %): pasos en vertical numerados con Anton.
 * - Derecha (40 %, fija): miniatura de 96 px, título, artista, precio y total en H2.
 * Botón primario a ancho completo con el monto exacto: "Pagar $ 1.250.000 COP".
 * Móvil: barra inferior plegable con "Ver resumen".
 * Obra vendida durante el proceso: "Esta obra ya fue adquirida." con "Ver obras similares".
 */
export function CheckoutPage({ idObraProp }: CheckoutPageProps) {
  const { idObra: idParam } = useParams<{ idObra: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { user } = useAuth();

  const idObra = idObraProp ?? Number(idParam ?? searchParams.get("obra") ?? "0");
  const idTransaccionExistente = Number(searchParams.get("transaccion") ?? "0");

  const [procesando, setProcesando] = useState(false);
  const [errorPago, setErrorPago] = useState(false);
  const [resumenMovilAbierto, setResumenMovilAbierto] = useState(false);

  const {
    data: obra,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["obra", idObra],
    queryFn: () => obtenerObra(idObra),
    enabled: idObra > 0,
  });

  useEffect(() => {
    document.title = obra ? `Pago · ${obra.titulo} · Pixel & Lienzo` : "Pago · Pixel & Lienzo";
  }, [obra]);

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isLoading) {
    return (
      <div className="relative min-h-[calc(100vh-var(--alto-cabecera))] py-[var(--espacio-48)]">
        <PageProgressBar etiqueta="Cargando resumen de compra…" />
        <Ambiente nivel={1} />
        <div className="contenedor-pyl relative z-10 grid grid-cols-1 gap-[var(--espacio-48)] min-[1024px]:grid-cols-[3fr_2fr]">
          <div className="flex flex-col gap-[var(--espacio-24)]">
            <Skeleton className="h-[140px] w-full" />
            <Skeleton className="h-[180px] w-full" />
          </div>
          <Skeleton className="h-[260px] w-full" />
        </div>
      </div>
    );
  }

  if (isError || !obra || idObra <= 0) {
    return <NotFoundPage />;
  }

  // 6.8: Obra vendida durante el proceso -> pantalla de estado "Esta obra ya fue adquirida." con "Ver obras similares"
  if (obra.estado_obra === "Vendido") {
    return (
      <div className="relative flex min-h-[calc(100vh-var(--alto-cabecera))] items-center justify-center py-[var(--espacio-64)]">
        <Ambiente nivel={1} />
        <div className="contenedor-pyl relative z-10 max-w-[var(--contenedor-resultado)]">
          <EmptyState
            titulo="Esta obra ya fue adquirida."
            accion={
              <Link to={`/#coleccion?categoria=${obra.id_categoria}`}>
                <Button variante="secundario">Ver obras similares</Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const montoFormateado = formatearMoneda(obra.precio_venta);

  const confirmarYPagar = async () => {
    if (procesando) return;
    setProcesando(true);
    setErrorPago(false);
    try {
      if (idTransaccionExistente > 0) {
        const reintento = await obtenerCheckoutWompi(idTransaccionExistente);
        window.location.href = reintento.checkout_url;
        return;
      }
      const transaccion = await crearTransaccion(obra.id_obra);
      window.location.href = transaccion.checkout_url;
    } catch {
      setErrorPago(true);
      setProcesando(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-var(--alto-cabecera))] pb-[calc(var(--alto-barra-compra-movil)+var(--espacio-48))] pt-[var(--espacio-48)] min-[1024px]:pb-[var(--espacio-64)]">
      <Ambiente nivel={1} />

      <div className="contenedor-pyl relative z-10">
        {errorPago && (
          <div className="mb-[var(--espacio-24)]">
            <Banner variante="aviso">
              No pudimos procesar el pago. Revisa los datos e inténtalo de nuevo.
            </Banner>
          </div>
        )}

        <div className="grid grid-cols-1 gap-[var(--espacio-48)] min-[1024px]:grid-cols-[3fr_2fr] min-[1024px]:items-start">
          {/* Columna izquierda (60 %): pasos en vertical numerados con Anton */}
          <div className="flex flex-col gap-[var(--espacio-24)]">
            {/* Paso 1: Datos del comprador (resumen de sesión) */}
            <section
              aria-labelledby="checkout-paso-1"
              className="border border-[color:var(--divisor)] bg-[color:var(--fondo)] p-[var(--espacio-24)]"
            >
              <div className="flex items-center justify-between gap-[var(--espacio-16)]">
                <div className="flex items-center gap-[var(--espacio-12)]">
                  <span className="font-[var(--fuente-poster)] text-[length:var(--text-etiqueta)] uppercase tracking-[0.12em] text-[color:var(--riel)]">
                    01
                  </span>
                  <h1 id="checkout-paso-1" className="voz-h3 text-[color:var(--tinta)]">
                    Datos del comprador
                  </h1>
                </div>
              </div>

              <dl className="mt-[var(--espacio-16)] grid grid-cols-1 gap-[var(--espacio-12)] border-t border-[color:var(--divisor)] pt-[var(--espacio-16)] sm:grid-cols-2">
                <div>
                  <dt className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">Correo</dt>
                  <dd className="voz-cuerpo mt-[var(--espacio-4)] font-semibold text-[color:var(--tinta)]">
                    {user.correo_electronico}
                  </dd>
                </div>
                <div>
                  <dt className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">Rol de cuenta</dt>
                  <dd className="voz-cuerpo mt-[var(--espacio-4)] font-semibold text-[color:var(--tinta)]">
                    Coleccionista
                  </dd>
                </div>
              </dl>
            </section>

            {/* Paso 2: Pago */}
            <section
              aria-labelledby="checkout-paso-2"
              className="border border-[color:var(--borde-reposo)] bg-[color:var(--fondo)] p-[var(--espacio-24)]"
            >
              <div className="flex items-center gap-[var(--espacio-12)]">
                <span className="font-[var(--fuente-poster)] text-[length:var(--text-etiqueta)] uppercase tracking-[0.12em] text-[color:var(--riel)]">
                  02
                </span>
                <h2 id="checkout-paso-2" className="voz-h3 text-[color:var(--tinta)]">
                  Pago
                </h2>
              </div>

              <p className="voz-cuerpo mt-[var(--espacio-16)] text-[color:var(--tinta-suave)]">
                Al continuar serás redirigido de forma segura a la pasarela de pagos Wompi para completar la transacción.
              </p>

              <div className="mt-[var(--espacio-24)]">
                <Button
                  type="button"
                  variante="primario"
                  cargando={procesando}
                  disabled={procesando}
                  onClick={confirmarYPagar}
                  className="w-full"
                >
                  Pagar {montoFormateado}
                </Button>
              </div>
            </section>
          </div>

          {/* Columna derecha (40 %, fija en escritorio): miniatura de 96 px, título, artista, precio y total en H2 */}
          <aside
            aria-label="Resumen del pedido"
            className="border border-[color:var(--borde-reposo)] bg-[color:var(--fondo)] p-[var(--espacio-24)] min-[1024px]:sticky min-[1024px]:top-[calc(var(--alto-cabecera)+var(--espacio-24))]"
          >
            <div className="flex items-center gap-[var(--espacio-16)] pb-[var(--espacio-24)] border-b border-[color:var(--divisor)]">
              <div className="flex h-[var(--miniatura-lista)] w-[var(--miniatura-lista)] shrink-0 items-center justify-center border border-[color:var(--divisor)] bg-[color:var(--vacio)] p-[var(--espacio-8)]">
                <img
                  src={urlPreviewObra(obra.id_obra)}
                  alt={obra.titulo}
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="voz-h3 truncate text-[color:var(--tinta)]">{obra.titulo}</h3>
                <p className="voz-cursiva mt-[var(--espacio-4)] text-[color:var(--tinta-suave)]">
                  Artista N.º {obra.id_artista}
                </p>
                <p className="voz-cuerpo-pequeno mt-[var(--espacio-4)] text-[color:var(--tinta-suave)]">
                  {obra.tecnica} · {obra.dimensiones}
                </p>
              </div>
            </div>

            <dl className="mt-[var(--espacio-24)] flex flex-col gap-[var(--espacio-12)]">
              <div className="flex items-baseline justify-between gap-[var(--espacio-16)]">
                <dt className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">Precio de la obra</dt>
                <dd className="precio-obra voz-cuerpo-pequeno font-semibold text-[color:var(--tinta)]">
                  {montoFormateado}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-[var(--espacio-16)] border-t border-[color:var(--divisor)] pt-[var(--espacio-16)]">
                <dt className="voz-cuerpo font-semibold text-[color:var(--tinta)]">Total</dt>
                <dd className="voz-h2 precio-obra text-[color:var(--tinta)]">{montoFormateado}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>

      {/* Móvil: barra inferior plegable con el total siempre visible y "Ver resumen" */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--riel)] bg-[color:var(--fondo)] p-[var(--espacio-16)] min-[1024px]:hidden">
        {resumenMovilAbierto && (
          <div className="mb-[var(--espacio-16)] flex items-center gap-[var(--espacio-12)] border-b border-[color:var(--divisor)] pb-[var(--espacio-12)]">
            <div className="flex h-[var(--espacio-64)] w-[var(--espacio-64)] shrink-0 items-center justify-center border border-[color:var(--divisor)] bg-[color:var(--vacio)] p-[var(--espacio-4)]">
              <img
                src={urlPreviewObra(obra.id_obra)}
                alt={obra.titulo}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-[var(--fuente-titulo)] text-[length:var(--text-cuerpo)] font-black text-[color:var(--tinta)]">
                {obra.titulo}
              </p>
              <p className="voz-cursiva text-[length:var(--text-cuerpo-pequeno)] text-[color:var(--tinta-suave)]">
                Artista N.º {obra.id_artista}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-[var(--espacio-16)]">
          <div>
            <p className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">Total</p>
            <p className="precio-obra font-[var(--fuente-titulo)] text-[length:var(--text-h3)] font-black text-[color:var(--tinta)]">
              {montoFormateado}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setResumenMovilAbierto((v) => !v)}
            aria-expanded={resumenMovilAbierto}
            className="enlace-acceso bg-transparent border-0 p-0 text-[length:var(--text-cuerpo-pequeno)] cursor-pointer"
          >
            {resumenMovilAbierto ? "Ocultar resumen" : "Ver resumen"}
          </button>
        </div>
      </div>
    </div>
  );
}

