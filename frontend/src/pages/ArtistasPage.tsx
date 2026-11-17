import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import clsx from "clsx";
import { listarCatalogo } from "../api/obras";
import { obtenerPerfilArtista } from "../api/artistas";
import { Ambiente } from "../components/escena/Ambiente";
import { ObraCard } from "../components/ObraCard";
import { ArtistaCard } from "../components/ui/ArtistaCard";
import { Breadcrumbs } from "../components/ui/Breadcrumbs";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Input } from "../components/ui/Input";
import { Pagination } from "../components/ui/Pagination";
import { SectionError } from "../components/ui/SectionError";
import { Select } from "../components/ui/Select";
import { PageProgressBar, Skeleton, SkeletonCardGrid } from "../components/ui/Skeleton";
import { Tabs } from "../components/ui/Tabs";
import { NotFoundPage } from "./NotFoundPage";

const POR_PAGINA = 24;

interface ResumenArtistaDirectorio {
  idArtista: number;
  nombre: string;
  disciplina: string;
  obrasPublicadas: number;
}

type PestanaPerfil = "obras" | "acerca";

/**
 * 6.5 Perfil público de artista (Nivel 2):
 * Retrato cuadrado de 280 px con fundido de 600 ms sobre la luz estática,
 * H1 con el nombre, disciplina, biografía corta (hasta 600 caracteres con "Leer más"),
 * pestañas "Obras" y "Acerca de" en Anton con subrayado de 2 px en --riel,
 * y estado vacío "Este artista aún no tiene obras publicadas.".
 */
