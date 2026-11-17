export type TipoEscena = "inicio" | "acceso" | "otra";

let ultimaEscenaVisitada: TipoEscena = "otra";
let ultimaRutaAcceso = "";

export function obtenerUltimaEscena(): { escena: TipoEscena; rutaAcceso: string } {
  return { escena: ultimaEscenaVisitada, rutaAcceso: ultimaRutaAcceso };
}

export function registrarEscenaActual(escena: TipoEscena, pathname: string): void {
  ultimaEscenaVisitada = escena;
  if (escena === "acceso") {
    ultimaRutaAcceso = pathname;
  }
}

