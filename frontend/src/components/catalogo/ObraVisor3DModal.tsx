import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, X, ZoomIn, ZoomOut } from "lucide-react";
import type { Obra } from "../../types";
import { resolverNombreArtistaObra, resolverUrlImagenObra } from "../../lib/obrasMuestraPalacio";

export interface ObraVisor3DModalProps {
  obra: Obra | null;
  nombreArtista?: string;
  abierto: boolean;
  onCerrar: () => void;
}

/**
 * Extrae el ancho y alto reales en centímetros desde `obra.dimensiones` (ej. "73.7 x 92.1 cm" o "120 x 140 cm").
 * Si no viene o el formato varía, usa 90 x 100 cm por defecto.
 */
function parsearDimensionesCm(dimensiones: string | undefined): { anchoCm: number; altoCm: number } {
  if (!dimensiones) return { anchoCm: 95, altoCm: 95 };
  const match = dimensiones.match(/(\d+(?:[.,]\d+)?)\s*[x×X*]\s*(\d+(?:[.,]\d+)?)/);
  if (!match) return { anchoCm: 95, altoCm: 95 };
  const v1 = parseFloat(match[1].replace(",", "."));
  const v2 = parseFloat(match[2].replace(",", "."));
  if (!Number.isFinite(v1) || !Number.isFinite(v2) || v1 <= 0 || v2 <= 0) {
    return { anchoCm: 95, altoCm: 95 };
  }
  return {
    anchoCm: Math.min(240, Math.max(30, v1)),
    altoCm: Math.min(220, Math.max(30, v2)),
  };
}

/**
 * Visualizador 3D interactivo estilo SingulArt (conforme a la imagen de referencia):
 * - Modal blanco luminoso con backdrop oscuro translúcido.
 * - Encabezado superior izquierdo: Título de la obra en mayúsculas + Artista en cursiva debajo.
 * - Botón circular superior derecho (X) para cerrar el modal.
 * - Barra superior central semitransparente: "Arrastra para mover • Rueda para zoom • Rota con los controles".
 * - Escenario gris/blanco minimalista (#f3f3f4) con:
 *   1. Silueta humana a escala real (1.75 m / 5'9") a la izquierda del cuadro.
 *   2. Cuadro 3D volumétrico (marco de madera natural tipo roble claro con grosor en 3D, bisel interior,
 *      textura de la obra y sombra proyectada sobre la pared).
 * - Interactividad completa:
 *   - Drag to move (arrastrar con mouse o touch para desplazar la vista).
 *   - Scroll to zoom (rueda del mouse para acercar/alejar).
 *   - Botonera flotante vertical a la derecha: Arriba (^), Izquierda (<), Derecha (>), Abajo (v) para rotar
 *     la perspectiva 3D, Zoom In (+), Zoom Out (-) y botón inferior (X) para restablecer la vista 3D.
 */
