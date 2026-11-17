import { useEffect, useRef, useState } from "react";

const SESSION_KEY = "pyl_entrada_vista";

export interface EntradaProps {
  onComplete?: () => void;
  /** Permite forzar su visualización en /kit sin depender de sessionStorage */
  forzarMostrar?: boolean;
}

/**
 * 6.1 Entrada:
 * El punto de luz aparece una sola vez por sesión. Se omite con movimiento reducido.
 * Porta `entrada.css` y `entrada.js` de la plantilla del portafolio.
 */
export function Entrada({ onComplete, forzarMostrar = false }: EntradaProps) {
  const botonRef = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return false;
    if (forzarMostrar) return true;
    return sessionStorage.getItem(SESSION_KEY) !== "1";
  });
  const [abriendo, setAbriendo] = useState(false);

  useEffect(() => {
    if (!visible) return;
    botonRef.current?.focus();
  }, [visible]);

  if (!visible) return null;

  const abrir = () => {
    if (abriendo) return;
    setAbriendo(true);
    if (!forzarMostrar) {
      sessionStorage.setItem(SESSION_KEY, "1");
    }
    window.setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 1800);
  };

  return (
    <div className={`entrada ${abriendo ? "abre" : ""}`}>
      <button
        ref={botonRef}
        type="button"
        onClick={abrir}
        className="entrada__boton"
      >
        <span className="entrada__punto" aria-hidden="true" />
        <span className="entrada__texto">Toca la luz para entrar</span>
      </button>
    </div>
  );
}

