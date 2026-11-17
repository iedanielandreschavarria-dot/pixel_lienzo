import { type TextareaHTMLAttributes, forwardRef, useId } from "react";
import clsx from "clsx";
import type { VarianteCampo } from "./Input";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  ayuda?: string;
  error?: string;
  opcional?: boolean;
  variante?: VarianteCampo;
  contadorMaximo?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      ayuda,
      error,
      opcional = false,
      variante = "caja",
      contadorMaximo,
      className,
      id,
      value,
      ...props
    },
    ref
  ) => {
    const uid = useId();
    const textareaId = id ?? props.name ?? uid;
    const ayudaId = `${textareaId}-ayuda`;
    const errorId = `${textareaId}-error`;
    const describedBy = [ayuda ? ayudaId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;
    const longitudActual = typeof value === "string" ? value.length : 0;

    return (
      <div className="flex flex-col gap-[var(--espacio-4)]">
        <div className="flex items-baseline justify-between gap-[var(--espacio-8)]">
          {label && (
            <label
              htmlFor={textareaId}
              className={clsx(
                "font-[var(--fuente-texto)] font-medium text-[length:var(--text-cuerpo-pequeno)] text-[color:var(--tinta-suave)]",
                variante === "subrayado" && "italic"
              )}
            >
              {label}
              {opcional && !label.toLowerCase().includes("opcional") && " (opcional)"}
            </label>
          )}
          {contadorMaximo !== undefined && (
            <span className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">
              {longitudActual} / {contadorMaximo}
            </span>
          )}
        </div>

        <textarea
          ref={ref}
          id={textareaId}
          value={value}
          maxLength={contadorMaximo}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={clsx(
            "w-full font-[var(--fuente-texto)] font-medium text-[length:var(--text-campo)] text-[color:var(--tinta)] placeholder:text-[color:var(--tinta-suave)] placeholder:opacity-60 transition-[border-color] duration-[var(--duracion-hover)] ease-[var(--curva-base)]",
            variante === "caja" && [
              "rounded-[var(--radio-recto)] border bg-[color:var(--campo-caja-fondo)] px-[var(--espacio-16)] py-[var(--espacio-12)]",
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
            className
          )}
          {...props}
        />

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
Textarea.displayName = "Textarea";

