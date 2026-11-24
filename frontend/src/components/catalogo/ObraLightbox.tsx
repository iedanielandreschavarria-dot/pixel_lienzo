import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Box, ChevronLeft, ChevronRight, Share2, ShieldCheck, ShoppingBag, X } from "lucide-react";
import { useCart } from "../../context/CartContext";
import {
  calcularDimensionesObra,
  obtenerSlugObra,
} from "../ObraCard";
import {
  esObraMuestraLocal,
  resolverNombreArtistaObra,
  resolverUrlImagenObra,
} from "../../lib/obrasMuestraPalacio";
import { Button } from "../ui/Button";
import { BadgeEstado } from "../ui/Badge";
import { formatearMoneda } from "../../lib/formato";
import { ObraVisor3DModal } from "./ObraVisor3DModal";
import type { Obra } from "../../types";

export interface ObraLightboxProps {
  obra: Obra | null;
  nombreArtista?: string;
  indiceActual: number;
  totalObras: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

/**
 * Lightbox interactivo del catálogo con sincronización de URL (?obra=<slug>):
 * - Backdrop rgba(0, 0, 0, 0.8)
 * - Imagen centrada sin recortar (object-fit: contain)
 * - Panel lateral en desktop / inferior en móvil con título, artista, técnica, dimensiones, precio y CTA píldora
 * - Accesibilidad WAI-ARIA: role="dialog", aria-modal="true", trampa de foco, cierre con Esc/backdrop,
 *   navegación con ArrowLeft / ArrowRight y bloqueo del scroll de fondo.
 */
export function ObraLightbox({
  obra,
  nombreArtista,
  indiceActual,
  totalObras,
  onClose,
  onPrev,
  onNext,
  triggerRef,
}: ObraLightboxProps) {
  const navigate = useNavigate();
  const { agregarObra, estaEnCarrito } = useCart();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const [errorImagen, setErrorImagen] = useState(false);
  const [imagenCargada, setImagenCargada] = useState(false);
  const [enlaceCopiado, setEnlaceCopiado] = useState(false);
  const [visor3DAbierto, setVisor3DAbierto] = useState(false);

  // Reiniciar estados visuales cuando cambia la obra activa en el Lightbox
  useEffect(() => {
    setErrorImagen(false);
    setImagenCargada(false);
    setEnlaceCopiado(false);
  }, [obra?.id_obra]);

  // Bloqueo de scroll del body y gestión del foco inicial + restauración al cerrar
  useEffect(() => {
    if (!obra) return;

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focoPrevio =
      triggerRef?.current ??
      (document.activeElement instanceof HTMLElement ? document.activeElement : null);

    const timerFoco = window.setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 20);

    return () => {
      window.clearTimeout(timerFoco);
      document.body.style.overflow = overflowPrevio;
      if (focoPrevio && typeof focoPrevio.focus === "function") {
        focoPrevio.focus();
      }
    };
  }, [Boolean(obra), triggerRef]);

