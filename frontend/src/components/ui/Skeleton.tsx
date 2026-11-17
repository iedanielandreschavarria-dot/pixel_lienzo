import clsx from "clsx";

/**
 * 4.9 Carga:
 * Esqueletos en rgba(242,236,227,.06) con pulso de opacidad de 2.4 s, sin brillo deslizante.
 * En página completa, una línea de 2 px en --riel avanza en el borde superior.
 * Nunca spinners grandes.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={clsx("esqueleto-pulso rounded-[var(--radio-recto)]", className)}
    />
  );
}

export function PageProgressBar({ etiqueta = "Cargando…" }: { etiqueta?: string }) {
  return (
    <div role="status" aria-live="polite" className="w-full">
      <div className="fixed inset-x-0 top-0 z-50 h-[2px] overflow-hidden bg-[color:var(--divisor)]">
        <div className="h-full w-2/3 bg-[color:var(--riel)] esqueleto-pulso" />
      </div>
      {etiqueta && <span className="sr-only">{etiqueta}</span>}
    </div>
  );
}

export function SkeletonCardGrid({ cantidad = 12 }: { cantidad?: number }) {
  return (
    <div className="rejilla-obras" role="status" aria-label="Cargando obras">
      {Array.from({ length: cantidad }).map((_, idx) => (
        <div
          key={idx}
          className="flex flex-col border border-[color:var(--divisor)] bg-[color:var(--fondo)]"
        >
          <Skeleton className="aspect-[4/5] w-full" />
          <div className="flex flex-col gap-[var(--espacio-8)] p-[var(--espacio-24)]">
            <Skeleton className="h-[var(--espacio-24)] w-3/4" />
            <Skeleton className="h-[var(--espacio-16)] w-1/2" />
            <Skeleton className="mt-[var(--espacio-8)] h-[var(--espacio-24)] w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

