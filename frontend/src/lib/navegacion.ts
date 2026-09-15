import type { NombreRol } from "../types";

/** Vista principal de cada rol tras iniciar sesión: el catálogo es el destino
 * natural del Comprador, pero Artista y Curador trabajan en sus propios
 * paneles y aterrizar en el catálogo los deja sin punto de partida. */
export function rutaInicialPorRol(rol: NombreRol | null | undefined): string {
  switch (rol) {
    case "Artista":
      return "/artista";
    case "Curador":
      return "/curaduria";
    default:
      return "/";
  }
}
