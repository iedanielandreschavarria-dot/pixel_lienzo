import api from "./client";
import type { RegistroTrazabilidad } from "../types";

/** Línea de tiempo pública de propietarios de la obra (provenance). */
export async function obtenerTrazabilidad(idObra: number): Promise<RegistroTrazabilidad[]> {
  const { data } = await api.get<RegistroTrazabilidad[]>(`/trazabilidad/${idObra}`);
  return data;
}
