import clsx from "clsx";

export interface SelloCertificadoProps {
  etiqueta?: "CERTIFICADO" | "VERIFICAR";
  codigo?: string | null;
  valido?: boolean;
  className?: string;
}

/**
 * 4.5 Sello de certificado:
 * Disco de 160 px (círculo negro con borde --riel y resplandor),
 * con "CERTIFICADO" en Anton y el código debajo.
 * En Verificar certificado (6.7), cuando es válido el borde pasa a --exito.
 */
export function SelloCertificado({
  etiqueta = "CERTIFICADO",
  codigo,
  valido,
  className,
}: SelloCertificadoProps) {
  const codigoCorto = codigo ? (codigo.length > 14 ? `${codigo.slice(0, 6)}…${codigo.slice(-6)}` : codigo) : undefined;

  return (
    <div
      className={clsx(
        "mx-auto flex h-[var(--sello-diametro)] w-[var(--sello-diametro)] shrink-0 flex-col items-center justify-center gap-[var(--espacio-8)] rounded-[var(--radio-circulo)] border bg-[color:var(--vacio)] p-[var(--espacio-16)] text-center transition-[border-color,box-shadow,opacity] duration-[var(--duracion-momento-min)] ease-[var(--curva-base)]",
        valido
          ? "border-[color:var(--exito)] shadow-[var(--resplandor-sello-valido)]"
          : "border-[color:var(--riel)] shadow-[var(--resplandor-disco)]",
        className
      )}
    >
      <span
        className={clsx(
          "voz-etiqueta",
          valido ? "text-[color:var(--exito)]" : "text-[color:var(--tinta)]"
        )}
      >
        {etiqueta}
      </span>
      {codigoCorto && (
        <span
          title={codigo ?? undefined}
          className="codigo-certificado text-[length:var(--text-minimo)] text-[color:var(--tinta-suave)]"
        >
          {codigoCorto}
        </span>
      )}
    </div>
  );
}

