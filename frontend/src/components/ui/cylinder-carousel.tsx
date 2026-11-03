import {
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent as ReactFocusEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import clsx from "clsx";

export interface ImagenCarrusel {
  src: string;
  alt?: string;
  href?: string;
  /** Copia para cerrar el anillo: no se anuncia ni recibe foco. */
  decorativa?: boolean;
}

interface CylinderCarouselProps {
  images: ImagenCarrusel[];
  className?: string;
  containerClassName?: string;
  cardClassName?: string;
  /** Duración de una vuelta completa, en segundos. */
  animationDuration?: number;
  /** Ancho de cada lámina, en píxeles. */
  cardWidth?: number;
  /** Se llama al abrir una obra desde el carrusel. */
  onNavigate?: () => void;
}

const MUELLE = { type: "spring" as const, stiffness: 300, damping: 25 };
const SIN_MOVIMIENTO = { duration: 0 };
const EnlaceLamina = motion.create(Link);

/**
 * Carrusel cilíndrico. Las láminas se reparten con rotateY y translateZ;
 * el radio sale de la función CSS tan(). El giro es lineal y largo.
 * Hover, arrastre horizontal o foco lo pausan. Con menos movimiento
 * el anillo queda quieto en arco.
 */
export function CylinderCarousel({
  images,
  className,
  containerClassName,
  cardClassName,
  animationDuration = 48,
  cardWidth = 160,
  onNavigate,
}: CylinderCarouselProps) {
  const total = images.length;
  const reducirMovimiento = useReducedMotion() === true;
  const transicion = reducirMovimiento ? SIN_MOVIMIENTO : MUELLE;

  const giroExtra = useRef(0);
  const origenX = useRef(0);
  const origenY = useRef(0);
  const giroAlInicio = useRef(0);
  const arrastrando = useRef(false);
  const ejeHorizontal = useRef(false);
  const seMovio = useRef(false);
  const sobre = useRef(false);

  const [giro, setGiro] = useState(0);
  const [pausado, setPausado] = useState(false);

  if (total === 0) return null;

  const variables = {
    "--n": total,
    "--w": `${cardWidth}px`,
    "--ba": "calc(1turn / var(--n))",
    "--anim-dur": `${animationDuration}s`,
  } as CSSProperties;

  const alEntrar = (evento: ReactPointerEvent<HTMLDivElement>) => {
    if (evento.pointerType !== "mouse") return;
    sobre.current = true;
    setPausado(true);
  };

  const alSalir = () => {
    sobre.current = false;
    if (!arrastrando.current) setPausado(false);
  };

  const alPresionar = (evento: ReactPointerEvent<HTMLDivElement>) => {
    if (evento.button !== 0) return;
    arrastrando.current = true;
    ejeHorizontal.current = false;
    seMovio.current = false;
    origenX.current = evento.clientX;
    origenY.current = evento.clientY;
    giroAlInicio.current = giroExtra.current;
  };

  const alMover = (evento: ReactPointerEvent<HTMLDivElement>) => {
    if (!arrastrando.current) return;
    const dx = evento.clientX - origenX.current;
    const dy = evento.clientY - origenY.current;
    if (!ejeHorizontal.current) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        arrastrando.current = false;
        setPausado(sobre.current);
        return;
      }
      ejeHorizontal.current = true;
      seMovio.current = true;
      setPausado(true);
      evento.currentTarget.setPointerCapture(evento.pointerId);
    }
    const siguiente = giroAlInicio.current + dx * 0.35;
    giroExtra.current = siguiente;
    setGiro(siguiente);
  };

  const alSoltar = () => {
    arrastrando.current = false;
    ejeHorizontal.current = false;
    setPausado(sobre.current);
  };

  const alPerderFoco = (evento: ReactFocusEvent<HTMLDivElement>) => {
    const destino = evento.relatedTarget;
    if (destino instanceof Node && evento.currentTarget.contains(destino)) return;
    if (!arrastrando.current) setPausado(sobre.current);
  };

  return (
    <div
      className={clsx(
        "grid h-full min-h-0 w-full cursor-grab place-items-center overflow-hidden active:cursor-grabbing",
        className
      )}
      style={{
        perspective: "35em",
        touchAction: "pan-y",
        maskImage: "linear-gradient(90deg, transparent, #000 12% 88%, transparent)",
        WebkitMaskImage: "linear-gradient(90deg, transparent, #000 12% 88%, transparent)",
      }}
      onPointerEnter={alEntrar}
      onPointerLeave={alSalir}
      onPointerDown={alPresionar}
      onPointerMove={alMover}
      onPointerUp={alSoltar}
      onPointerCancel={alSoltar}
      onFocusCapture={() => setPausado(true)}
      onBlurCapture={alPerderFoco}
      role="region"
      aria-roledescription="carrusel"
      aria-label="Obras en exhibición. Arrastra en horizontal para girarlas."
    >
      <div className="grid place-items-center [transform-style:preserve-3d]" style={{ transform: `rotateY(${giro}deg)` }}>
        <div
          className={clsx(
            "cylinder-rotor grid place-items-center [transform-style:preserve-3d]",
            containerClassName
          )}
          style={{
            ...variables,
            animation: total > 1 ? "cylinder-ry var(--anim-dur) linear infinite" : undefined,
            animationPlayState: pausado ? "paused" : "running",
          }}
        >
          {images.map((imagen, indice) => {
            const estilo = {
              width: "var(--w)",
              aspectRatio: "7 / 10",
              "--i": indice,
              transform:
                total > 1
                  ? "rotateY(calc(var(--i) * var(--ba))) translateZ(calc(-1 * (0.5 * var(--w) + 0.5em) / tan(0.5 * var(--ba))))"
                  : undefined,
            } as CSSProperties;
            const clase = clsx("[grid-area:1/1] [backface-visibility:hidden]", cardClassName);
            const marco =
              "block h-full w-full overflow-hidden border border-marfil/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocre";
            const foto = (
              <img
                src={imagen.src}
                alt={imagen.href ? "" : (imagen.alt ?? `Obra ${indice + 1}`)}
                draggable={false}
                className="pointer-events-none h-full w-full object-cover"
              />
            );
            const gesto = {
              whileHover: reducirMovimiento ? undefined : { y: -2 },
              whileTap: reducirMovimiento ? undefined : { scale: 0.97 },
              transition: transicion,
            };

            if (!imagen.href) {
              return (
                <div key={`${imagen.src}-${indice}`} className={clase} style={estilo}>
                  <motion.div className={marco} {...gesto}>
                    {foto}
                  </motion.div>
                </div>
              );
            }

            return (
              <div key={`${imagen.href}-${indice}`} className={clase} style={estilo}>
                <EnlaceLamina
                  to={imagen.href}
                  aria-hidden={imagen.decorativa || undefined}
                  tabIndex={imagen.decorativa ? -1 : undefined}
                  aria-label={imagen.decorativa ? undefined : (imagen.alt ?? `Obra ${indice + 1}`)}
                  className={marco}
                  onClick={(evento) => {
                    if (seMovio.current) {
                      evento.preventDefault();
                      seMovio.current = false;
                      return;
                    }
                    onNavigate?.();
                  }}
                  {...gesto}
                >
                  {foto}
                </EnlaceLamina>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
