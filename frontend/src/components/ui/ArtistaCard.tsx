import { Link } from "react-router-dom";
import { Star } from "lucide-react";

export interface ArtistaCardProps {
  idArtista: number | string;
  nombre: string;
  disciplina: string;
  obrasPublicadas: number;
  fotoUrl?: string;
  href?: string;
  promedioEstrellas?: number;
  totalResenas?: number;
  comentarioDestacado?: string;
  salaPalacio?: string;
}

/**
 * Tarjeta de artista enriquecida con retrato/obra representativa, nombre,
 * disciplina, calificación promedio con estrellas doradas, conteo de reseñas
 * y extracto de reseña destacada.
 */
export function ArtistaCard({
  idArtista,
  nombre,
  disciplina,
  obrasPublicadas,
  fotoUrl,
  href,
  promedioEstrellas = 5.0,
  totalResenas = 2,
  comentarioDestacado,
  salaPalacio,
}: ArtistaCardProps) {
  const destino = href ?? `/artistas/${idArtista}`;
  const iniciales = nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  const estrellasRedondeadas = Math.round(promedioEstrellas);

  return (
    <Link
      to={destino}
      className="group flex flex-col rounded-[var(--catalog-radius)] border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] no-underline shadow-[var(--sombra-tarjeta)] transition-all duration-[var(--duracion-hover)] ease-[var(--curva-base)] hover:-translate-y-1 hover:border-[color:var(--borde-hover)]"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-t-[var(--catalog-radius)] border-b border-[color:var(--borde-reposo)] bg-[color:var(--vacio)]">
        {fotoUrl ? (
          <img
            src={fotoUrl}
            alt={`Obra representativa de ${nombre}, ${disciplina}`}
            loading="lazy"
            className="block h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            aria-hidden="true"
            className="grid h-full w-full place-items-center"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, var(--vacio) 0 32%, transparent 33%), linear-gradient(180deg, var(--profundidad), var(--carmesi))",
            }}
          >
            <span className="voz-etiqueta text-[length:var(--text-h2)] text-[color:var(--tinta)]">
              {iniciales || "A"}
            </span>
          </div>
        )}

        {/* Insignia flotante de calificación con estrellas en la esquina superior derecha */}
        <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-[var(--radio-pildora)] border border-[color:var(--riel)] bg-[#181614]/90 px-3 py-1 backdrop-blur-xs shadow-md">
          <Star size={14} className="fill-[#e6b050] text-[#e6b050]" aria-hidden="true" />
          <span className="font-[var(--fuente-texto)] text-[0.92rem] font-bold text-[color:var(--tinta)]">
            {promedioEstrellas.toFixed(1)}
          </span>
          <span className="font-[var(--fuente-texto)] text-[0.82rem] text-[color:var(--tinta-suave)]">
            ({totalResenas})
          </span>
        </div>

        {salaPalacio && (
          <div className="absolute bottom-2.5 left-2.5 rounded-xs border border-[color:var(--borde-reposo)] bg-[#181614]/88 px-2.5 py-0.5 font-[var(--fuente-poster)] text-[0.72rem] uppercase tracking-[0.1em] text-[color:var(--riel)]">
            {salaPalacio}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between gap-[var(--espacio-12)] p-[var(--espacio-16)] sm:p-[var(--espacio-24)]">
        <div>
          <h3 className="voz-h3 line-clamp-2 text-[color:var(--tinta)] group-hover:text-[color:var(--riel)] transition-colors">
            {nombre}
          </h3>
          <p className="voz-cursiva mt-[var(--espacio-4)] text-[color:var(--tinta-suave)]">
            {disciplina}
          </p>

          {/* Fila de 5 estrellas con conteo de reseñas */}
          <div className="mt-2.5 flex items-center gap-2">
            <div className="flex items-center gap-0.5" aria-label={`Calificación: ${promedioEstrellas} de 5 estrellas`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  size={15}
                  className={
                    n <= estrellasRedondeadas
                      ? "fill-[#e6b050] text-[#e6b050]"
                      : "fill-transparent text-[color:var(--tinta-suave)]/45"
                  }
                />
              ))}
            </div>
            <span className="font-[var(--fuente-texto)] text-[0.92rem] text-[color:var(--tinta-suave)]">
              {totalResenas} {totalResenas === 1 ? "reseña" : "reseñas"}
            </span>
          </div>

          {comentarioDestacado && (
            <p className="mt-3 line-clamp-2 border-l-2 border-[color:var(--riel)]/60 pl-2.5 font-[var(--fuente-texto)] text-[0.95rem] italic text-[color:var(--tinta-suave)]">
              “{comentarioDestacado}”
            </p>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[color:var(--divisor)] pt-3">
          <span className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">
            {obrasPublicadas} {obrasPublicadas === 1 ? "obra publicada" : "obras publicadas"}
          </span>
          <span className="font-[var(--fuente-texto)] text-[0.95rem] font-semibold text-[color:var(--riel)] group-hover:underline">
            Ver obras y reseñas →
          </span>
        </div>
      </div>
    </Link>
  );
}
