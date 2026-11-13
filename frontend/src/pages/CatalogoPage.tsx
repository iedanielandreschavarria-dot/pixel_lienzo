import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { listarCatalogo } from "../api/obras";
import { listarCategorias } from "../api/categorias";
import { formatearMoneda } from "../lib/formato";
import { ObraCard } from "../components/ObraCard";
import { Ambiente } from "../components/escena/Ambiente";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { EmptyState } from "../components/ui/EmptyState";
import { SectionError } from "../components/ui/SectionError";
import { SkeletonCardGrid } from "../components/ui/Skeleton";
import { Pagination } from "../components/ui/Pagination";
import { ArtistasPage } from "./ArtistasPage";
import { CuentaPage } from "./CuentaPage";
import { InicioPage } from "./InicioPage";

type OrdenCatalogo = "recientes" | "precio_menor" | "precio_mayor" | "titulo_az";
type FiltroDisponibilidad = "todas" | "disponibles" | "vendidas";

const POR_PAGINA = 24;

interface ChipFiltro {
  clave: string;
  etiqueta: string;
  alQuitar: () => void;
}

/**
 * 6.3 Catálogo (Nivel 1):
 * H1 "Obras" con riel de 64 x 2 px debajo, barra de herramientas (búsqueda, botón "Filtros",
 * orden y contador), filtros laterales fijos de 280 px en escritorio, pantalla completa de
 * filtros en móvil con "Ver N obras", chips con "×" + "Limpiar filtros", rejilla 3.3 y
 * paginación numerada de 24 obras por página.
 */
