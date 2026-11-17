import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import type { NivelIntensidad } from "./Ambiente";

export interface ColumnaProps {
  nivel?: NivelIntensidad;
  mostrarMarca?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Columna roja con cápsula negra `.vacio-capsula` para pantallas de Acceso (Nivel 3).
 * Porta `acceso.css` de la plantilla del portafolio.
 */
export function Columna({
  nivel = 3,
  mostrarMarca = false,
  children,
  className,
}: ColumnaProps) {
  if (nivel < 3) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={clsx("escena-columna-wrap", className)}>
      <div className="columna">
        <div className="vacio-capsula">
          {mostrarMarca && (
            <div className="cabeza-capsula">
              <Link
                to="/"
                className="inline-block font-[var(--fuente-poster)] text-[length:var(--text-etiqueta)] uppercase tracking-[0.14em] text-[color:var(--riel)] no-underline transition-colors duration-[var(--duracion-hover)] hover:text-white"
              >
                PIXEL &amp; LIENZO
              </Link>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