export function ObraVisor3DModal({
  obra,
  nombreArtista,
  abierto,
  onCerrar,
}: ObraVisor3DModalProps) {
  // Estados de cámara y transformación 3D (por defecto con leve giro tipo SingulArt: rotateY -14deg)
  const [rotX, setRotX] = useState(2);
  const [rotY, setRotY] = useState(-14);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [arrastrando, setArrastrando] = useState(false);
  const [usarFallbackImg, setUsarFallbackImg] = useState(false);

  const puntoInicioRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const resetearCamara = useCallback(() => {
    setRotX(2);
    setRotY(-14);
    setPanX(0);
    setPanY(0);
    setZoom(1);
  }, []);

  useEffect(() => {
    if (abierto) {
      resetearCamara();
      setUsarFallbackImg(false);
    }
  }, [abierto, obra?.id_obra, resetearCamara]);

  // Cerrar con Escape y bloquear scroll del body
  useEffect(() => {
    if (!abierto) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const alTeclado = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCerrar();
      } else if (e.key === "ArrowLeft") {
        setRotY((y) => Math.max(-48, y - 6));
      } else if (e.key === "ArrowRight") {
        setRotY((y) => Math.min(48, y + 6));
      } else if (e.key === "ArrowUp") {
        setRotX((x) => Math.min(32, x + 5));
      } else if (e.key === "ArrowDown") {
        setRotX((x) => Math.max(-32, x - 5));
      } else if (e.key === "+" || e.key === "=") {
        setZoom((z) => Math.min(2.2, Number((z + 0.15).toFixed(2))));
      } else if (e.key === "-") {
        setZoom((z) => Math.max(0.55, Number((z - 0.15).toFixed(2))));
      }
    };

    window.addEventListener("keydown", alTeclado);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", alTeclado);
    };
  }, [abierto, onCerrar]);

  const dimensionesFisicas = useMemo(() => {
    const { anchoCm, altoCm } = parsearDimensionesCm(obra?.dimensiones);
    // Escala: 175 cm (persona 5'9" / 1.75 m) = 385 px de altura en escena
    const pxPorCm = 385 / 175;
    // Ajustamos para que cuadros pequeños sigan viéndose con buen detalle y cuadros grandes respeten la proporción con la silueta
    const anchoEscala = Math.round(Math.min(360, Math.max(190, anchoCm * pxPorCm * 1.12)));
    const altoEscala = Math.round(Math.min(360, Math.max(190, altoCm * pxPorCm * 1.12)));
    return {
      anchoCm,
      altoCm,
      anchoPx: anchoEscala,
      altoPx: altoEscala,
    };
  }, [obra?.dimensiones]);

  if (!abierto || !obra) return null;

  const artistaTexto = resolverNombreArtistaObra(obra, nombreArtista);
  const srcPintura = resolverUrlImagenObra(obra, usarFallbackImg);

  // Drag to move (arrastrar para mover la escena)
  const manejarPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // Evitar arrastrar si hizo clic en la botonera de controles
    if ((e.target as HTMLElement).closest("[data-controles-3d]")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setArrastrando(true);
    puntoInicioRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX,
      panY,
    };
  };

  const manejarPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!arrastrando || !puntoInicioRef.current) return;
    const dx = e.clientX - puntoInicioRef.current.x;
    const dy = e.clientY - puntoInicioRef.current.y;
    setPanX(Math.max(-340, Math.min(340, puntoInicioRef.current.panX + dx)));
    setPanY(Math.max(-220, Math.min(220, puntoInicioRef.current.panY + dy)));
  };

  const manejarPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!arrastrando) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setArrastrando(false);
    puntoInicioRef.current = null;
  };

  // Scroll to zoom (rueda del mouse)
  const manejarWheel = (e: ReactWheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.12 : -0.12;
    setZoom((z) => Math.min(2.2, Math.max(0.55, Number((z + delta).toFixed(2)))));
  };

  const grosorMarco = 22; // 22px de profundidad 3D del bastidor/marco de madera

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="visor3d-titulo-obra"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/72 p-3 sm:p-6 backdrop-blur-[3px] animate-[aparecer-pagina_240ms_ease_forwards]"
    >
      {/* Contenedor Modal Blanco estilo SingulArt */}
      <div className="relative flex h-[min(92vh,760px)] w-[min(96vw,1060px)] flex-col overflow-hidden rounded-[22px] bg-white text-[#1e1e1e] shadow-[0_28px_80px_rgba(0,0,0,0.55)]">
        {/* Cabecera blanca: Título en MAYÚSCULAS arriba a la izquierda + Artista en cursiva debajo + Botón X a la derecha */}
        <header className="flex items-start justify-between px-6 pt-5 pb-3 sm:px-8 sm:pt-6">
          <div>
            <h2
              id="visor3d-titulo-obra"
              className="font-sans text-[0.95rem] sm:text-[1.02rem] font-semibold uppercase tracking-[0.04em] text-[#222222]"
            >
              {obra.titulo}
            </h2>
            <p className="mt-0.5 font-serif text-[0.94rem] italic text-[#555555]">
              {artistaTexto}
            </p>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar visualizador 3D"
            className="inline-grid h-10 w-10 place-items-center rounded-full bg-[#f0f0f0] text-[#222222] transition-colors hover:bg-[#e2e2e2] cursor-pointer border-0"
          >
            <X size={20} strokeWidth={1.8} />
          </button>
        </header>

        {/* Área del escenario 3D minimalista (pared blanca/gris clara #f3f3f4) */}
        <div className="relative mx-4 mb-4 flex-1 overflow-hidden rounded-[16px] bg-[#f4f4f6] sm:mx-6 sm:mb-6 select-none">
          {/* Barra superior central de instrucciones semitransparente */}
          <div className="pointer-events-none absolute top-4 left-1/2 z-20 -translate-x-1/2 w-[min(92%,640px)]">
            <div className="rounded-lg bg-[#b8b8bc]/85 px-4 py-1.5 text-center font-sans text-[0.82rem] sm:text-[0.88rem] font-medium tracking-[0.01em] text-white shadow-sm backdrop-blur-xs">
              Arrastra para mover • Rueda para zoom • Rota con los controles
            </div>
          </div>

          {/* Botonera vertical flotante a la derecha (idéntica a la imagen de referencia) */}
          <div
            data-controles-3d="true"
            className="absolute right-3.5 top-1/2 z-20 -translate-y-1/2 flex flex-col items-center gap-2 rounded-full bg-[#c4c4c8]/85 p-1.5 shadow-[0_6px_20px_rgba(0,0,0,0.12)] backdrop-blur-xs"
          >
            {/* Flechas de rotación 3D: Arriba, Izquierda, Derecha, Abajo */}
            <button
              type="button"
              onClick={() => setRotX((x) => Math.min(35, x + 7))}
              title="Inclinar hacia arriba"
              aria-label="Inclinar obra hacia arriba"
              className="inline-grid h-8 w-8 place-items-center rounded-full bg-white text-[#2b2b2b] shadow-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer border-0"
            >
              <ChevronUp size={16} strokeWidth={2.2} />
            </button>

            <button
              type="button"
              onClick={() => setRotY((y) => Math.max(-52, y - 8))}
              title="Rotar hacia la izquierda"
              aria-label="Rotar obra hacia la izquierda"
              className="inline-grid h-8 w-8 place-items-center rounded-full bg-white text-[#2b2b2b] shadow-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer border-0"
            >
              <ChevronLeft size={16} strokeWidth={2.2} />
            </button>

            <button
              type="button"
              onClick={() => setRotY((y) => Math.min(52, y + 8))}
              title="Rotar hacia la derecha"
              aria-label="Rotar obra hacia la derecha"
              className="inline-grid h-8 w-8 place-items-center rounded-full bg-white text-[#2b2b2b] shadow-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer border-0"
            >
              <ChevronRight size={16} strokeWidth={2.2} />
            </button>

            <button
              type="button"
              onClick={() => setRotX((x) => Math.max(-35, x - 7))}
              title="Inclinar hacia abajo"
              aria-label="Inclinar obra hacia abajo"
              className="inline-grid h-8 w-8 place-items-center rounded-full bg-white text-[#2b2b2b] shadow-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer border-0"
            >
              <ChevronDown size={16} strokeWidth={2.2} />
            </button>

            {/* Separador sutil entre rotación y zoom */}
            <div className="my-0.5 h-[1px] w-4 bg-white/50" />

            {/* Zoom In (+) */}
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.2, Number((z + 0.16).toFixed(2))))}
              title="Acercar (Zoom In)"
              aria-label="Acercar vista"
              className="inline-grid h-8 w-8 place-items-center rounded-full bg-white text-[#2b2b2b] shadow-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer border-0"
            >
              <ZoomIn size={15} strokeWidth={2} />
            </button>

            {/* Zoom Out (-) */}
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.55, Number((z - 0.16).toFixed(2))))}
              title="Alejar (Zoom Out)"
              aria-label="Alejar vista"
              className="inline-grid h-8 w-8 place-items-center rounded-full bg-white text-[#2b2b2b] shadow-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer border-0"
            >
              <ZoomOut size={15} strokeWidth={2} />
            </button>

            <div className="my-0.5 h-[1px] w-4 bg-white/50" />

            {/* Botón X inferior de la botonera: restablece la vista o cierra */}
            <button
              type="button"
              onClick={resetearCamara}
              title="Restablecer posición 3D original"
              aria-label="Restablecer posición 3D"
              className="inline-grid h-8 w-8 place-items-center rounded-full bg-white text-[#2b2b2b] shadow-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer border-0"
            >
              <X size={15} strokeWidth={2.1} />
            </button>
          </div>

          {/* Superficie interactiva de arrastre y rueda de zoom */}
          <div
            onPointerDown={manejarPointerDown}
            onPointerMove={manejarPointerMove}
            onPointerUp={manejarPointerUp}
            onPointerCancel={manejarPointerUp}
            onWheel={manejarWheel}
            className={`relative flex h-full w-full items-center justify-center ${
              arrastrando ? "cursor-grabbing" : "cursor-grab"
            }`}
            style={{
              perspective: "1350px",
              touchAction: "none",
            }}
          >
            {/* Escena desplazable y escalable (cámara Pan + Zoom) */}
            <div
              className="relative flex items-center justify-center gap-8 sm:gap-14 transition-transform duration-150 ease-out"
              style={{
                transform: `translate3d(${panX}px, ${panY}px, 0) scale(${zoom})`,
                transformStyle: "preserve-3d",
              }}
            >
              {/* 1. SILUETA HUMANA DE ESCALA A LA IZQUIERDA (5'9" · 1.75 m) */}
              <div
                aria-label="Referencia de escala humana: 1.75 metros (5 pies 9 pulgadas)"
                className="pointer-events-none flex flex-col items-center self-end translate-y-12"
              >
                <span className="mb-2 font-sans text-[0.82rem] font-bold tracking-tight text-[#5a63b8]">
                  5&apos;9&quot; <span className="font-normal text-[#787f9a]">(1.75m)</span>
                </span>

                {/* Silueta anatómica blanca semitransparente idéntica a SingulArt */}
                <svg
                  viewBox="0 0 140 410"
                  className="h-[340px] sm:h-[385px] w-auto drop-shadow-[0_2px_10px_rgba(0,0,0,0.03)]"
                  aria-hidden="true"
                >
                  <path
                    d="M70 8
                       C82 8 90 18 90 32
                       C90 43 84 52 80 57
                       L81 68
                       C97 72 114 80 120 96
                       C125 112 128 148 130 184
                       C131 198 128 212 123 218
                       C119 222 115 215 115 204
                       L111 124
                       L105 124
                       L108 208
                       C109 235 104 282 101 334
                       L98 394
                       C97 403 88 406 82 406
                       C76 406 74 398 74 390
                       L72 246
                       L68 246
                       L66 390
                       C66 398 64 406 58 406
                       C52 406 43 403 42 394
                       L39 334
                       C36 282 31 235 32 208
                       L35 124
                       L29 124
                       L25 204
                       C25 215 21 222 17 218
                       C12 212 9 198 10 184
                       C12 148 15 112 20 96
                       C26 80 43 72 59 68
                       L60 57
                       C56 52 50 43 50 32
                       C50 18 58 8 70 8 Z"
                    fill="#ffffff"
                    fillOpacity="0.92"
                  />
                </svg>
              </div>

              {/* 2. CUADRO 3D VOLUMÉTRICO CON GROSOR DE MARCO DE MADERA Y SOMBRA REALISTA */}
              <div
                className="relative transition-transform duration-200 ease-out"
                style={{
                  width: `${dimensionesFisicas.anchoPx}px`,
                  height: `${dimensionesFisicas.altoPx}px`,
                  transformStyle: "preserve-3d",
                  transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
                }}
              >
                {/* Sombra realista proyectada sobre la pared trasera */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-2 rounded-xs transition-all duration-200"
                  style={{
                    transform: `translate3d(${-rotY * 0.65}px, ${14 + rotX * 0.5}px, -${grosorMarco + 6}px)`,
                    background: "rgba(25, 23, 20, 0.24)",
                    filter: "blur(18px)",
                  }}
                />

                {/* Cara frontal del cuadro: Marco de madera natural clara + sombra interior + lienzo de la pintura */}
                <div
                  className=" absolute inset-0 box-border flex items-center justify-center"
                  style={{
                    transform: `translateZ(${grosorMarco / 2}px)`,
                    padding: "11px",
                    background:
                      "linear-gradient(135deg, #e7ceb1 0%, #d8b894 50%, #c9a67e 100%)",
                    boxShadow:
                      "inset 0 0 0 1px rgba(255,255,255,0.45), inset 0 2px 6px rgba(60,40,20,0.22)",
                    backfaceVisibility: "hidden",
                  }}
                >
                  {/* Bisel interior del marco y lienzo con textura */}
                  <div className="relative h-full w-full overflow-hidden bg-[#1a1917] shadow-[inset_0_2px_6px_rgba(0,0,0,0.45)]">
                    <img
                      src={srcPintura}
                      alt={`${obra.titulo} — ${artistaTexto}`}
                      draggable={false}
                      onError={() => {
                        if (!usarFallbackImg) setUsarFallbackImg(true);
                      }}
                      className="h-full w-full object-cover select-none pointer-events-none"
                    />
                    {/* Brillo sutil de barniz de galería que reacciona al ángulo 3D */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background: `linear-gradient(${125 + rotY * 1.4}deg, rgba(255,255,255,0.16) 0%, transparent 45%, rgba(0,0,0,0.08) 100%)`,
                      }}
                    />
                  </div>
                </div>

                {/* Canto o grosor lateral DERECHO del marco de madera (3D thickness) */}
                <div
                  aria-hidden="true"
                  className="absolute top-0 right-0 h-full"
                  style={{
                    width: `${grosorMarco}px`,
                    transformOrigin: "right center",
                    transform: `translateZ(${grosorMarco / 2}px) rotateY(90deg)`,
                    background: "linear-gradient(180deg, #cfa980 0%, #b78f65 100%)",
                    boxShadow: "inset 0 0 0 1px rgba(90,60,30,0.18)",
                  }}
                />

                {/* Canto o grosor lateral IZQUIERDO del marco de madera (3D thickness) */}
                <div
                  aria-hidden="true"
                  className="absolute top-0 left-0 h-full"
                  style={{
                    width: `${grosorMarco}px`,
                    transformOrigin: "left center",
                    transform: `translateZ(${grosorMarco / 2}px) rotateY(-90deg)`,
                    background: "linear-gradient(180deg, #dec09e 0%, #c6a179 100%)",
                    boxShadow: "inset 0 0 0 1px rgba(90,60,30,0.15)",
                  }}
                />

                {/* Canto SUPERIOR del marco de madera */}
                <div
                  aria-hidden="true"
                  className="absolute top-0 left-0 w-full"
                  style={{
                    height: `${grosorMarco}px`,
                    transformOrigin: "center top",
                    transform: `translateZ(${grosorMarco / 2}px) rotateX(90deg)`,
                    background: "linear-gradient(90deg, #ead3b8 0%, #d8b792 100%)",
                  }}
                />

                {/* Canto INFERIOR del marco de madera */}
                <div
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 w-full"
                  style={{
                    height: `${grosorMarco}px`,
                    transformOrigin: "center bottom",
                    transform: `translateZ(${grosorMarco / 2}px) rotateX(-90deg)`,
                    background: "linear-gradient(90deg, #b89168 0%, #9f7952 100%)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Etiqueta discreta inferior con las dimensiones reales de la obra */}
          <div className="pointer-events-none absolute bottom-3 left-5 z-10 font-sans text-[0.78rem] font-medium text-[#76767a]">
            Escala real: {obra.dimensiones || `${dimensionesFisicas.anchoCm} × ${dimensionesFisicas.altoCm} cm`} ·
            Zoom {Math.round(zoom * 100)}%
          </div>
        </div>
      </div>
    </div>
  );
}

