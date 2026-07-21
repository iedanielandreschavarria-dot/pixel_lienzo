import api from "./client";
import type { Categoria } from "../types";

export async function listarCategorias(): Promise<Categoria[]> {
  const { data } = await api.get<Categoria[]>("/categorias");
  return data;
}
