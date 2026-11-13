import { useEffect, useRef } from "react";
import clsx from "clsx";

export type NivelIntensidad = 1 | 2 | 3;

export interface AmbienteProps {
  nivel: NivelIntensidad;
  /** En páginas de Nivel 3 que exigen luz estática sin animaciones decorativas (p. ej. 404 y 403). */
  luzEstatica?: boolean;
  /** Cuando es false, usa position absolute para previsualizaciones contenidas (p. ej. en /kit). */
  fijo?: boolean;
  className?: string;
}

/**
 * Sección 2 — Tres niveles de intensidad:
 * - Nivel 1 (Funcional): Fondo #0a0808 plano, grano al 6 %, sin animaciones decorativas.
 * - Nivel 2 (Escena ligera): Fondo #0a0808 con luz roja estática desde abajo, viñeta y grano. Sin arco.
 * - Nivel 3 (Escena completa): Luz roja animada, foco que sigue al cursor (solo mouse), viñeta y grano.
 */
export function Ambiente({ nivel, luzEstatica = false, fijo = true, className }: AmbienteProps) {
  const focoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (nivel !== 3 || luzEstatica) return;
    const focoEl = focoRef.current;
    if (!focoEl) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tieneMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (reduceMotion || !tieneMouse) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let objetivoX = x;
    let objetivoY = y;
    let activo = false;
    let rafId = 0;

    const paso = () => {
      x += (objetivoX - x) * 0.12;
      y += (objetivoY - y) * 0.12;
      focoEl.style.setProperty("--mx", `${x.toFixed(1)}px`);
      focoEl.style.setProperty("--my", `${y.toFixed(1)}px`);
      if (Math.abs(objetivoX - x) > 0.3 || Math.abs(objetivoY - y) > 0.3) {
        rafId = window.requestAnimationFrame(paso);
      } else {
        activo = false;
      }
    };

    const alMover = (e: MouseEvent) => {
      objetivoX = e.clientX;
      objetivoY = e.clientY;
      focoEl.classList.add("visible");
      if (!activo) {
        activo = true;
        rafId = window.requestAnimationFrame(paso);
      }
    };

    const alSalir = () => {
      focoEl.classList.remove("visible");
    };

    window.addEventListener("mousemove", alMover, { passive: true });
    document.addEventListener("mouseleave", alSalir);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", alMover);
      document.removeEventListener("mouseleave", alSalir);
    };
  }, [nivel, luzEstatica]);

  const posClase = !fijo ? "!absolute" : undefined;

  return (
    <div aria-hidden="true" className={clsx("pointer-events-none", className)}>
      {nivel >= 2 && (
        <div
          className={clsx(
            "luz",
            nivel === 3 && !luzEstatica ? "luz--animada" : "luz--estatica",
            posClase
          )}
        >
          <div className="luz__brillo" />
        </div>
      )}

      {nivel === 3 && !luzEstatica && <div ref={focoRef} className={clsx("foco", posClase)} />}

      {nivel >= 2 && <div className={clsx("vineta", posClase)} />}

      <div
        className={clsx(
          "grano",
          nivel === 1 && "grano--nivel-1",
          posClase
        )}
      />
    </div>
  );
}

