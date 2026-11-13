import { Link } from "react-router-dom";

export interface ArtistaCardProps {
  idArtista: number | string;
  nombre: string;
  disciplina: string;
  obrasPublicadas: number;
  fotoUrl?: string;
  href?: string;
}

/**
 * 4.5 Tarjeta de artista:
 * Imagen cuadrada 1:1, nombre en H3, disciplina en cursiva y número de obras publicadas.
 */
export function ArtistaCard({
  idArtista,
  nombre,
  disciplina,
  obrasPublicadas,
  fotoUrl,
  href,
}: ArtistaCardProps) {
  const destino = href ?? `/artistas/${idArtista}`;
  const iniciales = nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <Link
      to={destino}
      className="group flex flex-col rounded-[var(--radio-recto)] border border-[color:var(--borde-reposo)] bg-[color:var(--fondo)] shadow-[var(--sombra-tarjeta)] transition-[border-color] duration-[var(--duracion-hover)] ease-[var(--curva-base)] hover:border-[color:var(--borde-hover)]"
    >
      <div className="relative aspect-square w-full overflow-hidden border-b border-[color:var(--borde-reposo)] bg-[color:var(--vacio)]">
        {fotoUrl ? (
          <img
            src={fotoUrl}
            alt={`Retrato de ${nombre}, ${disciplina}`}
            loading="lazy"
            className="block h-full w-full object-cover object-center"
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
      </div>

      <div className="flex flex-1 flex-col justify-between gap-[var(--espacio-8)] p-[var(--espacio-16)] sm:p-[var(--espacio-24)]">
        <div>
          <h3 className="voz-h3 line-clamp-2 text-[color:var(--tinta)]">{nombre}</h3>
          <p className="voz-cursiva mt-[var(--espacio-4)] text-[color:var(--tinta-suave)]">{disciplina}</p>
        </div>

        <p className="voz-cuerpo-pequeno mt-[var(--espacio-8)] text-[color:var(--tinta-suave)]">
          {obrasPublicadas} {obrasPublicadas === 1 ? "obra publicada" : "obras publicadas"}
        </p>
      </div>
    </Link>
  );
}

