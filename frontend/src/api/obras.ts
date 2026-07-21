import api, { API_URL } from "./client";
import type { Obra } from "../types";

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

/** URL de la previsualización con marca de agua (nunca usar `fotografia_hd_url` directamente en el catálogo público). */
export function urlPreviewObra(idObra: number): string {
  return `${API_URL}/obras/${idObra}/preview`;
}

export function urlQrObra(idObra: number): string {
  return `${API_URL}/obras/${idObra}/qr`;
}
