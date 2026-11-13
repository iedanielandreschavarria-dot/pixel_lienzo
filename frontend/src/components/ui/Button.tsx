import { type ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

export type VarianteBoton =
  | "primario"
  | "secundario"
  | "terciario"
  | "destructivo"
  /* Alias de compatibilidad con páginas existentes hasta Fases 4 */
  | "dorado"
  | "contorno"
  | "fantasma"
  | "peligro";

export type TamanoBoton = "estandar" | "compacto";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
  cargando?: boolean;
  anchoCompleto?: boolean;
}

function normalizarVariante(v: VarianteBoton): "primario" | "secundario" | "terciario" | "destructivo" {
  switch (v) {
    case "dorado":
    case "primario":
      return "primario";
    case "contorno":
    case "secundario":
      return "secundario";
    case "fantasma":
    case "terciario":
      return "terciario";
    case "peligro":
    case "destructivo":
      return "destructivo";
  }
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variante = "primario",
      tamano = "estandar",
      cargando = false,
      anchoCompleto = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const tipo = normalizarVariante(variante);
    const esTerciario = tipo === "terciario";

    return (
      <button
        ref={ref}
        disabled={disabled || cargando}
        aria-busy={cargando || undefined}
        className={clsx(
          "inline-flex items-center justify-center gap-[var(--espacio-8)] font-[var(--fuente-texto)] font-semibold transition-[border-color,box-shadow,opacity,color] duration-[var(--duracion-hover)] ease-[var(--curva-base)] cursor-pointer select-none",
          "disabled:opacity-45 disabled:cursor-not-allowed disabled:!shadow-none",
          !esTerciario && [
            "rounded-[var(--radio-pildora)] px-[var(--espacio-24)] text-[length:var(--text-cuerpo)] leading-none",
            tamano === "compacto"
              ? "min-h-[var(--alto-control-compacto)] py-[var(--espacio-8)]"
              : "min-h-[var(--alto-control)] py-[var(--espacio-12)]",
          ],
          esTerciario &&
            "rounded-[var(--radio-recto)] bg-transparent p-0 pb-[var(--espacio-4)] text-[length:var(--text-dato)] text-[color:var(--tinta)] border-b border-[color:var(--borde-terciario)] hover:border-white",
          tipo === "primario" &&
            "bg-[color:var(--carmesi)] border border-[color:var(--riel)] text-[color:var(--tinta)] hover:border-white hover:shadow-[var(--resplandor-primario)]",
          tipo === "secundario" &&
            "bg-transparent border border-[color:var(--riel)] text-[color:var(--tinta)] hover:border-white",
          tipo === "destructivo" &&
            "bg-transparent border border-[color:var(--aviso)] text-[color:var(--aviso)] hover:border-white",
          anchoCompleto && "w-full",
          className
        )}
        {...props}
      >
        {cargando ? (
          <>
            <span
              aria-hidden="true"
              className="inline-block h-[var(--espacio-16)] w-[var(--espacio-16)] shrink-0 rounded-[var(--radio-circulo)] border border-current border-t-transparent animate-spin"
            />
            <span>Procesando…</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";

