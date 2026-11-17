import { PageProgressBar, Skeleton } from "./Skeleton";

/**
 * 4.9 Carga:
 * "Nunca spinners grandes". Se reemplaza el spinner giratorio por una barra superior
 * de 2px en --riel y bloques de esqueleto en rgba(242,236,227,.06) con pulso de 2.4s.
 */
export function Spinner({ etiqueta = "Cargando…" }: { etiqueta?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-[var(--espacio-16)] py-[var(--espacio-32)]">
      <PageProgressBar etiqueta={etiqueta} />
      <Skeleton className="h-[var(--espacio-24)] w-1/3" />
      <Skeleton className="h-[var(--miniatura-96)] w-full" />
      {etiqueta && <p className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">{etiqueta}</p>}
    </div>
  );
}

