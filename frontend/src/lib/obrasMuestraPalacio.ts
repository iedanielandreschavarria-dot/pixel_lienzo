import { urlPreviewObra } from "../api/obras";
import type { Obra } from "../types";

export interface ObraMuestra extends Obra {
  nombreArtistaMuestra?: string;
}

/**
 * Fotografías reales de pinturas maestras de la historia del arte almacenadas
 * localmente en `public/obras/` para carga instantánea en las tarjetas del
 * catálogo, el Lightbox y la vista de detalle.
 */
export const IMAGENES_PINTURAS_FAMOSAS: ReadonlyArray<string> = [
  "/obras/noche-estrellada.jpg",
  "/obras/impresion-sol-naciente.jpg",
  "/obras/joven-perla.jpg",
  "/obras/el-beso-klimt.jpg",
  "/obras/caminante-mar-nubes.jpg",
  "/obras/gran-ola-kanagawa.jpg",
  "/obras/lirios-van-gogh.jpg",
  "/obras/nenufares-monet.jpg",
];

/**
 * Obras curatoriales del Palacio Nacional de Medellín con fotografías reales
 * de pinturas famosas en alta resolución.
 */
export const OBRAS_MUESTRA_PALACIO: ReadonlyArray<ObraMuestra> = [
  {
    id_obra: 901,
    uid: "PYL-PAL-2026-0901",
    titulo: "La noche estrellada",
    tecnica: "Óleo sobre lienzo",
    dimensiones: "73.7 x 92.1 cm",
    peso: "4.2",
    anio_creacion: 1889,
    precio_venta: "4850000",
    fotografia_hd_url: "/obras/noche-estrellada.jpg",
    codigo_qr_obra: null,
    estado_obra: "Publicado",
    es_patrimonio_historico: true,
    id_artista: 101,
    id_categoria: 1,
    nombreArtistaMuestra: "VINCENT VAN GOGH",
  },
  {
    id_obra: 902,
    uid: "PYL-PAL-2026-0902",
    titulo: "Impresión, sol naciente",
    tecnica: "Óleo sobre lienzo",
    dimensiones: "48 x 63 cm",
    peso: "2.4",
    anio_creacion: 1872,
    precio_venta: "3650000",
    fotografia_hd_url: "/obras/impresion-sol-naciente.jpg",
    codigo_qr_obra: null,
    estado_obra: "Publicado",
    es_patrimonio_historico: false,
    id_artista: 102,
    id_categoria: 1,
    nombreArtistaMuestra: "CLAUDE MONET",
  },
  {
    id_obra: 903,
    uid: "PYL-PAL-2026-0903",
    titulo: "La joven de la perla",
    tecnica: "Óleo sobre tela",
    dimensiones: "44.5 x 39 cm",
    peso: "2.1",
    anio_creacion: 1665,
    precio_venta: "5400000",
    fotografia_hd_url: "/obras/joven-perla.jpg",
    codigo_qr_obra: null,
    estado_obra: "Publicado",
    es_patrimonio_historico: true,
    id_artista: 103,
    id_categoria: 1,
    nombreArtistaMuestra: "JOHANNES VERMEER",
  },
  {
    id_obra: 904,
    uid: "PYL-PAL-2026-0904",
    titulo: "El beso",
    tecnica: "Óleo y laminillas de oro y plata sobre lienzo",
    dimensiones: "180 x 180 cm",
    peso: "6.5",
    anio_creacion: 1908,
    precio_venta: "6200000",
    fotografia_hd_url: "/obras/el-beso-klimt.jpg",
    codigo_qr_obra: null,
    estado_obra: "Publicado",
    es_patrimonio_historico: true,
    id_artista: 104,
    id_categoria: 1,
    nombreArtistaMuestra: "GUSTAV KLIMT",
  },
  {
    id_obra: 905,
    uid: "PYL-PAL-2026-0905",
    titulo: "El caminante sobre el mar de nubes",
    tecnica: "Óleo sobre lienzo",
    dimensiones: "94.8 x 74.8 cm",
    peso: "3.8",
    anio_creacion: 1818,
    precio_venta: "4100000",
    fotografia_hd_url: "/obras/caminante-mar-nubes.jpg",
    codigo_qr_obra: null,
    estado_obra: "Publicado",
    es_patrimonio_historico: false,
    id_artista: 105,
    id_categoria: 1,
    nombreArtistaMuestra: "CASPAR DAVID FRIEDRICH",
  },
  {
    id_obra: 906,
    uid: "PYL-PAL-2026-0906",
    titulo: "La gran ola de Kanagawa",
    tecnica: "Xilografía ukiyo-e policromada",
    dimensiones: "25.7 x 37.9 cm",
    peso: "1.4",
    anio_creacion: 1831,
    precio_venta: "2950000",
    fotografia_hd_url: "/obras/gran-ola-kanagawa.jpg",
    codigo_qr_obra: null,
    estado_obra: "Publicado",
    es_patrimonio_historico: true,
    id_artista: 106,
    id_categoria: 3,
    nombreArtistaMuestra: "KATSUSHIKA HOKUSAI",
  },
  {
    id_obra: 907,
    uid: "PYL-PAL-2026-0907",
    titulo: "Los lirios",
    tecnica: "Óleo sobre lienzo",
    dimensiones: "71 x 93 cm",
    peso: "3.6",
    anio_creacion: 1889,
    precio_venta: "4450000",
    fotografia_hd_url: "/obras/lirios-van-gogh.jpg",
    codigo_qr_obra: null,
    estado_obra: "Publicado",
    es_patrimonio_historico: false,
    id_artista: 101,
    id_categoria: 1,
    nombreArtistaMuestra: "VINCENT VAN GOGH",
  },
  {
    id_obra: 908,
    uid: "PYL-PAL-2026-0908",
    titulo: "Nenúfares",
    tecnica: "Óleo sobre lienzo",
    dimensiones: "89.9 x 94.1 cm",
    peso: "3.4",
    anio_creacion: 1906,
    precio_venta: "3980000",
    fotografia_hd_url: "/obras/nenufares-monet.jpg",
    codigo_qr_obra: null,
    estado_obra: "Publicado",
    es_patrimonio_historico: false,
    id_artista: 102,
    id_categoria: 2,
    nombreArtistaMuestra: "CLAUDE MONET",
  },
];

