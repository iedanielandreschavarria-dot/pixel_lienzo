import { Palette, Receipt, ArrowRightLeft } from "lucide-react";
import { formatearFecha } from "../lib/formato";
import type { RegistroTrazabilidad } from "../types";

interface LineaTrazabilidadProps {
  registros: RegistroTrazabilidad[];
  idArtista: number;
}

/**
 * Procedencia (provenance) de la obra: parte del registro original del artista y encadena
 * cada cambio de propietario sin exponer datos personales de los coleccionistas.
 */
export function LineaTrazabilidad({ registros, idArtista }: LineaTrazabilidadProps) {
  return (
    <ol className="relative flex flex-col gap-[var(--espacio-24)] border-l border-[color:var(--borde-reposo)] pl-[var(--espacio-24)] list-none m-0">
      <li className="relative">
        <span
          aria-hidden="true"
          className="absolute -left-[calc(var(--espacio-24)+12px)] flex h-[var(--espacio-24)] w-[var(--espacio-24)] items-center justify-center rounded-[var(--radio-circulo)] border border-[color:var(--riel)] bg-[color:var(--vacio)] text-[color:var(--riel)]"
        >
          <Palette size={14} strokeWidth={1.5} />
        </span>
        <p className="voz-etiqueta text-[color:var(--riel)]">Origen</p>
        <p className="voz-cuerpo mt-[var(--espacio-4)] text-[color:var(--tinta)]">
          Registro del artista N.º {idArtista} en la galería
        </p>
        <p className="voz-cuerpo-pequeno mt-[var(--espacio-4)] text-[color:var(--tinta-suave)]">
          La pieza ingresó al catálogo tras superar la revisión curatorial.
        </p>
      </li>

      {registros.map((registro) => (
        <li key={registro.id_trazabilidad} className="relative">
          <span
            aria-hidden="true"
            className="absolute -left-[calc(var(--espacio-24)+12px)] flex h-[var(--espacio-24)] w-[var(--espacio-24)] items-center justify-center rounded-[var(--radio-circulo)] border border-[color:var(--borde-reposo)] bg-[color:var(--vacio)] text-[color:var(--tinta-suave)]"
          >
            <ArrowRightLeft size={14} strokeWidth={1.5} />
          </span>
          <p className="voz-etiqueta text-[color:var(--tinta-suave)]">
            {formatearFecha(registro.fecha_cambio)}
          </p>
          <p className="voz-cuerpo mt-[var(--espacio-4)] text-[color:var(--tinta)]">
            {registro.id_propietario_anterior !== null
              ? `Transferida del propietario N.º ${registro.id_propietario_anterior} al N.º ${registro.id_propietario_nuevo}`
              : `Adquirida por el propietario N.º ${registro.id_propietario_nuevo}`}
          </p>
          {registro.id_transaccion !== null && (
            <p className="voz-cuerpo-pequeno mt-[var(--espacio-4)] flex items-center gap-[var(--espacio-8)] text-[color:var(--tinta-suave)]">
              <Receipt size={16} strokeWidth={1.5} aria-hidden="true" />
              <span>Transacción N.º {registro.id_transaccion}</span>
            </p>
          )}
        </li>
      ))}

      {registros.length === 0 && (
        <li className="relative">
          <span
            aria-hidden="true"
            className="absolute -left-[calc(var(--espacio-24)+12px)] h-[var(--espacio-24)] w-[var(--espacio-24)] rounded-[var(--radio-circulo)] border border-[color:var(--divisor)] bg-[color:var(--vacio)]"
          />
          <p className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">
            Todavía no hay transferencias de propiedad registradas: la obra permanece en la galería.
          </p>
        </li>
      )}
    </ol>
  );
}
