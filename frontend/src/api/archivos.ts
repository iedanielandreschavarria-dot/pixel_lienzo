import api from "./client";

async function subirArchivo(ruta: string, archivo: File): Promise<string> {
  const formData = new FormData();
  formData.append("archivo", archivo);
  const { data } = await api.post<{ url: string }>(ruta, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.url;
}

export function subirDocumentoIdentidad(archivo: File): Promise<string> {
  return subirArchivo("/archivos/documento-identidad", archivo);
}

/** Sube la fotografía en alta resolución de una obra (solo Artista).
 * La URL devuelta es la que se envía como `fotografia_hd_url`. */
export function subirFotografiaObra(archivo: File): Promise<string> {
  return subirArchivo("/archivos/obra", archivo);
}

/** Sube el PDF del certificado de autenticidad firmado (solo Curador).
 * La URL devuelta es la que se envía como `pdf_certificado_url`. */
export function subirPdfCertificado(archivo: File): Promise<string> {
  return subirArchivo("/archivos/certificado", archivo);
}
