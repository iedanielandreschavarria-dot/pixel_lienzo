import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import clsx from "clsx";

export interface MetricaCardProps {
  etiqueta: string;
  cifra: string | number;
  variacion?: {
    texto: string;
    tipo: "exito" | "aviso";
  };
  className?: string;
}

/**
 * 4.5 Tarjeta métrica (paneles):
 * Etiqueta en Anton suave, cifra en H2 y variación opcional en salvia o ámbar con flecha.
 * Sin gráficos decorativos.
 */
export function MetricaCard({ etiqueta, cifra, variacion, className }: MetricaCardProps) {
  return (
    <div
      className={clsx(
        "flex flex-col justify-between gap-[var(--espacio-8)] rounded-[var(--radio-recto)] border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)]",
        className
      )}
    >
      <dt className="voz-etiqueta text-[color:var(--tinta-suave)]">{etiqueta}</dt>
      <dd className="voz-h2 text-[color:var(--tinta)]">{cifra}</dd>
      {variacion && (
        <p
          className={clsx(
            "voz-cuerpo-pequeno flex items-center gap-[var(--espacio-4)]",
            variacion.tipo === "exito" ? "text-[color:var(--exito)]" : "text-[color:var(--aviso)]"
          )}
        >
          {variacion.tipo === "exito" ? (
            <ArrowUpRight size={16} strokeWidth={1.5} aria-hidden="true" />
          ) : (
            <ArrowDownRight size={16} strokeWidth={1.5} aria-hidden="true" />
          )}
          <span>{variacion.texto}</span>
        </p>
      )}
    </div>
  );
}

