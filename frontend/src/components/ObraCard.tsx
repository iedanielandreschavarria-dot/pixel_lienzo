import { useState } from "react";
import { Link } from "react-router-dom";
import { urlPreviewObra } from "../api/obras";
import type { Obra } from "../types";
import { formatearMoneda } from "../lib/formato";
import { BadgeEstado } from "./ui/Badge";

export interface ObraCardProps {
  obra: Obra;
  nombreArtista?: string;
}

/**
 * 4.5 Tarjeta de obra:
 * Imagen 4:5, pie con título en H3 (máximo 2 líneas), artista en cursiva suave y precio como Dato.
 * Toda la tarjeta es un enlace. Hover: borde al 80 %, sin zoom ni desplazamiento.
 * Si la obra está vendida, el precio se reemplaza por "Adquirida" y aparece la etiqueta Vendida.
 * 3.6 Fidelidad: nunca se tiñe, recorta con velos ni se superpone texto sobre una obra.
 */
export function ObraCard({ obra, nombreArtista }: ObraCardProps) {
  const [errorImagen, setErrorImagen] = useState(false);
  const artistaTexto = nombreArtista ?? `Artista N.º ${obra.id_artista}`;
  const altTexto = `${obra.titulo}, de ${artistaTexto}, ${obra.tecnica}`;
  const vendida = obra.estado_obra === "Vendido";

  return (
    <Link
      to={`/obras/${obra.id_obra}`}
      className="group flex flex-col rounded-[var(--radio-recto)] border border-[color:var(--borde-reposo)] bg-[color:var(--fondo)] shadow-[var(--sombra-tarjeta)] transition-[border-color] duration-[var(--duracion-hover)] ease-[var(--curva-base)] hover:border-[color:var(--borde-hover)]"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden border-b border-[color:var(--borde-reposo)] bg-[color:var(--vacio)]">
        {!errorImagen && obra.fotografia_hd_url ? (
          <img
            src={urlPreviewObra(obra.id_obra)}
            alt={altTexto}
            loading="lazy"
            onError={() => setErrorImagen(true)}
            className="block h-full w-full object-cover object-center"
          />
        ) : (
          <div
            aria-hidden="true"
            className="h-full w-full"
            style={{
              background:
                "radial-gradient(circle at 50% 54%, var(--vacio) 0 24%, transparent 25%), linear-gradient(180deg, var(--profundidad), var(--carmesi))",
            }}
          />
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between gap-[var(--espacio-8)] p-[var(--espacio-16)] sm:p-[var(--espacio-24)]">
        <div>
          <h3 className="voz-h3 line-clamp-2 text-[color:var(--tinta)]">{obra.titulo}</h3>
          <p className="voz-cursiva mt-[var(--espacio-4)] text-[color:var(--tinta-suave)]">{artistaTexto}</p>
        </div>

        <div className="mt-[var(--espacio-8)] flex items-center justify-between gap-[var(--espacio-8)]">
          {vendida ? (
            <>
              <span className="voz-dato text-[color:var(--tinta-suave)]">Adquirida</span>
              <BadgeEstado estado="Vendida" />
            </>
          ) : (
            <span className="voz-dato text-[color:var(--tinta)]">{formatearMoneda(obra.precio_venta)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

