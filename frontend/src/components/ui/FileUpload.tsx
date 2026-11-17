import { useId, useRef, useState } from "react";
import { Upload } from "lucide-react";
import clsx from "clsx";

export interface FileUploadProps {
  label?: string;
  ayuda?: string;
  error?: string;
  accept?: string;
  progreso?: number;
  archivoActual?: { nombre: string; tamanoBytes?: number } | null;
  onSelectFile?: (file: File) => void;
  className?: string;
}

function formatearBytes(bytes?: number): string {
  if (bytes === undefined) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * 4.4 Carga de archivos:
 * Zona rectangular con borde de 1 px discontinuo en --riel al 40 %,
 * texto "Arrastra tu archivo o elige uno". Muestra nombre, tamaño y una línea de progreso de 2 px en --riel.
 */
export function FileUpload({
  label,
  ayuda,
  error,
  accept,
  progreso,
  archivoActual,
  onSelectFile,
  className,
}: FileUploadProps) {
  const uid = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [archivoInterno, setArchivoInterno] = useState<{ nombre: string; tamanoBytes?: number } | null>(null);

  const archivo = archivoActual !== undefined ? archivoActual : archivoInterno;

  const manejarArchivo = (file: File | undefined) => {
    if (!file) return;
    setArchivoInterno({ nombre: file.name, tamanoBytes: file.size });
    onSelectFile?.(file);
  };

  return (
    <div className={clsx("flex flex-col gap-[var(--espacio-8)]", className)}>
      {label && (
        <label htmlFor={uid} className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">
          {label}
        </label>
      )}

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastrando(false);
          manejarArchivo(e.dataTransfer.files?.[0]);
        }}
        className={clsx(
          "relative flex flex-col items-center justify-center gap-[var(--espacio-8)] rounded-[var(--radio-recto)] border border-dashed px-[var(--espacio-24)] py-[var(--espacio-24)] text-center cursor-pointer transition-[border-color,background-color] duration-[var(--duracion-hover)] ease-[var(--curva-base)]",
          error
            ? "border-[color:var(--aviso)]"
            : arrastrando
              ? "border-[color:var(--borde-hover)] bg-[color:var(--superficie-elevada)]"
              : "border-[color:var(--borde-reposo)] hover:border-[color:var(--borde-hover)]"
        )}
      >
        <Upload size={24} strokeWidth={1.5} className="text-[color:var(--tinta)]" aria-hidden="true" />
        <p className="voz-cuerpo text-[color:var(--tinta)]">Arrastra tu archivo o elige uno</p>

        {archivo && (
          <p className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">
            {archivo.nombre}
            {archivo.tamanoBytes !== undefined ? ` · ${formatearBytes(archivo.tamanoBytes)}` : ""}
          </p>
        )}

        {progreso !== undefined && (
          <div className="mt-[var(--espacio-8)] h-[2px] w-full bg-[color:var(--divisor)]" role="progressbar" aria-valuenow={progreso} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="h-full bg-[color:var(--riel)] transition-[width] duration-[var(--duracion-hover)] ease-[var(--curva-base)]"
              style={{ width: `${Math.min(100, Math.max(0, progreso))}%` }}
            />
          </div>
        )}

        <input
          ref={inputRef}
          id={uid}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => manejarArchivo(e.target.files?.[0])}
        />
      </div>

      {ayuda && <p className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">{ayuda}</p>}

      {error && (
        <p
          role="alert"
          className="flex items-center gap-[var(--espacio-8)] font-[var(--fuente-texto)] text-[length:var(--text-cuerpo-pequeno)] text-[color:var(--aviso)]"
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

