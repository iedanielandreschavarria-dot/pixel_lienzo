import api, { API_URL } from "./client";
import type { EstadoObra, Obra, ObraCreatePayload, ObraUpdatePayload } from "../types";

export interface FiltrosCatalogo {
  id_categoria?: number;
  id_artista?: number;
  precio_min?: number;
  precio_max?: number;
}

export async function listarCatalogo(filtros: FiltrosCatalogo = {}): Promise<Obra[]> {
  const { data } = await api.get<Obra[]>("/obras", { params: filtros });
  return data;
}

export async function obtenerObra(idObra: number): Promise<Obra> {
  const { data } = await api.get<Obra>(`/obras/${idObra}`);
  return data;
}

/** Resuelve la obra por su UID público: es el identificador que llevan los
 * códigos QR físicos ubicados junto a la pieza. */
export async function obtenerObraPorUid(uid: string): Promise<Obra> {
  const { data } = await api.get<Obra>(`/obras/uid/${uid}`);
  return data;
}

/** Portafolio del artista autenticado, en cualquier estado (incluye las que
 * siguen en revisión curatorial y por eso no aparecen en el catálogo). */
export async function listarMisObras(): Promise<Obra[]> {
  const { data } = await api.get<Obra[]>("/obras/mis-obras");
  return data;
}

export async function crearObra(payload: ObraCreatePayload): Promise<Obra> {
  const { data } = await api.post<Obra>("/obras", payload);
  return data;
}

export async function actualizarObra(idObra: number, payload: ObraUpdatePayload): Promise<Obra> {
  const { data } = await api.patch<Obra>(`/obras/${idObra}`, payload);
  return data;
}

/** Cola de revisión curatorial (solo Curador). */
export async function listarObrasPendientes(): Promise<Obra[]> {
  const { data } = await api.get<Obra[]>("/obras/pendientes");
  return data;
}

export async function actualizarEstadoObra(
  idObra: number,
  estado_obra: EstadoObra,
  motivo?: string
): Promise<Obra> {
  const { data } = await api.patch<Obra>(`/obras/${idObra}/estado`, { estado_obra, motivo });
  return data;
}

/** URL de la previsualización con marca de agua (nunca usar `fotografia_hd_url` directamente en el catálogo público). */
export function urlPreviewObra(idObra: number): string {
  return `${API_URL}/obras/${idObra}/preview`;
}

export function urlQrObra(idObra: number): string {
  return `${API_URL}/obras/${idObra}/qr`;
}
