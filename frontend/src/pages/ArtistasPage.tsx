import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, LayoutDashboard, MapPin, MessageSquarePlus, Palette, Search, Star } from "lucide-react";
import clsx from "clsx";
import { listarCatalogo } from "../api/obras";
import { obtenerPerfilArtista } from "../api/artistas";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { rutaInicialPorRol } from "../lib/navegacion";
import {
  ARTISTAS_MUESTRA_PALACIO,
  agregarResenaArtista,
  calcularPromedioEstrellas,
  listarObrasDeArtistaMuestra,
  listarResenasDeArtista,
  obtenerArtistaMuestra,
  type ResenaArtista,
} from "../lib/artistasMuestraPalacio";
import { OBRAS_MUESTRA_PALACIO, resolverNombreArtistaObra } from "../lib/obrasMuestraPalacio";
import { formatearFecha } from "../lib/formato";
import { Ambiente } from "../components/escena/Ambiente";
import { ObraCard } from "../components/ObraCard";
import { ArtistaCard } from "../components/ui/ArtistaCard";
import { Breadcrumbs } from "../components/ui/Breadcrumbs";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Input } from "../components/ui/Input";
import { Pagination } from "../components/ui/Pagination";
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
  fotoUrl?: string;
  salaPalacio?: string;
  promedioEstrellas: number;
  totalResenas: number;
  comentarioDestacado?: string;
}

type PestanaPerfil = "obras" | "resenas" | "acerca";

/**
 * 6.5 Perfil público de artista (Nivel 2):
 * Retrato cuadrado de 280 px, nombre real del artista, disciplina, calificación promedio con
 * estrellas, sala del Palacio Nacional, biografía corta y pestañas:
 * - "Obras" (con tarjetas de obra en ambiente + hover completo)
 * - "Reseñas (★)" (con listado de reseñas verificadas con estrellas y formulario para dejar una nueva reseña)
 * - "Acerca de" (biografía completa y trayectoria)
 */
