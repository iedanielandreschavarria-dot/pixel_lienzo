import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { listarCatalogo, urlPreviewObra } from "../api/obras";
import { listarCategorias } from "../api/categorias";
import { ObraCard } from "../components/ObraCard";
import { CylinderCarousel, type ImagenCarrusel } from "../components/ui/cylinder-carousel";
import { PerspectiveGrid } from "../components/ui/perspective-grid";

const MUELLE = { type: "spring" as const, stiffness: 300, damping: 25 };
const ALTURAS_ESQUELETO = ["h-64", "h-80", "h-72", "h-96", "h-60", "h-80", "h-72", "h-64"];

function completarAnillo(laminas: ImagenCarrusel[]): ImagenCarrusel[] {
  if (laminas.length === 0 || laminas.length >= 8) return laminas;
  const vueltas = Math.ceil(8 / laminas.length);
  return Array.from({ length: vueltas }, (_, vuelta) =>
    laminas.map((lamina) => ({ ...lamina, decorativa: vuelta > 0 }))
  ).flat();
}

function useAnchoLamina() {
  const [ancho, setAncho] = useState(112);

  useEffect(() => {
    const consulta = window.matchMedia("(min-width: 768px)");
    const aplicar = () => setAncho(consulta.matches ? 148 : 104);
    aplicar();
    consulta.addEventListener("change", aplicar);
    return () => consulta.removeEventListener("change", aplicar);
  }, []);

  return ancho;
}

function EsqueletoCilindro() {
  return (
    <div className="flex h-full items-end justify-center gap-3 pb-6 sm:items-center sm:pb-0" role="status">
      <span className="sr-only">Cargando obras…</span>
      <div className="h-36 w-14 animate-pulse bg-antracita sm:h-52 sm:w-16" />
      <div className="h-48 w-20 animate-pulse bg-antracita-suave sm:h-72 sm:w-24" />
      <div className="h-36 w-14 animate-pulse bg-antracita sm:h-52 sm:w-16" />
    </div>
  );
}

function EsqueletoGaleria() {
  return (
    <div className="galeria-masonry" role="status" aria-label="Cargando colección">
      {ALTURAS_ESQUELETO.map((altura, indice) => (
        <div key={indice} className={`mb-6 animate-pulse bg-antracita ${altura}`} />
      ))}
    </div>
  );
}

