import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { listarCatalogo, urlPreviewObra } from "../api/obras";
import { useAuth } from "../context/AuthContext";
import { formatearMoneda } from "../lib/formato";
import { obtenerUltimaEscena, registrarEscenaActual } from "../lib/transicionEscena";
import { Ambiente } from "../components/escena/Ambiente";
import { Arco } from "../components/escena/Arco";
import { Disco } from "../components/escena/Disco";
import { Entrada } from "../components/escena/Entrada";

interface ParadaActo {
  acto: "I" | "II" | "III" | "IV";
  titulo: string;
  subtitulo: string;
}

type ModoGaleria = "obras" | "artistas";

interface ArtistaDestacado {
  idArtista: number;
  inicial: string;
  nombre: string;
  disciplina: string;
  obrasPublicadas: number;
}

interface ObraMuestra {
  id: string;
  titulo: string;
  subtitulo: string;
  vista: string;
}

const OBRAS_MUESTRA: ObraMuestra[] = [
  {
    id: "muestra-1",
    titulo: "Umbral en carmesí",
    subtitulo: "Óleo sobre lino · 2026",
    vista: "vista-1",
  },
  {
    id: "muestra-2",
    titulo: "Horizonte de brasa",
    subtitulo: "Técnica mixta · 2026",
    vista: "vista-2",
  },
  {
    id: "muestra-3",
    titulo: "Trama nocturna",
    subtitulo: "Grabado y pigmento · 2025",
    vista: "vista-3",
  },
  {
    id: "muestra-4",
    titulo: "Punto de ignición",
    subtitulo: "Fotografía de archivo · 2026",
    vista: "vista-4",
  },
  {
    id: "muestra-5",
    titulo: "Resonancia vertical",
    subtitulo: "Arte generativo · 2026",
    vista: "vista-5",
  },
];

const PARADAS: ParadaActo[] = [
  {
    acto: "I",
    titulo: "Pixel & Lienzo",
    subtitulo: "Arte con certificado verificable",
  },
  {
    acto: "II",
    titulo: "Obras",
    subtitulo: "Selección en sala",
  },
  {
    acto: "III",
    titulo: "Artistas",
    subtitulo: "Creadores de la colección",
  },
  {
    acto: "IV",
    titulo: "Certificado",
    subtitulo: "Autenticidad comprobable",
  },
];

const VISTAS_RESPALDO = ["vista-1", "vista-2", "vista-3", "vista-4", "vista-5"] as const;

const ARTISTAS_RESPALDO: ArtistaDestacado[] = [
  {
    idArtista: 1,
    inicial: "C",
    nombre: "Camila Restrepo",
    disciplina: "Óleo y técnica mixta",
    obrasPublicadas: 4,
  },
  {
    idArtista: 2,
    inicial: "M",
    nombre: "Mateo Villamizar",
    disciplina: "Arte digital y grabado",
    obrasPublicadas: 3,
  },
  {
    idArtista: 3,
    inicial: "A",
    nombre: "Elena Arbeláez",
    disciplina: "Fotografía de gran formato",
    obrasPublicadas: 5,
  },
];

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export interface InicioPageProps {
  onExplorarCatalogo?: () => void;
}

/**
 * 6.1 Inicio (Nivel 3 — escena completa):
 * Cuatro actos fijos de 100vh dentro de la columna roja (.arco) de 400vh con el disco negro (.disco)
 * que parte de la cúspide (.arco__hueco) y desciende entre los dos rieles al hacer scroll.
 * Al elegir las opciones de Obras o Artistas, la columna rota -90° horizontalmente (.galeria__arco)
 * para mostrar la pista horizontal entre los rieles.
 */
