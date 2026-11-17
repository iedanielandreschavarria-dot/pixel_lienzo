import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Maximize2, Pause, Play, Volume2, VolumeX } from "lucide-react";
import clsx from "clsx";
import { listarCatalogo, urlPreviewObra } from "../api/obras";
import { Ambiente } from "../components/escena/Ambiente";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";

interface PiezaMotion {
  id: string;
  idObra?: number;
  titulo: string;
  artista: string;
  anio: string;
  duracionTexto: string;
  duracionSegundos: number;
  descripcion: string;
  posterUrl?: string;
}

const PIEZAS_BASE: PiezaMotion[] = [
  {
    id: "noche-sobre-el-rio",
    titulo: "Noche sobre el río",
    artista: "Estudio Palacio",
    anio: "2024",
    duracionTexto: "01:24",
    duracionSegundos: 84,
    descripcion:
      "Una superficie oscura recorrida por un pulso cálido. La pieza fue concebida para proyectarse en sala en absoluto silencio.",
  },
  {
    id: "geometria-de-sal",
    titulo: "Geometría de sal",
    artista: "Estudio Palacio",
    anio: "2023",
    duracionTexto: "02:05",
    duracionSegundos: 125,
    descripcion:
      "Planos superpuestos que modulan su contraste de forma gradual, dejando respirar el grano del soporte original.",
  },
  {
    id: "umbral",
    titulo: "Umbral",
    artista: "Estudio Palacio",
    anio: "2025",
    duracionTexto: "01:48",
    duracionSegundos: 108,
    descripcion:
      "Un claro circular en el centro del lienzo cuya penumbra se desplaza lentamente a lo largo de la proyección.",
  },
];

function formatearSegundos(seg: number): string {
  const m = Math.floor(seg / 60);
  const s = Math.floor(seg % 60);
  return `${m < 10 ? `0${m}` : m}:${s < 10 ? `0${s}` : s}`;
}

/**
 * 6.6 Estudio Motion (Nivel 2):
 * H1 "Estudio Motion" con la cursiva "Obras en movimiento".
 * Escenario principal 16:9 sobre --vacio con borde --riel al 40 % y controles propios
 * (reproducir/pausar, barra de tiempo de 2 px en --riel, volumen y pantalla completa).
 * Información de la pieza + botón "Ver obra".
 * Tira horizontal de miniaturas 16:9 con la duración en Anton.
 * Inicia siempre en pausa con un póster; sin autoplay y sin sonido al entrar.
 */
