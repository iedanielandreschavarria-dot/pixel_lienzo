import { Link } from "react-router-dom";
import clsx from "clsx";

export interface ItemMiga {
  etiqueta: string;
  to?: string;
}

/**
 * 4.1 Migas de pan:
 * En Detalle de obra, Perfil de artista y paneles.
 * Anton de 1 rem en --tinta-suave, con "/" como separador.
 */
export function Breadcrumbs({
  items,
  className,
}: {
  items: ItemMiga[];
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Ruta de navegación" className={clsx("w-full", className)}>
      <ol className="flex flex-wrap items-center gap-[var(--espacio-8)] list-none p-0">
        {items.map((item, idx) => {
          const esUltimo = idx === items.length - 1;
          return (
            <li key={`${item.etiqueta}-${idx}`} className="inline-flex items-center gap-[var(--espacio-8)]">
              {item.to && !esUltimo ? (
                <Link
                  to={item.to}
                  className="voz-etiqueta text-[color:var(--tinta-suave)] hover:text-[color:var(--tinta)] no-underline"
                >
                  {item.etiqueta}
                </Link>
              ) : (
                <span
                  aria-current={esUltimo ? "page" : undefined}
                  className={clsx(
                    "voz-etiqueta",
                    esUltimo ? "text-[color:var(--tinta)]" : "text-[color:var(--tinta-suave)]"
                  )}
                >
                  {item.etiqueta}
                </span>
              )}
              {!esUltimo && (
                <span aria-hidden="true" className="voz-etiqueta text-[color:var(--tinta-suave)]">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

