import type { ReactNode } from "react";

interface PanelShellProps {
  eyebrow: string;
  titulo: string;
  descripcion?: string;
  acciones?: ReactNode;
  children: ReactNode;
}

/** Encabezado común de los paneles internos (Artista, Curador): mantiene la
 * misma jerarquía tipográfica del catálogo para que las vistas de trabajo no
 * se sientan como una aplicación distinta. */
export function PanelShell({ eyebrow, titulo, descripcion, acciones, children }: PanelShellProps) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-14 sm:px-10">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-antracita-suave/60 pb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ocre">{eyebrow}</p>
          <h1 className="mt-3 font-[var(--font-display)] text-4xl font-medium leading-tight text-marfil">
            {titulo}
          </h1>
          {descripcion && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-marfil-suave">{descripcion}</p>
          )}
        </div>
        {acciones && <div className="flex flex-wrap items-center gap-3">{acciones}</div>}
      </div>
      <div className="mt-10">{children}</div>
    </div>
  );
}
