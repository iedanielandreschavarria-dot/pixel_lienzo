import api from "./client";
import type { PerfilArtista } from "../types";

export async function obtenerPerfilArtista(idArtista: number): Promise<PerfilArtista> {
  const { data } = await api.get<PerfilArtista>(`/artistas/${idArtista}`);
  return data;
}
