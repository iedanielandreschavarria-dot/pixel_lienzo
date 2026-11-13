import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listarMisTransacciones, obtenerCheckoutWompi } from "../api/transacciones";
import { obtenerObra, urlPreviewObra } from "../api/obras";
import { obtenerPerfilArtista } from "../api/artistas";
import { obtenerCertificado } from "../api/certificados";
import { obtenerMensajeError } from "../api/client";
import { Ambiente } from "../components/escena/Ambiente";
import { BadgeEstadoPago } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { CompraCard } from "../components/ui/CompraCard";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { Pagination } from "../components/ui/Pagination";
import { SectionError } from "../components/ui/SectionError";
import { SelloCertificado } from "../components/ui/SelloCertificado";
import { Skeleton } from "../components/ui/Skeleton";
import { Tabs, type ItemPestana } from "../components/ui/Tabs";
import { useToast } from "../context/ToastContext";
import { formatearFecha, formatearMoneda } from "../lib/formato";
import type { Certificado, Obra, Transaccion } from "../types";

type PestanaCompras = "todas" | "aprobadas" | "pendientes";

const COMPRAS_POR_PAGINA = 10;

export interface DetalleCompraSeleccionada {
  transaccion: Transaccion;
  obra?: Obra;
  nombreArtista: string;
  certificado?: Certificado | null;
}

function obtenerMetodoPagoEnmascarado(referencia: string | null): string {
  if (!referencia) return "Pasarela Wompi";
  const soloDigitos = referencia.replace(/\D/g, "");
  if (soloDigitos.length >= 4) {
    return `Terminada en •••• ${soloDigitos.slice(-4)}`;
  }
  return "Pasarela Wompi";
}

function ItemCompra({
  transaccion,
  onAbrirDetalle,
}: {
  transaccion: Transaccion;
  onAbrirDetalle: (detalle: DetalleCompraSeleccionada) => void;
}) {
  const { notificar } = useToast();
  const [continuando, setContinuando] = useState(false);

  const aprobada =
    transaccion.estado_pago === "Confirmado" || transaccion.estado_pago === "Dispersado";

  const { data: obra } = useQuery({
    queryKey: ["obra", transaccion.id_obra],
    queryFn: () => obtenerObra(transaccion.id_obra),
  });

  const { data: perfilArtista } = useQuery({
    queryKey: ["artista", obra?.id_artista],
    queryFn: () => obtenerPerfilArtista(obra!.id_artista),
    enabled: Boolean(obra?.id_artista),
  });

  const { data: certificado } = useQuery({
    queryKey: ["certificado-obra", transaccion.id_obra],
    queryFn: () => obtenerCertificado(transaccion.id_obra),
    enabled: aprobada,
    retry: false,
  });

  const nombreArtista = useMemo(() => {
    if (perfilArtista) {
      return `Artista N.º ${perfilArtista.id_artista}`;
    }
    if (obra?.id_artista) {
      return `Artista N.º ${obra.id_artista}`;
    }
    return "Artista del catálogo";
  }, [perfilArtista, obra]);

  const sello = certificado?.codigo_qr_validacion ?? obra?.codigo_qr_obra ?? null;

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

  const abrirModal = () => {
    onAbrirDetalle({
      transaccion,
      obra,
      nombreArtista,
      certificado: certificado ?? null,
    });
  };

  return (
    <CompraCard
      idTransaccion={transaccion.id_transaccion}
      idObra={transaccion.id_obra}
      titulo={obra?.titulo ?? `Obra #${transaccion.id_obra}`}
      artista={nombreArtista}
      fechaIso={transaccion.fecha_pago}
      precio={transaccion.monto_total}
      estado={transaccion.estado_pago}
      imagenUrl={obra ? urlPreviewObra(obra.id_obra) : undefined}
      certificadoUrl={certificado?.pdf_certificado_url}
      selloVerificacion={sello}
      onVerCertificado={aprobada ? abrirModal : undefined}
      onVerComprobante={abrirModal}
      onContinuarPago={transaccion.estado_pago === "Procesando" ? continuarPago : undefined}
      continuandoPago={continuando}
    />
  );
}