export function CatalogoPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [modalFiltrosMovil, setModalFiltrosMovil] = useState(false);

  const enVistaCuenta = searchParams.get("vista") === "cuenta";
  const enVistaArtistas =
    !enVistaCuenta && (location.hash === "#artistas" || searchParams.has("perfil_artista"));
  const enVistaCatalogo =
    !enVistaCuenta &&
    !enVistaArtistas &&
    (location.hash === "#coleccion" || location.search.length > 0);

  // Parámetros sincronizados con la URL
  const busqueda = searchParams.get("q") ?? "";
  const idCategoriaParam = searchParams.get("categoria") ?? "";
  const tecnicaParam = searchParams.get("tecnica") ?? "";
  const idArtistaParam = searchParams.get("artista") ?? "";
  const precioMin = searchParams.get("precio_min") ?? "";
  const precioMax = searchParams.get("precio_max") ?? "";
  const disponibilidad = (searchParams.get("disponibilidad") as FiltroDisponibilidad | null) ?? "todas";
  const orden = (searchParams.get("orden") as OrdenCatalogo | null) ?? "recientes";
  const paginaActual = Math.max(1, Number(searchParams.get("pagina") ?? "1") || 1);

  const actualizarParametros = useCallback(
    (cambios: Record<string, string | null>, resetearPagina = true) => {
      const siguientes = new URLSearchParams(searchParams);
      for (const [clave, valor] of Object.entries(cambios)) {
        if (
          !valor ||
          valor.trim() === "" ||
          (clave === "disponibilidad" && valor === "todas") ||
          (clave === "orden" && valor === "recientes")
        ) {
          siguientes.delete(clave);
        } else {
          siguientes.set(clave, valor);
        }
      }
      if (resetearPagina) {
        siguientes.delete("pagina");
      }
      setSearchParams(siguientes, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const limpiarFiltros = () => {
    const siguientes = new URLSearchParams();
    if (orden !== "recientes") {
      siguientes.set("orden", orden);
    }
    setSearchParams(siguientes, { replace: true });
  };

  useEffect(() => {
    if (enVistaCatalogo) {
      document.title = "Obras · Pixel & Lienzo";
    }
  }, [enVistaCatalogo]);

  // Cierre con Escape del modal móvil de filtros
  useEffect(() => {
    if (!modalFiltrosMovil) return;
    const alTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setModalFiltrosMovil(false);
      }
    };
    window.addEventListener("keydown", alTecla);
    return () => window.removeEventListener("keydown", alTecla);
  }, [modalFiltrosMovil]);

  const filtrosApi = useMemo(
    () => ({
      id_categoria: idCategoriaParam === "" ? undefined : Number(idCategoriaParam),
      id_artista: idArtistaParam === "" ? undefined : Number(idArtistaParam),
      precio_min: precioMin === "" ? undefined : Number(precioMin),
      precio_max: precioMax === "" ? undefined : Number(precioMax),
    }),
    [idCategoriaParam, idArtistaParam, precioMin, precioMax]
  );

  const { data: categorias } = useQuery({
    queryKey: ["categorias"],
    queryFn: listarCategorias,
    enabled: enVistaCatalogo,
  });

  const {
    data: obrasBase,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["catalogo", filtrosApi],
    queryFn: () => listarCatalogo(filtrosApi),
    enabled: enVistaCatalogo,
  });

  // Lista de técnicas disponibles en las obras cargadas
  const tecnicasDisponibles = useMemo(() => {
    const conjunto = new Set<string>();
    for (const obra of obrasBase ?? []) {
      if (obra.tecnica?.trim()) {
        conjunto.add(obra.tecnica.trim());
      }
    }
    return Array.from(conjunto).sort((a, b) => a.localeCompare(b, "es"));
  }, [obrasBase]);

  // Filtrado en cliente complementario (búsqueda, técnica, disponibilidad) y ordenamiento
  const obrasFiltradas = useMemo(() => {
    const lista = [...(obrasBase ?? [])].filter((obra) => {
      if (busqueda.trim() !== "") {
        const q = busqueda.trim().toLowerCase();
        const coincideTitulo = obra.titulo.toLowerCase().includes(q);
        const coincideTecnica = obra.tecnica.toLowerCase().includes(q);
        if (!coincideTitulo && !coincideTecnica) return false;
      }
      if (tecnicaParam !== "" && obra.tecnica.trim() !== tecnicaParam) {
        return false;
      }
      if (disponibilidad === "disponibles" && obra.estado_obra !== "Publicado") {
        return false;
      }
      if (disponibilidad === "vendidas" && obra.estado_obra !== "Vendido") {
        return false;
      }
      return true;
    });

    lista.sort((a, b) => {
      if (orden === "precio_menor") {
        return Number(a.precio_venta) - Number(b.precio_venta);
      }
      if (orden === "precio_mayor") {
        return Number(b.precio_venta) - Number(a.precio_venta);
      }
      if (orden === "titulo_az") {
        return a.titulo.localeCompare(b.titulo, "es");
      }
      // "Más recientes": las disponibles van antes que las vendidas (Sección 6.3)
      const aVendida = a.estado_obra === "Vendido" ? 1 : 0;
      const bVendida = b.estado_obra === "Vendido" ? 1 : 0;
      if (aVendida !== bVendida) return aVendida - bVendida;
      return b.id_obra - a.id_obra;
    });

    return lista;
  }, [obrasBase, busqueda, tecnicaParam, disponibilidad, orden]);

  const hayFiltrosActivos =
    busqueda.trim() !== "" ||
    idCategoriaParam !== "" ||
    tecnicaParam !== "" ||
    idArtistaParam !== "" ||
    precioMin !== "" ||
    precioMax !== "" ||
    disponibilidad !== "todas";

  const chipsActivos: ChipFiltro[] = useMemo(() => {
    const chips: ChipFiltro[] = [];
    if (busqueda.trim() !== "") {
      chips.push({
        clave: "q",
        etiqueta: `Búsqueda: "${busqueda.trim()}"`,
        alQuitar: () => actualizarParametros({ q: null }),
      });
    }
    if (idCategoriaParam !== "") {
      const cat = categorias?.find((c) => String(c.id_categoria) === idCategoriaParam);
      chips.push({
        clave: "categoria",
        etiqueta: cat ? cat.nombre_categoria : `Categoría #${idCategoriaParam}`,
        alQuitar: () => actualizarParametros({ categoria: null }),
      });
    }
    if (tecnicaParam !== "") {
      chips.push({
        clave: "tecnica",
        etiqueta: tecnicaParam,
        alQuitar: () => actualizarParametros({ tecnica: null }),
      });
    }
    if (idArtistaParam !== "") {
      chips.push({
        clave: "artista",
        etiqueta: `Artista #${idArtistaParam}`,
        alQuitar: () => actualizarParametros({ artista: null }),
      });
    }
    if (precioMin !== "") {
      chips.push({
        clave: "precio_min",
        etiqueta: `Desde ${formatearMoneda(precioMin)}`,
        alQuitar: () => actualizarParametros({ precio_min: null }),
      });
    }
    if (precioMax !== "") {
      chips.push({
        clave: "precio_max",
        etiqueta: `Hasta ${formatearMoneda(precioMax)}`,
        alQuitar: () => actualizarParametros({ precio_max: null }),
      });
    }
    if (disponibilidad !== "todas") {
      chips.push({
        clave: "disponibilidad",
        etiqueta: disponibilidad === "disponibles" ? "Disponible" : "Vendida",
        alQuitar: () => actualizarParametros({ disponibilidad: null }),
      });
    }
    return chips;
  }, [
    busqueda,
    idCategoriaParam,
    tecnicaParam,
    idArtistaParam,
    precioMin,
    precioMax,
    disponibilidad,
    categorias,
    actualizarParametros,
  ]);

  const totalPaginas = Math.max(1, Math.ceil(obrasFiltradas.length / POR_PAGINA));
  const paginaSegura = Math.min(paginaActual, totalPaginas);
  const obrasPaginadas = useMemo(() => {
    const inicio = (paginaSegura - 1) * POR_PAGINA;
    return obrasFiltradas.slice(inicio, inicio + POR_PAGINA);
  }, [obrasFiltradas, paginaSegura]);

  if (enVistaCuenta) {
    return <CuentaPage />;
  }

  if (enVistaArtistas) {
    return <ArtistasPage />;
  }

  if (!enVistaCatalogo) {
    return (
      <InicioPage
        onExplorarCatalogo={() => {
          window.scrollTo({ top: 0, behavior: "auto" });
          navigate("/#coleccion");
        }}
      />
    );
  }

  const renderControlesFiltro = (prefijoId: string) => (
    <div className="flex flex-col gap-[var(--espacio-24)]">
      <Select
        id={`${prefijoId}-categoria`}
        label="Categoría"
        value={idCategoriaParam}
        onChange={(e) => actualizarParametros({ categoria: e.target.value || null })}
      >
        <option value="">Todas las categorías</option>
        {categorias?.map((c) => (
          <option key={c.id_categoria} value={String(c.id_categoria)}>
            {c.nombre_categoria}
          </option>
        ))}
      </Select>

      <Select
        id={`${prefijoId}-tecnica`}
        label="Técnica"
        value={tecnicaParam}
        onChange={(e) => actualizarParametros({ tecnica: e.target.value || null })}
      >
        <option value="">Todas las técnicas</option>
        {tecnicasDisponibles.map((tec) => (
          <option key={tec} value={tec}>
            {tec}
          </option>
        ))}
      </Select>

      <div className="grid grid-cols-2 gap-[var(--espacio-12)]">
        <Input
          id={`${prefijoId}-precio-min`}
          variante="caja"
          label="Precio mínimo"
          type="number"
          min={0}
          placeholder="0"
          value={precioMin}
          onChange={(e) => actualizarParametros({ precio_min: e.target.value || null })}
        />
        <Input
          id={`${prefijoId}-precio-max`}
          variante="caja"
          label="Precio máximo"
          type="number"
          min={0}
          placeholder="Sin límite"
          value={precioMax}
          onChange={(e) => actualizarParametros({ precio_max: e.target.value || null })}
        />
      </div>

      <Select
        id={`${prefijoId}-disponibilidad`}
        label="Disponibilidad"
        value={disponibilidad}
        onChange={(e) => actualizarParametros({ disponibilidad: e.target.value })}
      >
        <option value="todas">Todas</option>
        <option value="disponibles">Disponible</option>
        <option value="vendidas">Vendida</option>
      </Select>

      {hayFiltrosActivos && (
        <Button
          type="button"
          variante="terciario"
          onClick={limpiarFiltros}
          className="self-start"
        >
          Limpiar filtros
        </Button>
      )}
    </div>
  );

  return (
    <div id="coleccion" className="relative min-h-screen py-[var(--espacio-48)]">
      <Ambiente nivel={1} />

      <div className="contenedor-pyl relative z-10">
        {/* Cabecera de página: H1 "Obras" con riel de 64 px por 2 px en --riel debajo */}
        <header className="mb-[var(--espacio-32)]">
          <h1 className="voz-h1 text-[color:var(--tinta)]">Obras</h1>
          <div
            aria-hidden="true"
            className="mt-[var(--espacio-12)] h-[2px] w-[var(--espacio-64)] bg-[color:var(--riel)]"
          />
        </header>

        {/* Barra de herramientas: búsqueda, botón "Filtros", orden y contador */}
        <div className="mb-[var(--espacio-24)] flex flex-wrap items-end justify-between gap-[var(--espacio-16)] border-b border-[color:var(--divisor)] pb-[var(--espacio-24)]">
          <div className="flex flex-1 flex-wrap items-end gap-[var(--espacio-16)]">
            <div className="relative min-w-[min(280px,100%)] flex-1 max-w-[var(--contenedor-formulario)]">
              <Input
                variante="caja"
                label="Buscar obra"
                type="search"
                placeholder="Título o técnica…"
                value={busqueda}
                onChange={(e) => actualizarParametros({ q: e.target.value || null })}
                className="pr-[var(--espacio-48)]"
              />
              <Search
                size={20}
                strokeWidth={1.5}
                aria-hidden="true"
                className="pointer-events-none absolute right-[var(--espacio-16)] bottom-[14px] text-[color:var(--tinta-suave)]"
              />
            </div>

            <div className="min-[1024px]:hidden">
              <Button
                type="button"
                variante="secundario"
                onClick={() => setModalFiltrosMovil(true)}
              >
                <SlidersHorizontal size={20} strokeWidth={1.5} aria-hidden="true" />
                <span>Filtros</span>
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-[var(--espacio-24)]">
            <div className="min-w-[220px]">
              <Select
                label="Ordenar por"
                value={orden}
                onChange={(e) =>
                  actualizarParametros({ orden: e.target.value }, false)
                }
              >
                <option value="recientes">Más recientes</option>
                <option value="precio_menor">Precio menor</option>
                <option value="precio_mayor">Precio mayor</option>
                <option value="titulo_az">Título de A a Z</option>
              </Select>
            </div>

            <p
              aria-live="polite"
              className="precio-obra pb-[var(--espacio-12)] text-[length:var(--text-cuerpo-pequeno)] text-[color:var(--tinta-suave)]"
            >
              {obrasFiltradas.length} {obrasFiltradas.length === 1 ? "obra" : "obras"}
            </p>
          </div>
        </div>

        {/* Chips de filtros aplicados con "×" y "Limpiar filtros" */}
        {chipsActivos.length > 0 && (
          <div
            aria-label="Filtros aplicados"
            className="mb-[var(--espacio-24)] flex flex-wrap items-center gap-[var(--espacio-8)]"
          >
            {chipsActivos.map((chip) => (
              <button
                key={chip.clave}
                type="button"
                onClick={chip.alQuitar}
                className="inline-flex min-h-[var(--alto-control-compacto)] items-center gap-[var(--espacio-8)] rounded-[var(--radio-pildora)] border border-[color:var(--riel)] bg-[color:var(--superficie-elevada)] px-[var(--espacio-16)] py-[var(--espacio-4)] font-[var(--fuente-texto)] text-[length:var(--text-cuerpo-pequeno)] text-[color:var(--tinta)] transition-colors duration-[var(--duracion-hover)] hover:border-white cursor-pointer"
              >
                <span>{chip.etiqueta}</span>
                <span aria-hidden="true" className="text-[color:var(--riel)]">
                  ×
                </span>
              </button>
            ))}

            <Button
              type="button"
              variante="terciario"
              onClick={limpiarFiltros}
              className="ml-[var(--espacio-8)]"
            >
              Limpiar filtros
            </Button>
          </div>
        )}

        {/* Cuerpo: filtros laterales fijos de 280 px en escritorio + rejilla de obras */}
        <div className="grid grid-cols-1 gap-[var(--espacio-32)] min-[1024px]:grid-cols-[var(--ancho-filtros-catalogo)_minmax(0,1fr)]">
          <aside
            aria-label="Filtros del catálogo"
            className="hidden self-start border-r border-[color:var(--divisor)] pr-[var(--espacio-24)] min-[1024px]:block"
          >
            <h2 className="voz-etiqueta mb-[var(--espacio-16)] text-[color:var(--tinta-suave)]">
              Filtros
            </h2>
            {renderControlesFiltro("escritorio")}
          </aside>

          <div>
            {isLoading && <SkeletonCardGrid cantidad={12} />}

            {!isLoading && isError && (
              <SectionError
                recurso="las obras"
                onReintentar={() => {
                  void refetch();
                }}
              />
            )}

            {!isLoading && !isError && obrasFiltradas.length === 0 && hayFiltrosActivos && (
              <EmptyState
                titulo="Ninguna obra coincide con tu búsqueda."
                accion={
                  <Button variante="secundario" onClick={limpiarFiltros}>
                    Limpiar filtros
                  </Button>
                }
              />
            )}

            {!isLoading && !isError && obrasFiltradas.length === 0 && !hayFiltrosActivos && (
              <EmptyState titulo="Aún no hay obras publicadas." />
            )}

            {!isLoading && !isError && obrasPaginadas.length > 0 && (
              <>
                <div className="rejilla-obras">
                  {obrasPaginadas.map((obra) => (
                    <ObraCard key={obra.id_obra} obra={obra} />
                  ))}
                </div>

                <Pagination
                  paginaActual={paginaSegura}
                  totalPaginas={totalPaginas}
                  onChange={(nuevaPagina) => {
                    actualizarParametros(
                      { pagina: nuevaPagina > 1 ? String(nuevaPagina) : null },
                      false
                    );
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="mt-[var(--espacio-48)]"
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de pantalla completa para filtros en móvil */}
      {modalFiltrosMovil && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filtros"
          className="fixed inset-0 z-50 flex flex-col bg-[color:var(--fondo)] p-[var(--espacio-24)] min-[1024px]:hidden"
        >
          <div className="flex items-center justify-between border-b border-[color:var(--divisor)] pb-[var(--espacio-16)]">
            <h2 className="voz-h3 text-[color:var(--tinta)]">Filtros</h2>
            <button
              type="button"
              onClick={() => setModalFiltrosMovil(false)}
              aria-label="Cerrar filtros"
              className="inline-grid h-[var(--area-tactil-min)] w-[var(--area-tactil-min)] place-items-center bg-transparent border-0 text-[color:var(--tinta)] cursor-pointer"
            >
              <X size={24} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-[var(--espacio-24)]">
            {renderControlesFiltro("movil")}
          </div>

          <div className="border-t border-[color:var(--divisor)] pt-[var(--espacio-16)]">
            <Button
              type="button"
              variante="primario"
              onClick={() => setModalFiltrosMovil(false)}
              className="w-full"
            >
              Ver {obrasFiltradas.length} {obrasFiltradas.length === 1 ? "obra" : "obras"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