export function CatalogoPage() {
  const [idCategoria, setIdCategoria] = useState<number | "">("");
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const reducirMovimiento = useReducedMotion() === true;
  const anchoLamina = useAnchoLamina();

  const filtros = useMemo(
    () => ({
      id_categoria: idCategoria === "" ? undefined : Number(idCategoria),
      precio_min: precioMin === "" ? undefined : Number(precioMin),
      precio_max: precioMax === "" ? undefined : Number(precioMax),
    }),
    [idCategoria, precioMin, precioMax]
  );

  const { data: categorias } = useQuery({ queryKey: ["categorias"], queryFn: listarCategorias });
  const {
    data: obrasPortada,
    isLoading: cargandoPortada,
    isError: errorPortada,
  } = useQuery({
    queryKey: ["catalogo", "portada"],
    queryFn: () => listarCatalogo(),
  });
  const {
    data: obras,
    isLoading,
    isError,
  } = useQuery({ queryKey: ["catalogo", filtros], queryFn: () => listarCatalogo(filtros) });

  const hayFiltrosActivos = idCategoria !== "" || precioMin !== "" || precioMax !== "";

  const caras = useMemo(() => {
    const laminas = (obrasPortada ?? []).map((obra) => ({
      src: urlPreviewObra(obra.id_obra),
      alt: obra.titulo,
      href: `/obras/${obra.id_obra}`,
    }));
    return completarAnillo(laminas);
  }, [obrasPortada]);

  const verColeccion = () => {
    document.getElementById("coleccion")?.scrollIntoView({
      behavior: reducirMovimiento ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <div>
      <section
        aria-labelledby="titulo-sala"
        className="relative h-[calc(100svh-var(--alto-header,4.75rem))] overflow-hidden"
      >
        <PerspectiveGrid suelo className="absolute inset-0" />

        <div className="relative z-10 mx-auto grid h-full min-h-0 w-full max-w-7xl content-center grid-rows-[auto_auto] gap-1 px-6 py-4 sm:px-10 md:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] md:grid-rows-1 md:content-stretch md:gap-8 md:py-8">
          <div className="flex max-w-md flex-col justify-center">
            <h1
              id="titulo-sala"
              className="font-[var(--font-display)] text-[2.65rem] font-medium leading-[0.95] text-marfil sm:text-6xl lg:text-7xl"
            >
              Pixel y Lienzo
            </h1>
            <p className="mt-4 max-w-[34rem] text-sm leading-relaxed text-marfil-suave sm:mt-5 sm:text-base">
              Obras originales del Palacio Nacional. Cada pieza lleva certificado y un código para comprobarla.
            </p>
            <motion.button
              type="button"
              onClick={verColeccion}
              whileHover={reducirMovimiento ? undefined : { y: -2 }}
              whileTap={reducirMovimiento ? undefined : { scale: 0.97 }}
              transition={reducirMovimiento ? { duration: 0 } : MUELLE}
              className="mt-5 inline-flex w-fit items-center justify-center self-start rounded-full bg-ocre px-6 py-2.5 text-sm font-medium text-carbon transition-colors duration-150 hover:bg-ocre-suave focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocre sm:mt-8"
            >
              Ver la colección
            </motion.button>
          </div>

          <div className="h-[42svh] max-h-80 min-h-48 md:h-full md:max-h-none">
            {cargandoPortada && <EsqueletoCilindro />}
            {errorPortada && (
              <p className="flex h-full items-center text-sm text-terracota" role="alert">
                No fue posible cargar las obras.
              </p>
            )}
            {!cargandoPortada && !errorPortada && caras.length > 0 && (
              <CylinderCarousel images={caras} cardWidth={anchoLamina} animationDuration={48} className="h-full" />
            )}
            {!cargandoPortada && !errorPortada && caras.length === 0 && (
              <p className="flex h-full items-center text-sm text-marfil-suave">Todavía no hay obras publicadas.</p>
            )}
          </div>
        </div>
      </section>

      <section
        id="coleccion"
        aria-label="Colección"
        className="scroll-mt-[var(--alto-header,4.75rem)] border-t border-antracita-suave/40"
      >
        <div className="mx-auto max-w-7xl px-6 py-14 sm:px-10">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6 border-b border-antracita-suave/50 pb-8">
            <div className="flex flex-wrap items-end gap-5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="filtro-categoria" className="text-xs text-marfil-suave">
                  Categoría
                </label>
                <select
                  id="filtro-categoria"
                  value={idCategoria}
                  onChange={(e) => setIdCategoria(e.target.value === "" ? "" : Number(e.target.value))}
                  className="rounded-full border border-antracita-suave bg-antracita px-4 py-2 text-sm text-marfil focus:outline-none focus-visible:ring-1 focus-visible:ring-ocre/60"
                >
                  <option value="">Todas</option>
                  {categorias?.map((c) => (
                    <option key={c.id_categoria} value={c.id_categoria}>
                      {c.nombre_categoria}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="filtro-precio-min" className="text-xs text-marfil-suave">
                  Precio mínimo
                </label>
                <input
                  id="filtro-precio-min"
                  type="number"
                  min={0}
                  value={precioMin}
                  onChange={(e) => setPrecioMin(e.target.value)}
                  placeholder="$0"
                  className="w-32 rounded-full border border-antracita-suave bg-antracita px-4 py-2 text-sm text-marfil placeholder:text-marfil-suave/50 focus:outline-none focus-visible:ring-1 focus-visible:ring-ocre/60"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="filtro-precio-max" className="text-xs text-marfil-suave">
                  Precio máximo
                </label>
                <input
                  id="filtro-precio-max"
                  type="number"
                  min={0}
                  value={precioMax}
                  onChange={(e) => setPrecioMax(e.target.value)}
                  placeholder="Sin límite"
                  className="w-32 rounded-full border border-antracita-suave bg-antracita px-4 py-2 text-sm text-marfil placeholder:text-marfil-suave/50 focus:outline-none focus-visible:ring-1 focus-visible:ring-ocre/60"
                />
              </div>
              {hayFiltrosActivos && (
                <button
                  type="button"
                  onClick={() => {
                    setIdCategoria("");
                    setPrecioMin("");
                    setPrecioMax("");
                  }}
                  className="self-center text-sm text-terracota underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocre"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
            {obras && obras.length > 0 && (
              <p className="text-sm text-marfil-suave">
                {obras.length} {obras.length === 1 ? "obra" : "obras"}
              </p>
            )}
          </div>

          {isLoading && <EsqueletoGaleria />}
          {isError && <p className="py-16 text-center text-terracota">No fue posible cargar el catálogo.</p>}
          {obras && obras.length === 0 && (
            <p className="py-24 text-center text-marfil-suave">No hay obras que coincidan con estos filtros.</p>
          )}
          {obras && obras.length > 0 && (
            <div className="galeria-masonry">
              {obras.map((obra) => (
                <ObraCard key={obra.id_obra} obra={obra} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
