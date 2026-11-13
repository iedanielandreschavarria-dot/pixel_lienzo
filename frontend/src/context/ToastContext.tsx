import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, Check, X } from "lucide-react";

export type TipoToast = "exito" | "error";

export interface OpcionesToast {
  accion?: {
    etiqueta: string;
    onClick: () => void;
  };
  duracionMs?: number;
}

interface Toast {
  id: number;
  tipo: TipoToast;
  mensaje: string;
  accion?: OpcionesToast["accion"];
}

interface ToastContextValue {
  notificar: (mensaje: string, tipo?: TipoToast, opciones?: OpcionesToast) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let contador = 0;

/**
 * 4.8 Toast:
 * Abajo al centro, de 360 a 480 px, borde del color semántico, icono y texto.
 * Dura 5 segundos; los de error permanecen hasta cerrarse. Solo uno visible a la vez.
 * 7.2: Los toasts de error usan role="alert" y los demás role="status".
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timerRef = useRef<number | null>(null);

  const limpiarTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const notificar = useCallback(
    (mensaje: string, tipo: TipoToast = "exito", opciones?: OpcionesToast) => {
      limpiarTimer();
      const id = ++contador;
      setToast({ id, tipo, mensaje, accion: opciones?.accion });

      if (tipo !== "error") {
        const duracion = opciones?.duracionMs ?? 5000;
        timerRef.current = window.setTimeout(() => {
          setToast((actual) => (actual?.id === id ? null : actual));
        }, duracion);
      }
    },
    []
  );

  useEffect(() => limpiarTimer, []);

  return (
    <ToastContext.Provider value={{ notificar }}>
      {children}
      {toast && (
        <div className="fixed inset-x-0 bottom-[var(--espacio-24)] z-50 flex justify-center px-[var(--espacio-16)] pointer-events-none">
          <div
            key={toast.id}
            role={toast.tipo === "error" ? "alert" : "status"}
            aria-live={toast.tipo === "error" ? "assertive" : "polite"}
            className={`pointer-events-auto flex w-full min-w-[min(360px,100%)] max-w-[480px] items-center gap-[var(--espacio-12)] rounded-[var(--radio-recto)] border bg-[color:var(--fondo)] px-[var(--espacio-16)] py-[var(--espacio-12)] shadow-[var(--sombra-tarjeta)] ${
              toast.tipo === "exito"
                ? "border-[color:var(--exito)] text-[color:var(--tinta)]"
                : "border-[color:var(--aviso)] text-[color:var(--tinta)]"
            }`}
          >
            {toast.tipo === "exito" ? (
              <Check
                size={24}
                strokeWidth={1.5}
                className="shrink-0 text-[color:var(--exito)]"
                aria-hidden="true"
              />
            ) : (
              <AlertTriangle
                size={24}
                strokeWidth={1.5}
                className="shrink-0 text-[color:var(--aviso)]"
                aria-hidden="true"
              />
            )}

            <p className="voz-cuerpo-pequeno flex-1 text-[color:var(--tinta)]">{toast.mensaje}</p>

            {toast.accion && (
              <button
                type="button"
                onClick={() => {
                  toast.accion?.onClick();
                  setToast(null);
                }}
                className="shrink-0 bg-transparent border-0 border-b border-[color:var(--borde-terciario)] pb-[var(--espacio-4)] font-[var(--fuente-texto)] font-semibold text-[length:var(--text-cuerpo-pequeno)] text-[color:var(--tinta)] hover:border-white cursor-pointer"
              >
                {toast.accion.etiqueta}
              </button>
            )}

            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="Cerrar aviso"
              className="inline-grid h-[var(--area-tactil-min)] w-[var(--area-tactil-min)] shrink-0 place-items-center bg-transparent border-0 text-[color:var(--tinta-suave)] hover:text-[color:var(--tinta)] cursor-pointer"
            >
              <X size={24} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return context;
}

