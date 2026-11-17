import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export interface ModalProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  descripcion?: string;
  destructivo?: boolean;
  children: ReactNode;
}

const SELECTOR_ENFOCABLES =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * 4.8 Modal:
 * Panel --fondo con borde --riel al 40 %, ancho de 520 px (máximo 92 % de la pantalla), relleno de 32 px.
 * Detrás, rgba(0,0,0,.8). Título en H3 y acciones alineadas a la derecha.
 * Se cierra con Esc, con X y con clic fuera, salvo las confirmaciones destructivas, que solo se cierran con sus botones.
 * El foco queda atrapado dentro y vuelve al disparador al cerrar.
 */
export function Modal({
  abierto,
  onCerrar,
  titulo,
  descripcion,
  destructivo = false,
  children,
}: ModalProps) {
  const tituloId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const disparadorRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!abierto) return;

    disparadorRef.current = document.activeElement as HTMLElement | null;
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const enfocarPrimero = () => {
      const contenedor = dialogRef.current;
      if (!contenedor) return;
      const enfocables = contenedor.querySelectorAll<HTMLElement>(SELECTOR_ENFOCABLES);
      if (enfocables.length > 0) {
        enfocables[0].focus();
      } else {
        contenedor.focus();
      }
    };
    const timer = window.setTimeout(enfocarPrimero, 0);

    const alPresionarTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !destructivo) {
        e.preventDefault();
        onCerrar();
        return;
      }

      if (e.key === "Tab" && dialogRef.current) {
        const enfocables = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(SELECTOR_ENFOCABLES)
        );
        if (enfocables.length === 0) {
          e.preventDefault();
          return;
        }
        const primero = enfocables[0];
        const ultimo = enfocables[enfocables.length - 1];
        if (e.shiftKey && document.activeElement === primero) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primero.focus();
        }
      }
    };

    window.addEventListener("keydown", alPresionarTecla);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", alPresionarTecla);
      document.body.style.overflow = overflowPrevio;
      disparadorRef.current?.focus?.();
    };
  }, [abierto, destructivo, onCerrar]);

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-[var(--espacio-16)]">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[color:var(--modal-velo)]"
        onClick={destructivo ? undefined : onCerrar}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        aria-describedby={descripcion ? descId : undefined}
        tabIndex={-1}
        className="relative w-[min(92vw,var(--modal-ancho))] rounded-[var(--radio-recto)] border border-[color:var(--borde-reposo)] bg-[color:var(--fondo)] p-[var(--espacio-32)] shadow-[var(--sombra-tarjeta)]"
      >
        {!destructivo && (
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="absolute right-[var(--espacio-16)] top-[var(--espacio-16)] inline-grid h-[var(--area-tactil-min)] w-[var(--area-tactil-min)] place-items-center bg-transparent border-0 text-[color:var(--tinta-suave)] transition-colors duration-[var(--duracion-hover)] hover:text-[color:var(--tinta)] cursor-pointer"
          >
            <X size={24} strokeWidth={1.5} aria-hidden="true" />
          </button>
        )}

        <h3 id={tituloId} className="voz-h3 pr-[var(--espacio-32)] text-[color:var(--tinta)]">
          {titulo}
        </h3>

        {descripcion && (
          <p id={descId} className="voz-cuerpo-pequeno mt-[var(--espacio-8)] text-[color:var(--tinta-suave)]">
            {descripcion}
          </p>
        )}

        <div className="mt-[var(--espacio-24)]">{children}</div>
      </div>
    </div>
  );
}

