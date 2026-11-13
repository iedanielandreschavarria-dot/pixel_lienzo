import { Button } from "./Button";
import { EmptyState } from "./EmptyState";

export interface SectionErrorProps {
  recurso?: string;
  mensajePersonalizado?: string;
  onReintentar?: () => void;
  className?: string;
}

/**
 * 4.9 Error de sección:
 * Estado vacío con el icono "!" en ámbar, "No pudimos cargar [lo que corresponda]" y un botón "Reintentar".
 */
export function SectionError({
  recurso = "esta sección",
  mensajePersonalizado,
  onReintentar,
  className,
}: SectionErrorProps) {
  const titulo = mensajePersonalizado ?? `No pudimos cargar ${recurso}.`;

  return (
    <EmptyState
      className={className}
      titulo={titulo}
      descripcion="Inténtalo de nuevo en unos momentos."
      icono={
        <span className="inline-grid h-[var(--espacio-32)] w-[var(--espacio-32)] place-items-center rounded-[var(--radio-circulo)] border border-[color:var(--aviso)] font-[var(--fuente-poster)] text-[length:var(--text-h3)] leading-none text-[color:var(--aviso)]">
          !
        </span>
      }
      accion={
        onReintentar ? (
          <Button variante="secundario" onClick={onReintentar}>
            Reintentar
          </Button>
        ) : undefined
      }
    />
  );
}

