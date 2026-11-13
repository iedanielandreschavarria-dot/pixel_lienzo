import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";

export interface PaginationProps {
  paginaActual: number;
  totalPaginas: number;
  onChange: (pagina: number) => void;
  className?: string;
}

/**
 * 4.6, 6.3, 6.5, 6.10 Paginación numerada:
 * 20 filas por página en tablas, 24 en catálogo/artistas, 10 en mis compras.
 */
export function Pagination({
  paginaActual,
  totalPaginas,
  onChange,
  className,
}: PaginationProps) {
  if (totalPaginas <= 1) return null;

  const paginas = Array.from({ length: totalPaginas }, (_, i) => i + 1);

  return (
    <nav
      aria-label="Paginación"
      className={clsx("flex flex-wrap items-center justify-center gap-[var(--espacio-8)]", className)}
    >
      <button
        type="button"
        disabled={paginaActual <= 1}
        onClick={() => onChange(paginaActual - 1)}
        aria-label="Página anterior"
        className="inline-grid h-[var(--area-tactil-min)] w-[var(--area-tactil-min)] place-items-center rounded-[var(--radio-pildora)] border border-[color:var(--riel)] bg-transparent text-[color:var(--tinta)] hover:border-white disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
      >
        <ChevronLeft size={20} strokeWidth={1.5} aria-hidden="true" />
      </button>

      {paginas.map((num) => {
        const activa = num === paginaActual;
        return (
          <button
            key={num}
            type="button"
            aria-current={activa ? "page" : undefined}
            onClick={() => onChange(num)}
            className={clsx(
              "inline-grid h-[var(--area-tactil-min)] min-w-[var(--area-tactil-min)] place-items-center rounded-[var(--radio-pildora)] border px-[var(--espacio-12)] font-[var(--fuente-texto)] font-semibold text-[length:var(--text-dato)] transition-colors duration-[var(--duracion-hover)] cursor-pointer",
              activa
                ? "border-[color:var(--riel)] bg-[color:var(--carmesi)] text-[color:var(--tinta)]"
                : "border-[color:var(--borde-reposo)] bg-transparent text-[color:var(--tinta-suave)] hover:border-white hover:text-[color:var(--tinta)]"
            )}
          >
            {num}
          </button>
        );
      })}

      <button
        type="button"
        disabled={paginaActual >= totalPaginas}
        onClick={() => onChange(paginaActual + 1)}
        aria-label="Página siguiente"
        className="inline-grid h-[var(--area-tactil-min)] w-[var(--area-tactil-min)] place-items-center rounded-[var(--radio-pildora)] border border-[color:var(--riel)] bg-transparent text-[color:var(--tinta)] hover:border-white disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
      >
        <ChevronRight size={20} strokeWidth={1.5} aria-hidden="true" />
      </button>
    </nav>
  );
}

