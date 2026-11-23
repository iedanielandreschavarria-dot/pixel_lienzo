import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import clsx from "clsx";
import { listarCatalogo } from "../api/obras";
import { obtenerUltimaEscena, registrarEscenaActual } from "../lib/transicionEscena";
import { OBRAS_MUESTRA_PALACIO } from "../lib/obrasMuestraPalacio";
import { ObraCard } from "../components/ObraCard";
import { Ambiente } from "../components/escena/Ambiente";
import { Arco } from "../components/escena/Arco";
import { Disco } from "../components/escena/Disco";
import { Entrada } from "../components/escena/Entrada";

export interface InicioPageProps {
  onExplorarCatalogo?: () => void;
}

/**
 * Página de Inicio con scroll natural (sin actos):
 * - Mantiene el arco completo (.arco) con sus rieles extendiéndose hacia abajo al hacer scroll.
 * - En la cúspide del arco (.disco): "Pixel & Lienzo", "Arte con certificado verificable" y únicamente
 *   el botón "Explorar obras" (que anima el arco y envía directamente al catálogo de obras).
 * - Al bajar por el cuerpo del arco: sección "Galería Palacio Nacional" con el bloque
 *   "Encuentra tu obra ideal", mostrando una selección de obras enmarcadas en su ambiente
 *   (que al pasar el mouse se despliegan completas) y el botón "Ver todo" que lleva al catálogo entero (/arte).
 */
