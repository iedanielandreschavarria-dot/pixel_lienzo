import type { ReactNode } from "react";
import clsx from "clsx";
import type { NivelIntensidad } from "./Ambiente";

export type VarianteDisco = "escena" | "error";

export interface DiscoProps {
  nivel?: NivelIntensidad;
  variante?: VarianteDisco;
  titulo: string;
  subtitulo?: string;
  cambiando?: boolean;
  onTituloClick?: () => void;
  children?: ReactNode;
  className?: string;
}

/**
 * Disco negro central.
 * - `variante="escena"` (Nivel 3, Inicio): acompaña el scroll con `aria-live="polite"`.
 * - `variante="error"` (Nivel 3, 404/403): disco centrado de `min(60vmin, 420px)` según 6.17.
 * Porta `disco.css` de la plantilla del portafolio.
 */
export function Disco({
  nivel = 3,
  variante = "escena",
  titulo,
  subtitulo,
  cambiando = false,
  onTituloClick,
  children,
  className,
}: DiscoProps) {
  if (nivel < 3 && variante === "escena") return null;

  return (
    <div
      onClick={(e) => {
        if (!onTituloClick) return;
        const target = e.target as HTMLElement | null;
        if (!target?.closest("a, button")) {
          onTituloClick();
        }
      }}
      className={clsx(
        "disco",
        variante === "error" && "disco--error",
        className
      )}
    >
      <div
        className={clsx("disco__texto", cambiando && "cambiando")}
        aria-live="polite"
      >
        <h1 className="disco__titulo">
          {onTituloClick ? (
            <button
              type="button"
              onClick={onTituloClick}
              className="bg-transparent border-0 p-0 font-inherit text-inherit tracking-inherit cursor-pointer"
            >
              {titulo}
            </button>
          ) : (
            titulo
          )}
        </h1>
        {subtitulo && <p className="disco__subtitulo">{subtitulo}</p>}
      </div>

      {children && <div className="disco__contenido">{children}</div>}
    </div>
  );
}

