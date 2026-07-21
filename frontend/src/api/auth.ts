import api, { tokenStorage } from "./client";
import type { Msg, TokenResponse, Usuario } from "../types";

export interface RegistroCompradorPayload {
  correo_electronico: string;
  contrasenia: string;
  categorias_interes: number[];
}

export interface RegistroArtistaPayload {
  correo_electronico: string;
  contrasenia: string;
  biografia_profesional?: string;
  documento_identidad_url: string;
  informacion_bancaria?: string;
}

export async function login(correo_electronico: string, contrasenia: string): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>("/auth/login", { correo_electronico, contrasenia });
  return data;
}

export async function verificarMfa(correo_electronico: string, codigo: string): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>("/auth/mfa/verificar", { correo_electronico, codigo });
  return data;
}

export async function registrarComprador(payload: RegistroCompradorPayload): Promise<Usuario> {
  const { data } = await api.post<Usuario>("/auth/registro/comprador", payload);
  return data;
}

export async function registrarArtista(payload: RegistroArtistaPayload): Promise<Usuario> {
  const { data } = await api.post<Usuario>("/auth/registro/artista", payload);
  return data;
}

export async function verificarEmail(correo_electronico: string, codigo: string): Promise<Msg> {
  const { data } = await api.post<Msg>("/auth/verificar-email", { correo_electronico, codigo });
  return data;
}

export async function solicitarRecuperacion(correo_electronico: string): Promise<Msg> {
  const { data } = await api.post<Msg>("/auth/password/recuperar", { correo_electronico });
  return data;
}

export async function restablecerPassword(token: string, nueva_contrasenia: string): Promise<Msg> {
  const { data } = await api.post<Msg>("/auth/password/restablecer", { token, nueva_contrasenia });
  return data;
}

export async function obtenerPerfilActual(): Promise<Usuario> {
  const { data } = await api.get<Usuario>("/auth/me");
  return data;
}

export async function logout(): Promise<void> {
  const refresh_token = tokenStorage.getRefresh() ?? undefined;
  try {
    await api.post<Msg>("/auth/logout", { refresh_token });
  } finally {
    tokenStorage.clear();
  }
}
