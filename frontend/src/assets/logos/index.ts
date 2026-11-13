import isotipoVacio from "./isotipo-vacio.png";
import isotipoFondo from "./isotipo-fondo.png";
import isotipoTinta from "./isotipo-tinta.png";
import isotipoTintaSuave from "./isotipo-tinta-suave.png";
import isotipoProfundidad from "./isotipo-profundidad.png";
import isotipoCarmesi from "./isotipo-carmesi.png";
import isotipoIncandescente from "./isotipo-incandescente.png";
import isotipoRiel from "./isotipo-riel.png";

export type VarianteLogo =
  | "vacio"
  | "fondo"
  | "tinta"
  | "tinta-suave"
  | "profundidad"
  | "carmesi"
  | "incandescente"
  | "riel";

export interface DefinicionLogo {
  variante: VarianteLogo;
  nombre: string;
  token: string;
  hex: string;
  src: string;
  fondoRecomendado: "oscuro" | "claro" | "carmesi";
}

export const LOGOS_POR_VARIANTE: Record<VarianteLogo, string> = {
  vacio: isotipoVacio,
  fondo: isotipoFondo,
  tinta: isotipoTinta,
  "tinta-suave": isotipoTintaSuave,
  profundidad: isotipoProfundidad,
  carmesi: isotipoCarmesi,
  incandescente: isotipoIncandescente,
  riel: isotipoRiel,
};

export const CATALOGO_LOGOS: DefinicionLogo[] = [
  {
    variante: "riel",
    nombre: "Brasa / Riel",
    token: "--riel",
    hex: "#e0472b",
    src: isotipoRiel,
    fondoRecomendado: "oscuro",
  },
  {
    variante: "incandescente",
    nombre: "Incandescente",
    token: "--incandescente",
    hex: "#d4421f",
    src: isotipoIncandescente,
    fondoRecomendado: "oscuro",
  },
  {
    variante: "carmesi",
    nombre: "Carmesí",
    token: "--carmesi",
    hex: "#932512",
    src: isotipoCarmesi,
    fondoRecomendado: "oscuro",
  },
  {
    variante: "profundidad",
    nombre: "Rojo profundo",
    token: "--profundidad",
    hex: "#4d0d0a",
    src: isotipoProfundidad,
    fondoRecomendado: "claro",
  },
  {
    variante: "tinta",
    nombre: "Tinta",
    token: "--tinta",
    hex: "#f2ece3",
    src: isotipoTinta,
    fondoRecomendado: "oscuro",
  },
  {
    variante: "tinta-suave",
    nombre: "Tinta suave",
    token: "--tinta-suave",
    hex: "#9a958f",
    src: isotipoTintaSuave,
    fondoRecomendado: "oscuro",
  },
  {
    variante: "fondo",
    nombre: "Negro escena",
    token: "--fondo",
    hex: "#0a0808",
    src: isotipoFondo,
    fondoRecomendado: "claro",
  },
  {
    variante: "vacio",
    nombre: "Vacío",
    token: "--vacio",
    hex: "#000000",
    src: isotipoVacio,
    fondoRecomendado: "carmesi",
  },
];

