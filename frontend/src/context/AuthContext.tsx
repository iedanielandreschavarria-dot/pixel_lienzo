import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { jwtDecode } from "jwt-decode";
import * as authApi from "../api/auth";
import { tokenStorage } from "../api/client";
import type { AuthUser, NombreRol, TokenResponse } from "../types";

interface AccessTokenClaims {
  sub: string;
  rol: NombreRol;
  exp: number;
}

type ResultadoLogin = { requiereMfa: true } | { requiereMfa: false; rol: NombreRol | null };

interface AuthContextValue {
  user: AuthUser | null;
  cargando: boolean;
  login: (correo: string, contrasenia: string) => Promise<ResultadoLogin>;
  loginGoogle: (credential: string) => Promise<ResultadoLogin>;
  guardarSesionDesdeTokens: (respuesta: TokenResponse) => Promise<NombreRol | null>;
  completarMfa: (correo: string, codigo: string) => Promise<NombreRol | null>;
  logout: () => Promise<void>;
  refrescarUsuario: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function decodificarRol(accessToken: string): NombreRol | null {
  try {
    return jwtDecode<AccessTokenClaims>(accessToken).rol;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargarUsuarioDesdeToken = useCallback(async () => {
    const access = tokenStorage.getAccess();
    if (!access) {
      setUser(null);
      return;
    }
    const rol = decodificarRol(access);
    if (!rol) {
      tokenStorage.clear();
      setUser(null);
      return;
    }
    try {
      const perfil = await authApi.obtenerPerfilActual();
      setUser({ ...perfil, rol });
    } catch {
      tokenStorage.clear();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    cargarUsuarioDesdeToken().finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const guardarSesionDesdeTokens = useCallback(async (respuesta: TokenResponse): Promise<NombreRol | null> => {
    tokenStorage.setTokens(respuesta.access_token, respuesta.refresh_token);
    await cargarUsuarioDesdeToken();
    return decodificarRol(respuesta.access_token);
  }, [cargarUsuarioDesdeToken]);

  const login = useCallback(async (correo: string, contrasenia: string): Promise<ResultadoLogin> => {
    const respuesta = await authApi.login(correo, contrasenia);
    if (respuesta.requiere_mfa) {
      return { requiereMfa: true };
    }
    const rol = await guardarSesionDesdeTokens(respuesta);
    return { requiereMfa: false, rol };
  }, [guardarSesionDesdeTokens]);

  const loginGoogle = useCallback(async (credential: string): Promise<ResultadoLogin> => {
    const respuesta = await authApi.loginConGoogle(credential);
    if (respuesta.requiere_mfa) {
      return { requiereMfa: true };
    }
    const rol = await guardarSesionDesdeTokens(respuesta);
    return { requiereMfa: false, rol };
  }, [guardarSesionDesdeTokens]);

  const completarMfa = useCallback(async (correo: string, codigo: string) => {
    const respuesta = await authApi.verificarMfa(correo, codigo);
    return guardarSesionDesdeTokens(respuesta);
  }, [guardarSesionDesdeTokens]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      cargando,
      login,
      loginGoogle,
      guardarSesionDesdeTokens,
      completarMfa,
      logout,
      refrescarUsuario: cargarUsuarioDesdeToken,
    }),
    [user, cargando, login, loginGoogle, guardarSesionDesdeTokens, completarMfa, logout, cargarUsuarioDesdeToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return context;
}