export function EstudioMotionPage() {
  const escenarioRef = useRef<HTMLDivElement>(null);
  const pistaRef = useRef<HTMLDivElement>(null);

  const [indiceActivo, setIndiceActivo] = useState(0);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [silenciado, setSilenciado] = useState(true);
  const [tiempoActual, setTiempoActual] = useState(0);
  const [errorVideo, setErrorVideo] = useState(false);
  const [arrastrandoPista, setArrastrandoPista] = useState(false);
  const dragInicioXRef = useRef(0);
  const dragScrollInicialRef = useRef(0);

  const { data: obrasCatalogo, isLoading } = useQuery({
    queryKey: ["catalogo", "estudio-motion"],
    queryFn: () => listarCatalogo(),
  });

  useEffect(() => {
    document.title = "Estudio Motion · Pixel & Lienzo";
  }, []);

  const piezas: PiezaMotion[] = useMemo(() => {
    if (!obrasCatalogo || obrasCatalogo.length === 0) {
      return PIEZAS_BASE;
    }
    return obrasCatalogo.slice(0, 6).map((obra, idx) => {
      const base = PIEZAS_BASE[idx % PIEZAS_BASE.length];
      return {
        id: `obra-${obra.id_obra}`,
        idObra: obra.id_obra,
        titulo: obra.titulo,
        artista: `Artista N.º ${obra.id_artista}`,
        anio: obra.anio_creacion ? String(obra.anio_creacion) : base.anio,
        duracionTexto: base.duracionTexto,
        duracionSegundos: base.duracionSegundos,
        descripcion: `${obra.tecnica} · ${obra.dimensiones}. ${base.descripcion}`,
        posterUrl: urlPreviewObra(obra.id_obra),
      };
    });
  }, [obrasCatalogo]);

  const piezaActiva = piezas[Math.min(indiceActivo, piezas.length - 1)] ?? PIEZAS_BASE[0];

  // Al cambiar de pieza: reinicia siempre en pausa con póster y sin sonido
  const seleccionarPieza = (nuevoIndice: number) => {
    setIndiceActivo(nuevoIndice);
    setReproduciendo(false);
    setTiempoActual(0);
    setErrorVideo(false);
  };

  // Avance del tiempo cuando el usuario pulsa Reproducir manualmente
  useEffect(() => {
    if (!reproduciendo || errorVideo) return;
    const timer = window.setInterval(() => {
      setTiempoActual((prev) => {
        if (prev + 0.25 >= piezaActiva.duracionSegundos) {
          setReproduciendo(false);
          return 0;
        }
        return prev + 0.25;
      });
    }, 250);
    return () => window.clearInterval(timer);
  }, [reproduciendo, errorVideo, piezaActiva.duracionSegundos]);

  const progresoPorcentaje = Math.min(
    100,
    Math.max(0, (tiempoActual / Math.max(1, piezaActiva.duracionSegundos)) * 100)
  );

  const alternarPantallaCompleta = () => {
    const el = escenarioRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void el.requestFullscreen?.();
    }
  };

  const destinoVerObra = piezaActiva.idObra ? `/obras/${piezaActiva.idObra}` : "/#coleccion";

  return (
    <div className="relative min-h-screen py-[var(--espacio-48)]">
      <Ambiente nivel={2} />

      <div className="contenedor-pyl relative z-10 flex flex-col gap-[var(--espacio-32)]">
        {/* Cabecera: H1 "Estudio Motion" con la cursiva "Obras en movimiento" */}
        <header>
          <h1 className="voz-h1 text-[color:var(--tinta)]">Estudio Motion</h1>
          <p className="voz-acento mt-[var(--espacio-8)] text-[color:var(--tinta-suave)]">
            Obras en movimiento
          </p>
        </header>

        {/* Escenario principal: reproductor 16:9 sobre --vacio con borde --riel al 40 % */}
        {isLoading ? (
          <Skeleton className="aspect-video w-full" />
        ) : errorVideo ? (
          <div className="flex aspect-video w-full items-center justify-center border border-[color:var(--borde-reposo)] bg-[color:var(--vacio)] p-[var(--espacio-24)]">
            <EmptyState
              titulo="No pudimos reproducir este video. Inténtalo de nuevo."
              icono={
                <span className="inline-grid h-[var(--espacio-32)] w-[var(--espacio-32)] place-items-center rounded-[var(--radio-circulo)] border border-[color:var(--aviso)] font-[var(--fuente-poster)] text-[length:var(--text-h3)] leading-none text-[color:var(--aviso)]">
                  !
                </span>
              }
              accion={
                <Button
                  variante="secundario"
                  onClick={() => {
                    setErrorVideo(false);
                    setTiempoActual(0);
                    setReproduciendo(false);
                  }}
                >
                  Reintentar
                </Button>
              }
            />
          </div>
        ) : (
          <div
            ref={escenarioRef}
            className="relative flex aspect-video w-full flex-col justify-between overflow-hidden border border-[color:var(--borde-reposo)] bg-[color:var(--vacio)]"
          >
            {/* Lienzo / Póster de la pieza sobre --vacio (sin recorte, sin texto encima) */}
            <div className="relative flex flex-1 min-h-0 items-center justify-center p-[var(--espacio-24)]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 transition-opacity duration-[var(--duracion-momento-min)] ease-[var(--curva-base)]"
                style={{
                  opacity: reproduciendo ? 0.9 : 0.45,
                  background:
                    "radial-gradient(ellipse 60% 55% at 50% 55%, var(--luz-escenario-obra), transparent 72%)",
                }}
              />

              {piezaActiva.posterUrl ? (
                <img
                  src={piezaActiva.posterUrl}
                  alt={piezaActiva.titulo}
                  decoding="async"
                  className="relative z-10 h-full w-full object-contain"
                />
              ) : (
                <div
                  aria-label={piezaActiva.titulo}
                  className="relative z-10 h-4/5 w-4/5 border border-[color:var(--borde-reposo)]"
                  style={{
                    background:
                      "radial-gradient(circle at 50% 50%, var(--vacio) 0 28%, transparent 29%), linear-gradient(180deg, var(--profundidad), var(--carmesi))",
                  }}
                />
              )}
            </div>

            {/* Controles propios y sobrios: reproducir/pausar, barra de tiempo de 2 px en --riel, volumen y pantalla completa */}
            <div className="relative z-20 flex flex-col gap-[var(--espacio-12)] border-t border-[color:var(--divisor)] bg-[color:var(--fondo)]/90 px-[var(--espacio-24)] py-[var(--espacio-12)]">
              {/* Barra de tiempo de 2 px en --riel */}
              <div
                role="slider"
                tabIndex={0}
                aria-label="Posición de reproducción"
                aria-valuemin={0}
                aria-valuemax={piezaActiva.duracionSegundos}
                aria-valuenow={Math.round(tiempoActual)}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                  setTiempoActual(ratio * piezaActiva.duracionSegundos);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight") {
                    e.preventDefault();
                    setTiempoActual((t) => Math.min(piezaActiva.duracionSegundos, t + 5));
                  } else if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    setTiempoActual((t) => Math.max(0, t - 5));
                  }
                }}
                className="flex h-[var(--espacio-16)] w-full cursor-pointer items-center"
              >
                <div className="h-[2px] w-full bg-[color:var(--divisor)]">
                  <div
                    className="h-full bg-[color:var(--riel)] transition-[width] duration-[var(--duracion-micro)]"
                    style={{ width: `${progresoPorcentaje}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-[var(--espacio-16)]">
                <div className="flex items-center gap-[var(--espacio-16)]">
                  <button
                    type="button"
                    onClick={() => setReproduciendo((r) => !r)}
                    aria-label={reproduciendo ? "Pausar" : "Reproducir"}
                    className="inline-flex min-h-[var(--alto-control-compacto)] items-center gap-[var(--espacio-8)] rounded-[var(--radio-pildora)] border border-[color:var(--riel)] bg-transparent px-[var(--espacio-16)] py-[var(--espacio-4)] font-[var(--fuente-texto)] text-[length:var(--text-cuerpo-pequeno)] font-semibold text-[color:var(--tinta)] hover:border-white cursor-pointer"
                  >
                    {reproduciendo ? (
                      <>
                        <Pause size={16} strokeWidth={1.5} aria-hidden="true" />
                        <span>Pausar</span>
                      </>
                    ) : (
                      <>
                        <Play size={16} strokeWidth={1.5} aria-hidden="true" />
                        <span>Reproducir</span>
                      </>
                    )}
                  </button>

                  <span className="codigo-certificado text-[length:var(--text-cuerpo-pequeno)] text-[color:var(--tinta-suave)]">
                    {formatearSegundos(tiempoActual)} / {piezaActiva.duracionTexto}
                  </span>
                </div>

                <div className="flex items-center gap-[var(--espacio-12)]">
                  <button
                    type="button"
                    onClick={() => setSilenciado((s) => !s)}
                    aria-label={silenciado ? "Activar sonido" : "Silenciar"}
                    aria-pressed={!silenciado}
                    className="inline-grid h-[var(--alto-control-compacto)] w-[var(--alto-control-compacto)] place-items-center rounded-[var(--radio-pildora)] border border-[color:var(--borde-reposo)] bg-transparent text-[color:var(--tinta)] hover:border-white cursor-pointer"
                  >
                    {silenciado ? (
                      <VolumeX size={18} strokeWidth={1.5} aria-hidden="true" />
                    ) : (
                      <Volume2 size={18} strokeWidth={1.5} aria-hidden="true" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={alternarPantallaCompleta}
                    aria-label="Pantalla completa"
                    className="inline-grid h-[var(--alto-control-compacto)] w-[var(--alto-control-compacto)] place-items-center rounded-[var(--radio-pildora)] border border-[color:var(--borde-reposo)] bg-transparent text-[color:var(--tinta)] hover:border-white cursor-pointer"
                  >
                    <Maximize2 size={18} strokeWidth={1.5} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Información de la pieza: título, artista, año, duración, descripción y botón "Ver obra" */}
        <section
          aria-label="Información de la pieza en proyección"
          className="flex flex-col justify-between gap-[var(--espacio-24)] border-b border-[color:var(--divisor)] pb-[var(--espacio-32)] min-[768px]:flex-row min-[768px]:items-start"
        >
          <div className="max-w-[var(--medida-lectura)]">
            <h2 className="voz-h2 text-[color:var(--tinta)]">{piezaActiva.titulo}</h2>
            <p className="voz-cursiva mt-[var(--espacio-4)] text-[color:var(--tinta-suave)]">
              {piezaActiva.artista} · {piezaActiva.anio} ·{" "}
              <span className="font-[var(--fuente-poster)] not-italic tracking-[0.12em] text-[color:var(--tinta)]">
                {piezaActiva.duracionTexto}
              </span>
            </p>
            <p className="voz-cuerpo mt-[var(--espacio-16)] text-[color:var(--tinta-suave)]">
              {piezaActiva.descripcion}
            </p>
          </div>

          <div className="shrink-0">
            <Link to={destinoVerObra}>
              <Button variante="primario">Ver obra</Button>
            </Link>
          </div>
        </section>

        {/* Otras piezas: tira horizontal de miniaturas 16:9 con la duración en Anton */}
        <section aria-labelledby="heading-otras-piezas-motion">
          <h3
            id="heading-otras-piezas-motion"
            className="voz-etiqueta mb-[var(--espacio-16)] text-[color:var(--tinta-suave)]"
          >
            Otras piezas
          </h3>

          <div
            ref={pistaRef}
            tabIndex={0}
            aria-label="Otras piezas en movimiento: desliza horizontalmente"
            onWheel={(e) => {
              const pista = pistaRef.current;
              if (!pista) return;
              if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                e.preventDefault();
                pista.scrollLeft += e.deltaY;
              }
            }}
            onMouseDown={(e) => {
              if (e.button !== 0 || !pistaRef.current) return;
              setArrastrandoPista(true);
              dragInicioXRef.current = e.clientX;
              dragScrollInicialRef.current = pistaRef.current.scrollLeft;
            }}
            onMouseMove={(e) => {
              if (!arrastrandoPista || !pistaRef.current) return;
              const dx = e.clientX - dragInicioXRef.current;
              pistaRef.current.scrollLeft = dragScrollInicialRef.current - dx;
            }}
            onMouseUp={() => setArrastrandoPista(false)}
            onMouseLeave={() => setArrastrandoPista(false)}
            className={clsx(
              "flex gap-[var(--espacio-24)] overflow-x-auto pb-[var(--espacio-16)]",
              arrastrandoPista ? "cursor-grabbing select-none" : "cursor-grab"
            )}
          >
            {piezas.map((pieza, idx) => {
              const activa = idx === indiceActivo;
              return (
                <button
                  key={pieza.id}
                  type="button"
                  onClick={() => seleccionarPieza(idx)}
                  aria-current={activa ? "true" : undefined}
                  className={clsx(
                    "flex w-[280px] shrink-0 flex-col border bg-[color:var(--fondo)] text-left transition-colors duration-[var(--duracion-hover)] cursor-pointer",
                    activa
                      ? "border-[color:var(--riel)] shadow-[var(--sombra-iluminacion-roja)]"
                      : "border-[color:var(--borde-reposo)] hover:border-[color:var(--borde-hover)]"
                  )}
                >
                  <div className=" flex aspect-video w-full items-center justify-center bg-[color:var(--vacio)] p-[var(--espacio-8)]">
                    {pieza.posterUrl ? (
                      <img
                        src={pieza.posterUrl}
                        alt={pieza.titulo}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        className="h-3/4 w-3/4 border border-[color:var(--borde-reposo)]"
                        style={{
                          background:
                            "radial-gradient(circle at 50% 50%, var(--vacio) 0 30%, transparent 31%), linear-gradient(180deg, var(--profundidad), var(--carmesi))",
                        }}
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-[var(--espacio-12)] border-t border-[color:var(--divisor)] p-[var(--espacio-16)]">
                    <div className="min-w-0">
                      <p className="truncate font-[var(--fuente-titulo)] text-[length:var(--text-cuerpo)] font-black text-[color:var(--tinta)]">
                        {pieza.titulo}
                      </p>
                      <p className="voz-cursiva truncate text-[length:var(--text-cuerpo-pequeno)] text-[color:var(--tinta-suave)]">
                        {pieza.artista}
                      </p>
                    </div>
                    <span className="codigo-certificado shrink-0 font-[var(--fuente-poster)] text-[length:var(--text-minimo)] uppercase tracking-[0.12em] text-[color:var(--riel)]">
                      {pieza.duracionTexto}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
