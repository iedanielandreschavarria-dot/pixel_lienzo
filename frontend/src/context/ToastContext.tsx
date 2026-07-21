import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";

type TipoToast = "exito" | "error";

interface Toast {
  id: number;
  tipo: TipoToast;
  mensaje: string;
}

interface ToastContextValue {
  notificar: (mensaje: string, tipo?: TipoToast) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let contador = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notificar = useCallback((mensaje: string, tipo: TipoToast = "exito") => {
    const id = ++contador;
    setToasts((prev) => [...prev, { id, tipo, mensaje }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  const cerrar = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ notificar }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start gap-2 rounded-lg border px-4 py-3 shadow-2xl shadow-black/50 backdrop-blur-md max-w-sm animate-in bg-antracita/95 text-marfil ${
              toast.tipo === "exito" ? "border-ocre/40" : "border-terracota/40"
            }`}
          >
            {toast.tipo === "exito" ? (
              <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-ocre" />
            ) : (
              <XCircle size={20} className="mt-0.5 shrink-0 text-terracota" />
            )}
            <p className="text-sm leading-snug">{toast.mensaje}</p>
            <button onClick={() => cerrar(toast.id)} className="ml-auto shrink-0 text-marfil-suave hover:text-marfil">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return context;
}
