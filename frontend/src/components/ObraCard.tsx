import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { urlPreviewObra } from "../api/obras";
import type { Obra } from "../types";
import { formatearMoneda } from "../lib/formato";

const EnlaceObra = motion.create(Link);
const MUELLE = { type: "spring" as const, stiffness: 300, damping: 25 };

export function ObraCard({ obra }: { obra: Obra }) {
  const reducirMovimiento = useReducedMotion() === true;

  return (
    <EnlaceObra
      to={`/obras/${obra.id_obra}`}
      whileHover={reducirMovimiento ? undefined : { y: -2 }}
      whileTap={reducirMovimiento ? undefined : { scale: 0.97 }}
      transition={reducirMovimiento ? { duration: 0 } : MUELLE}
      className="group relative mb-6 block overflow-hidden bg-antracita focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocre"
    >
      <img
        src={urlPreviewObra(obra.id_obra)}
        alt={obra.titulo}
        loading="lazy"
        className="block w-full scale-100 object-cover opacity-95 transition-[transform,opacity] duration-700 ease-out group-hover:scale-[1.045] group-hover:opacity-100"
      />

      {/* Velo tenue permanente para que el título nunca se pierda contra
          fotografías muy claras; se intensifica al pasar el cursor para
          revelar el resto de los metadatos. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/25 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="absolute inset-x-0 bottom-0 p-5">
        {/* En pantallas táctiles (sin hover real) los metadatos quedan siempre
            visibles; el revelado diferido con transición solo aplica desde `sm`,
            donde sí hay un puntero para disparar :hover. */}
        <p className="text-[0.68rem] font-medium uppercase tracking-[0.16em] text-ocre transition-all duration-500 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
          {obra.tecnica}
        </p>
        <h3 className="mt-1 font-[var(--font-display)] text-xl leading-snug text-marfil drop-shadow-sm">
          {obra.titulo}
        </h3>
        <div className="mt-2 flex items-baseline justify-between gap-3 transition-all delay-75 duration-500 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
          <span className="text-xs text-marfil-suave">Artista N.º {obra.id_artista}</span>
          <span className="whitespace-nowrap text-sm font-semibold text-ocre">{formatearMoneda(obra.precio_venta)}</span>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 border border-transparent transition-colors duration-500 group-hover:border-ocre/25" />
    </EnlaceObra>
  );
}
