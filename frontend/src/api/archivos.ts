import api from "./client";

export async function subirDocumentoIdentidad(archivo: File): Promise<string> {
  const formData = new FormData();
  formData.append("archivo", archivo);
  const { data } = await api.post<{ url: string }>("/archivos/documento-identidad", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.url;
}
