import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, MoreHorizontal } from "lucide-react";
import clsx from "clsx";

export interface AccionFila<T> {
  etiqueta: string;
  onClick: (fila: T) => void;
}

export interface ColumnaTabla<T> {
  id: string;
  encabezado: string;
  alineacion?: "izquierda" | "derecha";
  ordenable?: boolean;
  valorOrden?: (fila: T) => string | number;
  render: (fila: T) => ReactNode;
}

export interface TableProps<T> {
  columnas: ColumnaTabla<T>[];
  datos: T[];
  obtenerClave: (fila: T) => string | number;
  acciones?: (fila: T) => AccionFila<T>[];
  className?: string;
}

function MenuAccionesExtra<T>({ fila, acciones }: { fila: T; acciones: AccionFila<T>[] }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label="Más acciones"
        aria-expanded={abierto}
        className="inline-grid h-[var(--alto-control-compacto)] w-[var(--alto-control-compacto)] place-items-center rounded-[var(--radio-pildora)] border border-[color:var(--riel)] bg-transparent text-[color:var(--tinta)] hover:border-white cursor-pointer"
      >
        <MoreHorizontal size={20} strokeWidth={1.5} aria-hidden="true" />
      </button>

      {abierto && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-[var(--espacio-4)] min-w-[160px] rounded-[var(--radio-recto)] border border-[color:var(--riel)] bg-[color:var(--fondo)] py-[var(--espacio-4)] shadow-[var(--sombra-tarjeta)]"
        >
          {acciones.map((acc) => (
            <button
              key={acc.etiqueta}
              type="button"
              role="menuitem"
              onClick={() => {
                setAbierto(false);
                acc.onClick(fila);
              }}
              className="block w-full bg-transparent px-[var(--espacio-16)] py-[var(--espacio-8)] text-left font-[var(--fuente-texto)] text-[length:var(--text-cuerpo-pequeno)] text-[color:var(--tinta)] hover:bg-[color:var(--fila-hover)] border-0 cursor-pointer"
            >
              {acc.etiqueta}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 4.6 Tablas y listas:
 * Encabezado en Anton de 1 rem y --tinta-suave. Filas separadas por divisores del 12 %.
 * Hover de fila: rgba(147,37,18,.18). Cifras alineadas a la derecha.
 * Columnas ordenables con un chevron. Acciones por fila al extremo derecho: máximo 2 visibles y el resto en un menú.
 * En móvil cada fila se convierte en una tarjeta con pares de etiqueta y valor.
 */
export function Table<T>({
  columnas,
  datos,
  obtenerClave,
  acciones,
  className,
}: TableProps<T>) {
  const [ordenId, setOrdenId] = useState<string | null>(null);
  const [direccion, setDireccion] = useState<"asc" | "desc">("asc");

  const alternarOrden = (colId: string) => {
    if (ordenId === colId) {
      setDireccion((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setOrdenId(colId);
      setDireccion("asc");
    }
  };

  const datosOrdenados = (() => {
    if (!ordenId) return datos;
    const col = columnas.find((c) => c.id === ordenId);
    if (!col?.valorOrden) return datos;
    return [...datos].sort((a, b) => {
      const va = col.valorOrden!(a);
      const vb = col.valorOrden!(b);
      if (va < vb) return direccion === "asc" ? -1 : 1;
      if (va > vb) return direccion === "asc" ? 1 : -1;
      return 0;
    });
  })();

  return (
    <div className={clsx("w-full", className)}>
      {/* Vista de escritorio (>= 600px) */}
      <div className="hidden overflow-x-auto border border-[color:var(--borde-reposo)] bg-[color:var(--fondo)] min-[600px]:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[color:var(--divisor)]">
              {columnas.map((col) => {
                const activa = ordenId === col.id;
                return (
                  <th
                    key={col.id}
                    scope="col"
                    className={clsx(
                      "voz-etiqueta px-[var(--espacio-16)] py-[var(--espacio-16)] text-[color:var(--tinta-suave)]",
                      col.alineacion === "derecha" && "text-right"
                    )}
                  >
                    {col.ordenable ? (
                      <button
                        type="button"
                        onClick={() => alternarOrden(col.id)}
                        className={clsx(
                          "inline-flex items-center gap-[var(--espacio-4)] bg-transparent border-0 p-0 font-inherit uppercase tracking-inherit text-inherit hover:text-[color:var(--tinta)] cursor-pointer",
                          col.alineacion === "derecha" && "ml-auto"
                        )}
                      >
                        <span>{col.encabezado}</span>
                        {activa && direccion === "desc" ? (
                          <ChevronUp size={16} strokeWidth={1.5} aria-hidden="true" />
                        ) : (
                          <ChevronDown size={16} strokeWidth={1.5} aria-hidden="true" />
                        )}
                      </button>
                    ) : (
                      col.encabezado
                    )}
                  </th>
                );
              })}
              {acciones && (
                <th
                  scope="col"
                  className="voz-etiqueta px-[var(--espacio-16)] py-[var(--espacio-16)] text-right text-[color:var(--tinta-suave)]"
                >
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--divisor)]">
            {datosOrdenados.map((fila) => {
              const listaAcciones = acciones ? acciones(fila) : [];
              const visibles = listaAcciones.slice(0, 2);
              const extras = listaAcciones.slice(2);

              return (
                <tr
                  key={obtenerClave(fila)}
                  className="transition-colors duration-[var(--duracion-hover)] hover:bg-[color:var(--fila-hover)]"
                >
                  {columnas.map((col) => (
                    <td
                      key={col.id}
                      className={clsx(
                        "px-[var(--espacio-16)] py-[var(--espacio-16)] font-[var(--fuente-texto)] text-[length:var(--text-dato)] text-[color:var(--tinta)]",
                        col.alineacion === "derecha" && "voz-dato text-right"
                      )}
                    >
                      {col.render(fila)}
                    </td>
                  ))}
                  {acciones && (
                    <td className="px-[var(--espacio-16)] py-[var(--espacio-16)] text-right">
                      <div className="inline-flex items-center justify-end gap-[var(--espacio-12)]">
                        {visibles.map((acc) => (
                          <button
                            key={acc.etiqueta}
                            type="button"
                            onClick={() => acc.onClick(fila)}
                            className="bg-transparent border-0 border-b border-[color:var(--borde-terciario)] pb-[var(--espacio-4)] font-[var(--fuente-texto)] font-semibold text-[length:var(--text-cuerpo-pequeno)] text-[color:var(--tinta)] hover:border-white cursor-pointer"
                          >
                            {acc.etiqueta}
                          </button>
                        ))}
                        {extras.length > 0 && <MenuAccionesExtra fila={fila} acciones={extras} />}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Vista móvil (< 600px): cada fila se convierte en una tarjeta con pares de etiqueta y valor */}
      <div className="flex flex-col gap-[var(--espacio-16)] min-[600px]:hidden">
        {datosOrdenados.map((fila) => {
          const listaAcciones = acciones ? acciones(fila) : [];
          return (
            <div
              key={obtenerClave(fila)}
              className="flex flex-col gap-[var(--espacio-12)] rounded-[var(--radio-recto)] border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-16)]"
            >
              <dl className="flex flex-col gap-[var(--espacio-8)]">
                {columnas.map((col) => (
                  <div
                    key={col.id}
                    className="flex items-baseline justify-between gap-[var(--espacio-12)] border-b border-[color:var(--divisor)] pb-[var(--espacio-8)] last:border-b-0 last:pb-0"
                  >
                    <dt className="voz-etiqueta text-[color:var(--tinta-suave)]">{col.encabezado}</dt>
                    <dd className="voz-dato text-right text-[color:var(--tinta)]">{col.render(fila)}</dd>
                  </div>
                ))}
              </dl>
              {listaAcciones.length > 0 && (
                <div className="flex flex-wrap justify-end gap-[var(--espacio-12)] pt-[var(--espacio-8)]">
                  {listaAcciones.map((acc) => (
                    <button
                      key={acc.etiqueta}
                      type="button"
                      onClick={() => acc.onClick(fila)}
                      className="bg-transparent border-0 border-b border-[color:var(--borde-terciario)] pb-[var(--espacio-4)] font-[var(--fuente-texto)] font-semibold text-[length:var(--text-cuerpo-pequeno)] text-[color:var(--tinta)] hover:border-white cursor-pointer"
                    >
                      {acc.etiqueta}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

