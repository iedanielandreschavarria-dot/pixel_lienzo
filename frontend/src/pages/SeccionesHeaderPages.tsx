import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Building2,
  Calendar,
  Clock,
  Compass,
  Film,
  Layers,
  Mail,
  MapPin,
  Palette,
  QrCode,
  Scale,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { listarCatalogo } from "../api/obras";
import { listarCategorias } from "../api/categorias";
import { Ambiente } from "../components/escena/Ambiente";
import { ObraCard } from "../components/ObraCard";
import { OBRAS_MUESTRA_PALACIO } from "../lib/obrasMuestraPalacio";
import { Breadcrumbs } from "../components/ui/Breadcrumbs";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { SkeletonCardGrid } from "../components/ui/Skeleton";

/**
 * 1. Ruta: /sala-palacio-nacional
 * Sala Palacio Nacional — Bóveda curatorial y acervo patrimonial de Pixel & Lienzo.
 */
export function SalaPalacioNacionalPage() {
  const navigate = useNavigate();

  const { data: obras, isLoading } = useQuery({
    queryKey: ["catalogo", "sala-palacio-nacional"],
    queryFn: () => listarCatalogo(),
  });

  useEffect(() => {
    document.title = "Sala Palacio Nacional · Pixel & Lienzo";
  }, []);

  const obrasSala = useMemo(() => {
    const lista = obras && obras.length > 0 ? obras : OBRAS_MUESTRA_PALACIO;
    const patrimoniales = lista.filter((o) => o.es_patrimonio_historico);
    return (patrimoniales.length > 0 ? lista : lista).slice(0, 8);
  }, [obras]);

  return (
    <div className="relative min-h-screen py-[var(--espacio-48)] animate-[aparecer-pagina_500ms_ease_forwards]">
      <Ambiente nivel={2} />

      <div className="contenedor-pyl relative z-10 flex flex-col gap-[var(--espacio-48)]">
        {/* Hero arquitectónico de la Sala Palacio Nacional */}
        <header className="relative overflow-hidden border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-32)] sm:p-[var(--espacio-48)] shadow-[var(--sombra-tarjeta)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-65"
            style={{
              background:
                "radial-gradient(ellipse 65% 60% at 80% 50%, rgba(140, 109, 70, 0.14), transparent 75%)",
            }}
          />
          <div className="relative z-10 flex flex-col gap-[var(--espacio-24)] min-[960px]:flex-row min-[960px]:items-end min-[960px]:justify-between">
            <div className="max-w-[680px]">
              <p className="voz-etiqueta mb-3 text-[color:var(--riel)]">
                Monumento Nacional · Medellín (1933)
              </p>
              <h1 className="voz-h1 text-[color:var(--tinta)]">Sala Palacio Nacional</h1>
              <div
                aria-hidden="true"
                className="mt-[var(--espacio-12)] h-[2px] w-[var(--espacio-64)] bg-[color:var(--riel)]"
              />
              <p className="voz-cuerpo mt-[var(--espacio-24)] text-[color:var(--tinta-suave)]">
                Ubicado en el corazón histórico de Medellín (Carrera 52 Carabobo # 48-45) y diseñado
                por el arquitecto belga Agustín Goovaerts, el Palacio Nacional alberga en sus pisos
                superiores un ecosistema único de galerías de arte, talleres de artistas y salas de
                exposición con obras verificables mediante certificado criptográfico SHA-256.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-[var(--espacio-12)]">
              <Button variante="primario" onClick={() => navigate("/arte")}>
                <span>Explorar catálogo completo</span>
                <ArrowRight size={18} strokeWidth={1.6} />
              </Button>
              <Link to="/verificar/buscar">
                <Button variante="secundario">Verificar sello en sala</Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Tarjetas hacia las tres páginas dedicadas de Sala Palacio Nacional */}
        <section
          aria-label="Secciones de Sala Palacio Nacional"
          className="grid grid-cols-1 gap-[var(--espacio-24)] md:grid-cols-3"
        >
          <Link
            to="/sala-palacio-nacional/quienes-somos"
            className="group flex flex-col justify-between border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)] no-underline transition-all duration-[var(--duracion-hover)] hover:-translate-y-1 hover:border-[color:var(--riel)]"
          >
            <div>
              <Sparkles size={24} strokeWidth={1.5} className="mb-3 text-[color:var(--riel)]" />
              <p className="voz-etiqueta text-[color:var(--riel)]">01 · Historia y Patrimonio</p>
              <h2 className="voz-h3 mt-2 text-[color:var(--tinta)]">Quiénes somos</h2>
              <p className="voz-cuerpo-pequeno mt-2 text-[color:var(--tinta-suave)]">
                Joya arquitectónica neorrománica inaugurada en 1933, declarada Monumento Nacional y
                transformada en el gran centro de galerías de arte de Medellín.
              </p>
            </div>
            <span className="mt-6 inline-flex items-center gap-2 font-[var(--fuente-texto)] text-[0.95rem] font-semibold text-[color:var(--riel)]">
              <span>Conocer nuestra historia</span>
              <ArrowRight size={16} strokeWidth={1.6} />
            </span>
          </Link>

          <Link
            to="/sala-palacio-nacional/visitanos"
            className="group flex flex-col justify-between border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)] no-underline transition-all duration-[var(--duracion-hover)] hover:-translate-y-1 hover:border-[color:var(--riel)]"
          >
            <div>
              <MapPin size={24} strokeWidth={1.5} className="mb-3 text-[color:var(--riel)]" />
              <p className="voz-etiqueta text-[color:var(--riel)]">02 · La Candelaria, Medellín</p>
              <h2 className="voz-h3 mt-2 text-[color:var(--tinta)]">Visítanos</h2>
              <p className="voz-cuerpo-pequeno mt-2 text-[color:var(--tinta-suave)]">
                Carrera 52 (Carabobo) # 48-45. Abierto de lunes a domingo de 9:00 a. m. a 7:00 p. m.
                y en la tradicional Noche de Galerías.
              </p>
            </div>
            <span className="mt-6 inline-flex items-center gap-2 font-[var(--fuente-texto)] text-[0.95rem] font-semibold text-[color:var(--riel)]">
              <span>Ver ubicación y horarios</span>
              <ArrowRight size={16} strokeWidth={1.6} />
            </span>
          </Link>

          <Link
            to="/sala-palacio-nacional/uso-del-espacio"
            className="group flex flex-col justify-between border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)] no-underline transition-all duration-[var(--duracion-hover)] hover:-translate-y-1 hover:border-[color:var(--riel)]"
          >
            <div>
              <Building2 size={24} strokeWidth={1.5} className="mb-3 text-[color:var(--riel)]" />
              <p className="voz-etiqueta text-[color:var(--riel)]">03 · Galerías y Arquitectura</p>
              <h2 className="voz-h3 mt-2 text-[color:var(--tinta)]">Conoce el uso del espacio</h2>
              <p className="voz-cuerpo-pequeno mt-2 text-[color:var(--tinta-suave)]">
                Más de 60 galerías y talleres de artistas en los pisos superiores, claustro de arcos
                de medio punto, murales de Pedro Nel Gómez y terraza en el Piso 5.
              </p>
            </div>
            <span className="mt-6 inline-flex items-center gap-2 font-[var(--fuente-texto)] text-[0.95rem] font-semibold text-[color:var(--riel)]">
              <span>Explorar el edificio</span>
              <ArrowRight size={16} strokeWidth={1.6} />
            </span>
          </Link>
        </section>

        {/* Obras actualmente en Sala Palacio Nacional */}
        <section aria-labelledby="titulo-obras-sala">
          <div className="mb-[var(--espacio-24)] flex flex-wrap items-end justify-between gap-4 border-b border-[color:var(--divisor)] pb-[var(--espacio-16)]">
            <div>
              <p className="voz-etiqueta text-[color:var(--tinta-suave)]">Exhibición permanente</p>
              <h2 id="titulo-obras-sala" className="voz-h2 mt-1 text-[color:var(--tinta)]">
                Obras en Sala Palacio Nacional
              </h2>
            </div>
            <Link to="/arte" className="enlace-acceso text-[1rem]">
              Ver todas las obras →
            </Link>
          </div>

          {isLoading ? (
            <SkeletonCardGrid cantidad={4} />
          ) : obrasSala.length === 0 ? (
            <EmptyState
              titulo="La sala está preparando su próximo montaje."
              accion={
                <Button variante="secundario" onClick={() => navigate("/arte")}>
                  Ir al catálogo general
                </Button>
              }
            />
          ) : (
            <div className="catalogo__masonry" role="list">
              {obrasSala.map((obra, idx) => (
                <ObraCard key={obra.id_obra} obra={obra} prioridad={idx < 4} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/**
 * 1.1 Ruta separada: /sala-palacio-nacional/quienes-somos
 * Página dedicada con información real del Palacio Nacional de Medellín.
 */
export function QuienesSomosPalacioPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Quiénes somos · Palacio Nacional de Medellín · Pixel & Lienzo";
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  return (
    <div className="relative min-h-screen py-[var(--espacio-48)] animate-[aparecer-pagina_500ms_ease_forwards]">
      <Ambiente nivel={2} />

      <div className="contenedor-pyl relative z-10 flex flex-col gap-[var(--espacio-48)]">
        <Breadcrumbs
          items={[
            { etiqueta: "Sala Palacio Nacional", to: "/sala-palacio-nacional" },
            { etiqueta: "Quiénes somos" },
          ]}
        />

        <header className="border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-32)] sm:p-[var(--espacio-48)] shadow-[var(--sombra-tarjeta)]">
          <p className="voz-etiqueta mb-3 text-[color:var(--riel)]">
            Patrimonio Histórico y Artístico de la Nación · Medellín
          </p>
          <h1 className="voz-h1 text-[color:var(--tinta)]">Quiénes somos</h1>
          <div
            aria-hidden="true"
            className="mt-[var(--espacio-12)] h-[2px] w-[var(--espacio-64)] bg-[color:var(--riel)]"
          />
          <p className="voz-cuerpo mt-[var(--espacio-24)] max-w-[68ch] text-[color:var(--tinta-suave)]">
            El Palacio Nacional de Medellín es uno de los monumentos arquitectónicos y culturales
            más emblemáticos de Colombia. Construido entre 1925 y 1933 por el arquitecto belga
            Agustín Goovaerts en estilo romántico modernizado (neorrománico), hoy es un epicentro
            vivo donde confluyen el patrimonio histórico, más de 60 galerías de arte, talleres de
            artistas y el coleccionismo contemporáneo.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-[var(--espacio-24)] md:grid-cols-3">
          <article className="border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)]">
            <Sparkles size={22} strokeWidth={1.5} className="mb-3 text-[color:var(--riel)]" />
            <h2 className="voz-h3 text-[color:var(--tinta)]">Legado de Agustín Goovaerts</h2>
            <p className="voz-cuerpo-pequeno mt-2 text-[color:var(--tinta-suave)]">
              Con sus más de 400 arcos de medio punto, vitrales, cúpula central y acabados en
              bronce, hierro forjado y madera, el edificio funcionó durante más de cinco décadas
              como sede de la Gobernación y Palacio de Justicia de Antioquia antes de ser declarado
              Monumento Nacional en 1988.
            </p>
          </article>

          <article className="border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)]">
            <Users size={22} strokeWidth={1.5} className="mb-3 text-[color:var(--riel)]" />
            <h2 className="voz-h3 text-[color:var(--tinta)]">Polo de Galerías y Artistas</h2>
            <p className="voz-cuerpo-pequeno mt-2 text-[color:var(--tinta-suave)]">
              En sus pisos superiores (niveles 3, 4 y 5), el Palacio Nacional reúne decenas de
              galerías de arte, salas de exposición y talleres de pintores, escultores y fotógrafos,
              además de custodiar murales patrimoniales al fresco del maestro Pedro Nel Gómez.
            </p>
          </article>

          <article className="border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)]">
            <ShieldCheck size={22} strokeWidth={1.5} className="mb-3 text-[color:var(--riel)]" />
            <h2 className="voz-h3 text-[color:var(--tinta)]">Tradición y Verificación Digital</h2>
            <p className="voz-cuerpo-pequeno mt-2 text-[color:var(--tinta-suave)]">
              En alianza con Pixel &amp; Lienzo, las obras exhibidas en el Palacio Nacional cuentan
              con fichas curatoriales verificadas y certificados de autenticidad con sello
              criptográfico SHA-256 para respaldar a artistas y coleccionistas.
            </p>
          </article>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[color:var(--divisor)] pt-[var(--espacio-24)]">
          <Button variante="primario" onClick={() => navigate("/arte")}>
            Explorar obras del catálogo
          </Button>
          <div className="flex flex-wrap gap-3">
            <Link to="/sala-palacio-nacional/visitanos">
              <Button variante="secundario">Visítanos →</Button>
            </Link>
            <Link to="/sala-palacio-nacional/uso-del-espacio">
              <Button variante="secundario">Conoce el uso del espacio →</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 1.2 Ruta separada: /sala-palacio-nacional/visitanos
 * Página dedicada con dirección, horarios reales y Noche de Galerías del Palacio Nacional de Medellín.
 */
export function VisitanosPalacioPage() {
  useEffect(() => {
    document.title = "Visítanos · Palacio Nacional de Medellín · Pixel & Lienzo";
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  return (
    <div className="relative min-h-screen py-[var(--espacio-48)] animate-[aparecer-pagina_500ms_ease_forwards]">
      <Ambiente nivel={2} />

      <div className="contenedor-pyl relative z-10 flex flex-col gap-[var(--espacio-48)]">
        <Breadcrumbs
          items={[
            { etiqueta: "Sala Palacio Nacional", to: "/sala-palacio-nacional" },
            { etiqueta: "Visítanos" },
          ]}
        />

        <header className="border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-32)] sm:p-[var(--espacio-48)] shadow-[var(--sombra-tarjeta)]">
          <p className="voz-etiqueta mb-3 text-[color:var(--riel)]">
            Centro Histórico · La Candelaria, Medellín
          </p>
          <h1 className="voz-h1 text-[color:var(--tinta)]">Visítanos</h1>
          <div
            aria-hidden="true"
            className="mt-[var(--espacio-12)] h-[2px] w-[var(--espacio-64)] bg-[color:var(--riel)]"
          />
          <p className="voz-cuerpo mt-[var(--espacio-24)] max-w-[68ch] text-[color:var(--tinta-suave)]">
            Recorre los corredores de arcos neorrománicos, visita las galerías de arte de los pisos
            superiores y vive la experiencia cultural y gastronómica del Palacio Nacional en el
            centro de Medellín.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-[var(--espacio-24)] md:grid-cols-3">
          <article className="border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)]">
            <MapPin size={22} strokeWidth={1.5} className="mb-3 text-[color:var(--riel)]" />
            <h2 className="voz-h3 text-[color:var(--tinta)]">Dirección y Acceso</h2>
            <p className="voz-cuerpo-pequeno mt-2 text-[color:var(--tinta-suave)]">
              <strong>Carrera 52 (Carabobo) # 48-45</strong>, barrio La Candelaria, Centro de
              Medellín, Antioquia. Ubicado junto a la Plazuela e Iglesia de la Veracruz, a pocos
              pasos de las estaciones Parque Berrío y San Antonio del Metro.
            </p>
          </article>

          <article className="border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)]">
            <Clock size={22} strokeWidth={1.5} className="mb-3 text-[color:var(--riel)]" />
            <h2 className="voz-h3 text-[color:var(--tinta)]">Horarios y Noche de Galerías</h2>
            <p className="voz-cuerpo-pequeno mt-2 text-[color:var(--tinta-suave)]">
              <strong>Lunes a domingo:</strong> 9:00 a. m. – 7:00 p. m.
              <br />
              <strong>Noche de Galerías (Piso 5):</strong> El último jueves de cada mes con horario
              extendido hasta las 12:00 a. m. (medianoche).
            </p>
          </article>

          <article className="border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)]">
            <Mail size={22} strokeWidth={1.5} className="mb-3 text-[color:var(--riel)]" />
            <h2 className="voz-h3 text-[color:var(--tinta)]">Contacto Directo</h2>
            <p className="voz-cuerpo-pequeno mt-2 text-[color:var(--tinta-suave)]">
              Para programar recorridos guiados por las galerías de arte, visitas grupales o
              consultas sobre exposiciones, escríbenos por WhatsApp al{" "}
              <strong>310 633 2874</strong>.
            </p>
          </article>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[color:var(--divisor)] pt-[var(--espacio-24)]">
          <a
            href="https://wa.me/573106332874"
            target="_blank"
            rel="noopener noreferrer"
            className="no-underline"
          >
            <Button variante="primario">Escribir al WhatsApp del Palacio</Button>
          </a>
          <div className="flex flex-wrap gap-3">
            <Link to="/sala-palacio-nacional/quienes-somos">
              <Button variante="secundario">← Quiénes somos</Button>
            </Link>
            <Link to="/sala-palacio-nacional/uso-del-espacio">
              <Button variante="secundario">Conoce el uso del espacio →</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 1.3 Ruta separada: /sala-palacio-nacional/uso-del-espacio
 * Página dedicada con la distribución real de niveles del Palacio Nacional de Medellín.
 */
export function UsoDelEspacioPalacioPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Conoce el uso del espacio · Palacio Nacional de Medellín · Pixel & Lienzo";
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  return (
    <div className="relative min-h-screen py-[var(--espacio-48)] animate-[aparecer-pagina_500ms_ease_forwards]">
      <Ambiente nivel={2} />

      <div className="contenedor-pyl relative z-10 flex flex-col gap-[var(--espacio-48)]">
        <Breadcrumbs
          items={[
            { etiqueta: "Sala Palacio Nacional", to: "/sala-palacio-nacional" },
            { etiqueta: "Conoce el uso del espacio" },
          ]}
        />

        <header className="border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-32)] sm:p-[var(--espacio-48)] shadow-[var(--sombra-tarjeta)]">
          <p className="voz-etiqueta mb-3 text-[color:var(--riel)]">
            Arquitectura, Arte &amp; Cultura en 5 Niveles
          </p>
          <h1 className="voz-h1 text-[color:var(--tinta)]">Conoce el uso del espacio</h1>
          <div
            aria-hidden="true"
            className="mt-[var(--espacio-12)] h-[2px] w-[var(--espacio-64)] bg-[color:var(--riel)]"
          />
          <p className="voz-cuerpo mt-[var(--espacio-24)] max-w-[68ch] text-[color:var(--tinta-suave)]">
            El Palacio Nacional articula su arquitectura patrimonial con un modelo único que integra
            comercio tradicional en sus primeros pisos y un gran distrito de arte, cultura y
            gastronomía en sus niveles superiores.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-[var(--espacio-24)] md:grid-cols-3">
          <article className="border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)]">
            <Building2 size={22} strokeWidth={1.5} className="mb-3 text-[color:var(--riel)]" />
            <h2 className="voz-h3 text-[color:var(--tinta)]">Pisos 3 y 4 · Distrito de Galerías</h2>
            <p className="voz-cuerpo-pequeno mt-2 text-[color:var(--tinta-suave)]">
              Albergan más de 60 galerías de arte, salas de exhibición y talleres abiertos donde
              artistas locales e internacionales crean y exponen pintura, escultura, grabado y
              fotografía bajo los arcos de medio punto del edificio.
            </p>
          </article>

          <article className="border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)]">
            <QrCode size={22} strokeWidth={1.5} className="mb-3 text-[color:var(--riel)]" />
            <h2 className="voz-h3 text-[color:var(--tinta)]">Claustro, Cúpula y Recorrido QR</h2>
            <p className="voz-cuerpo-pequeno mt-2 text-[color:var(--tinta-suave)]">
              El claustro central cubierto por su cúpula monumental y los corredores con murales de
              Pedro Nel Gómez reciben exposiciones temporales y recorridos interactivos donde cada
              pieza cuenta con su código QR de verificación.
            </p>
          </article>

          <article className="border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)]">
            <Film size={22} strokeWidth={1.5} className="mb-3 text-[color:var(--riel)]" />
            <h2 className="voz-h3 text-[color:var(--tinta)]">Piso 5 · Rooftop y Eventos</h2>
            <p className="voz-cuerpo-pequeno mt-2 text-[color:var(--tinta-suave)]">
              El quinto nivel reúne salas de exhibición contemporánea, café artesanal, restaurantes,
              terraza panorámica sobre el centro de Medellín y es el escenario principal de la Noche
              de Galerías y eventos culturales.
            </p>
          </article>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[color:var(--divisor)] pt-[var(--espacio-24)]">
          <Button variante="primario" onClick={() => navigate("/exposiciones")}>
            Ver exposiciones actuales
          </Button>
          <div className="flex flex-wrap gap-3">
            <Link to="/sala-palacio-nacional/quienes-somos">
              <Button variante="secundario">← Quiénes somos</Button>
            </Link>
            <Link to="/sala-palacio-nacional/visitanos">
              <Button variante="secundario">← Visítanos</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 2. Ruta: /exposiciones
 * Exposiciones temporales, ciclos curatoriales y muestras activas.
 */
interface ExposicionCuratorial {
  id: string;
  estado: "En curso" | "Próxima" | "Archivo";
  titulo: string;
  subtitulo: string;
  fechas: string;
  sala: string;
  descripcion: string;
}

const EXPOSICIONES_CICLO: ExposicionCuratorial[] = [
  {
    id: "umbral-incandescente",
    estado: "En curso",
    titulo: "Umbral Incandescente: Materia y Sello",
    subtitulo: "Pintura contemporánea, grabado y pigmento mineral",
    fechas: "Octubre 2026 — Enero 2027",
    sala: "Sala Palacio Nacional · Nave Central",
    descripcion:
      "Un diálogo entre la densidad matérica del óleo y la permanencia del registro criptográfico. Doce artistas exploran el contraste entre penumbra y luz carmesí.",
  },
  {
    id: "arquitecturas-del-vacio",
    estado: "En curso",
    titulo: "Arquitecturas del Vacío",
    subtitulo: "Fotografía de gran formato y arte generativo",
    fechas: "Noviembre 2026 — Febrero 2027",
    sala: "Gabinete de Luz & Estudio Motion",
    descripcion:
      "Obras concebidas para habitar el silencio de la sala oscura, donde la geometría arquitectónica conversa con proyecciones en movimiento.",
  },
  {
    id: "memoria-y-soporte",
    estado: "Próxima",
    titulo: "Memoria y Soporte: Acervo Patrimonial",
    subtitulo: "Obra gráfica histórica y restauración documental",
    fechas: "Marzo 2027 — Junio 2027",
    sala: "Sala Palacio Nacional · Bóveda Sur",
    descripcion:
      "Revisión de piezas catalogadas como patrimonio histórico con protocolos de certificación digital y trazabilidad de conservación.",
  },
];

export function ExposicionesPage() {
  const navigate = useNavigate();
  const [filtroEstado, setFiltroEstado] = useState<"Todas" | "En curso" | "Próxima">("Todas");

  const { data: obras, isLoading } = useQuery({
    queryKey: ["catalogo", "exposiciones"],
    queryFn: () => listarCatalogo(),
  });

  useEffect(() => {
    document.title = "Exposiciones · Pixel & Lienzo";
  }, []);

  const exposicionesVisibles = useMemo(() => {
    if (filtroEstado === "Todas") return EXPOSICIONES_CICLO;
    return EXPOSICIONES_CICLO.filter((e) => e.estado === filtroEstado);
  }, [filtroEstado]);

  return (
    <div className="relative min-h-screen py-[var(--espacio-48)] animate-[aparecer-pagina_500ms_ease_forwards]">
      <Ambiente nivel={2} />

      <div className="contenedor-pyl relative z-10 flex flex-col gap-[var(--espacio-48)]">
        <header className="flex flex-wrap items-end justify-between gap-[var(--espacio-24)] border-b border-[color:var(--divisor)] pb-[var(--espacio-24)]">
          <div>
            <p className="voz-etiqueta mb-2 text-[color:var(--riel)]">Agenda Curatorial</p>
            <h1 className="voz-h1 text-[color:var(--tinta)]">Exposiciones</h1>
            <p className="voz-cursiva mt-2 text-[color:var(--tinta-suave)]">
              Ciclos expositivos en sala física y exhibición digital certificada.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-[var(--espacio-8)]">
            {(["Todas", "En curso", "Próxima"] as const).map((estado) => (
              <button
                key={estado}
                type="button"
                onClick={() => setFiltroEstado(estado)}
                className={
                  filtroEstado === estado
                    ? "rounded-[var(--radio-pildora)] border border-[color:var(--carmesi)] bg-[color:var(--carmesi)] px-4 py-1.5 font-[var(--fuente-texto)] text-[0.95rem] font-semibold text-[color:var(--tinta-inversa)] cursor-pointer"
                    : "rounded-[var(--radio-pildora)] border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] px-4 py-1.5 font-[var(--fuente-texto)] text-[0.95rem] text-[color:var(--tinta-suave)] hover:border-[color:var(--carmesi)] hover:text-[color:var(--tinta)] cursor-pointer"
                }
              >
                {estado}
              </button>
            ))}
          </div>
        </header>

        {/* Tarjetas de Exposiciones */}
        <section className="grid grid-cols-1 gap-[var(--espacio-24)] lg:grid-cols-3">
          {exposicionesVisibles.map((expo) => (
            <article
              key={expo.id}
              className="flex flex-col justify-between border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)] shadow-[var(--sombra-tarjeta)] transition-colors hover:border-[color:var(--riel)]"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center border border-[color:var(--riel)] bg-[color:var(--vacio)] px-2.5 py-0.5 font-[var(--fuente-poster)] text-[0.78rem] uppercase tracking-[0.12em] text-[color:var(--carmesi)]">
                    {expo.estado}
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-[var(--fuente-texto)] text-[0.9rem] text-[color:var(--tinta-suave)]">
                    <Calendar size={14} strokeWidth={1.5} />
                    {expo.fechas}
                  </span>
                </div>

                <h2 className="voz-h3 mt-4 text-[color:var(--tinta)]">{expo.titulo}</h2>
                <p className="voz-cursiva mt-1 text-[color:var(--riel)]">{expo.subtitulo}</p>
                <p className="voz-cuerpo-pequeno mt-3 text-[color:var(--tinta-suave)]">
                  {expo.descripcion}
                </p>
              </div>

              <div className="mt-6 border-t border-[color:var(--divisor)] pt-4 flex items-center justify-between">
                <span className="font-[var(--fuente-texto)] text-[0.9rem] text-[color:var(--tinta-suave)]">
                  {expo.sala}
                </span>
                <button
                  type="button"
                  onClick={() => navigate("/arte")}
                  className="enlace-acceso bg-transparent border-0 p-0 text-[0.95rem] cursor-pointer"
                >
                  Ver obras →
                </button>
              </div>
            </article>
          ))}
        </section>

        {/* Piezas destacadas de las exposiciones activas */}
        <section aria-labelledby="titulo-piezas-exposicion">
          <div className="mb-[var(--espacio-24)] flex items-end justify-between border-b border-[color:var(--divisor)] pb-[var(--espacio-16)]">
            <div>
              <p className="voz-etiqueta text-[color:var(--tinta-suave)]">Recorrido de sala</p>
              <h2 id="titulo-piezas-exposicion" className="voz-h2 mt-1 text-[color:var(--tinta)]">
                Piezas integradas en la exposición actual
              </h2>
            </div>
            <Link to="/estudio" className="enlace-acceso text-[1rem]">
              Ir a Estudio Motion →
            </Link>
          </div>

          {isLoading ? (
            <SkeletonCardGrid cantidad={4} />
          ) : (obras ?? []).length > 0 ? (
            <div className="rejilla-obras">
              {(obras ?? []).slice(0, 4).map((obra, idx) => (
                <ObraCard key={obra.id_obra} obra={obra} prioridad={idx < 4} />
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

/**
 * 3. Ruta: /colecciones
 * Colecciones temáticas y categorías curatoriales conectadas al catálogo real.
 */
export function ColeccionesPage() {
  const navigate = useNavigate();

  const { data: categorias } = useQuery({
    queryKey: ["categorias"],
    queryFn: listarCategorias,
  });

  const { data: obras, isLoading } = useQuery({
    queryKey: ["catalogo", "colecciones-vista"],
    queryFn: () => listarCatalogo(),
  });

  useEffect(() => {
    document.title = "Colecciones · Pixel & Lienzo";
  }, []);

  const coleccionesCuradas = useMemo(() => {
    const todas = obras ?? [];
    if (categorias && categorias.length > 0) {
      return categorias.map((cat) => {
        const obrasCat = todas.filter((o) => o.id_categoria === cat.id_categoria);
        return {
          id: String(cat.id_categoria),
          nombre: cat.nombre_categoria,
          descripcion: `Selección verificada de ${cat.nombre_categoria.toLowerCase()} por el comité de curaduría de Pixel & Lienzo.`,
          cantidad: obrasCat.length,
          href: `/arte?categoria=${cat.id_categoria}`,
        };
      });
    }

    return [
      {
        id: "pintura-contemporanea",
        nombre: "Pintura & Materia",
        descripcion: "Óleo, acrílico y pigmentos sobre lino de gran formato.",
        cantidad: todas.length,
        href: "/arte",
      },
      {
        id: "obra-grafica",
        nombre: "Obra Gráfica & Grabado",
        descripcion: "Serigrafía, aguafuerte y ediciones numeradas con sello único.",
        cantidad: Math.max(1, Math.floor(todas.length / 2)),
        href: "/arte",
      },
      {
        id: "patrimonio",
        nombre: "Acervo Patrimonial",
        descripcion: "Obras con clasificación de valor histórico y custodia documental.",
        cantidad: todas.filter((o) => o.es_patrimonio_historico).length || todas.length,
        href: "/sala-palacio-nacional",
      },
    ];
  }, [categorias, obras]);

  return (
    <div className="relative min-h-screen py-[var(--espacio-48)] animate-[aparecer-pagina_500ms_ease_forwards]">
      <Ambiente nivel={2} />

      <div className="contenedor-pyl relative z-10 flex flex-col gap-[var(--espacio-48)]">
        <header className="border-b border-[color:var(--divisor)] pb-[var(--espacio-24)]">
          <p className="voz-etiqueta mb-2 text-[color:var(--riel)]">Fondos &amp; Series</p>
          <h1 className="voz-h1 text-[color:var(--tinta)]">Colecciones</h1>
          <p className="voz-cursiva mt-2 text-[color:var(--tinta-suave)]">
            Explora el acervo agrupado por disciplina, línea curatorial y técnica.
          </p>
        </header>

        {/* Tarjetas de Colecciones */}
        <section className="grid grid-cols-1 gap-[var(--espacio-24)] md:grid-cols-2 lg:grid-cols-3">
          {coleccionesCuradas.map((col, idx) => (
            <Link
              key={col.id}
              to={col.href}
              className="group flex flex-col justify-between border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)] no-underline shadow-[var(--sombra-tarjeta)] transition-all duration-[var(--duracion-hover)] hover:-translate-y-1 hover:border-[color:var(--riel)]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-[var(--fuente-poster)] text-[0.85rem] uppercase tracking-[0.14em] text-[color:var(--riel)]">
                    Colección 0{idx + 1}
                  </span>
                  <Layers size={18} strokeWidth={1.5} className="text-[color:var(--tinta-suave)] group-hover:text-[color:var(--riel)]" />
                </div>
                <h2 className="voz-h3 mt-3 text-[color:var(--tinta)]">{col.nombre}</h2>
                <p className="voz-cuerpo-pequeno mt-2 text-[color:var(--tinta-suave)]">
                  {col.descripcion}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-[color:var(--divisor)] pt-4">
                <span className="voz-dato text-[0.95rem] text-[color:var(--tinta-suave)]">
                  {col.cantidad} {col.cantidad === 1 ? "obra catalogada" : "obras catalogadas"}
                </span>
                <span className="font-[var(--fuente-texto)] font-semibold text-[0.95rem] text-[color:var(--tinta)] group-hover:text-[color:var(--riel)]">
                  Explorar →
                </span>
              </div>
            </Link>
          ))}
        </section>

        {/* Vista previa de obras de las colecciones */}
        <section aria-labelledby="titulo-vista-colecciones">
          <div className="mb-[var(--espacio-24)] flex items-end justify-between border-b border-[color:var(--divisor)] pb-[var(--espacio-16)]">
            <h2 id="titulo-vista-colecciones" className="voz-h2 text-[color:var(--tinta)]">
              Selección transversal de las colecciones
            </h2>
            <Button variante="secundario" onClick={() => navigate("/arte")}>
              Abrir catálogo de Arte
            </Button>
          </div>

          {isLoading ? (
            <SkeletonCardGrid cantidad={4} />
          ) : (obras ?? []).length > 0 ? (
            <div className="rejilla-obras">
              {(obras ?? []).slice(0, 4).map((obra, idx) => (
                <ObraCard key={obra.id_obra} obra={obra} prioridad={idx < 4} />
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

/**
 * 4. Ruta: /mas
 * Centro de servicios curatoriales, verificación criptográfica, Estudio Motion y portal legal/institucional.
 */
export function MasPage() {
  useEffect(() => {
    document.title = "Más · Pixel & Lienzo";
  }, []);

  const tarjetasMas = [
    {
      to: "/verificar/buscar",
      etiqueta: "Autenticidad SHA-256",
      titulo: "Verificar certificado",
      descripcion:
        "Comprueba públicamente la validez del sello criptográfico, la ficha técnica y el titular actual de cualquier obra.",
      icono: ShieldCheck,
    },
    {
      to: "/estudio",
      etiqueta: "Proyección 16:9",
      titulo: "Estudio Motion",
      descripcion:
        "Sala de proyección dedicada a obras en movimiento, videoarte y piezas generativas en silencio de galería.",
      icono: Film,
    },
    {
      to: "/sala-palacio-nacional",
      etiqueta: "Sede Física",
      titulo: "Sala Palacio Nacional",
      descripcion:
        "Conoce nuestra bóveda expositiva principal, el protocolo de códigos QR en sala y las piezas patrimoniales.",
      icono: Building2,
    },
    {
      to: "/artistas/quiero-formar-parte",
      etiqueta: "Convocatoria Curatorial",
      titulo: "Quiero formar parte",
      descripcion:
        "Completa el perfilamiento de 10 preguntas y adjunta tu portafolio de artista en PDF para formar parte del Palacio Nacional.",
      icono: Palette,
    },
    {
      to: "/legal/acerca",
      etiqueta: "Institucional",
      titulo: "Acerca de Pixel & Lienzo",
      descripcion:
        "Nuestra misión curatorial, arquitectura de trazabilidad y alianzas con museos, galerías y coleccionistas.",
      icono: Compass,
    },
    {
      to: "/legal/contacto",
      etiqueta: "Atención directa",
      titulo: "Contacto y Soporte",
      descripcion:
        "Escríbenos para asesoría de adquisición, soporte con transacciones Wompi o consultas institucionales.",
      icono: Mail,
    },
    {
      to: "/legal/terminos",
      etiqueta: "Marco Legal",
      titulo: "Términos y Privacidad",
      descripcion:
        "Consulta las condiciones de adquisición, derechos de autoría y política de tratamiento de datos personales.",
      icono: Scale,
    },
  ];

  return (
    <div className="relative min-h-screen py-[var(--espacio-48)] animate-[aparecer-pagina_500ms_ease_forwards]">
      <Ambiente nivel={2} />

      <div className="contenedor-pyl relative z-10 flex flex-col gap-[var(--espacio-48)]">
        <header className="border-b border-[color:var(--divisor)] pb-[var(--espacio-24)]">
          <p className="voz-etiqueta mb-2 text-[color:var(--riel)]">
            Ecosistema Pixel &amp; Lienzo
          </p>
          <h1 className="voz-h1 text-[color:var(--tinta)]">Más recursos y servicios</h1>
          <p className="voz-cursiva mt-2 text-[color:var(--tinta-suave)]">
            Verificación de certificados, proyección en sala, convocatorias e información institucional.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-[var(--espacio-24)] md:grid-cols-2 lg:grid-cols-3">
          {tarjetasMas.map((item) => {
            const Icono = item.icono;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="group flex flex-col justify-between border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)] no-underline shadow-[var(--sombra-tarjeta)] transition-all duration-[var(--duracion-hover)] hover:-translate-y-1 hover:border-[color:var(--riel)]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="voz-etiqueta text-[color:var(--riel)]">{item.etiqueta}</span>
                    <Icono
                      size={22}
                      strokeWidth={1.5}
                      className="text-[color:var(--tinta-suave)] transition-colors group-hover:text-[color:var(--riel)]"
                    />
                  </div>
                  <h2 className="voz-h3 mt-4 text-[color:var(--tinta)]">{item.titulo}</h2>
                  <p className="voz-cuerpo-pequeno mt-2 text-[color:var(--tinta-suave)]">
                    {item.descripcion}
                  </p>
                </div>

                <div className="mt-6 border-t border-[color:var(--divisor)] pt-4 flex items-center justify-between">
                  <span className="font-[var(--fuente-texto)] font-semibold text-[0.95rem] text-[color:var(--tinta)] group-hover:text-[color:var(--riel)]">
                    Abrir sección
                  </span>
                  <ArrowRight
                    size={17}
                    strokeWidth={1.6}
                    className="text-[color:var(--riel)] transition-transform group-hover:translate-x-1"
                  />
                </div>
              </Link>
            );
          })}
        </section>
      </div>
    </div>
  );
}
