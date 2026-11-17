import { type ReactNode, useEffect, useState } from "react";
import { AlertTriangle, Check, Info, WifiOff } from "lucide-react";
import clsx from "clsx";

export type VarianteBanner = "aviso" | "exito" | "informativo";

export interface BannerProps {
  variante?: VarianteBanner;
  children: ReactNode;
  accion?: ReactNode;
  className?: string;
}

/**
 * 4.8 Banner en página:
 * Borde izquierdo de 2 px del color semántico, fondo rgba(242,236,227,.04),
 * icono, texto y acción opcional.
 */
export function Banner({
  variante = "informativo",
  children,
  accion,
  className,
}: BannerProps) {
  const esAviso = variante === "aviso";
  const esExito = variante === "exito";

  return (
    <div
      role={esAviso ? "alert" : "status"}
      className={clsx(
        "flex flex-wrap items-center justify-between gap-[var(--espacio-16)] rounded-[var(--radio-recto)] border-l-2 bg-[color:var(--superficie-elevada)] px-[var(--espacio-16)] py-[var(--espacio-12)]",
        esAviso && "border-l-[color:var(--aviso)]",
        esExito && "border-l-[color:var(--exito)]",
        !esAviso && !esExito && "border-l-[color:var(--tinta)]",
        className
      )}
    >
      <div className="flex items-start gap-[var(--espacio-12)]">
        {esAviso ? (
          <AlertTriangle
            size={24}
            strokeWidth={1.5}
            className="shrink-0 text-[color:var(--aviso)]"
            aria-hidden="true"
          />
        ) : esExito ? (
          <Check
            size={24}
            strokeWidth={1.5}
            className="shrink-0 text-[color:var(--exito)]"
            aria-hidden="true"
          />
        ) : (
          <Info
            size={24}
            strokeWidth={1.5}
            className="shrink-0 text-[color:var(--tinta)]"
            aria-hidden="true"
          />
        )}
        <div className="voz-cuerpo-pequeno text-[color:var(--tinta)]">{children}</div>
      </div>

      {accion && <div className="shrink-0">{accion}</div>}
    </div>
  );
}

/**
 * 4.9 Sin conexión:
 * Banner fijo ámbar abajo: "Sin conexión. Los cambios no se guardarán hasta que vuelvas a conectarte."
 */
export function OfflineBanner({ forzarVisible = false }: { forzarVisible?: boolean }) {
  const [sinConexion, setSinConexion] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false
  );

  useEffect(() => {
    const alDesconectar = () => setSinConexion(true);
    const alConectar = () => setSinConexion(false);
    window.addEventListener("offline", alDesconectar);
    window.addEventListener("online", alConectar);
    return () => {
      window.removeEventListener("offline", alDesconectar);
      window.removeEventListener("online", alConectar);
    };
  }, []);

  if (!sinConexion && !forzarVisible) return null;

  return (
    <div
      role="alert"
      className={clsx(
        "z-50 flex items-center justify-center gap-[var(--espacio-12)] border-t border-[color:var(--aviso)] bg-[color:var(--fondo)] px-[var(--espacio-24)] py-[var(--espacio-12)] text-[color:var(--aviso)]",
        !forzarVisible && "fixed inset-x-0 bottom-0"
      )}
    >
      <WifiOff size={24} strokeWidth={1.5} className="shrink-0" aria-hidden="true" />
      <p className="voz-cuerpo-pequeno text-[color:var(--tinta)]">
        Sin conexión. Los cambios no se guardarán hasta que vuelvas a conectarte.
      </p>
    </div>
  );
}

