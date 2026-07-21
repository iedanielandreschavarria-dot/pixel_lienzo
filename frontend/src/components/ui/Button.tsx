import { type ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";
import clsx from "clsx";

type Variante = "dorado" | "contorno" | "fantasma" | "peligro";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  cargando?: boolean;
}

const estilosPorVariante: Record<Variante, string> = {
  // CTA principal: acento metálico sólido. Reservado para acciones críticas
  // (comprar, confirmar) — nunca se compite con él en la misma vista.
  dorado:
    "bg-ocre text-carbon shadow-[0_0_0_1px_rgba(201,162,75,0.4)] hover:bg-ocre-suave hover:shadow-[0_0_24px_-4px_rgba(201,162,75,0.55)]",
  contorno: "bg-transparent text-marfil border border-marfil-suave/40 hover:border-ocre hover:text-ocre",
  fantasma: "bg-transparent text-marfil-suave hover:text-marfil",
  peligro: "bg-terracota text-marfil hover:opacity-90",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variante = "dorado", cargando = false, disabled, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || cargando}
        className={clsx(
          "inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium tracking-wide transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-40",
          estilosPorVariante[variante],
          className
        )}
        {...props}
      >
        {cargando && <Loader2 size={16} className="animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