const NOMBRES_ARTISTAS_POR_ID: Record<number, string> = {
  101: "VINCENT VAN GOGH",
  102: "CLAUDE MONET",
  103: "JOHANNES VERMEER",
  104: "GUSTAV KLIMT",
  105: "CASPAR DAVID FRIEDRICH",
  106: "KATSUSHIKA HOKUSAI",
};

export function resolverNombreArtistaObra(obra: Obra, nombreArtistaProp?: string): string {
  if (nombreArtistaProp && nombreArtistaProp.trim()) {
    return nombreArtistaProp;
  }
  const conMuestra = obra as ObraMuestra;
  if (conMuestra.nombreArtistaMuestra) {
    return conMuestra.nombreArtistaMuestra;
  }
  if (NOMBRES_ARTISTAS_POR_ID[obra.id_artista]) {
    return NOMBRES_ARTISTAS_POR_ID[obra.id_artista];
  }
  return `ARTISTA N.º ${obra.id_artista}`;
}

export function esObraMuestraLocal(obra: Obra): boolean {
  return Boolean(obra.fotografia_hd_url?.startsWith("/obras/")) || obra.id_obra >= 901;
}

/**
 * Devuelve la pintura famosa de respaldo determinista para cualquier obra
 * (en caso de que una obra del backend no tenga foto cargada o dé 404).
 */
export function obtenerPinturaFamosaFallback(obra: Obra): string {
  if (obra.fotografia_hd_url?.startsWith("/obras/")) {
    return obra.fotografia_hd_url;
  }
  const idx = Math.abs(obra.id_obra) % IMAGENES_PINTURAS_FAMOSAS.length;
  return IMAGENES_PINTURAS_FAMOSAS[idx] ?? IMAGENES_PINTURAS_FAMOSAS[0];
}

/**
 * Resuelve la URL de imagen real a mostrar en tarjetas, lightbox y detalle.
 */
export function resolverUrlImagenObra(obra: Obra, forzarFallbackFamoso = false): string {
  if (forzarFallbackFamoso || esObraMuestraLocal(obra) || !obra.fotografia_hd_url) {
    return obtenerPinturaFamosaFallback(obra);
  }
  if (
    obra.fotografia_hd_url.startsWith("http://") ||
    obra.fotografia_hd_url.startsWith("https://")
  ) {
    return obra.fotografia_hd_url;
  }
  return urlPreviewObra(obra.id_obra);
}
