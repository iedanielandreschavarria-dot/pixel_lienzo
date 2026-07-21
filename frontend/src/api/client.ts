import axios, { type InternalAxiosRequestConfig } from "axios";
import type { TokenResponse } from "../types";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

const ACCESS_KEY = "pyl_access_token";
const REFRESH_KEY = "pyl_refresh_token";

export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  setTokens: (access: string, refresh: string) => {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Evita disparar varios `/auth/refresh` en paralelo si varias peticiones
// reciben 401 al mismo tiempo: todas esperan la misma promesa en curso.
let refreshEnCurso: Promise<string | null> | null = null;

async function refrescarAccessToken(): Promise<string | null> {
  const refresh_token = tokenStorage.getRefresh();
  if (!refresh_token) return null;
  try {
    const { data } = await axios.post<TokenResponse>(`${API_URL}/auth/refresh`, { refresh_token });
    tokenStorage.setTokens(data.access_token, data.refresh_token);
    return data.access_token;
  } catch {
    tokenStorage.clear();
    return null;
  }
}

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as RetriableRequestConfig | undefined;
    const esRefresh = original?.url?.includes("/auth/refresh");

    if (error.response?.status === 401 && original && !original._retry && !esRefresh && tokenStorage.getRefresh()) {
      original._retry = true;
      refreshEnCurso ??= refrescarAccessToken().finally(() => {
        refreshEnCurso = null;
      });
      const nuevoToken = await refreshEnCurso;
      if (nuevoToken) {
        original.headers.Authorization = `Bearer ${nuevoToken}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  }
);

/** Extrae un mensaje de error legible de una respuesta de FastAPI (`{detail: ...}`). */
export function obtenerMensajeError(error: unknown, fallback = "Ocurrió un error inesperado"): string {
  if (axios.isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: unknown } | undefined)?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail.map((d) => (typeof d === "object" && d && "msg" in d ? String(d.msg) : String(d))).join(". ");
    }
  }
  return fallback;
}

export default api;
