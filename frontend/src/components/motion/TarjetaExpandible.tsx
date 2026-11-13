"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

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
            className="absolute inset-0 bg-[color:var(--velo-modal)] border-0 cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reducirMovimiento ? SIN_MOVIMIENTO : { duration: 0.2 }}
            onClick={cerrar}
          />

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-[var(--espacio-16)] sm:p-[var(--espacio-32)]">
            <motion.article
              layoutId={marco}
              transition={transicion}
              exit={{ opacity: 1, transition: transicion }}
              role="dialog"
              aria-modal="true"
              aria-labelledby={tituloId}
              className="pointer-events-auto grid max-h-[min(40rem,100%)] w-full max-w-3xl grid-cols-1 overflow-hidden border border-[color:var(--borde-reposo)] bg-[color:var(--fondo)] shadow-[var(--sombra-tarjeta)] sm:grid-cols-[0.9fr_1.1fr]"
            >
              <div className="flex items-center justify-center bg-[color:var(--vacio)] p-[var(--espacio-16)]">
                <motion.img
                  layoutId={imagen}
                  src={pieza.imagen}
                  alt={pieza.imagenAlt}
                  transition={transicion}
                  className="max-h-64 w-full object-contain sm:max-h-full"
                />
              </div>

              <div className="flex min-h-0 flex-col p-[var(--espacio-24)] sm:p-[var(--espacio-32)]">
                <div className="flex items-start justify-between gap-[var(--espacio-16)]">
                  <motion.p
                    layoutId={badge}
                    transition={transicion}
                    className="voz-etiqueta text-[color:var(--riel)]"
                  >
                    {pieza.tecnica}
                  </motion.p>
                  <button
                    ref={cerrarRef}
                    type="button"
                    onClick={cerrar}
                    className="enlace-acceso shrink-0 bg-transparent border-0 text-[length:var(--text-cuerpo-pequeno)] cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>

                <motion.h2
                  layoutId={titulo}
                  id={tituloId}
                  transition={transicion}
                  className="voz-h2 mt-[var(--espacio-12)] text-[color:var(--tinta)]"
                >
                  {pieza.titulo}
                </motion.h2>

                <motion.div
                  initial={reducirMovimiento ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={reducirMovimiento ? SIN_MOVIMIENTO : { ...MUELLE, delay: 0.06 }}
                >
                  <p className="voz-cursiva mt-[var(--espacio-12)] text-[color:var(--tinta-suave)]">
                    {pieza.artista} · {pieza.anio}
                  </p>
                  <p className="voz-cuerpo mt-[var(--espacio-16)] text-[color:var(--tinta-suave)]">
                    {pieza.descripcion}
                  </p>
                  <p className="precio-obra mt-[var(--espacio-24)] font-[var(--fuente-texto)] text-[length:var(--text-h3)] font-semibold text-[color:var(--tinta)]">
                    {pieza.precio}
                  </p>
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
          className="group block w-full overflow-hidden border border-[color:var(--borde-reposo)] bg-[color:var(--fondo)] text-left shadow-[var(--sombra-tarjeta)] hover:border-[color:var(--borde-hover)] cursor-pointer"
        >
          <div className="flex aspect-[4/5] w-full items-center justify-center bg-[color:var(--vacio)] p-[var(--espacio-12)]">
            <motion.img
              layoutId={imagen}
              src={pieza.imagen}
              alt={pieza.imagenAlt}
              transition={transicion}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="flex items-end justify-between gap-[var(--espacio-16)] border-t border-[color:var(--divisor)] p-[var(--espacio-24)]">
            <div>
              <motion.p
                layoutId={badge}
                transition={transicion}
                className="voz-etiqueta text-[color:var(--riel)]"
              >
                {pieza.tecnica}
              </motion.p>
              <motion.h3
                layoutId={titulo}
                transition={transicion}
                className="voz-h3 mt-[var(--espacio-4)] text-[color:var(--tinta)]"
              >
                {pieza.titulo}
              </motion.h3>
            </div>
            <span className="voz-etiqueta shrink-0 border border-[color:var(--borde-reposo)] px-[var(--espacio-12)] py-[var(--espacio-8)] text-[color:var(--tinta)]">
              Ver obra
            </span>
          </div>
        </motion.button>
      )}

      {portalListo ? createPortal(dialogo, document.body) : null}
    </div>
  );
}
