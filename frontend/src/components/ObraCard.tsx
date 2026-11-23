import { useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { Obra } from "../types";
import { formatearMoneda } from "../lib/formato";
import {
  obtenerPinturaFamosaFallback,
  resolverNombreArtistaObra,
  resolverUrlImagenObra,
} from "../lib/obrasMuestraPalacio";

export interface ObraCardProps {
  obra: Obra;
  nombreArtista?: string;
  /** Índices < 4 deben cargarse con loading="eager" para proteger el LCP */
  prioridad?: boolean;
  /** Callback al seleccionar la obra para abrir el Lightbox sincronizado con la URL */
  onSelect?: (obra: Obra, triggerEl: HTMLElement) => void;
}

const PROPORCIONES_EDITORIALES: ReadonlyArray<{ width: number; height: number }> = [
  { width: 880, height: 960 },
];

/**
 * Genera un slug legible y determinista para sincronizar la obra en la URL (?obra=<slug>).
 */
export function obtenerSlugObra(obra: Obra): string {
  const base = obra.titulo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base ? `${base}-${obra.id_obra}` : `obra-${obra.id_obra}`;
}

/**
 * Verifica si un parámetro ?obra= de la URL coincide con la obra por slug, UID o ID numérico.
 */
export function coincideParametroObra(obra: Obra, parametro: string | null): boolean {
  if (!parametro) return false;
  const limpio = parametro.trim().toLowerCase();
  if (!limpio) return false;
  if (limpio === String(obra.id_obra)) return true;
  if (obra.uid && limpio === obra.uid.toLowerCase()) return true;
  if (limpio === obtenerSlugObra(obra).toLowerCase()) return true;
  const matchSufijo = limpio.match(/-(\d+)$/);
  if (matchSufijo && Number(matchSufijo[1]) === obra.id_obra) return true;
  return false;
}

/**
 * Proporción armónica para las tarjetas con ambiente de galería/sala.
 */
export function calcularDimensionesObra(obra: Obra): {
  width: number;
  height: number;
  aspectRatioCss: string;
} {
  const fallback =
    PROPORCIONES_EDITORIALES[Math.abs(obra.id_obra) % PROPORCIONES_EDITORIALES.length] ??
    PROPORCIONES_EDITORIALES[0];

  return {
    width: fallback.width,
    height: fallback.height,
    aspectRatioCss: `${fallback.width} / ${fallback.height}`,
  };
}

/**
 * Lienzo fotográfico real de pintura famosa para usar como fallback en Lightbox o Detalle.
 */
export function LienzoPictoricoObra({ obra }: { obra: Obra }) {
  const srcPintura = obtenerPinturaFamosaFallback(obra);
  return (
    <img
      src={srcPintura}
      alt={obra.titulo}
      decoding="async"
      className="h-full w-full object-cover block"
    />
  );
}

/**
 * Tarjeta de obra con fotografía real de pintura enmarcada en sala/ambiente y zoom a obra completa en hover:
 * - Estado de reposo (Imagen 1): la pintura real se aprecia enmarcada dentro de un ambiente arquitectónico
 *   de galería (Variante A: sala de galería con riel de focos cenitales y piso de madera;
 *   Variante B: estudio luminoso con marco negro, paspartú de galería, escritorio blanco, laptop, taza y planta).
 * - Estado hover / focus (Imagen 2): la fotografía de la pintura completa se despliega al 100 % del recuadro
 *   y el título inferior se subraya limpiamente.
 */
export function ObraCard({
  obra,
  nombreArtista,
  prioridad = false,
  onSelect,
}: ObraCardProps) {
  const navigate = useNavigate();
  const [usarFallbackFamoso, setUsarFallbackFamoso] = useState(false);

  const artistaTexto = resolverNombreArtistaObra(obra, nombreArtista);
  const altTexto = `${obra.titulo} — ${artistaTexto} (${obra.tecnica})`;
  const vendida = obra.estado_obra === "Vendido";
  const slug = obtenerSlugObra(obra);
  const { width, height, aspectRatioCss } = calcularDimensionesObra(obra);

  const srcImagen = resolverUrlImagenObra(obra, usarFallbackFamoso);
  const varianteAmbiente = Math.abs(obra.id_obra) % 2 === 1 ? "galeria" : "estudio";

  const precioTexto = vendida
    ? "Adquirida"
    : obra.es_patrimonio_historico
      ? `${formatearMoneda(obra.precio_venta)} · Patrimonio`
      : formatearMoneda(obra.precio_venta);

  const hrefDestino = onSelect ? `?obra=${encodeURIComponent(slug)}` : `/obras/${obra.id_obra}`;

  const manejarClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) {
      return;
    }
    e.preventDefault();
    if (onSelect) {
      onSelect(obra, e.currentTarget);
    } else {
      navigate(`/obras/${obra.id_obra}`);
    }
  };

  return (
    <article role="listitem" className="obra-card">
      <a
        href={hrefDestino}
        onClick={manejarClick}
        className="obra__trigger"
        aria-label={`Ver obra ${obra.titulo}, de ${artistaTexto}`}
      >
        <figure
          className={`obra__figure obra__figure--${varianteAmbiente}`}
          style={{ aspectRatio: aspectRatioCss }}
        >
          {/* 1. ESCENA DE AMBIENTE EN REPOSO (la pintura real colgada en un cuadro dentro del espacio) */}
          <div className={`obra__ambiente obra__ambiente--${varianteAmbiente}`} aria-hidden="true">
            {varianteAmbiente === "galeria" ? (
              <>
                {/* Techo de sala con riel de 4 focos museográficos y haz de luz cálida */}
                <div className="obra__galeria-techo">
                  <div className="obra__galeria-riel">
                    <span className="obra__galeria-foco obra__galeria-foco--1" />
                    <span className="obra__galeria-foco obra__galeria-foco--2" />
                    <span className="obra__galeria-foco obra__galeria-foco--3" />
                    <span className="obra__galeria-foco obra__galeria-foco--4" />
                  </div>
                </div>
                <div className="obra__galeria-pared-izq" />
                <div className="obra__galeria-pared-der" />

                {/* Cuadro de gran formato centrado en la pared de la galería */}
                <div className="obra__cuadro obra__cuadro--galeria">
                  <div className="obra__cuadro-lienzo">
                    <img
                      src={srcImagen}
                      alt={altTexto}
                      width={width}
                      height={height}
                      decoding="async"
                      loading={prioridad ? "eager" : "lazy"}
                      fetchPriority={prioridad ? "high" : "auto"}
                      onError={() => {
                        if (!usarFallbackFamoso) setUsarFallbackFamoso(true);
                      }}
                      className="obra__img-cuadro"
                    />
                  </div>
                </div>

                {/* Piso de madera pulida con reflejo suave de la sala */}
                <div className="obra__galeria-piso" />
              </>
            ) : (
              <>
                {/* Ambiente Estudio / Sala con ventana, lámpara superior, planta y escritorio */}
                <div className="obra__estudio-lampara" />
                <div className="obra__estudio-ventana" />
                <div className="obra__estudio-puerta" />

                {/* Cuadro con marco oscuro de galería y paspartú marfil */}
                <div className="obra__cuadro obra__cuadro--estudio">
                  <div className="obra__cuadro-paspartu">
                    <div className="obra__cuadro-lienzo">
                      <img
                        src={srcImagen}
                        alt={altTexto}
                        width={width}
                        height={height}
                        decoding="async"
                        loading={prioridad ? "eager" : "lazy"}
                        fetchPriority={prioridad ? "high" : "auto"}
                        onError={() => {
                          if (!usarFallbackFamoso) setUsarFallbackFamoso(true);
                        }}
                        className="obra__img-cuadro"
                      />
                    </div>
                  </div>
                </div>

                {/* Planta decorativa a la izquierda y escritorio minimalista debajo */}
                <svg
                  className="obra__estudio-mobilario"
                  viewBox="0 0 400 175"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  {/* Hojas de planta tropical a la izquierda */}
                  <g fill="#4c6b3c">
                    <ellipse cx="22" cy="36" rx="22" ry="12" transform="rotate(-24 22 36)" />
                    <ellipse cx="38" cy="58" rx="24" ry="11" transform="rotate(18 38 58)" />
                    <ellipse cx="18" cy="82" rx="25" ry="12" transform="rotate(-15 18 82)" />
                    <ellipse cx="42" cy="105" rx="22" ry="11" transform="rotate(22 42 105)" />
                    <ellipse cx="20" cy="128" rx="24" ry="13" transform="rotate(-12 20 128)" />
                  </g>
                  <g fill="#6d8f56">
                    <ellipse cx="32" cy="44" rx="18" ry="9" transform="rotate(10 32 44)" />
                    <ellipse cx="28" cy="72" rx="20" ry="9" transform="rotate(-20 28 72)" />
                    <ellipse cx="34" cy="96" rx="18" ry="8" transform="rotate(14 34 96)" />
                  </g>

                  {/* Silla blanca a la derecha */}
                  <path
                    d="M348 45 L382 65 L370 148 L336 138 Z"
                    fill="none"
                    stroke="#eceae4"
                    strokeWidth="6"
                  />
                  <line x1="344" y1="74" x2="376" y2="90" stroke="#e2dfd8" strokeWidth="4" />
                  <line x1="340" y1="100" x2="373" y2="114" stroke="#e2dfd8" strokeWidth="4" />

                  {/* Mesa / escritorio blanco en perspectiva */}
                  <polygon points="88,82 325,82 350,132 58,132" fill="#f7f6f2" />
                  <rect x="58" y="132" width="292" height="11" fill="#dedbd3" />
                  <rect x="64" y="143" width="14" height="32" fill="#d0cdc4" />
                  <rect x="330" y="143" width="14" height="32" fill="#d0cdc4" />

                  {/* Laptop sobre el escritorio */}
                  <polygon points="172,88 238,88 248,112 162,112" fill="#d5d8dc" />
                  <polygon points="164,112 248,112 238,120 156,120" fill="#aeb4ba" />

                  {/* Vaso de café a la izquierda de la laptop */}
                  <polygon points="142,66 158,66 155,94 145,94" fill="#f3efe8" />
                  <rect x="140" y="62" width="20" height="5" rx="2" fill="#ffffff" />
                  <rect x="143" y="74" width="14" height="10" fill="#c7a57a" />
                </svg>
              </>
            )}
          </div>

          {/* 2. CAPA DE OBRA COMPLETA AL PASAR EL MOUSE (HOVER / FOCUS) */}
          <div className="obra__completa">
            <img
              src={srcImagen}
              alt=""
              aria-hidden="true"
              width={width}
              height={height}
              decoding="async"
              loading={prioridad ? "eager" : "lazy"}
              onError={() => {
                if (!usarFallbackFamoso) setUsarFallbackFamoso(true);
              }}
              className="obra__img-completa-media"
            />
          </div>
        </figure>

        {/* Ficha limpia inferior: Título (subrayado en hover), Artista en mayúsculas y Precio */}
        <div className="obra__info">
          <h3 className="obra__titulo">{obra.titulo}</h3>
          <p className="obra__artista">{artistaTexto}</p>
          <p className="obra__precio">{precioTexto}</p>
        </div>
      </a>
    </article>
  );
}
