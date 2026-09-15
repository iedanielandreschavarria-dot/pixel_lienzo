import api, { API_URL } from "./client";
import type { Certificado, Obra, VerificacionCertificado } from "../types";

/** Obras aprobadas por curaduría que todavía no tienen certificado emitido
 * (solo Curador). */
export async function listarObrasSinCertificado(): Promise<Obra[]> {
  const { data } = await api.get<Obra[]>("/certificados/pendientes");
  return data;
}

export async function obtenerCertificado(idObra: number): Promise<Certificado> {
  const { data } = await api.get<Certificado>(`/certificados/${idObra}`);
  return data;
}

/** Resuelve el sello SHA-256 que codifica el QR de validación del certificado
 * e informa si la ficha técnica sigue coincidiendo con lo certificado. */
export async function verificarSello(sello: string): Promise<VerificacionCertificado> {
  const { data } = await api.get<VerificacionCertificado>(`/certificados/verificar/${sello}`);
  return data;
}

export interface CertificadoCreatePayload {
  firma_digital_curador: string;
  pdf_certificado_url: string;
}

export async function emitirCertificado(
  idObra: number,
  payload: CertificadoCreatePayload
): Promise<Certificado> {
  const { data } = await api.post<Certificado>(`/certificados/${idObra}`, payload);
  return data;
}

export function urlQrCertificado(idObra: number): string {
  return `${API_URL}/certificados/${idObra}/qr`;
}
