import clsx from "clsx";
import { LOGOS_POR_VARIANTE, type VarianteLogo } from "../../assets/logos";

export type TamanoLogo = "sm" | "md" | "lg" | "xl";

export interface LogoMarcaProps {
  variante?: VarianteLogo;
  tamano?: TamanoLogo;
  conTexto?: boolean;
  className?: string;
  imgClassName?: string;
}

const ALTO_POR_TAMANO: Record<TamanoLogo, string> = {
  sm: "h-[20px] w-[20px]",
  md: "h-[26px] w-[26px]",
  lg: "h-[36px] w-[36px]",
  xl: "h-[56px] w-[56px]",
};

/**
 * Isotipo y marca oficial de Pixel & Lienzo en las 8 variantes cromáticas del Kit.
 */
export function LogoMarca({
  variante = "riel",
  tamano = "md",
  conTexto = true,
  className,
  imgClassName,
}: LogoMarcaProps) {
  const src = LOGOS_POR_VARIANTE[variante];

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-[var(--espacio-8)] select-none",
        className
      )}
    >
      <img
        src={src}
        alt={conTexto ? "" : "Pixel & Lienzo"}
        aria-hidden={conTexto ? "true" : undefined}
        decoding="async"
        className={clsx(
          ALTO_POR_TAMANO[tamano],
          "shrink-0 object-contain",
          imgClassName
        )}
      />
      {conTexto && (
        <span className="font-[var(--fuente-poster)] text-[length:var(--text-dato)] uppercase tracking-[0.12em] text-[color:var(--riel)]">
          PIXEL &amp; LIENZO
        </span>
      )}
    </span>
  );
}

