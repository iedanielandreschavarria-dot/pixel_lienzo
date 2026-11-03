"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/** Muelle pedido para el morph: rápido al arrancar y sin rebote largo. */
const MUELLE = { type: "spring" as const, stiffness: 300, damping: 25 };
const SIN_MOVIMIENTO = { duration: 0 };

export interface PiezaTarjeta {
  id: string;
  titulo: string;
  tecnica: string;
  imagen: string;
  imagenAlt: string;
  artista: string;
  precio: string;
  anio: string;
  descripcion: string;
}

/**
 * Tarjeta que se expande a un diálogo centrado.
 * El mismo `layoutId` en la vista previa y en el modal hace que Framer Motion
 * interpole posición y tamaño (continuidad visual) en lugar de un fade suelto.
 * `"use client"` la deja lista para el App Router de Next.js.
 */
export function TarjetaExpandible({ pieza }: { pieza: PiezaTarjeta }) {
  const [abierta, setAbierta] = useState(false);
  const [portalListo, setPortalListo] = useState(false);
  const reducirMovimiento = useReducedMotion();
  const transicion = reducirMovimiento ? SIN_MOVIMIENTO : MUELLE;
  const tituloId = useId();
  const cerrarRef = useRef<HTMLButtonElement>(null);
  const marco = `marco-${pieza.id}`;
  const imagen = `imagen-${pieza.id}`;
  const badge = `badge-${pieza.id}`;
  const titulo = `titulo-${pieza.id}`;

  useEffect(() => {
    setPortalListo(true);
  }, []);

  useEffect(() => {
    if (!abierta) return;

    const alPulsarTecla = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setAbierta(false);
    };

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", alPulsarTecla);
    cerrarRef.current?.focus();

    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", alPulsarTecla);
    };
  }, [abierta]);

  const cerrar = () => setAbierta(false);

  const dialogo = (
    <AnimatePresence>
      {abierta && (
        <motion.div key="capa" className="fixed inset-0 z-50" role="presentation">
          <motion.button
            type="button"
            aria-label="Cerrar detalles"
            className="absolute inset-0 bg-carbon/80 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reducirMovimiento ? SIN_MOVIMIENTO : { duration: 0.2 }}
            onClick={cerrar}
          />

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4 sm:p-8">
            <motion.article
              layoutId={marco}
              transition={transicion}
              exit={{ opacity: 1, transition: transicion }}
              role="dialog"
              aria-modal="true"
              aria-labelledby={tituloId}
              className="pointer-events-auto grid max-h-[min(40rem,100%)] w-full max-w-3xl grid-cols-1 overflow-hidden bg-antracita shadow-[0_30px_80px_-20px_rgba(0,0,0,0.75)] sm:grid-cols-[0.9fr_1.1fr]"
            >
              <motion.img
                layoutId={imagen}
                src={pieza.imagen}
                alt=""
                transition={transicion}
                className="h-56 w-full object-cover sm:h-full"
              />

              <div className="flex min-h-0 flex-col p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <motion.p
                    layoutId={badge}
                    transition={transicion}
                    className="text-[0.68rem] font-medium uppercase tracking-[0.16em] text-ocre"
                  >
                    {pieza.tecnica}
                  </motion.p>
                  <button
                    ref={cerrarRef}
                    type="button"
                    onClick={cerrar}
                    className="shrink-0 text-xs uppercase tracking-[0.14em] text-marfil-suave hover:text-ocre"
                  >
                    Cerrar
                  </button>
                </div>

                <motion.h2
                  layoutId={titulo}
                  id={tituloId}
                  transition={transicion}
                  className="mt-3 font-[var(--font-display)] text-3xl leading-tight text-marfil sm:text-4xl"
                >
                  {pieza.titulo}
                </motion.h2>

                <motion.div
                  initial={reducirMovimiento ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={reducirMovimiento ? SIN_MOVIMIENTO : { ...MUELLE, delay: 0.06 }}
                >
                  <p className="mt-3 text-sm text-marfil-suave">
                    {pieza.artista}
                    <span className="mx-2 text-antracita-suave">/</span>
                    {pieza.anio}
                  </p>
                  <p className="mt-5 text-sm leading-relaxed text-marfil-suave">{pieza.descripcion}</p>
                  <p className="mt-6 font-[var(--font-display)] text-2xl text-ocre">{pieza.precio}</p>
                </motion.div>
              </div>
            </motion.article>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="w-full max-w-sm">
      {abierta ? (
        <div className="invisible" aria-hidden>
          <div className="aspect-[4/5] w-full" />
          <div className="flex items-end justify-between gap-4 p-5">
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.16em]">{pieza.tecnica}</p>
              <h3 className="mt-1 font-[var(--font-display)] text-2xl leading-tight">{pieza.titulo}</h3>
            </div>
            <span className="shrink-0 px-3 py-2 text-[0.65rem] uppercase">Ver detalles</span>
          </div>
        </div>
      ) : (
        <motion.button
          type="button"
          layoutId={marco}
          transition={transicion}
          onClick={() => setAbierta(true)}
          aria-haspopup="dialog"
          aria-expanded={false}
          aria-label={`Ver detalles de ${pieza.titulo}`}
          whileHover={reducirMovimiento ? undefined : { y: -4 }}
          whileTap={reducirMovimiento ? undefined : { scale: 0.98 }}
          className="group block w-full overflow-hidden bg-antracita text-left"
        >
          <motion.img
            layoutId={imagen}
            src={pieza.imagen}
            alt={pieza.imagenAlt}
            transition={transicion}
            className="aspect-[4/5] w-full object-cover"
          />
          <div className="flex items-end justify-between gap-4 p-5">
            <div>
              <motion.p
                layoutId={badge}
                transition={transicion}
                className="text-[0.68rem] font-medium uppercase tracking-[0.16em] text-ocre"
              >
                {pieza.tecnica}
              </motion.p>
              <motion.h3
                layoutId={titulo}
                transition={transicion}
                className="mt-1 font-[var(--font-display)] text-2xl leading-tight text-marfil"
              >
                {pieza.titulo}
              </motion.h3>
            </div>
            <span className="shrink-0 border border-ocre/40 px-3 py-2 text-[0.65rem] uppercase tracking-[0.14em] text-ocre transition-colors group-hover:border-ocre group-hover:bg-ocre group-hover:text-carbon">
              Ver detalles
            </span>
          </div>
        </motion.button>
      )}

      {portalListo ? createPortal(dialogo, document.body) : null}
    </div>
  );
}