export function InicioPage({ onExplorarCatalogo }: InicioPageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [actoActual, setActoActual] = useState(0);
  const [actoMostrado, setActoMostrado] = useState(0);
  const [cambiandoTexto, setCambiandoTexto] = useState(false);
  const [desdeAcceso] = useState(() => obtenerUltimaEscena().escena === "acceso");

  const [modoGaleria, setModoGaleria] = useState<ModoGaleria>("obras");
  const [galeriaActiva, setGaleriaActiva] = useState(false);
  const [galeriaAbierta, setGaleriaAbierta] = useState(false);
  const [indiceGaleria, setIndiceGaleria] = useState(0);
  const [arrastrandoPista, setArrastrandoPista] = useState(false);

  const galeriaRef = useRef<HTMLElement>(null);
  const pistaRef = useRef<HTMLDivElement>(null);
  const cerrarGaleriaRef = useRef<HTMLButtonElement>(null);
  const origenFocoRef = useRef<HTMLElement | null>(null);
  const scrollAlAbrirRef = useRef(0);
  const indiceInicialPendienteRef = useRef(0);
  const enTransicionRef = useRef(false);
  const timerAbrirRef = useRef<number | null>(null);
  const timerCerrarRef = useRef<number | null>(null);
  const fueArrastreRef = useRef(false);
  const dragInicioXRef = useRef(0);
  const dragScrollInicialRef = useRef(0);

  const { data: obras, isLoading: cargandoObras } = useQuery({
    queryKey: ["catalogo", "inicio-destacadas"],
    queryFn: () => listarCatalogo(),
  });

  const obrasDestacadas = useMemo(() => (obras ?? []).slice(0, 8), [obras]);
  const miniaturasDisco = useMemo(() => obrasDestacadas.slice(0, 3), [obrasDestacadas]);

  const artistasColeccion = useMemo<ArtistaDestacado[]>(() => {
    if (!obras?.length) return ARTISTAS_RESPALDO;
    const mapa = new Map<number, ArtistaDestacado>();
    const letrasFallback = ["C", "M", "A", "L", "S", "V", "R", "D"];
    for (const obra of obras) {
      const existente = mapa.get(obra.id_artista);
      if (existente) {
        existente.obrasPublicadas += 1;
      } else {
        const idx = mapa.size;
        const inicial = (obra.titulo.trim()[0] ?? letrasFallback[idx % letrasFallback.length] ?? "A").toUpperCase();
        mapa.set(obra.id_artista, {
          idArtista: obra.id_artista,
          inicial,
          nombre: `Artista N.º ${obra.id_artista}`,
          disciplina: obra.tecnica?.trim() || "Artes visuales",
          obrasPublicadas: 1,
        });
      }
    }
    const lista = Array.from(mapa.values());
    while (lista.length < 3) {
      lista.push(ARTISTAS_RESPALDO[lista.length]);
    }
    return lista.slice(0, 8);
  }, [obras]);

  const avataresArtistas = useMemo(() => artistasColeccion.slice(0, 3), [artistasColeccion]);

  const rutaSoyArtista = user?.rol === "Artista" ? "/artista" : "/registro/artista";
  const rutaPublicarObra = user?.rol === "Artista" ? "/artista/obras/nueva" : "/registro/artista";
  const rutaVerificar = "/verificar/buscar";

  useEffect(() => {
    document.title = "Pixel & Lienzo · Arte con certificado verificable";
    registrarEscenaActual("inicio", "/");
    const raiz = document.documentElement;
    raiz.classList.add("escena-inicio");
    return () => {
      raiz.classList.remove("escena-inicio", "galeria-abierta");
      if (timerAbrirRef.current) window.clearTimeout(timerAbrirRef.current);
      if (timerCerrarRef.current) window.clearTimeout(timerCerrarRef.current);
    };
  }, []);

  // Sincroniza el progreso de scroll (--p) y el acto activo (0..3)
  useEffect(() => {
    const raiz = document.documentElement;
    let rafPendiente = false;

    const actualizarScroll = () => {
      rafPendiente = false;
      const alto = window.innerHeight || 1;
      const maximo = Math.max(1, document.documentElement.scrollHeight - alto);
      const scroll = window.scrollY;
      const progreso = Math.max(0, Math.min(1, scroll / maximo));
      raiz.style.setProperty("--p", progreso.toFixed(3));

      const nuevoActo = Math.max(0, Math.min(PARADAS.length - 1, Math.round(scroll / alto)));
      setActoActual(nuevoActo);
      window.dispatchEvent(new CustomEvent("pyl:acto-inicio", { detail: { acto: nuevoActo } }));
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

  // Fundido limpio al cambiar de acto (420 ms, o inmediato con movimiento reducido)
  useEffect(() => {
    if (actoActual === actoMostrado) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setActoMostrado(actoActual);
      return;
    }
    setCambiandoTexto(true);
    const timer = window.setTimeout(() => {
      setActoMostrado(actoActual);
      setCambiandoTexto(false);
    }, 420);
    return () => window.clearTimeout(timer);
  }, [actoActual, actoMostrado]);

  const irAActo = useCallback((indice: number) => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: indice * window.innerHeight,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, []);

  const irAlCatalogo = useCallback(() => {
    document.documentElement.classList.remove("galeria-abierta");
    if (onExplorarCatalogo) {
      onExplorarCatalogo();
    } else {
      window.scrollTo({ top: 0, behavior: "auto" });
      navigate("/#coleccion");
    }
  }, [navigate, onExplorarCatalogo]);

  const irADirectorioArtistas = useCallback(
    (idArtista?: number) => {
      document.documentElement.classList.remove("galeria-abierta");
      window.scrollTo({ top: 0, behavior: "auto" });
      if (idArtista && obras?.some((o) => o.id_artista === idArtista)) {
        navigate(`/?perfil_artista=${idArtista}#artistas`);
      } else {
        navigate("/#artistas");
      }
    },
    [navigate, obras]
  );

  // Medidas exactas para el giro horizontal (-90deg) de la columna (.galeria__arco)
  const calcularMedidasGaleria = useCallback((scrollReferencia: number) => {
    const raiz = document.documentElement;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const W = Math.min(0.96 * vw, 1.12 * vh, 1040);
    const s = Math.min(1.4, (0.9 * vh) / W);
    const arriba = 0.03 * vh - scrollReferencia;
    raiz.style.setProperty("--s", s.toFixed(3));
    raiz.style.setProperty("--arriba", `${arriba.toFixed(1)}px`);
  }, []);

  const desplazarPistaAIndice = useCallback((idx: number, suave: boolean) => {
    const pista = pistaRef.current;
    if (!pista || !pista.children.length) return;
    const destinoEl = pista.children[
      Math.max(0, Math.min(pista.children.length - 1, idx))
    ] as HTMLElement | undefined;
    const baseEl = pista.children[0] as HTMLElement | undefined;
    if (!destinoEl || !baseEl) return;
    const left = destinoEl.offsetLeft - baseEl.offsetLeft;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    pista.scrollTo({
      left,
      behavior: suave && !reduceMotion ? "smooth" : "auto",
    });
  }, []);

  // Recalcular medidas de la columna girada si cambia el tamaño de ventana
  useEffect(() => {
    const alRedimensionar = () => {
      const refScroll = galeriaActiva ? scrollAlAbrirRef.current : window.scrollY;
      calcularMedidasGaleria(refScroll);
    };
    alRedimensionar();
    window.addEventListener("resize", alRedimensionar);
    return () => window.removeEventListener("resize", alRedimensionar);
  }, [calcularMedidasGaleria, galeriaActiva]);

  // Secuencia en dos fotogramas para garantizar la transición de rotación (-90deg)
  useEffect(() => {
    if (!galeriaActiva) return;
    const galeriaEl = galeriaRef.current;
    if (galeriaEl) {
      // Fuerza reflujo con el arco aún en 0deg antes de aplicar .abierta (-90deg)
      void galeriaEl.offsetWidth;
    }
    desplazarPistaAIndice(indiceInicialPendienteRef.current, false);

    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        setGaleriaAbierta(true);
      });
    });

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (timerAbrirRef.current) window.clearTimeout(timerAbrirRef.current);
    timerAbrirRef.current = window.setTimeout(
      () => {
        enTransicionRef.current = false;
        cerrarGaleriaRef.current?.focus();
      },
      reduceMotion ? 0 : 1850
    );

    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, [desplazarPistaAIndice, galeriaActiva]);

  const abrirGaleria = useCallback(
    (modo: ModoGaleria, indiceInicial: number, origen: HTMLElement | null) => {
      if (galeriaActiva || enTransicionRef.current) return;
      enTransicionRef.current = true;
      origenFocoRef.current = origen;
      scrollAlAbrirRef.current = window.scrollY;
      indiceInicialPendienteRef.current = indiceInicial;

      calcularMedidasGaleria(window.scrollY);
      setModoGaleria(modo);
      setIndiceGaleria(indiceInicial);
      document.documentElement.classList.add("galeria-abierta");
      setGaleriaActiva(true);
    },
    [calcularMedidasGaleria, galeriaActiva]
  );

  const cerrarGaleria = useCallback(() => {
    if (!galeriaActiva) return;
    if (timerAbrirRef.current) window.clearTimeout(timerAbrirRef.current);
    enTransicionRef.current = true;
    setGaleriaAbierta(false);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (timerCerrarRef.current) window.clearTimeout(timerCerrarRef.current);
    timerCerrarRef.current = window.setTimeout(
      () => {
        setGaleriaActiva(false);
        document.documentElement.classList.remove("galeria-abierta");
        enTransicionRef.current = false;
        origenFocoRef.current?.focus();
      },
      reduceMotion ? 0 : 1750
    );
  }, [galeriaActiva]);

  const totalTarjetasPista = useMemo(() => {
    if (modoGaleria === "artistas") {
      return artistasColeccion.length + 1;
    }
    const baseObras = obrasDestacadas.length > 0 ? obrasDestacadas.length : OBRAS_MUESTRA.length;
    return baseObras + 1;
  }, [artistasColeccion.length, modoGaleria, obrasDestacadas.length]);

  // Teclado dentro de la galería horizontal
  useEffect(() => {
    if (!galeriaActiva) return;
    const alTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        cerrarGaleria();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const sig = Math.min(totalTarjetasPista - 1, indiceGaleria + 1);
        setIndiceGaleria(sig);
        desplazarPistaAIndice(sig, true);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        const ant = Math.max(0, indiceGaleria - 1);
        setIndiceGaleria(ant);
        desplazarPistaAIndice(ant, true);
      }
    };
    window.addEventListener("keydown", alTecla);
    return () => window.removeEventListener("keydown", alTecla);
  }, [cerrarGaleria, desplazarPistaAIndice, galeriaActiva, indiceGaleria, totalTarjetasPista]);

  const alScrollPista = () => {
    const pista = pistaRef.current;
    if (!pista || !pista.children.length) return;
    const base = (pista.children[0] as HTMLElement).offsetLeft;
    const actualScroll = pista.scrollLeft;
    let mejorIdx = 0;
    let mejorDist = Infinity;
    for (let i = 0; i < pista.children.length; i++) {
      const el = pista.children[i] as HTMLElement;
      const dist = Math.abs(el.offsetLeft - base - actualScroll);
      if (dist < mejorDist) {
        mejorDist = dist;
        mejorIdx = i;
      }
    }
    setIndiceGaleria(mejorIdx);
  };

  const paradaVisible = PARADAS[actoMostrado];
  const tituloGaleriaHorizontal = modoGaleria === "artistas" ? "Artistas" : "Obras";

  return (
    <div
      className={clsx(
        "pagina-escena text-[color:var(--tinta)]",
        desdeAcceso && "escena-desde-acceso"
      )}
    >
      {/* Entrada: punto de luz una sola vez por sesión (se omite con movimiento reducido) */}
      <Entrada />

      {/* Ambiente de Nivel 3 */}
      <Ambiente nivel={3} />

      {/* Indicador de actos */}
      <nav
        className="actos !top-[calc(var(--alto-cabecera)+var(--espacio-16))]"
        aria-label="Actos"
      >
        <p className={clsx("actos__numero", cambiandoTexto && "cambiando")}>
          <span className="actos__etiqueta">Acto</span>{" "}
          <span>{paradaVisible.acto}</span>
        </p>
        <div className="actos__marcas">
          {PARADAS.map((parada, idx) => (
            <button
              key={parada.acto}
              type="button"
              aria-label={`Ir al acto ${parada.acto}: ${parada.titulo}`}
              aria-current={idx === actoActual ? "true" : "false"}
              onClick={() => irAActo(idx)}
            />
          ))}
        </div>
      </nav>

      {/* Cuatro paradas fijas de 100vh cada una (400vh en total) */}
      <div aria-hidden="true">
        <div className="parada-escena" id="acto-inicio" />
        <div className="parada-escena" id="acto-obras" />
        <div className="parada-escena" id="acto-artistas" />
        <div className="parada-escena" id="acto-certificado" />
      </div>

      {/* Columna / Arco rojo con textura de impresión, hueco superior en la cúspide y dos rieles incandescentes */}
      <Arco nivel={3} />

      {/* Disco negro que nace en la cúspide del arco y desciende por la columna con el scroll */}
      <Disco
        nivel={3}
        variante="escena"
        titulo={paradaVisible.titulo}
        subtitulo={paradaVisible.subtitulo}
        cambiando={cambiandoTexto}
        onTituloClick={() => irAActo((actoActual + 1) % PARADAS.length)}
      >
        {/* ACTO I: Pixel & Lienzo */}
        {actoMostrado === 0 && (
          <div className="flex flex-wrap items-center justify-center gap-[var(--espacio-12)]">
            <button
              type="button"
              onClick={(e) => abrirGaleria("obras", 0, e.currentTarget)}
              className="disco-enlace disco-enlace--primario"
            >
              Explorar obras
            </button>
            <Link to={rutaSoyArtista} className="disco-enlace">
              Soy artista
            </Link>
          </div>
        )}

        {/* ACTO II: Obras */}
        {actoMostrado === 1 && (
          <div className="flex flex-col items-center gap-[var(--espacio-12)]">
            {cargandoObras ? (
              <div
                role="status"
                aria-label="Cargando obras destacadas"
                className="flex items-center justify-center gap-[var(--espacio-12)] py-[var(--espacio-8)]"
              >
                <span className="h-[var(--espacio-12)] w-[var(--espacio-12)] rounded-[var(--radio-circulo)] bg-[color:var(--esqueleto)] animate-[pulso-esqueleto_var(--duracion-esqueleto)_ease-in-out_infinite]" />
                <span className="h-[var(--espacio-12)] w-[var(--espacio-12)] rounded-[var(--radio-circulo)] bg-[color:var(--esqueleto)] animate-[pulso-esqueleto_var(--duracion-esqueleto)_ease-in-out_infinite]" />
                <span className="h-[var(--espacio-12)] w-[var(--espacio-12)] rounded-[var(--radio-circulo)] bg-[color:var(--esqueleto)] animate-[pulso-esqueleto_var(--duracion-esqueleto)_ease-in-out_infinite]" />
              </div>
            ) : obrasDestacadas.length === 0 ? (
              <>
                <div className="disco__miniaturas">
                  {OBRAS_MUESTRA.slice(0, 3).map((muestra, idx) => (
                    <button
                      key={muestra.id}
                      type="button"
                      className={clsx("miniatura-disco", muestra.vista)}
                      aria-label={`Ver obra: ${muestra.titulo}`}
                      onClick={(e) => abrirGaleria("obras", idx, e.currentTarget)}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={(e) => abrirGaleria("obras", 0, e.currentTarget)}
                  className="disco-enlace"
                >
                  Ver obras en sala →
                </button>
              </>
            ) : (
              <>
                <div className="disco__miniaturas">
                  {miniaturasDisco.map((obra, idx) => (
                    <button
                      key={obra.id_obra}
                      type="button"
                      className={clsx(
                        "miniatura-disco overflow-hidden p-[var(--espacio-4)]",
                        VISTAS_RESPALDO[idx % VISTAS_RESPALDO.length]
                      )}
                      aria-label={`Ver obra destacada: ${obra.titulo}`}
                      onClick={(e) => abrirGaleria("obras", idx, e.currentTarget)}
                    >
                      <img
                        src={urlPreviewObra(obra.id_obra)}
                        alt={obra.titulo}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-contain"
                      />
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={(e) => abrirGaleria("obras", 0, e.currentTarget)}
                  className="disco-enlace"
                >
                  Ver obras destacadas →
                </button>
              </>
            )}
          </div>
        )}

        {/* ACTO III: Artistas */}
        {actoMostrado === 2 && (
          <div className="flex flex-col items-center gap-[var(--espacio-12)]">
            <div className="flex items-center justify-center gap-[var(--espacio-12)]">
              {avataresArtistas.map((artista, idx) => (
                <button
                  key={artista.idArtista}
                  type="button"
                  onClick={(e) => abrirGaleria("artistas", idx, e.currentTarget)}
                  aria-label={`Explorar artista: ${artista.nombre}`}
                  className="avatar-disco cursor-pointer transition-transform duration-[var(--duracion-hover)] hover:-translate-y-[3px] hover:border-white"
                >
                  {artista.inicial}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={(e) => abrirGaleria("artistas", 0, e.currentTarget)}
              className="disco-enlace"
            >
              Conocer a los artistas
            </button>
          </div>
        )}

        {/* ACTO IV: Certificado (límite de panel <= 80 caracteres) */}
        {actoMostrado === 3 && (
          <div className="flex flex-col items-center gap-[var(--espacio-12)]">
            <p className="max-w-[26ch] font-[var(--fuente-acento)] text-[length:var(--text-cuerpo-pequeno)] italic leading-snug text-[color:var(--tinta-suave)]">
              Cada obra incluye un certificado de autenticidad que cualquiera puede verificar.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-[var(--espacio-8)]">
              <Link to={rutaVerificar} className="disco-enlace disco-enlace--primario">
                Verificar certificado
              </Link>
              <Link to={rutaPublicarObra} className="disco-enlace">
                Publicar mi obra
              </Link>
            </div>
          </div>
        )}
      </Disco>

      {/* Galería horizontal: la columna roja (.galeria__arco) gira -90° y despliega las tarjetas en horizontal */}
      <section
        ref={galeriaRef}
        className={clsx(
          "galeria",
          galeriaActiva && "activa",
          galeriaAbierta && "abierta"
        )}
        role="dialog"
        aria-modal="true"
        aria-label={tituloGaleriaHorizontal}
        aria-hidden={!galeriaActiva}
      >
        <div className="galeria__fondo" />
        <div className="galeria__arco" aria-hidden="true">
          <div className="riel riel--izq" />
          <div className="riel riel--der" />
          <div className="arco__hueco" />
        </div>

        <h2 className="galeria__titulo">{tituloGaleriaHorizontal}</h2>

        <div
          ref={pistaRef}
          tabIndex={0}
          aria-label={`${tituloGaleriaHorizontal}: desliza horizontalmente`}
          onScroll={alScrollPista}
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
            fueArrastreRef.current = false;
            dragInicioXRef.current = e.clientX;
            dragScrollInicialRef.current = pistaRef.current.scrollLeft;
          }}
          onMouseMove={(e) => {
            if (!arrastrandoPista || !pistaRef.current) return;
            const dx = e.clientX - dragInicioXRef.current;
            if (Math.abs(dx) > 6) fueArrastreRef.current = true;
            pistaRef.current.scrollLeft = dragScrollInicialRef.current - dx;
          }}
          onMouseUp={() => setArrastrandoPista(false)}
          onMouseLeave={() => setArrastrandoPista(false)}
          className={clsx("galeria__pista", arrastrandoPista && "arrastrando")}
        >
          {modoGaleria === "obras" ? (
            <>
              {obrasDestacadas.length > 0
                ? obrasDestacadas.map((obra, idx) => {
                    const anio = obra.anio_creacion ?? undefined;

                    return (
                      <Link
                        key={obra.id_obra}
                        to={`/obras/${obra.id_obra}`}
                        onClick={(e) => {
                          if (fueArrastreRef.current) {
                            e.preventDefault();
                          } else {
                            document.documentElement.classList.remove("galeria-abierta");
                          }
                        }}
                        className="tarjeta-galeria"
                      >
                        <div
                          className={clsx(
                            "tarjeta-galeria__vista",
                            VISTAS_RESPALDO[idx % VISTAS_RESPALDO.length]
                          )}
                        >
                          <img
                            src={urlPreviewObra(obra.id_obra)}
                            alt={obra.titulo}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <div className="tarjeta-galeria__pie">
                          <span className="tarjeta-galeria__num">{pad2(idx + 1)}</span>
                          <h3 className="tarjeta-galeria__titulo line-clamp-1">{obra.titulo}</h3>
                          <p className="tarjeta-galeria__meta line-clamp-1">
                            {obra.tecnica}
                            {anio ? ` · ${anio}` : ""}
                          </p>
                          <p className="precio-obra mt-[var(--espacio-4)] text-[length:var(--text-cuerpo-pequeno)] font-semibold text-[color:var(--tinta)]">
                            {formatearMoneda(obra.precio_venta)}
                          </p>
                        </div>
                      </Link>
                    );
                  })
                : OBRAS_MUESTRA.map((muestra, idx) => (
                    <button
                      key={muestra.id}
                      type="button"
                      onClick={() => {
                        if (fueArrastreRef.current) return;
                        setGaleriaAbierta(false);
                        setGaleriaActiva(false);
                        irAlCatalogo();
                      }}
                      className="tarjeta-galeria text-left"
                    >
                      <div className={clsx("tarjeta-galeria__vista", muestra.vista)} />
                      <div className="tarjeta-galeria__pie">
                        <span className="tarjeta-galeria__num">{pad2(idx + 1)}</span>
                        <h3 className="tarjeta-galeria__titulo line-clamp-1">{muestra.titulo}</h3>
                        <p className="tarjeta-galeria__meta line-clamp-1">{muestra.subtitulo}</p>
                      </div>
                    </button>
                  ))}

              {/* Última tarjeta de la pista de Obras: "Ver todo el catálogo" */}
              <button
                type="button"
                onClick={() => {
                  setGaleriaAbierta(false);
                  setGaleriaActiva(false);
                  irAlCatalogo();
                }}
                className="tarjeta-galeria items-center justify-center p-[var(--espacio-32)] text-center"
              >
                <span className="tarjeta-galeria__num">CATÁLOGO</span>
                <span className="mt-[var(--espacio-12)] font-[var(--fuente-titulo)] text-[length:var(--text-h3)] font-black text-[color:var(--tinta)]">
                  Ver todo el catálogo
                </span>
                <span className="mt-[var(--espacio-8)] font-[var(--fuente-acento)] text-[length:var(--text-cuerpo)] italic text-[color:var(--tinta-suave)]">
                  Explorar todas las obras disponibles →
                </span>
              </button>
            </>
          ) : (
            <>
              {artistasColeccion.map((artista, idx) => (
                <button
                  key={artista.idArtista}
                  type="button"
                  onClick={() => {
                    if (fueArrastreRef.current) return;
                    setGaleriaAbierta(false);
                    setGaleriaActiva(false);
                    irADirectorioArtistas(artista.idArtista);
                  }}
                  className="tarjeta-galeria text-left"
                >
                  <div
                    className={clsx(
                      "tarjeta-galeria__vista flex-col gap-[var(--espacio-12)]",
                      VISTAS_RESPALDO[idx % VISTAS_RESPALDO.length]
                    )}
                  >
                    <span className="inline-grid h-[var(--miniatura-96)] w-[var(--miniatura-96)] place-items-center rounded-[var(--radio-circulo)] border border-[color:var(--riel)] bg-[color:var(--vacio)] font-[var(--fuente-titulo)] text-[length:var(--text-h1-movil)] font-black text-[color:var(--tinta)] shadow-[var(--resplandor-disco)]">
                      {artista.inicial}
                    </span>
                  </div>
                  <div className="tarjeta-galeria__pie">
                    <span className="tarjeta-galeria__num">{pad2(idx + 1)}</span>
                    <h3 className="tarjeta-galeria__titulo line-clamp-1">{artista.nombre}</h3>
                    <p className="tarjeta-galeria__meta line-clamp-1">{artista.disciplina}</p>
                    <p className="precio-obra mt-[var(--espacio-4)] text-[length:var(--text-cuerpo-pequeno)] text-[color:var(--tinta-suave)]">
                      {artista.obrasPublicadas}{" "}
                      {artista.obrasPublicadas === 1 ? "obra en sala" : "obras en sala"}
                    </p>
                  </div>
                </button>
              ))}

              {/* Última tarjeta de la pista de Artistas: "Ver todos los artistas" */}
              <button
                type="button"
                onClick={() => {
                  setGaleriaAbierta(false);
                  setGaleriaActiva(false);
                  irADirectorioArtistas();
                }}
                className="tarjeta-galeria items-center justify-center p-[var(--espacio-32)] text-center"
              >
                <span className="tarjeta-galeria__num">DIRECTORIO</span>
                <span className="mt-[var(--espacio-12)] font-[var(--fuente-titulo)] text-[length:var(--text-h3)] font-black text-[color:var(--tinta)]">
                  Ver todos los artistas
                </span>
                <span className="mt-[var(--espacio-8)] font-[var(--fuente-acento)] text-[length:var(--text-cuerpo)] italic text-[color:var(--tinta-suave)]">
                  Conocer a quienes crean cada obra →
                </span>
              </button>
            </>
          )}
        </div>

        <div className="galeria__controles">
          <button
            type="button"
            aria-label="Elemento anterior"
            onClick={() => {
              const ant = Math.max(0, indiceGaleria - 1);
              setIndiceGaleria(ant);
              desplazarPistaAIndice(ant, true);
            }}
          >
            ←
          </button>
          <span className="galeria__contador">
            {pad2(Math.min(indiceGaleria + 1, totalTarjetasPista))} / {pad2(totalTarjetasPista)}
          </span>
          <button
            type="button"
            aria-label="Elemento siguiente"
            onClick={() => {
              const sig = Math.min(totalTarjetasPista - 1, indiceGaleria + 1);
              setIndiceGaleria(sig);
              desplazarPistaAIndice(sig, true);
            }}
          >
            →
          </button>
        </div>

        <button
          ref={cerrarGaleriaRef}
          type="button"
          onClick={cerrarGaleria}
          className="galeria__cerrar"
        >
          Cerrar
        </button>
      </section>
    </div>
  );
}
