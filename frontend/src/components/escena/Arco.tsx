import clsx from "clsx";
import type { NivelIntensidad } from "./Ambiente";

export interface ArcoProps {
  /** El arco solo existe en Nivel 3 (sección 2). Si nivel < 3, no renderiza nada. */
  nivel?: NivelIntensidad;
  className?: string;
}

/**
 * Arco rojo con textura de impresión, rieles laterales y hueco circular superior.
 * Porta `arco.css` de la plantilla del portafolio.
 */
export function Arco({ nivel = 3, className }: ArcoProps) {
  if (nivel < 3) return null;

  return (
    <div className={clsx("arco", className)} aria-hidden="true">
      <div className="riel riel--izq" />
      <div className="riel riel--der" />
      <div className="arco__hueco" />
    </div>
  );
}