export function InicioPage({ onExplorarCatalogo }: InicioPageProps) {
  const navigate = useNavigate();

  const [desdeAcceso] = useState(() => obtenerUltimaEscena().escena === "acceso");
  const [saliendoAlCatalogo, setSaliendoAlCatalogo] = useState(false);
  const timerCatalogoRef = useRef<number | null>(null);

  const { data: obrasBackend } = useQuery({
    queryKey: ["catalogo", "inicio-destacadas"],
    queryFn: () => listarCatalogo(),
    retry: 1,
  });

  // Mostrar 4 obras destacadas en "Encuentra tu obra ideal" (del backend o de la colección de muestra del Palacio)
  const obrasDestacadas = useMemo(() => {
    const disponibles = (obrasBackend ?? []).filter((o) => o.estado_obra === "Publicado");
    const fuente =
      disponibles.length > 0
        ? disponibles
        : obrasBackend && obrasBackend.length > 0
          ? obrasBackend
          : OBRAS_MUESTRA_PALACIO;
    return fuente.slice(0, 4);
  }, [obrasBackend]);

  useEffect(() => {
    document.title = "Pixel & Lienzo · Arte con certificado verificable";
    registrarEscenaActual("inicio", "/");
    return () => {
      if (timerCatalogoRef.current) window.clearTimeout(timerCatalogoRef.current);
    };
  }, []);

  // Sincroniza el progreso de scroll (--p) para la intensidad ambiental de la luz inferior
  useEffect(() => {
    const raiz = document.documentElement;
    let rafPendiente = false;

    const actualizarScroll = () => {
      rafPendiente = false;
      const alto = window.innerHeight || 1;
      const maximo = Math.max(1, document.documentElement.scrollHeight - alto);
      const progreso = Math.max(0, Math.min(1, window.scrollY / maximo));
      raiz.style.setProperty("--p", progreso.toFixed(3));
    };

    const alScroll = () => {
      if (!rafPendiente) {
        rafPendiente = true;
        window.requestAnimationFrame(actualizarScroll);
      }
    };

    actualizarScroll();
    window.addEventListener("scroll", alScroll, { passive: true });
    window.addEventListener("resize", alScroll);
    return () => {
      raiz.style.setProperty("--p", "0");
      window.removeEventListener("scroll", alScroll);
      window.removeEventListener("resize", alScroll);
    };
  }, []);

  const irAlCatalogo = useCallback(
    (rutaDestino = "/arte") => {
      window.scrollTo({ top: 0, behavior: "auto" });
      if (onExplorarCatalogo && rutaDestino === "/arte") {
        onExplorarCatalogo();
      } else {
        navigate(rutaDestino);
      }
    },
    [navigate, onExplorarCatalogo]
  );

  const explorarObrasConAnimacionArco = useCallback(
    (rutaDestino = "/arte") => {
      if (saliendoAlCatalogo) return;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion) {
        irAlCatalogo(rutaDestino);
        return;
      }
      setSaliendoAlCatalogo(true);
      if (timerCatalogoRef.current) window.clearTimeout(timerCatalogoRef.current);
      timerCatalogoRef.current = window.setTimeout(() => {
        irAlCatalogo(rutaDestino);
      }, 820);
    },
    [irAlCatalogo, saliendoAlCatalogo]
  );

  return (
    <div
      className={clsx(
        "pagina-escena text-[color:var(--tinta)]",
        desdeAcceso && "escena-desde-acceso",
        saliendoAlCatalogo && "escena-hacia-catalogo"
      )}
    >
      {/* Entrada: punto de luz una sola vez por sesión (se omite con movimiento reducido) */}
      <Entrada />

      {/* Ambiente de Nivel 3 */}
      <Ambiente nivel={3} />

      {/* Arco completo que nace arriba y se mantiene extendido con sus rieles al bajar */}
      <Arco nivel={3} />

      {/* Disco en la cúspide del arco: únicamente con la acción "Explorar obras" */}
      <Disco
        nivel={3}
        variante="escena"
        titulo="Pixel & Lienzo"
        subtitulo="Arte con certificado verificable"
      >
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => explorarObrasConAnimacionArco("/arte")}
            className="disco-enlace disco-enlace--primario"
          >
            Explorar obras
          </button>
        </div>
      </Disco>

      {/* Siguiente sección al bajar por el arco: Galería Palacio Nacional */}
      <div
        className="relative z-10 mx-auto w-full px-[var(--espacio-16)]"
        style={{
          paddingTop: "calc(var(--margen-superior) + var(--W) * 0.88)",
        }}
      >
        <section
          aria-labelledby="titulo-galeria-palacio-nacional"
          className="mx-auto w-full max-w-[min(860px,calc(var(--W)-48px))] min-w-[min(100%,320px)] border border-[color:var(--borde-reposo)] bg-[#221f1b]/95 p-[var(--espacio-24)] sm:p-[var(--espacio-48)] shadow-[0_24px_70px_rgba(10,9,8,0.45)] backdrop-blur-sm"
        >
          {/* Encabezado y descripción real de Galería Palacio Nacional */}
          <header className="flex flex-col items-center text-center">
            <span className="voz-etiqueta text-[color:var(--riel)]">
              Patrimonio Histórico y Artístico · Medellín
            </span>
            <h2
              id="titulo-galeria-palacio-nacional"
              className="voz-h1 mt-[var(--espacio-12)] text-[color:var(--tinta)]"
            >
              Galería Palacio Nacional
            </h2>
            <div
              aria-hidden="true"
              className="mt-[var(--espacio-16)] h-[2px] w-[var(--espacio-64)] bg-[color:var(--riel)]"
            />
            <p className="voz-cuerpo mt-[var(--espacio-24)] max-w-[54ch] text-[color:var(--tinta-suave)]">
              El Palacio Nacional de Medellín promueve e impulsa la cultura desde su histórico
              edificio neorrománico diseñado por Agustín Goovaerts, trabajando con artistas
              exitosos, establecidos y contemporáneos en sus salas de exhibición para ofrecer una
              amplia gama de arte.
            </p>
          </header>

          {/* Separador */}
          <div className="divisor-riel" aria-hidden="true">
            Palacio Nacional
          </div>

          {/* Bloque: Encuentra tu obra ideal (vista previa de obras + botón "Ver todo") */}
          <div className="mt-[var(--espacio-32)] flex flex-col items-center">
            <p className="voz-etiqueta text-center text-[color:var(--tinta-suave)]">
              Obras en el Palacio Nacional
            </p>
            <h3 className="voz-h2 mt-[var(--espacio-8)] text-center text-[color:var(--tinta)]">
              Encuentra tu obra ideal
            </h3>
            <p className="voz-cursiva mt-[var(--espacio-8)] text-center text-[color:var(--tinta-suave)]">
              Pasa el cursor sobre cada cuadro para contemplar la obra completa en detalle.
            </p>

            {/* Rejilla de 2 columnas con unas cuantas obras seleccionadas */}
            <div
              role="list"
              aria-label="Selección de obras en el Palacio Nacional"
              className="mt-[var(--espacio-32)] grid w-full grid-cols-1 gap-[var(--espacio-24)] sm:grid-cols-2"
            >
              {obrasDestacadas.map((obra, idx) => (
                <ObraCard
                  key={obra.id_obra}
                  obra={obra}
                  prioridad={idx < 2}
                  onSelect={(obraSeleccionada) => {
                    window.scrollTo({ top: 0, behavior: "auto" });
                    navigate(`/arte?obra=${encodeURIComponent(obraSeleccionada.id_obra)}`);
                  }}
                />
              ))}
            </div>

            {/* Botón "Ver todo" que lleva al catálogo entero */}
            <div className="mt-[var(--espacio-32)] flex justify-center">
              <button
                type="button"
                onClick={() => irAlCatalogo("/arte")}
                className="inline-flex min-h-[var(--alto-control)] items-center justify-center gap-3 rounded-[var(--radio-pildora)] border border-[color:var(--riel)] bg-[color:var(--carmesi)] px-9 py-3 font-[var(--fuente-texto)] text-[1.12rem] font-semibold tracking-[0.04em] text-[color:var(--tinta-inversa)] shadow-[var(--resplandor-primario)] transition-all duration-[var(--duracion-hover)] hover:border-white hover:bg-[color:var(--incandescente)] cursor-pointer"
              >
                <span>Ver todo</span>
                <ArrowRight size={19} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