/**
 * 6.10 Mis compras
 * Nivel 1 — Funcional.
 * H1 "Mis compras", pestañas "Todas", "Aprobadas" y "Pendientes",
 * lista de tarjetas de compra según 4.5, ordenadas por fecha descendente, 10 por página.
 */
export function MisComprasPage() {
  const { notificar } = useToast();
  const [pestana, setPestana] = useState<PestanaCompras>("todas");
  const [pagina, setPagina] = useState(1);
  const [detalleActivo, setDetalleActivo] = useState<DetalleCompraSeleccionada | null>(null);

  const {
    data: transacciones,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["mis-transacciones"],
    queryFn: listarMisTransacciones,
  });

  const transaccionesOrdenadas = useMemo(() => {
    if (!transacciones) return [];
    return transacciones
      .slice()
      .sort((a, b) => new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime());
  }, [transacciones]);

  const conteos = useMemo(() => {
    let aprobadas = 0;
    let pendientes = 0;
    for (const tx of transaccionesOrdenadas) {
      if (tx.estado_pago === "Confirmado" || tx.estado_pago === "Dispersado") {
        aprobadas += 1;
      } else if (tx.estado_pago === "Procesando") {
        pendientes += 1;
      }
    }
    return {
      todas: transaccionesOrdenadas.length,
      aprobadas,
      pendientes,
    };
  }, [transaccionesOrdenadas]);

  const itemsPestanas: ItemPestana<PestanaCompras>[] = [
    { id: "todas", etiqueta: "Todas", conteo: conteos.todas },
    { id: "aprobadas", etiqueta: "Aprobadas", conteo: conteos.aprobadas },
    { id: "pendientes", etiqueta: "Pendientes", conteo: conteos.pendientes },
  ];

  const transaccionesFiltradas = useMemo(() => {
    if (pestana === "aprobadas") {
      return transaccionesOrdenadas.filter(
        (tx) => tx.estado_pago === "Confirmado" || tx.estado_pago === "Dispersado"
      );
    }
    if (pestana === "pendientes") {
      return transaccionesOrdenadas.filter((tx) => tx.estado_pago === "Procesando");
    }
    return transaccionesOrdenadas;
  }, [transaccionesOrdenadas, pestana]);

  const totalPaginas = Math.max(1, Math.ceil(transaccionesFiltradas.length / COMPRAS_POR_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);

  const transaccionesPaginadas = useMemo(() => {
    const inicio = (paginaSegura - 1) * COMPRAS_POR_PAGINA;
    return transaccionesFiltradas.slice(inicio, inicio + COMPRAS_POR_PAGINA);
  }, [transaccionesFiltradas, paginaSegura]);

  const cambiarPestana = (nueva: PestanaCompras) => {
    setPestana(nueva);
    setPagina(1);
  };

  const copiarEnlaceVerificacion = async (codigo: string) => {
    const url = `${window.location.origin}/verificar/${encodeURIComponent(codigo)}`;
    try {
      await navigator.clipboard.writeText(url);
      notificar("Enlace copiado al portapapeles", "exito");
    } catch {
      notificar("No pudimos copiar el enlace automáticamente", "error");
    }
  };

  const detalleAprobado =
    detalleActivo?.transaccion.estado_pago === "Confirmado" ||
    detalleActivo?.transaccion.estado_pago === "Dispersado";

  const codigoCertificadoDetalle =
    detalleActivo?.certificado?.codigo_qr_validacion ??
    detalleActivo?.obra?.codigo_qr_obra ??
    (detalleActivo ? `CERT-${detalleActivo.transaccion.id_obra}-${detalleActivo.transaccion.id_transaccion}` : "");

  return (
    <div className="relative min-h-[calc(100vh-var(--alto-cabecera))]">
      <Ambiente nivel={1} />

      <div className="relative z-10 mx-auto max-w-[var(--contenedor-max)] px-[var(--espacio-16)] py-[var(--espacio-48)] sm:px-[var(--espacio-24)]">
        {/* Cabecera */}
        <header className="mb-[var(--espacio-32)]">
          <h1 className="voz-h1 text-[color:var(--tinta)]">Mis compras</h1>
          <div className="regla-titulo mt-[var(--espacio-12)]" aria-hidden="true" />
        </header>

        {/* Pestañas */}
        <Tabs
          items={itemsPestanas}
          activa={pestana}
          onChange={cambiarPestana}
          ariaLabel="Filtrar compras por estado"
          className="mb-[var(--espacio-32)]"
        />

        {/* Estado de carga: 3 esqueletos */}
        {isLoading && (
          <div className="flex flex-col gap-[var(--espacio-16)]" role="status" aria-label="Cargando compras">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between gap-[var(--espacio-16)] border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)] sm:flex-row sm:items-center"
              >
                <div className="flex items-start gap-[var(--espacio-16)]">
                  <Skeleton className="h-[var(--miniatura-96)] w-[var(--miniatura-96)] shrink-0" />
                  <div className="flex flex-col gap-[var(--espacio-8)]">
                    <Skeleton className="h-[var(--espacio-24)] w-48" />
                    <Skeleton className="h-[var(--espacio-16)] w-32" />
                    <Skeleton className="h-[var(--espacio-16)] w-24" />
                    <Skeleton className="h-[var(--espacio-20)] w-36" />
                  </div>
                </div>
                <div className="flex flex-col items-start gap-[var(--espacio-12)] sm:items-end">
                  <Skeleton className="h-[var(--espacio-24)] w-28" />
                  <div className="flex gap-[var(--espacio-8)]">
                    <Skeleton className="h-[var(--alto-control)] w-32" />
                    <Skeleton className="h-[var(--alto-control)] w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Estado de error */}
        {isError && !isLoading && (
          <SectionError
            recurso="tus compras"
            onReintentar={() => {
              void refetch();
            }}
          />
        )}

        {/* Estado vacío global */}
        {!isLoading && !isError && transaccionesOrdenadas.length === 0 && (
          <EmptyState
            titulo="Aún no tienes compras."
            descripcion="Explora las obras disponibles en el catálogo y adquiere piezas con certificado verificable."
            accion={
              <Link to="/?vista=catalogo">
                <Button variante="primario">Explorar obras</Button>
              </Link>
            }
          />
        )}

        {/* Estado vacío en pestaña filtrada */}
        {!isLoading &&
          !isError &&
          transaccionesOrdenadas.length > 0 &&
          transaccionesFiltradas.length === 0 && (
            <EmptyState
              titulo={
                pestana === "aprobadas"
                  ? "No tienes compras aprobadas."
                  : "No tienes compras pendientes."
              }
              accion={
                <Button variante="secundario" onClick={() => cambiarPestana("todas")}>
                  Ver todas las compras
                </Button>
              }
            />
          )}

        {/* Lista de tarjetas de compra */}
        {!isLoading && !isError && transaccionesPaginadas.length > 0 && (
          <div className="flex flex-col gap-[var(--espacio-16)]">
            {transaccionesPaginadas.map((tx) => (
              <ItemCompra
                key={tx.id_transaccion}
                transaccion={tx}
                onAbrirDetalle={setDetalleActivo}
              />
            ))}

            <Pagination
              paginaActual={paginaSegura}
              totalPaginas={totalPaginas}
              onChange={(nuevaPagina) => {
                setPagina(nuevaPagina);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="mt-[var(--espacio-24)]"
            />
          </div>
        )}
      </div>

      {/* Modal de detalle de compra y certificado */}
      <Modal
        abierto={Boolean(detalleActivo)}
        onCerrar={() => setDetalleActivo(null)}
        titulo={detalleActivo?.obra?.titulo ?? "Detalle de la compra"}
        descripcion={detalleActivo ? `Artista: ${detalleActivo.nombreArtista}` : undefined}
      >
        {detalleActivo && (
          <div className="flex flex-col gap-[var(--espacio-24)]">
            {/* Resumen de la compra */}
            <dl className="flex flex-col gap-[var(--espacio-12)] border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-16)]">
              <div className="flex items-center justify-between gap-[var(--espacio-12)]">
                <dt className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">Estado</dt>
                <dd>
                  <BadgeEstadoPago estado={detalleActivo.transaccion.estado_pago} />
                </dd>
              </div>
              <div className="flex items-center justify-between gap-[var(--espacio-12)]">
                <dt className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">Referencia</dt>
                <dd className="codigo-certificado text-[length:var(--text-cuerpo-pequeno)] text-[color:var(--tinta)]">
                  {detalleActivo.transaccion.referencia_pasarela ??
                    `TX-${detalleActivo.transaccion.id_transaccion}`}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-[var(--espacio-12)]">
                <dt className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">Fecha</dt>
                <dd className="voz-dato text-[color:var(--tinta)]">
                  {formatearFecha(detalleActivo.transaccion.fecha_pago)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-[var(--espacio-12)]">
                <dt className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">Método de pago</dt>
                <dd className="voz-cuerpo-pequeno text-[color:var(--tinta)]">
                  {obtenerMetodoPagoEnmascarado(detalleActivo.transaccion.referencia_pasarela)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-[var(--espacio-12)] border-t border-[color:var(--divisor)] pt-[var(--espacio-12)]">
                <dt className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">Monto total</dt>
                <dd className="voz-dato text-[color:var(--tinta)]">
                  {formatearMoneda(detalleActivo.transaccion.monto_total)}
                </dd>
              </div>
            </dl>

            {/* Nota si está pendiente */}
            {detalleActivo.transaccion.estado_pago === "Procesando" && (
              <p className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">
                Actualizaremos este estado cuando el banco confirme.
              </p>
            )}

            {/* Bloque de certificado (solo en compras aprobadas) */}
            {detalleAprobado && (
              <div className="flex flex-col items-center gap-[var(--espacio-16)] border border-[color:var(--borde-reposo)] bg-[color:var(--vacio)] p-[var(--espacio-24)] text-center">
                <SelloCertificado
                  etiqueta="CERTIFICADO"
                  codigo={codigoCertificadoDetalle}
                  valido
                />
                <div className="flex flex-col gap-[var(--espacio-4)]">
                  <span className="voz-etiqueta text-[color:var(--tinta-suave)]">
                    Código de verificación
                  </span>
                  <span className="codigo-certificado break-all text-[length:var(--text-cuerpo-pequeno)] text-[color:var(--tinta)]">
                    {codigoCertificadoDetalle}
                  </span>
                </div>

                <div className="flex w-full flex-col gap-[var(--espacio-12)] sm:flex-row sm:justify-center">
                  {detalleActivo.certificado?.pdf_certificado_url ? (
                    <a
                      href={detalleActivo.certificado.pdf_certificado_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button variante="primario" tamano="compacto">
                        Descargar certificado
                      </Button>
                    </a>
                  ) : (
                    <Link to={`/verificar/${encodeURIComponent(codigoCertificadoDetalle)}`}>
                      <Button variante="primario" tamano="compacto">
                        Descargar certificado
                      </Button>
                    </Link>
                  )}

                  <Button
                    variante="secundario"
                    tamano="compacto"
                    onClick={() => void copiarEnlaceVerificacion(codigoCertificadoDetalle)}
                  >
                    Copiar enlace de verificación
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-[var(--espacio-12)]">
              <Link to={`/obras/${detalleActivo.transaccion.id_obra}`}>
                <Button variante="terciario">Ver obra</Button>
              </Link>
              <Button variante="secundario" onClick={() => setDetalleActivo(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
