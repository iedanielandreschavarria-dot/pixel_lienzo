import clsx from "clsx";

/**
 * 4.9 Carga:
 * Esqueletos con superficie rgba(242, 236, 227, 0.04) y pulso de opacidad de 2.4 s.
 * En página completa, una línea de 2 px en --riel avanza en el borde superior.
 * Nunca spinners grandes.
 */
export function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      aria-hidden="true"
      style={style}
      className={clsx("esqueleto-pulso rounded-[var(--catalog-radius)]", className)}
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

const ASPECTOS_ESQUELETO = [
  "800 / 1000",
  "800 / 1066",
  "800 / 800",
  "960 / 768",
  "720 / 1040",
  "840 / 980",
] as const;

export function SkeletonCardGrid({ cantidad = 12 }: { cantidad?: number }) {
  return (
    <div
      className="catalogo__masonry"
      role="status"
      aria-label="Cargando obras"
    >
      {Array.from({ length: cantidad }).map((_, idx) => {
        const aspectRatio = ASPECTOS_ESQUELETO[idx % ASPECTOS_ESQUELETO.length];
        return (
          <div key={idx} className="obra-card">
            <Skeleton
              className="w-full"
              style={{
                aspectRatio,
                backgroundColor: "rgba(242, 236, 227, 0.04)",
              }}
            />
            <div className="obra__info">
              <Skeleton className="h-[22px] w-4/5" />
              <Skeleton className="mt-[6px] h-[16px] w-3/5" />
              <Skeleton className="mt-[4px] h-[14px] w-2/3" />
              <Skeleton className="mt-[4px] h-[14px] w-1/3" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
