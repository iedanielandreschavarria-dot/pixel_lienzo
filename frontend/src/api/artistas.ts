import api from "./client";
import type { PerfilArtista } from "../types";

export async function obtenerPerfilArtista(idArtista: number): Promise<PerfilArtista> {
  const { data } = await api.get<PerfilArtista>(`/artistas/${idArtista}`);
  return data;
}

export interface PerfilArtistaUpdatePayload {
  biografia_profesional?: string;
  informacion_bancaria?: string;
}

export async function actualizarPerfilArtista(
  idArtista: number,
  payload: PerfilArtistaUpdatePayload
): Promise<PerfilArtista> {
  const { data } = await api.patch<PerfilArtista>(`/artistas/${idArtista}`, payload);
  return data;
}

/** Bandeja de artistas por validar (solo Curador). */
export async function listarArtistasPendientes(): Promise<PerfilArtista[]> {
  const { data } = await api.get<PerfilArtista[]>("/artistas/pendientes");
  return data;
}

export async function validarArtista(
  idArtista: number,
  aprobar: boolean,
  motivos_rechazo?: string
): Promise<PerfilArtista> {
  const { data } = await api.patch<PerfilArtista>(`/artistas/${idArtista}/validar`, {
    aprobar,
    motivos_rechazo,
  });
  return data;
}