export function ArtistaPublicoPage({ idArtistaProp }: { idArtistaProp?: number }) {
  const { user } = useAuth();
  const { notificar } = useToast();
  const params = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const idResuelto =
    idArtistaProp ??
    (params.id ? Number(params.id) : Number(searchParams.get("perfil_artista") ?? "0"));

  const [retratoVisible, setRetratoVisible] = useState(false);
  const [biografiaExpandida, setBiografiaExpandida] = useState(false);
  const [pestanaActiva, setPestanaActiva] = useState<PestanaPerfil>("obras");

  const artistaMuestra = useMemo(() => obtenerArtistaMuestra(idResuelto), [idResuelto]);
  const obrasMuestraArtista = useMemo(
    () => listarObrasDeArtistaMuestra(idResuelto),
    [idResuelto]
  );

  // Estado de reseñas del artista
  const [resenas, setResenas] = useState<ResenaArtista[]>(() =>
    listarResenasDeArtista(idResuelto)
  );
  const [estrellasNueva, setEstrellasNueva] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [estrellasHover, setEstrellasHover] = useState<number | null>(null);
  const [autorNueva, setAutorNueva] = useState(() =>
    user?.correo_electronico ? user.correo_electronico.split("@")[0] ?? "" : ""
  );
  const [obraRelacionadaNueva, setObraRelacionadaNueva] = useState("");
  const [comentarioNuevo, setComentarioNuevo] = useState("");
  const [errorResena, setErrorResena] = useState<string | null>(null);

  useEffect(() => {
    setResenas(listarResenasDeArtista(idResuelto));
  }, [idResuelto]);

  const {
    data: perfilApi,
    isLoading: cargandoPerfil,
    isError: errorPerfil,
  } = useQuery({
    queryKey: ["artista-publico", idResuelto],
    queryFn: () => obtenerPerfilArtista(idResuelto),
    enabled: idResuelto > 0 && !artistaMuestra,
    retry: false,
  });

  const {
    data: obrasArtistaApi,
    isLoading: cargandoObras,
  } = useQuery({
    queryKey: ["catalogo", "artista-publico", idResuelto],
    queryFn: () => listarCatalogo({ id_artista: idResuelto }),
    enabled: idResuelto > 0 && !artistaMuestra,
    retry: 1,
  });

  useEffect(() => {
    setRetratoVisible(false);
    setBiografiaExpandida(false);
    setPestanaActiva("obras");
    const timer = window.setTimeout(() => setRetratoVisible(true), 40);
    return () => window.clearTimeout(timer);
  }, [idResuelto]);

  const obrasPublicadas = useMemo(() => {
    if (obrasArtistaApi && obrasArtistaApi.length > 0) {
      return obrasArtistaApi;
    }
    return obrasMuestraArtista;
  }, [obrasArtistaApi, obrasMuestraArtista]);

  const nombreArtista = useMemo(() => {
    if (artistaMuestra) return artistaMuestra.nombre;
    if (obrasPublicadas[0]) return resolverNombreArtistaObra(obrasPublicadas[0]);
    return `Artista N.º ${idResuelto}`;
  }, [artistaMuestra, obrasPublicadas, idResuelto]);

  useEffect(() => {
    if (idResuelto > 0) {
      document.title = `${nombreArtista} · Artistas · Pixel & Lienzo`;
    }
  }, [idResuelto, nombreArtista]);

  const disciplinaPrincipal = useMemo(() => {
    if (artistaMuestra) return artistaMuestra.disciplina;
    const primeraTecnica = obrasPublicadas[0]?.tecnica?.trim();
    return primeraTecnica || "Artes visuales";
  }, [artistaMuestra, obrasPublicadas]);

  const { promedio: promedioEstrellas, total: totalResenas } = useMemo(
    () => calcularPromedioEstrellas(resenas),
    [resenas]
  );

  if (cargandoPerfil && !artistaMuestra) {
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

  if (idResuelto <= 0 || (!artistaMuestra && errorPerfil && !obrasPublicadas.length)) {
    return <NotFoundPage />;
  }

  const biografiaCompleta =
    artistaMuestra?.biografia ||
    perfilApi?.biografia_profesional?.trim() ||
    "Autor vinculado al catálogo verificado del Palacio Nacional de Medellín en Pixel & Lienzo.";
  const requiereLeerMas = biografiaCompleta.length > 600;
  const biografiaMostrada =
    requiereLeerMas && !biografiaExpandida
      ? `${biografiaCompleta.slice(0, 600)}…`
      : biografiaCompleta;

  const fotoRetrato = artistaMuestra?.foto_url || obrasPublicadas[0]?.fotografia_hd_url;

  const manejarPublicarResena = (e: FormEvent) => {
    e.preventDefault();
    if (autorNueva.trim().length < 2) {
      setErrorResena("Escribe tu nombre para firmar la reseña.");
      return;
    }
    if (comentarioNuevo.trim().length < 12) {
      setErrorResena("Escribe una reseña de al menos 12 caracteres.");
      return;
    }
    const actualizadas = agregarResenaArtista({
      id_artista: idResuelto,
      autor: autorNueva,
      rol_autor: user?.rol === "Comprador" ? "Coleccionista verificado" : "Visitante Sala Palacio Nacional",
      estrellas: estrellasNueva,
      comentario: comentarioNuevo,
      obra_adquirida: obraRelacionadaNueva || undefined,
    });
    setResenas(actualizadas);
    setComentarioNuevo("");
    setObraRelacionadaNueva("");
    setErrorResena(null);
    notificar("¡Gracias! Tu reseña con estrellas fue publicada en el perfil del artista.", "exito");
  };

  return (
    <div className="relative min-h-screen py-[var(--espacio-48)]">
      <Ambiente nivel={2} />

      <div className="contenedor-pyl relative z-10 flex flex-col gap-[var(--espacio-32)]">
        <Breadcrumbs
          items={[
            { etiqueta: "Artistas", to: "/artistas" },
            { etiqueta: nombreArtista },
          ]}
        />

        {/* Bloque superior: retrato cuadrado de 280 px a la izquierda y datos + estrellas a la derecha */}
        <header className="flex flex-col items-start gap-[var(--espacio-32)] min-[768px]:flex-row min-[768px]:items-center">
          <div
            className={clsx(
              "relative h-[var(--retrato-artista)] w-[var(--retrato-artista)] shrink-0 overflow-hidden rounded-[var(--catalog-radius)] border border-[color:var(--borde-reposo)] bg-[color:var(--vacio)] shadow-[var(--sombra-iluminacion-roja)] transition-opacity duration-[600ms] ease-[var(--curva-base)]",
              retratoVisible ? "opacity-100" : "opacity-0"
            )}
          >
            {fotoRetrato ? (
              <img
                src={fotoRetrato}
                alt={nombreArtista}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className="grid h-full w-full place-items-center"
                style={{
                  background:
                    "radial-gradient(circle at 50% 50%, var(--vacio) 0 32%, transparent 33%), linear-gradient(180deg, var(--profundidad), var(--carmesi))",
                }}
              >
                <span className="font-[var(--fuente-titulo)] text-[length:var(--text-display-movil)] font-black text-[color:var(--tinta)]">
                  A{idResuelto}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-[var(--espacio-12)]">
            <div className="flex flex-wrap items-center gap-3">
              {artistaMuestra?.sala_palacio && (
                <span className="inline-flex items-center gap-1.5 border border-[color:var(--riel)] bg-[color:var(--superficie-elevada)] px-3 py-1 font-[var(--fuente-poster)] text-[0.78rem] uppercase tracking-[0.12em] text-[color:var(--riel)]">
                  <MapPin size={13} />
                  <span>{artistaMuestra.sala_palacio}</span>
                </span>
              )}

              {/* Resumen de calificación con estrellas clickable hacia la pestaña de reseñas */}
              <button
                type="button"
                onClick={() => setPestanaActiva("resenas")}
                className="inline-flex items-center gap-2 rounded-[var(--radio-pildora)] border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] px-3.5 py-1 transition-colors hover:border-[color:var(--riel)] cursor-pointer"
              >
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={15}
                      className={
                        n <= Math.round(promedioEstrellas)
                          ? "fill-[#e6b050] text-[#e6b050]"
                          : "fill-transparent text-[color:var(--tinta-suave)]/45"
                      }
                    />
                  ))}
                </div>
                <span className="font-[var(--fuente-texto)] text-[1rem] font-bold text-[color:var(--tinta)]">
                  {promedioEstrellas.toFixed(1)}
                </span>
                <span className="font-[var(--fuente-texto)] text-[0.95rem] text-[color:var(--tinta-suave)] underline underline-offset-4">
                  ({totalResenas} {totalResenas === 1 ? "reseña" : "reseñas"})
                </span>
              </button>
            </div>

            <h1 className="voz-h1 text-[color:var(--tinta)]">{nombreArtista}</h1>
            <p className="voz-acento text-[color:var(--riel)]">{disciplinaPrincipal}</p>

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

        {/* Pestañas: "Obras", "Reseñas" y "Acerca de" */}
        <Tabs<PestanaPerfil>
          ariaLabel="Secciones del perfil de artista"
          activa={pestanaActiva}
          onChange={setPestanaActiva}
          items={[
            { id: "obras", etiqueta: "Obras", conteo: obrasPublicadas.length },
            { id: "resenas", etiqueta: `Reseñas (${promedioEstrellas.toFixed(1)} ★)`, conteo: totalResenas },
            { id: "acerca", etiqueta: "Acerca de" },
          ]}
        />

        {/* PESTAÑA 1: OBRAS DEL ARTISTA */}
        {pestanaActiva === "obras" && (
          <section aria-label="Obras del artista" className="flex flex-col gap-[var(--espacio-48)]">
            {cargandoObras && !artistaMuestra && <SkeletonCardGrid cantidad={4} />}

            {!cargandoObras && obrasPublicadas.length === 0 && (
              <EmptyState titulo="Este artista aún no tiene obras publicadas." />
            )}

            {obrasPublicadas.length > 0 && (
              <div className="catalogo__masonry" role="list">
                {obrasPublicadas.map((obra, idx) => (
                  <ObraCard
                    key={obra.id_obra}
                    obra={obra}
                    nombreArtista={nombreArtista}
                    prioridad={idx < 4}
                  />
                ))}
              </div>
            )}

            {/* Bloque de vista previa de Reseñas debajo de las obras del artista */}
            <div className="border-t border-[color:var(--divisor)] pt-[var(--espacio-32)]">
              <div className="mb-[var(--espacio-24)] flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="voz-etiqueta text-[color:var(--riel)]">
                    Valoraciones de coleccionistas
                  </span>
                  <h2 className="voz-h2 mt-1 text-[color:var(--tinta)]">
                    Reseñas sobre {nombreArtista}
                  </h2>
                </div>
                <Button
                  type="button"
                  variante="secundario"
                  onClick={() => setPestanaActiva("resenas")}
                >
                  <MessageSquarePlus size={17} strokeWidth={1.6} />
                  <span>Ver todas / Escribir reseña ({totalResenas})</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-[var(--espacio-24)] md:grid-cols-2">
                {resenas.slice(0, 2).map((resena) => (
                  <article
                    key={resena.id_resena}
                    className="flex flex-col justify-between gap-4 border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)] shadow-[var(--sombra-tarjeta)]"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1" aria-label={`${resena.estrellas} de 5 estrellas`}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              size={16}
                              className={
                                n <= resena.estrellas
                                  ? "fill-[#e6b050] text-[#e6b050]"
                                  : "fill-transparent text-[color:var(--tinta-suave)]/40"
                              }
                            />
                          ))}
                        </div>
                        <span className="font-[var(--fuente-texto)] text-[0.9rem] text-[color:var(--tinta-suave)]">
                          {formatearFecha(resena.fecha)}
                        </span>
                      </div>

                      <p className="voz-cuerpo mt-3 text-[color:var(--tinta)]">
                        “{resena.comentario}”
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[color:var(--divisor)] pt-3">
                      <div>
                        <p className="font-[var(--fuente-titulo)] text-[1.02rem] font-black text-[color:var(--tinta)]">
                          {resena.autor}
                        </p>
                        <p className="inline-flex items-center gap-1 font-[var(--fuente-texto)] text-[0.9rem] text-[color:var(--riel)]">
                          <CheckCircle2 size={13} />
                          <span>{resena.rol_autor}</span>
                        </p>
                      </div>
                      {resena.obra_adquirida && (
                        <span className="border border-[color:var(--borde-reposo)] bg-[color:var(--fondo)] px-2.5 py-0.5 font-[var(--fuente-texto)] text-[0.88rem] text-[color:var(--tinta-suave)]">
                          Obra: {resena.obra_adquirida}
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* PESTAÑA 2: RESEÑAS CON ESTRELLAS Y FORMULARIO PARA CALIFICAR */}
        {pestanaActiva === "resenas" && (
          <section
            aria-label={`Reseñas sobre ${nombreArtista}`}
            className="grid grid-cols-1 gap-[var(--espacio-32)] lg:grid-cols-[1.25fr_0.75fr] lg:items-start"
          >
            {/* Columna izquierda: Resumen de puntuación y lista de reseñas */}
            <div className="flex flex-col gap-[var(--espacio-24)]">
              {/* Tarjeta resumen de calificación promedio */}
              <div className="flex flex-wrap items-center justify-between gap-6 border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)] sm:p-[var(--espacio-32)]">
                <div className="flex items-center gap-5">
                  <div className="flex h-20 w-20 flex-col items-center justify-center rounded-lg border border-[color:var(--riel)] bg-[color:var(--fondo)]">
                    <span className="font-[var(--fuente-titulo)] text-[2rem] font-black leading-none text-[color:var(--tinta)]">
                      {promedioEstrellas.toFixed(1)}
                    </span>
                    <span className="mt-1 font-[var(--fuente-poster)] text-[0.72rem] uppercase tracking-[0.1em] text-[color:var(--riel)]">
                      de 5.0
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          size={20}
                          className={
                            n <= Math.round(promedioEstrellas)
                              ? "fill-[#e6b050] text-[#e6b050]"
                              : "fill-transparent text-[color:var(--tinta-suave)]/40"
                          }
                        />
                      ))}
                    </div>
                    <p className="voz-h3 mt-1.5 text-[color:var(--tinta)]">
                      Basado en {totalResenas} {totalResenas === 1 ? "reseña verificada" : "reseñas verificadas"}
                    </p>
                    <p className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">
                      Valoraciones de coleccionistas y visitantes de la Sala Palacio Nacional.
                    </p>
                  </div>
                </div>
              </div>

              {/* Lista completa de reseñas con estrellas */}
              <div className="flex flex-col gap-[var(--espacio-16)]">
                {resenas.map((resena) => (
                  <article
                    key={resena.id_resena}
                    className="flex flex-col gap-3 border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)] shadow-[var(--sombra-tarjeta)]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1" aria-label={`${resena.estrellas} de 5 estrellas`}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            size={17}
                            className={
                              n <= resena.estrellas
                                ? "fill-[#e6b050] text-[#e6b050]"
                                : "fill-transparent text-[color:var(--tinta-suave)]/40"
                            }
                          />
                        ))}
                        <span className="ml-2 font-[var(--fuente-texto)] text-[0.95rem] font-bold text-[color:var(--tinta)]">
                          {resena.estrellas}.0 / 5.0
                        </span>
                      </div>
                      <span className="font-[var(--fuente-texto)] text-[0.92rem] text-[color:var(--tinta-suave)]">
                        {formatearFecha(resena.fecha)}
                      </span>
                    </div>

                    <p className="voz-cuerpo text-[color:var(--tinta)]">
                      “{resena.comentario}”
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[color:var(--divisor)] pt-3">
                      <div>
                        <p className="font-[var(--fuente-titulo)] text-[1.05rem] font-black text-[color:var(--tinta)]">
                          {resena.autor}
                        </p>
                        <p className="inline-flex items-center gap-1 font-[var(--fuente-texto)] text-[0.92rem] text-[color:var(--riel)]">
                          <CheckCircle2 size={14} />
                          <span>{resena.rol_autor}</span>
                        </p>
                      </div>

                      {resena.obra_adquirida && (
                        <span className="border border-[color:var(--borde-reposo)] bg-[color:var(--fondo)] px-3 py-1 font-[var(--fuente-texto)] text-[0.9rem] text-[color:var(--tinta-suave)]">
                          Obra reseñada: <strong className="text-[color:var(--tinta)]">{resena.obra_adquirida}</strong>
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* Columna derecha: Formulario interactivo para dejar una reseña con selector de estrellas */}
            <aside className="border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)] sm:p-[var(--espacio-32)] shadow-[var(--sombra-tarjeta)]">
              <span className="voz-etiqueta text-[color:var(--riel)]">Calificar al artista</span>
              <h2 className="voz-h3 mt-1 text-[color:var(--tinta)]">Escribir una reseña</h2>
              <p className="voz-cuerpo-pequeno mt-1 text-[color:var(--tinta-suave)]">
                Comparte tu experiencia con la obra de {nombreArtista} en el Palacio Nacional.
              </p>

              <form onSubmit={manejarPublicarResena} noValidate className="mt-6 flex flex-col gap-5">
                {/* Selector interactivo de 1 a 5 estrellas */}
                <div>
                  <span className="block font-[var(--fuente-texto)] text-[1rem] font-semibold text-[color:var(--tinta)]">
                    Tu calificación con estrellas *
                  </span>
                  <div className="mt-2 flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((valor) => {
                      const activa = (estrellasHover ?? estrellasNueva) >= valor;
                      return (
                        <button
                          key={valor}
                          type="button"
                          onMouseEnter={() => setEstrellasHover(valor)}
                          onMouseLeave={() => setEstrellasHover(null)}
                          onClick={() => setEstrellasNueva(valor as 1 | 2 | 3 | 4 | 5)}
                          aria-label={`Calificar con ${valor} ${valor === 1 ? "estrella" : "estrellas"}`}
                          className="rounded-md border border-[color:var(--divisor)] bg-[color:var(--fondo)] p-2 transition-transform hover:scale-110 cursor-pointer"
                        >
                          <Star
                            size={24}
                            className={
                              activa
                                ? "fill-[#e6b050] text-[#e6b050]"
                                : "fill-transparent text-[color:var(--tinta-suave)]/40"
                            }
                          />
                        </button>
                      );
                    })}
                    <span className="ml-2 font-[var(--fuente-texto)] text-[1.05rem] font-bold text-[color:var(--riel)]">
                      {estrellasNueva} de 5 ★
                    </span>
                  </div>
                </div>

                <Input
                  id="resena-autor"
                  variante="caja"
                  label="Tu nombre"
                  placeholder="Ej. Carolina Restrepo"
                  value={autorNueva}
                  onChange={(e) => {
                    setAutorNueva(e.target.value);
                    if (errorResena) setErrorResena(null);
                  }}
                />

                {obrasPublicadas.length > 0 && (
                  <Select
                    id="resena-obra"
                    variante="caja"
                    label="Obra apreciada o adquirida (opcional)"
                    value={obraRelacionadaNueva}
                    onChange={(e) => setObraRelacionadaNueva(e.target.value)}
                  >
                    <option value="">General sobre el artista</option>
                    {obrasPublicadas.map((ob) => (
                      <option key={ob.id_obra} value={ob.titulo}>
                        {ob.titulo}
                      </option>
                    ))}
                  </Select>
                )}

                <div>
                  <label
                    htmlFor="resena-comentario"
                    className="mb-2 block font-[var(--fuente-texto)] text-[1.05rem] font-semibold text-[color:var(--tinta)]"
                  >
                    Tu reseña *
                  </label>
                  <textarea
                    id="resena-comentario"
                    rows={4}
                    placeholder="Describe qué te pareció la técnica, el montaje en sala o la adquisición de la obra…"
                    value={comentarioNuevo}
                    onChange={(e) => {
                      setComentarioNuevo(e.target.value);
                      if (errorResena) setErrorResena(null);
                    }}
                    className="w-full border border-[color:var(--campo-caja-borde)] bg-[color:var(--campo-caja-fondo)] p-3 font-[var(--fuente-texto)] text-[1.1rem] text-[color:var(--tinta)] placeholder:text-[color:var(--tinta-suave)]/60 focus:border-[color:var(--riel)] focus:outline-none"
                  />
                </div>

                {errorResena && (
                  <p role="alert" className="font-[var(--fuente-texto)] text-[0.98rem] text-[color:var(--aviso)]">
                    {errorResena}
                  </p>
                )}

                <Button type="submit" variante="primario" className="w-full">
                  Publicar reseña con estrellas
                </Button>
              </form>
            </aside>
          </section>
        )}

        {/* PESTAÑA 3: ACERCA DEL ARTISTA */}
        {pestanaActiva === "acerca" && (
          <section
            aria-label="Acerca del artista"
            className="max-w-[var(--medida-lectura)] py-[var(--espacio-16)]"
          >
            <h2 className="voz-h3 mb-[var(--espacio-16)] text-[color:var(--tinta)]">
              Trayectoria y presencia en el Palacio Nacional
            </h2>
            <p className="voz-cuerpo text-[color:var(--tinta-suave)]">
              {biografiaCompleta}
            </p>
            {artistaMuestra && (
              <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-[color:var(--divisor)] pt-6 sm:grid-cols-2">
                <div>
                  <dt className="voz-etiqueta text-[color:var(--riel)]">Sala de exhibición</dt>
                  <dd className="voz-cuerpo mt-1 text-[color:var(--tinta)]">
                    {artistaMuestra.sala_palacio}
                  </dd>
                </div>
                <div>
                  <dt className="voz-etiqueta text-[color:var(--riel)]">Origen / Ubicación</dt>
                  <dd className="voz-cuerpo mt-1 text-[color:var(--tinta)]">
                    {artistaMuestra.ciudad}
                  </dd>
                </div>
              </dl>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

/**
 * 6.5 Listado de artistas (Nivel 2):
 * Directorio completo con artistas reales de prueba, sus obras certificadas y
 * sus reseñas con estrellas.
 */
export function ArtistasPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const idPerfil = Number(searchParams.get("perfil_artista") ?? "0");
  const puedePostularComoArtista = !user || user.rol === "Comprador";

  const [busqueda, setBusqueda] = useState("");
  const [disciplinaFiltro, setDisciplinaFiltro] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);

  const {
    data: obrasApi,
    isLoading,
  } = useQuery({
    queryKey: ["catalogo", "directorio-artistas"],
    queryFn: () => listarCatalogo(),
    enabled: idPerfil <= 0,
    retry: 1,
  });

  useEffect(() => {
    if (idPerfil <= 0) {
      document.title = "Artistas · Pixel & Lienzo";
    }
  }, [idPerfil]);

  const artistasBase: ResumenArtistaDirectorio[] = useMemo(() => {
    const obrasFuente =
      obrasApi && obrasApi.length > 0 ? obrasApi : OBRAS_MUESTRA_PALACIO;
    const mapa = new Map<number, ResumenArtistaDirectorio>();

    // 1. Sembrar todos los artistas curatoriales de prueba con sus nombres, fotos y reseñas con estrellas
    for (const artMuestra of ARTISTAS_MUESTRA_PALACIO) {
      const obrasDelArtista = OBRAS_MUESTRA_PALACIO.filter(
        (o) => o.id_artista === artMuestra.id_artista
      );
      const resenasArtista = listarResenasDeArtista(artMuestra.id_artista);
      const { promedio, total } = calcularPromedioEstrellas(resenasArtista);

      mapa.set(artMuestra.id_artista, {
        idArtista: artMuestra.id_artista,
        nombre: artMuestra.nombre,
        disciplina: artMuestra.disciplina,
        obrasPublicadas: obrasDelArtista.length,
        fotoUrl: artMuestra.foto_url,
        salaPalacio: artMuestra.sala_palacio,
        promedioEstrellas: promedio,
        totalResenas: total,
        comentarioDestacado: resenasArtista[0]?.comentario,
      });
    }

    // 2. Incorporar también cualquier artista adicional que venga del backend
    for (const obra of obrasFuente) {
      const existente = mapa.get(obra.id_artista);
      if (!existente) {
        const resenasArtista = listarResenasDeArtista(obra.id_artista);
        const { promedio, total } = calcularPromedioEstrellas(resenasArtista);
        mapa.set(obra.id_artista, {
          idArtista: obra.id_artista,
          nombre: resolverNombreArtistaObra(obra),
          disciplina: obra.tecnica?.trim() || "Artes visuales",
          obrasPublicadas: 1,
          fotoUrl: obra.fotografia_hd_url,
          promedioEstrellas: promedio,
          totalResenas: total,
          comentarioDestacado: resenasArtista[0]?.comentario,
        });
      }
    }

    return Array.from(mapa.values()).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [obrasApi]);

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
        {/* Cabecera: H1 "Artistas" con la frase en cursiva y el botón según el rol */}
        <header className="mb-[var(--espacio-32)] flex flex-wrap items-end justify-between gap-[var(--espacio-16)]">
          <div>
            <p className="voz-etiqueta mb-2 text-[color:var(--riel)]">
              Directorio Curatorial &amp; Reseñas Verificadas
            </p>
            <h1 className="voz-h1 text-[color:var(--tinta)]">Artistas</h1>
            <p className="voz-acento mt-[var(--espacio-8)] text-[color:var(--tinta-suave)]">
              Quienes hacen posible cada obra en el Palacio Nacional de Medellín.
            </p>
          </div>
          {puedePostularComoArtista ? (
            <Link to="/artistas/quiero-formar-parte" className="no-underline">
              <Button variante="primario">
                <Palette size={18} strokeWidth={1.6} aria-hidden="true" />
                <span>Quiero formar parte</span>
              </Button>
            </Link>
          ) : (
            <Link to={rutaInicialPorRol(user?.rol)} className="no-underline">
              <Button variante="secundario">
                <LayoutDashboard size={18} strokeWidth={1.6} aria-hidden="true" />
                <span>
                  {user?.rol === "Curador"
                    ? "Revisar postulaciones en Curaduría"
                    : user?.rol === "Artista"
                      ? "Ir a mi Panel del artista"
                      : "Ir al Panel institucional"}
                </span>
              </Button>
            </Link>
          )}
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

        {isLoading && artistasPaginados.length === 0 && <SkeletonCardGrid cantidad={6} />}

        {!isLoading && artistasFiltrados.length === 0 && (
          <EmptyState
            titulo="Ningún artista coincide con tu búsqueda."
            accion={
              busqueda.trim() !== "" || disciplinaFiltro !== "" ? (
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

        {artistasPaginados.length > 0 && (
          <>
            <div className="rejilla-obras">
              {artistasPaginados.map((artista) => (
                <ArtistaCard
                  key={artista.idArtista}
                  idArtista={artista.idArtista}
                  nombre={artista.nombre}
                  disciplina={artista.disciplina}
                  obrasPublicadas={artista.obrasPublicadas}
                  fotoUrl={artista.fotoUrl}
                  salaPalacio={artista.salaPalacio}
                  promedioEstrellas={artista.promedioEstrellas}
                  totalResenas={artista.totalResenas}
                  comentarioDestacado={artista.comentarioDestacado}
                  href={`/artistas/${artista.idArtista}`}
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
