import clsx from "clsx";
import {
  AlertTriangle,
  Archive,
  Check,
  Clock,
  FileEdit,
  RotateCcw,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";
import type { EstadoObra, EstadoPago, EstadoValidacion } from "../../types";

export type EstadoGuia =
  | "Borrador"
  | "En revisión"
  | "Requiere cambios"
  | "Publicada"
  | "Vendida"
  | "Retirada"
  | "Pago pendiente"
  | "Pago aprobado"
  | "Pago rechazado"
  | "Reembolsado";

interface ConfigEstado {
  etiqueta: string;
  icono: LucideIcon;
  clases: string;
}

const ESTILOS_GUIA: Record<EstadoGuia, ConfigEstado> = {
  Borrador: {
    etiqueta: "Borrador",
    icono: FileEdit,
    clases: "border-[color:var(--tinta-suave)] text-[color:var(--tinta-suave)] bg-transparent",
  },
  "En revisión": {
    etiqueta: "En revisión",
    icono: Clock,
    clases: "border-[color:var(--riel)] text-[color:var(--tinta)] bg-transparent",
  },
  "Requiere cambios": {
    etiqueta: "Requiere cambios",
    icono: AlertTriangle,
    clases: "border-[color:var(--aviso)] text-[color:var(--aviso)] bg-transparent",
  },
  Publicada: {
    etiqueta: "Publicada",
    icono: Check,
    clases: "border-[color:var(--exito)] text-[color:var(--exito)] bg-transparent",
  },
  Vendida: {
    etiqueta: "Vendida",
    icono: ShoppingBag,
    clases: "border-[color:var(--riel)] bg-[color:var(--carmesi)] text-[color:var(--tinta)]",
  },
  Retirada: {
    etiqueta: "Retirada",
    icono: Archive,
    clases: "border-[color:var(--tinta-suave)] text-[color:var(--tinta-suave)] bg-transparent",
  },
  "Pago pendiente": {
    etiqueta: "Pago pendiente",
    icono: Clock,
    clases: "border-[color:var(--riel)] text-[color:var(--tinta)] bg-transparent",
  },
  "Pago aprobado": {
    etiqueta: "Pago aprobado",
    icono: Check,
    clases: "border-[color:var(--exito)] text-[color:var(--exito)] bg-transparent",
  },
  "Pago rechazado": {
    etiqueta: "Pago rechazado",
    icono: AlertTriangle,
    clases: "border-[color:var(--aviso)] text-[color:var(--aviso)] bg-transparent",
  },
  Reembolsado: {
    etiqueta: "Reembolsado",
    icono: RotateCcw,
    clases: "border-[color:var(--tinta-suave)] text-[color:var(--tinta-suave)] bg-transparent",
  },
};

function mapearEstadoObra(estado: EstadoObra | EstadoGuia): ConfigEstado {
  if (estado in ESTILOS_GUIA) return ESTILOS_GUIA[estado as EstadoGuia];
  switch (estado) {
    case "Publicado":
      return ESTILOS_GUIA.Publicada;
    case "Pendiente":
    case "Reservado":
      return ESTILOS_GUIA["En revisión"];
    case "Vendido":
      return ESTILOS_GUIA.Vendida;
    case "En Préstamo":
      return ESTILOS_GUIA.Retirada;
    case "Mantenimiento":
    default:
      return ESTILOS_GUIA["Requiere cambios"];
  }
}

function mapearEstadoPago(estado: EstadoPago | EstadoGuia): ConfigEstado {
  if (estado in ESTILOS_GUIA) return ESTILOS_GUIA[estado as EstadoGuia];
  switch (estado) {
    case "Procesando":
      return ESTILOS_GUIA["Pago pendiente"];
    case "Confirmado":
    case "Dispersado":
      return ESTILOS_GUIA["Pago aprobado"];
    case "Rechazado":
      return ESTILOS_GUIA["Pago rechazado"];
    case "Reembolsado":
    default:
      return ESTILOS_GUIA.Reembolsado;
  }
}

function mapearEstadoValidacion(estado: EstadoValidacion): ConfigEstado {
  switch (estado) {
    case "Verificado":
      return {
        etiqueta: "Verificado",
        icono: Check,
        clases: "border-[color:var(--exito)] text-[color:var(--exito)] bg-transparent",
      };
    case "Pendiente":
      return ESTILOS_GUIA["En revisión"];
    case "Rechazado":
      return ESTILOS_GUIA["Requiere cambios"];
  }
}

/**
 * 4.7 Estados (etiquetas):
 * Rectángulo de 28 px de alto, esquinas rectas, Anton de 1 rem en mayúsculas,
 * borde de 1 px, icono de 16 px a la izquierda.
 */
export function EtiquetaEstado({
  config,
  textoPersonalizado,
  className,
}: {
  config: ConfigEstado;
  textoPersonalizado?: string;
  className?: string;
}) {
  const Icono = config.icono;
  return (
    <span
      className={clsx(
        "inline-flex h-[var(--alto-estado)] items-center gap-[var(--espacio-8)] rounded-[var(--radio-recto)] border px-[var(--espacio-8)] font-[var(--fuente-poster)] text-[length:var(--text-etiqueta)] uppercase tracking-[0.12em] leading-none whitespace-nowrap",
        config.clases,
        className
      )}
    >
      <Icono size={16} strokeWidth={1.5} className="shrink-0" aria-hidden="true" />
      <span>{textoPersonalizado ?? config.etiqueta}</span>
    </span>
  );
}

export function BadgeEstado({ estado, className }: { estado: EstadoGuia; className?: string }) {
  return <EtiquetaEstado config={ESTILOS_GUIA[estado]} className={className} />;
}

export function BadgeEstadoObra({ estado, className }: { estado: EstadoObra | EstadoGuia; className?: string }) {
  return <EtiquetaEstado config={mapearEstadoObra(estado)} className={className} />;
}

export function BadgeEstadoPago({ estado, className }: { estado: EstadoPago | EstadoGuia; className?: string }) {
  return <EtiquetaEstado config={mapearEstadoPago(estado)} className={className} />;
}

export function BadgeEstadoValidacion({ estado, className }: { estado: EstadoValidacion; className?: string }) {
  return <EtiquetaEstado config={mapearEstadoValidacion(estado)} className={className} />;
}

