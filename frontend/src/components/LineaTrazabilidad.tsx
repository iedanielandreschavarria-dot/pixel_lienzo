import { Palette, Receipt, ArrowRightLeft } from "lucide-react";
import { formatearFecha } from "../lib/formato";
import type { RegistroTrazabilidad } from "../types";

interface LineaTrazabilidadProps {
  registros: RegistroTrazabilidad[];
  idArtista: number;
}

/** Provenance de la obra: parte del registro original del artista y encadena
 * cada cambio de propietario. El backend solo entrega identificadores de
 * usuario (nunca nombres ni correos), así que la línea de tiempo es pública sin
 * exponer datos personales de los coleccionistas. */
export function LineaTrazabilidad({ registros, idArtista }: LineaTrazabilidadProps) {
  return (
    <ol className="relative flex flex-col gap-7 border-l border-antracita-suave pl-7">
      <li className="relative">
        <span className="absolute -left-[2.19rem] flex h-5 w-5 items-center justify-center rounded-full border border-ocre/50 bg-carbon">
          <Palette size={11} className="text-ocre" />
        </span>
        <p className="text-[0.68rem] uppercase tracking-[0.16em] text-ocre">Origen</p>
        <p className="mt-1 text-sm text-marfil">Registro del artista N.º {idArtista} en la galería</p>
        <p className="mt-0.5 text-xs text-marfil-suave">
          La pieza ingresó al catálogo tras superar la revisión curatorial.
        </p>
      </li>

      {registros.map((registro) => (
        <li key={registro.id_trazabilidad} className="relative">
          <span className="absolute -left-[2.19rem] flex h-5 w-5 items-center justify-center rounded-full border border-antracita-suave bg-carbon">
            <ArrowRightLeft size={11} className="text-marfil-suave" />
          </span>
          <p className="text-[0.68rem] uppercase tracking-[0.16em] text-marfil-suave">
            {formatearFecha(registro.fecha_cambio)}
          </p>
          <p className="mt-1 text-sm text-marfil">
            {registro.id_propietario_anterior !== null
              ? `Transferida del propietario N.º ${registro.id_propietario_anterior} al N.º ${registro.id_propietario_nuevo}`
              : `Adquirida por el propietario N.º ${registro.id_propietario_nuevo}`}
          </p>
          {registro.id_transaccion !== null && (
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-marfil-suave">
              <Receipt size={12} /> Transacción N.º {registro.id_transaccion}
            </p>
          )}
        </li>
      ))}

      {registros.length === 0 && (
        <li className="relative">
          <span className="absolute -left-[2.19rem] h-5 w-5 rounded-full border border-antracita-suave bg-carbon" />
          <p className="text-sm text-marfil-suave">
            Todavía no hay transferencias de propiedad registradas: la obra permanece en la galería.
          </p>
        </li>
      )}
    </ol>
  );
}
