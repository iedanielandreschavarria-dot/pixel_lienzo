import { type InputHTMLAttributes, forwardRef, useId, useState } from "react";
import clsx from "clsx";

export type VarianteCampo = "caja" | "subrayado";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  ayuda?: string;
  error?: string;
  opcional?: boolean;
  variante?: VarianteCampo;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      ayuda,
      error,
      opcional = false,
      variante = "caja",
      type = "text",
      className,
      id,
      ...props
    },
    ref
  ) => {
    const uid = useId();
    const inputId = id ?? props.name ?? uid;
    const ayudaId = `${inputId}-ayuda`;
    const errorId = `${inputId}-error`;
    const esPassword = type === "password";
    const [mostrarClave, setMostrarClave] = useState(false);

    const describedBy = [ayuda ? ayudaId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

    return (
      <div className="flex flex-col gap-[var(--espacio-4)]">
        {label && (
          <label
            htmlFor={inputId}
            className={clsx(
              "font-[var(--fuente-texto)] font-medium text-[length:var(--text-cuerpo-pequeno)] text-[color:var(--tinta-suave)]",
              variante === "subrayado" && "italic"
            )}
          >
            {label}
            {opcional && !label.toLowerCase().includes("opcional") && " (opcional)"}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={esPassword ? (mostrarClave ? "text" : "password") : type}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={clsx(
              "w-full font-[var(--fuente-texto)] font-medium text-[length:var(--text-campo)] text-[color:var(--tinta)] placeholder:text-[color:var(--tinta-suave)] placeholder:opacity-60 transition-[border-color,box-shadow] duration-[var(--duracion-hover)] ease-[var(--curva-base)]",
              variante === "caja" && [
                "min-h-[var(--alto-control)] rounded-[var(--radio-recto)] border bg-[color:var(--campo-caja-fondo)] px-[var(--espacio-16)] py-[var(--espacio-12)]",
                error
                  ? "border-[color:var(--aviso)] focus:border-[color:var(--aviso)]"
                  : "border-[color:var(--campo-caja-borde)] focus:border-[color:var(--riel)]",
              ],
              variante === "subrayado" && [
                "rounded-[var(--radio-recto)] border-0 border-b bg-transparent py-[var(--espacio-8)] px-0",
                error
                  ? "border-b-[color:var(--aviso)] focus:border-b-[color:var(--aviso)]"
                  : "border-b-[color:var(--campo-subrayado-borde)] focus:border-b-[color:var(--riel)]",
              ],
              esPassword && "pr-[var(--espacio-64)]",
              className
            )}
            {...props}
          />

          {esPassword && (
            <button
              type="button"
              onClick={() => setMostrarClave((v) => !v)}
              aria-label={mostrarClave ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute right-[var(--espacio-8)] top-1/2 -translate-y-1/2 bg-transparent border-0 px-[var(--espacio-8)] py-[var(--espacio-4)] font-[var(--fuente-texto)] italic font-medium text-[length:var(--text-minimo)] text-[color:var(--tinta-suave)] hover:text-[color:var(--tinta)] cursor-pointer"
            >
              {mostrarClave ? "Ocultar" : "Mostrar"}
            </button>
          )}
        </div>

        {ayuda && (
          <p id={ayudaId} className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">
            {ayuda}
          </p>
        )}

        {error && (
          <p
            id={errorId}
            role="alert"
            className="mt-[var(--espacio-4)] flex items-center gap-[var(--espacio-8)] font-[var(--fuente-texto)] text-[length:var(--text-cuerpo-pequeno)] text-[color:var(--aviso)]"
          >
            <span
              aria-hidden="true"
              className="inline-grid h-[var(--espacio-24)] w-[var(--espacio-24)] shrink-0 place-items-center rounded-[var(--radio-circulo)] border border-[color:var(--aviso)] font-[var(--fuente-poster)] text-[length:var(--text-minimo)] leading-none text-[color:var(--aviso)]"
            >
              !
            </span>
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

