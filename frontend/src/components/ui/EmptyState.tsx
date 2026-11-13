import type { ReactNode } from "react";
import clsx from "clsx";

export interface EmptyStateProps {
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
  icono?: ReactNode;
  className?: string;
}

/**
 * 4.9 Vacío:
 * Miniatura del disco de 96 px, título en H3, una línea de cuerpo y una acción opcional.
 */
export function EmptyState({
  titulo,
  descripcion,
  accion,
  icono,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        "mx-auto flex flex-col items-center justify-center gap-[var(--espacio-16)] py-[var(--espacio-48)] text-center",
        className
      )}
    >
      <div
        aria-hidden="true"
        className="grid h-[var(--miniatura-96)] w-[var(--miniatura-96)] place-items-center rounded-[var(--radio-circulo)] border border-[color:var(--borde-reposo)] bg-[color:var(--vacio)] shadow-[var(--resplandor-disco)]"
      >
        {icono}
      </div>

      <h3 className="voz-h3 text-[color:var(--tinta)]">{titulo}</h3>

      {descripcion && (
        <p className="voz-cuerpo text-[color:var(--tinta-suave)]">{descripcion}</p>
      )}

      {accion && <div className="mt-[var(--espacio-8)]">{accion}</div>}
    </div>
  );
}

