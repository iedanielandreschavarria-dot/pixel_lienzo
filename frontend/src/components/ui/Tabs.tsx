import clsx from "clsx";

export interface ItemPestana<T extends string = string> {
  id: T;
  etiqueta: string;
  conteo?: number;
}

export interface TabsProps<T extends string = string> {
  items: ItemPestana<T>[];
  activa: T;
  onChange: (id: NoInfer<T>) => void;
  ariaLabel?: string;
  className?: string;
}

/**
 * 6.5 / 6.10 / 6.11 / 6.14 Pestañas:
 * Las pestañas van en Anton, con subrayado de 2 px en --riel para la activa.
 */
export function Tabs<T extends string = string>({
  items,
  activa,
  onChange,
  ariaLabel = "Secciones",
  className,
}: TabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={clsx(
        "flex flex-wrap items-center gap-[var(--espacio-24)] border-b border-[color:var(--divisor)]",
        className
      )}
    >
      {items.map((item) => {
        const esActiva = item.id === activa;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={esActiva}
            onClick={() => onChange(item.id)}
            className={clsx(
              "relative -mb-px inline-flex min-h-[var(--alto-control)] items-center gap-[var(--espacio-8)] border-0 border-b-2 bg-transparent px-[var(--espacio-8)] py-[var(--espacio-12)] font-[var(--fuente-poster)] text-[length:var(--text-etiqueta)] uppercase tracking-[0.12em] transition-colors duration-[var(--duracion-hover)] ease-[var(--curva-base)] cursor-pointer",
              esActiva
                ? "border-b-[color:var(--riel)] text-[color:var(--tinta)]"
                : "border-b-transparent text-[color:var(--tinta-suave)] hover:text-[color:var(--tinta)]"
            )}
          >
            <span>{item.etiqueta}</span>
            {item.conteo !== undefined && (
              <span className="voz-dato text-[color:var(--tinta-suave)]">({item.conteo})</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

