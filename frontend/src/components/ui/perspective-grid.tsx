import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";

interface PerspectiveGridProps {
  className?: string;
  /** Casillas por lado. 40 es el valor del diseño original. */
  gridSize?: number;
  showOverlay?: boolean;
  fadeRadius?: number;
  /** Suelo de la sala: un plano lineal casi invisible, sin interacción. */
  suelo?: boolean;
}

function SueloSala({ className }: { className?: string }) {
  return (
    <div className={clsx("pointer-events-none overflow-hidden", className)} aria-hidden>
      <div
        className="absolute inset-x-[-8%] bottom-0 h-[42%] origin-bottom"
        style={{
          opacity: 0.4,
          backgroundImage:
            "linear-gradient(to right, var(--divisor) 1px, transparent 1px), linear-gradient(to bottom, var(--divisor) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          transform: "perspective(900px) rotateX(62deg)",
          maskImage: "linear-gradient(to top, var(--vacio), transparent 80%)",
          WebkitMaskImage: "linear-gradient(to top, var(--vacio), transparent 80%)",
        }}
      />
    </div>
  );
}

function RejillaDensa({
  className,
  gridSize,
  showOverlay,
  fadeRadius,
}: Required<Pick<PerspectiveGridProps, "gridSize" | "showOverlay" | "fadeRadius">> &
  Pick<PerspectiveGridProps, "className">) {
  const [montada, setMontada] = useState(false);

  useEffect(() => {
    setMontada(true);
  }, []);

  const casillas = useMemo(() => Array.from({ length: gridSize * gridSize }), [gridSize]);

  return (
    <div
      className={clsx(
        "relative h-full w-full overflow-hidden bg-[color:var(--fondo)] [--fade-stop:var(--fondo)]",
        className,
      )}
      style={{
        perspective: "2000px",
        transformStyle: "preserve-3d",
      }}
    >
      <div
        className="absolute grid aspect-square w-[80rem] origin-center"
        style={{
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%) rotateX(30deg) rotateY(-5deg) rotateZ(20deg) scale(2)",
          transformStyle: "preserve-3d",
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`,
        }}
      >
        {montada &&
          casillas.map((_, i) => (
            <div
              key={i}
              className="min-h-px min-w-px border border-[color:var(--divisor)] bg-transparent transition-colors duration-[1500ms] hover:border-[color:var(--riel)] hover:bg-[color:var(--fila-hover)] hover:duration-0"
            />
          ))}
      </div>

      {showOverlay && (
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background: `radial-gradient(circle, transparent 25%, var(--fade-stop) ${fadeRadius}%)`,
          }}
        />
      )}
    </div>
  );
}

/**
 * Cuadrícula en perspectiva. Con `suelo` queda un plano lineal tenue,
 * detrás del texto y de las obras.
 */
export function PerspectiveGrid({
  className,
  gridSize = 40,
  showOverlay = true,
  fadeRadius = 80,
  suelo = false,
}: PerspectiveGridProps) {
  if (suelo) return <SueloSala className={className} />;
  return (
    <RejillaDensa
      className={className}
      gridSize={gridSize}
      showOverlay={showOverlay}
      fadeRadius={fadeRadius}
    />
  );
}