export function ArtistaPublicoPage({ idArtistaProp }: { idArtistaProp?: number }) {
  const params = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const idResuelto =
    idArtistaProp ??
    (params.id ? Number(params.id) : Number(searchParams.get("perfil_artista") ?? "0"));

  const [retratoVisible, setRetratoVisible] = useState(false);
  const [biografiaExpandida, setBiografiaExpandida] = useState(false);
  const [pestanaActiva, setPestanaActiva] = useState<PestanaPerfil>("obras");

  const {
    data: perfil,
    isLoading: cargandoPerfil,
    isError: errorPerfil,
  } = useQuery({
    queryKey: ["artista-publico", idResuelto],
    queryFn: () => obtenerPerfilArtista(idResuelto),
    enabled: idResuelto > 0,
    retry: false,
  });

  const {
    data: obrasArtista,
    isLoading: cargandoObras,
    isError: errorObras,
    refetch: recargarObras,
  } = useQuery({
    queryKey: ["catalogo", "artista-publico", idResuelto],
    queryFn: () => listarCatalogo({ id_artista: idResuelto }),
    enabled: idResuelto > 0,
  });

  // Momento teatral: el retrato aparece con un fundido de 600 ms sobre la luz estática
  useEffect(() => {
    setRetratoVisible(false);
    setBiografiaExpandida(false);
    setPestanaActiva("obras");
    const timer = window.setTimeout(() => setRetratoVisible(true), 40);
    return () => window.clearTimeout(timer);
  }, [idResuelto]);

  const nombreArtista = `Artista N.º ${idResuelto}`;

  useEffect(() => {
    if (idResuelto > 0) {
      document.title = `${nombreArtista} · Pixel & Lienzo`;
    }
  }, [idResuelto, nombreArtista]);

  const disciplinaPrincipal = useMemo(() => {
    const primeraTecnica = obrasArtista?.[0]?.tecnica?.trim();
    return primeraTecnica || "Artes visuales";
  }, [obrasArtista]);

  if (cargandoPerfil) {
    return (
      <div className="relative min-h-screen py-[var(--espacio-48)]">
        <PageProgressBar etiqueta="Cargando perfil del artista…" />
        <Ambiente nivel={2} />
        <div className="contenedor-pyl relative z-10 flex flex-col gap-[var(--espacio-32)]">
          <Skeleton className="h-[var(--espacio-16)] w-48" />
          <div className="flex flex-col gap-[var(--espacio-32)] min-[768px]:flex-row">
            <Skeleton className="h-[var(--retrato-artista)] w-[var(--retrato-artista)] shrink-0" />
            <div className="flex flex-1 flex-col gap-[var(--espacio-16)]">
              <Skeleton className="h-[var(--espacio-48)] w-1/2" />
              <Skeleton className="h-[var(--espacio-24)] w-1/3" />
              <Skeleton className="h-[var(--espacio-96)] w-full max-w-[var(--medida-lectura)]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (idResuelto <= 0 || (errorPerfil && !obrasArtista?.length)) {
    return <NotFoundPage />;
  }

  const biografiaCompleta =
    perfil?.biografia_profesional?.trim() ||
    "Autor vinculado al catálogo verificado de Pixel & Lienzo.";
  const requiereLeerMas = biografiaCompleta.length > 600;
  const biografiaMostrada =
    requiereLeerMas && !biografiaExpandida
      ? `${biografiaCompleta.slice(0, 600)}…`
      : biografiaCompleta;

  const obrasPublicadas = obrasArtista ?? [];

  return (
    <div className="relative min-h-screen py-[var(--espacio-48)]">
      <Ambiente nivel={2} />

      <div className="contenedor-pyl relative z-10 flex flex-col gap-[var(--espacio-32)]">
        <Breadcrumbs
          items={[
            { etiqueta: "Artistas", to: "/#artistas" },
            { etiqueta: nombreArtista },
          ]}
        />

        {/* Bloque superior: retrato cuadrado de 280 px a la izquierda y datos a la derecha */}
        <header className="flex flex-col items-start gap-[var(--espacio-32)] min-[768px]:flex-row min-[768px]:items-center">
          <div
            className={clsx(
              "grid h-[var(--retrato-artista)] w-[var(--retrato-artista)] shrink-0 place-items-center border border-[color:var(--borde-reposo)] bg-[color:var(--vacio)] shadow-[var(--sombra-iluminacion-roja)] transition-opacity duration-[600ms] ease-[var(--curva-base)]",
              retratoVisible ? "opacity-100" : "opacity-0"
            )}
            style={{
              background:
                "radial-gradient(circle at 50% 50%, var(--vacio) 0 32%, transparent 33%), linear-gradient(180deg, var(--profundidad), var(--carmesi))",
            }}
          >
            <span className="font-[var(--fuente-titulo)] text-[length:var(--text-display-movil)] font-black text-[color:var(--tinta)]">
              A{idResuelto}
            </span>
          </div>

          <div className="flex flex-1 flex-col gap-[var(--espacio-12)]">
            <h1 className="voz-h1 text-[color:var(--tinta)]">{nombreArtista}</h1>
            <p className="voz-acento text-[color:var(--tinta-suave)]">{disciplinaPrincipal}</p>

            <div className="mt-[var(--espacio-8)] max-w-[var(--medida-lectura)]">
              <p className="voz-cuerpo text-[color:var(--tinta-suave)]">{biografiaMostrada}</p>
              {requiereLeerMas && (
                <button
                  type="button"
                  onClick={() => setBiografiaExpandida((v) => !v)}
                  className="enlace-acceso mt-[var(--espacio-8)] bg-transparent border-0 p-0 text-[length:var(--text-cuerpo-pequeno)] cursor-pointer"
                >
                  {biografiaExpandida ? "Mostrar menos" : "Leer más"}
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Pestañas "Obras" y "Acerca de" en Anton con subrayado de 2 px en --riel */}
        <Tabs<PestanaPerfil>
          ariaLabel="Secciones del perfil de artista"
          activa={pestanaActiva}
          onChange={setPestanaActiva}
          items={[
            { id: "obras", etiqueta: "Obras", conteo: obrasPublicadas.length },
            { id: "acerca", etiqueta: "Acerca de" },
          ]}
        />

        {pestanaActiva === "obras" ? (
          <section aria-label="Obras del artista">
            {cargandoObras && <SkeletonCardGrid cantidad={6} />}

            {!cargandoObras && errorObras && (
              <SectionError
                recurso="las obras del artista"
                onReintentar={() => {
                  void recargarObras();
                }}
              />
            )}

            {!cargandoObras && !errorObras && obrasPublicadas.length === 0 && (
              <EmptyState titulo="Este artista aún no tiene obras publicadas." />
            )}

            {!cargandoObras && !errorObras && obrasPublicadas.length > 0 && (
              <div className="rejilla-obras">
                {obrasPublicadas.map((obra) => (
                  <ObraCard key={obra.id_obra} obra={obra} />
                ))}
              </div>
            )}
          </section>
        ) : (
          <section
            aria-label="Acerca del artista"
            className="max-w-[var(--medida-lectura)] py-[var(--espacio-16)]"
          >
            <h2 className="voz-h3 mb-[var(--espacio-16)] text-[color:var(--tinta)]">
              Trayectoria
            </h2>
            <p className="voz-cuerpo-grande text-[color:var(--tinta-suave)]">
              {biografiaCompleta}
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

/**
 * 6.5 Listado de artistas (Nivel 2):
 * H1 "Artistas" con la frase en cursiva "Quienes hacen posible cada obra.",
 * búsqueda y filtro por disciplina, rejilla de tarjetas de artista según 3.3,
 * 24 por página, orden alfabético por defecto.
 */
export function ArtistasPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const idPerfil = Number(searchParams.get("perfil_artista") ?? "0");

  const [busqueda, setBusqueda] = useState("");
  const [disciplinaFiltro, setDisciplinaFiltro] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);

  const {
    data: obras,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["catalogo", "directorio-artistas"],
    queryFn: () => listarCatalogo(),
    enabled: idPerfil <= 0,
  });

  useEffect(() => {
    if (idPerfil <= 0) {
      document.title = "Artistas · Pixel & Lienzo";
    }
  }, [idPerfil]);

  const artistasBase: ResumenArtistaDirectorio[] = useMemo(() => {
    const mapa = new Map<number, ResumenArtistaDirectorio>();
    for (const obra of obras ?? []) {
      const existente = mapa.get(obra.id_artista);
      if (existente) {
        existente.obrasPublicadas += 1;
      } else {
        mapa.set(obra.id_artista, {
          idArtista: obra.id_artista,
          nombre: `Artista N.º ${obra.id_artista}`,
          disciplina: obra.tecnica?.trim() || "Artes visuales",
          obrasPublicadas: 1,
        });
      }
    }
    return Array.from(mapa.values()).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [obras]);

  const disciplinasDisponibles = useMemo(() => {
    const set = new Set<string>();
    for (const a of artistasBase) {
      if (a.disciplina) set.add(a.disciplina);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [artistasBase]);

  const artistasFiltrados = useMemo(() => {
    return artistasBase.filter((a) => {
      if (busqueda.trim() !== "") {
        const q = busqueda.trim().toLowerCase();
        if (!a.nombre.toLowerCase().includes(q) && !a.disciplina.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (disciplinaFiltro !== "" && a.disciplina !== disciplinaFiltro) {
        return false;
      }
      return true;
    });
  }, [artistasBase, busqueda, disciplinaFiltro]);

  const totalPaginas = Math.max(1, Math.ceil(artistasFiltrados.length / POR_PAGINA));
  const paginaSegura = Math.min(paginaActual, totalPaginas);
  const artistasPaginados = useMemo(() => {
    const inicio = (paginaSegura - 1) * POR_PAGINA;
    return artistasFiltrados.slice(inicio, inicio + POR_PAGINA);
  }, [artistasFiltrados, paginaSegura]);

  if (idPerfil > 0) {
    return <ArtistaPublicoPage idArtistaProp={idPerfil} />;
  }

  return (
    <div id="artistas" className="relative min-h-screen py-[var(--espacio-48)]">
      <Ambiente nivel={2} />

      <div className="contenedor-pyl relative z-10">
        {/* Cabecera: H1 "Artistas" con la frase en cursiva "Quienes hacen posible cada obra." */}
        <header className="mb-[var(--espacio-32)]">
          <h1 className="voz-h1 text-[color:var(--tinta)]">Artistas</h1>
          <p className="voz-acento mt-[var(--espacio-8)] text-[color:var(--tinta-suave)]">
            Quienes hacen posible cada obra.
          </p>
        </header>

        {/* Búsqueda y filtro por disciplina */}
        <div className="mb-[var(--espacio-32)] flex flex-wrap items-end justify-between gap-[var(--espacio-16)] border-b border-[color:var(--divisor)] pb-[var(--espacio-24)]">
          <div className="flex flex-1 flex-wrap items-end gap-[var(--espacio-16)]">
            <div className="relative min-w-[min(280px,100%)] flex-1 max-w-[var(--contenedor-formulario)]">
              <Input
                variante="caja"
                label="Buscar artista"
                type="search"
                placeholder="Nombre o disciplina…"
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPaginaActual(1);
                }}
                className="pr-[var(--espacio-48)]"
              />
              <Search
                size={20}
                strokeWidth={1.5}
                aria-hidden="true"
                className="pointer-events-none absolute right-[var(--espacio-16)] bottom-[14px] text-[color:var(--tinta-suave)]"
              />
            </div>

            <div className="min-w-[220px]">
              <Select
                label="Disciplina"
                value={disciplinaFiltro}
                onChange={(e) => {
                  setDisciplinaFiltro(e.target.value);
                  setPaginaActual(1);
                }}
              >
                <option value="">Todas las disciplinas</option>
                {disciplinasDisponibles.map((disc) => (
                  <option key={disc} value={disc}>
                    {disc}
                  </option>
                ))}
              </Select>
            </div>

            {(busqueda.trim() !== "" || disciplinaFiltro !== "") && (
              <Button
                type="button"
                variante="terciario"
                onClick={() => {
                  setBusqueda("");
                  setDisciplinaFiltro("");
                  setPaginaActual(1);
                }}
              >
                Limpiar filtros
              </Button>
            )}
          </div>

          <p className="precio-obra pb-[var(--espacio-12)] text-[length:var(--text-cuerpo-pequeno)] text-[color:var(--tinta-suave)]">
            {artistasFiltrados.length} {artistasFiltrados.length === 1 ? "artista" : "artistas"}
          </p>
        </div>

        {isLoading && <SkeletonCardGrid cantidad={8} />}

        {!isLoading && isError && (
          <SectionError
            recurso="los artistas"
            onReintentar={() => {
              void refetch();
            }}
          />
        )}

        {!isLoading && !isError && artistasFiltrados.length === 0 && (
          <EmptyState
            titulo="Ningún artista coincide con tu búsqueda."
            accion={
              (busqueda.trim() !== "" || disciplinaFiltro !== "") ? (
                <Button
                  variante="secundario"
                  onClick={() => {
                    setBusqueda("");
                    setDisciplinaFiltro("");
                    setPaginaActual(1);
                    setSearchParams({}, { replace: true });
                  }}
                >
                  Limpiar filtros
                </Button>
              ) : undefined
            }
          />
        )}

        {!isLoading && !isError && artistasPaginados.length > 0 && (
          <>
            <div className="rejilla-obras">
              {artistasPaginados.map((artista) => (
                <ArtistaCard
                  key={artista.idArtista}
                  idArtista={artista.idArtista}
                  nombre={artista.nombre}
                  disciplina={artista.disciplina}
                  obrasPublicadas={artista.obrasPublicadas}
                  href={`/?perfil_artista=${artista.idArtista}#artistas`}
                />
              ))}
            </div>

            <Pagination
              paginaActual={paginaSegura}
              totalPaginas={totalPaginas}
              onChange={(nuevaPagina) => {
                setPaginaActual(nuevaPagina);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="mt-[var(--espacio-48)]"
            />
          </>
        )}
      </div>
    </div>
  );
}

