import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  descripcion?: string;
  children: ReactNode;
}

export function Modal({ abierto, onCerrar, titulo, descripcion, children }: ModalProps) {
  useEffect(() => {
    if (!abierto) return;
    const alPresionarTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", alPresionarTecla);
    // Evita que el fondo siga desplazándose mientras el diálogo está abierto.
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", alPresionarTecla);
      document.body.style.overflow = overflowPrevio;
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onCerrar} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="relative w-full max-w-md rounded-lg border border-antracita-suave bg-antracita p-6 shadow-2xl shadow-black/60"
      >
        <button
          onClick={onCerrar}
          aria-label="Cerrar"
          className="absolute right-4 top-4 text-marfil-suave transition-colors hover:text-marfil"
        >
          <X size={18} />
        </button>
        <h2 className="pr-8 font-[var(--font-display)] text-xl font-medium text-marfil">{titulo}</h2>
        {descripcion && <p className="mt-2 text-sm leading-relaxed text-marfil-suave">{descripcion}</p>}
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