  // Teclado: Esc para cerrar, ArrowLeft / ArrowRight para navegar, Tab para trampa de foco
  useEffect(() => {
    if (!obra) return;

    const manejarTeclado = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "ArrowLeft" && totalObras > 1) {
        e.preventDefault();
        onPrev();
        return;
      }

      if (e.key === "ArrowRight" && totalObras > 1) {
        e.preventDefault();
        onNext();
        return;
      }

      if (e.key === "Tab" && dialogRef.current) {
        const focusables = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusables.length === 0) return;
        const primero = focusables[0];
        const ultimo = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === primero) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primero.focus();
        }
      }
    };

    window.addEventListener("keydown", manejarTeclado);
    return () => window.removeEventListener("keydown", manejarTeclado);
  }, [obra, totalObras, onClose, onPrev, onNext]);

  if (!obra) return null;

  const artistaTexto = resolverNombreArtistaObra(obra, nombreArtista);
  const vendida = obra.estado_obra === "Vendido";
  const { width, height } = calcularDimensionesObra(obra);
  const slug = obtenerSlugObra(obra);
  const usarLienzoMuestra = esObraMuestraLocal(obra);

  const copiarEnlaceCompartible = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("obra", slug);
      await navigator.clipboard.writeText(url.toString());
      setEnlaceCopiado(true);
      window.setTimeout(() => setEnlaceCopiado(false), 2400);
    } catch {
      setEnlaceCopiado(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lightbox-obra-titulo"
      aria-describedby="lightbox-obra-ficha"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
    >
      <div
        ref={dialogRef}
        className="relative flex max-h-[92vh] w-[min(calc(100vw-24px),1160px)] flex-col overflow-hidden border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] shadow-[var(--sombra-modal)] min-[960px]:h-[min(86vh,780px)] min-[960px]:flex-row"
        style={{ borderRadius: "var(--catalog-radius)" }}
      >
        {/* Barra superior flotante con contador y botón de cierre */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
          {totalObras > 1 && (
            <span
              aria-live="polite"
              className="border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)]/95 px-3 py-1.5 font-[var(--fuente-texto)] text-[0.9rem] text-[color:var(--tinta-suave)]"
            >
              {indiceActual + 1} / {totalObras}
            </span>
          )}
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar vista ampliada (Esc)"
            className="inline-grid h-11 w-11 place-items-center border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)]/95 text-[color:var(--tinta)] transition-colors duration-200 hover:border-[color:var(--carmesi)] hover:text-[color:var(--carmesi)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--carmesi)] cursor-pointer"
          >
            <X size={22} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        {/* Escenario de imagen centrada sin recortar (object-fit: contain) */}
        <div
          className="relative flex min-h-[280px] flex-1 items-center justify-center overflow-hidden bg-[color:var(--vacio)] p-4 sm:p-8 min-[960px]:h-full"
        >
          {totalObras > 1 && (
            <button
              type="button"
              onClick={onPrev}
              aria-label="Obra anterior (Flecha izquierda)"
              className="absolute left-3 top-1/2 z-10 inline-grid h-11 w-11 -translate-y-1/2 place-items-center border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)]/90 text-[color:var(--tinta)] transition-colors duration-200 hover:border-[color:var(--carmesi)] hover:text-[color:var(--carmesi)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--carmesi)] cursor-pointer"
            >
              <ChevronLeft size={22} strokeWidth={1.5} aria-hidden="true" />
            </button>
          )}

          {!usarLienzoMuestra && !imagenCargada && !errorImagen && obra.fotografia_hd_url && (
            <div
              aria-hidden="true"
              className="esqueleto-pulso h-[65%] w-[65%] max-w-[460px]"
            />
          )}

          {!usarLienzoMuestra && !errorImagen && obra.fotografia_hd_url ? (
            <img
              src={resolverUrlImagenObra(obra, false)}
              alt={`${obra.titulo} — ${artistaTexto} (${obra.tecnica})`}
              width={width}
              height={height}
              decoding="async"
              onLoad={() => setImagenCargada(true)}
              onError={() => setErrorImagen(true)}
              className="max-h-[48vh] w-auto max-w-full object-contain transition-opacity duration-300 min-[960px]:max-h-[calc(86vh-64px)]"
              style={{ opacity: imagenCargada ? 1 : 0 }}
            />
          ) : (
            <img
              src={resolverUrlImagenObra(obra, true)}
              alt={`${obra.titulo} — ${artistaTexto} (${obra.tecnica})`}
              width={width}
              height={height}
              decoding="async"
              className="max-h-[48vh] w-auto max-w-full rounded-[var(--catalog-radius)] object-contain shadow-2xl min-[960px]:max-h-[calc(86vh-64px)]"
            />
          )}

          {totalObras > 1 && (
            <button
              type="button"
              onClick={onNext}
              aria-label="Obra siguiente (Flecha derecha)"
              className="absolute right-3 top-1/2 z-10 inline-grid h-11 w-11 -translate-y-1/2 place-items-center border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)]/90 text-[color:var(--tinta)] transition-colors duration-200 hover:border-[color:var(--carmesi)] hover:text-[color:var(--carmesi)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--carmesi)] cursor-pointer"
            >
              <ChevronRight size={22} strokeWidth={1.5} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Panel lateral en desktop / panel inferior en móvil */}
        <aside
          id="lightbox-obra-ficha"
          className="flex w-full flex-col justify-between gap-6 overflow-y-auto border-t border-[color:var(--divisor)] bg-[color:var(--superficie-elevada)] p-6 sm:p-8 min-[960px]:w-[380px] min-[960px]:shrink-0 min-[960px]:border-t-0 min-[960px]:border-l"
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="voz-etiqueta text-[color:var(--riel)]">Ficha curatorial</span>
              {obra.es_patrimonio_historico && (
                <span className="border border-[color:var(--borde-reposo)] bg-[color:var(--vacio)] px-2.5 py-0.5 font-[var(--fuente-texto)] text-[0.8rem] text-[color:var(--tinta)]">
                  Patrimonio Histórico
                </span>
              )}
              {vendida && <BadgeEstado estado="Vendida" />}
            </div>

            <div>
              <h2
                id="lightbox-obra-titulo"
                className="font-[var(--fuente-titulo)] text-[1.65rem] font-black leading-[1.12] text-[color:var(--tinta)]"
              >
                {obra.titulo}
              </h2>
              <p className="mt-1.5 font-[var(--fuente-texto)] text-[1.15rem] text-[color:var(--tinta-suave)]">
                <Link
                  to={`/artistas/${obra.id_artista}`}
                  onClick={onClose}
                  className="underline decoration-[color:var(--riel)] underline-offset-4 transition-colors hover:text-[color:var(--carmesi)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--carmesi)]"
                >
                  {artistaTexto}
                </Link>
              </p>
            </div>

            <div
              aria-hidden="true"
              className="h-[1px] w-full bg-[color:var(--divisor)]"
            />

            <dl className="grid grid-cols-1 gap-3 font-[var(--fuente-texto)] text-[1rem]">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-[color:var(--tinta-suave)]">Técnica</dt>
                <dd className="text-right font-medium text-[color:var(--tinta)]">{obra.tecnica}</dd>
              </div>

              {obra.dimensiones && (
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-[color:var(--tinta-suave)]">Dimensiones</dt>
                  <dd className="text-right font-medium text-[color:var(--tinta)]">{obra.dimensiones}</dd>
                </div>
              )}

              {obra.anio_creacion && (
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-[color:var(--tinta-suave)]">Año</dt>
                  <dd className="text-right font-medium text-[color:var(--tinta)]">{obra.anio_creacion}</dd>
                </div>
              )}

              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-[color:var(--tinta-suave)]">Certificado QR</dt>
                <dd className="codigo-certificado text-right text-[0.88rem] text-[color:var(--tinta-suave)]">
                  {obra.uid.slice(0, 13).toUpperCase()}
                </dd>
              </div>
            </dl>

            <div
              aria-hidden="true"
              className="h-[1px] w-full bg-[color:var(--divisor)]"
            />

            <div className="flex items-baseline justify-between gap-4">
              <span className="font-[var(--fuente-texto)] text-[1rem] text-[color:var(--tinta-suave)]">
                {vendida ? "Estado" : "Valor de adquisición"}
              </span>
              <span className="voz-dato text-[1.45rem] text-[color:var(--tinta)]">
                {vendida ? "Adquirida" : formatearMoneda(obra.precio_venta)}
              </span>
            </div>
          </div>

          {/* Acciones con botones principales en estilo píldora */}
          <div className="flex flex-col gap-3 pt-2">
            <Button
              type="button"
              variante="primario"
              onClick={() => navigate(`/obras/${obra.id_obra}`)}
              className="w-full"
            >
              {vendida ? "Ver ficha y certificado" : "Adquirir / Ver ficha completa"}
            </Button>

            <Button
              type="button"
              variante="secundario"
              onClick={() => setVisor3DAbierto(true)}
              className="w-full"
            >
              <Box size={17} strokeWidth={1.6} aria-hidden="true" />
              <span>Ver en 3D y escala real</span>
            </Button>

            {!vendida && obra.estado_obra === "Publicado" && (
              <Button
                type="button"
                variante="secundario"
                onClick={() => {
                  if (!estaEnCarrito(obra.id_obra)) {
                    agregarObra(obra);
                  }
                  onClose();
                  window.scrollTo({ top: 0, behavior: "auto" });
                  navigate("/carrito");
                }}
                className="w-full"
              >
                <ShoppingBag size={17} strokeWidth={1.6} aria-hidden="true" />
                <span>{estaEnCarrito(obra.id_obra) ? "Ver en tu carrito" : "Agregar al carrito"}</span>
              </Button>
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variante="secundario"
                onClick={() => navigate(`/verificar/${obra.uid}`)}
                className="flex-1 text-[0.95rem]"
              >
                <ShieldCheck size={17} strokeWidth={1.5} aria-hidden="true" />
                <span>Certificado</span>
              </Button>

              <Button
                type="button"
                variante="secundario"
                onClick={() => {
                  void copiarEnlaceCompartible();
                }}
                className="flex-1 text-[0.95rem]"
              >
                <Share2 size={17} strokeWidth={1.5} aria-hidden="true" />
                <span>{enlaceCopiado ? "Copiado" : "Compartir"}</span>
              </Button>
            </div>
          </div>
        </aside>
      </div>
      <ObraVisor3DModal
        obra={obra}
        nombreArtista={artistaTexto}
        abierto={visor3DAbierto}
        onCerrar={() => setVisor3DAbierto(false)}
      />
    </div>
  );
}

