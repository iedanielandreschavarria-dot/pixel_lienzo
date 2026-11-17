import { Link } from "react-router-dom";
import { formatearFecha, formatearMoneda } from "../../lib/formato";
import type { EstadoPago } from "../../types";
import { BadgeEstadoPago, type EstadoGuia } from "./Badge";
import { Button } from "./Button";

export interface CompraCardProps {
  idTransaccion: number;
  idObra: number;
  titulo: string;
  artista: string;
  fechaIso: string;
  precio: string | number;
  estado: EstadoPago | EstadoGuia;
  imagenUrl?: string;
  certificadoUrl?: string;
  selloVerificacion?: string | null;
  onVerCertificado?: () => void;
  onVerComprobante?: () => void;
  onContinuarPago?: () => void;
  continuandoPago?: boolean;
}

/**
 * 4.5 / 6.10 Tarjeta de compra:
 * Miniatura de 96 px, título, artista, fecha, precio, estado y acciones:
 * "Ver certificado" (solo en aprobadas), "Ver comprobante" y "Ver obra".
 */
export function CompraCard({
  idObra,
  titulo,
  artista,
  fechaIso,
  precio,
  estado,
  imagenUrl,
  certificadoUrl,
  selloVerificacion,
  onVerCertificado,
  onVerComprobante,
  onContinuarPago,
  continuandoPago,
}: CompraCardProps) {
  const aprobada = estado === "Confirmado" || estado === "Dispersado" || estado === "Pago aprobado";
  const pendiente = estado === "Procesando" || estado === "Pago pendiente";

  return (
    <article className="flex flex-col justify-between gap-[var(--espacio-16)] rounded-[var(--radio-recto)] border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-16)] sm:flex-row sm:items-center sm:p-[var(--espacio-24)]">
      <div className="flex items-start gap-[var(--espacio-16)]">
        <div className="h-[var(--miniatura-96)] w-[var(--miniatura-96)] shrink-0 overflow-hidden rounded-[var(--radio-recto)] border border-[color:var(--borde-reposo)] bg-[color:var(--vacio)]">
          {imagenUrl ? (
            <img
              src={imagenUrl}
              alt={`${titulo}, de ${artista}`}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="h-full w-full"
              style={{
                background:
                  "radial-gradient(circle at 50% 54%, var(--vacio) 0 24%, transparent 25%), linear-gradient(180deg, var(--profundidad), var(--carmesi))",
              }}
            />
          )}
        </div>

        <div className="flex flex-col gap-[var(--espacio-4)]">
          <h3 className="voz-h3 line-clamp-2 text-[color:var(--tinta)]">{titulo}</h3>
          <p className="voz-cursiva text-[color:var(--tinta-suave)]">{artista}</p>
          <p className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">{formatearFecha(fechaIso)}</p>
          <p className="voz-dato text-[color:var(--tinta)]">{formatearMoneda(precio)}</p>
          {pendiente && (
            <p className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">
              Actualizaremos este estado cuando el banco confirme.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col items-start gap-[var(--espacio-12)] sm:items-end">
        <BadgeEstadoPago estado={estado} />

        <div className="flex flex-wrap items-center gap-[var(--espacio-12)]">
          {aprobada && (
            onVerCertificado ? (
              <Button variante="primario" tamano="compacto" onClick={onVerCertificado}>
                Ver certificado
              </Button>
            ) : selloVerificacion ? (
              <Link to={`/verificar/${selloVerificacion}`}>
                <Button variante="primario" tamano="compacto">
                  Ver certificado
                </Button>
              </Link>
            ) : certificadoUrl ? (
              <a href={certificadoUrl} target="_blank" rel="noreferrer">
                <Button variante="primario" tamano="compacto">
                  Ver certificado
                </Button>
              </a>
            ) : null
          )}

          {onVerComprobante && (
            <Button variante="secundario" tamano="compacto" onClick={onVerComprobante}>
              Ver comprobante
            </Button>
          )}

          {pendiente && onContinuarPago && (
            <Button
              variante="secundario"
              tamano="compacto"
              onClick={onContinuarPago}
              cargando={continuandoPago}
            >
              Continuar pago
            </Button>
          )}

          <Link to={`/obras/${idObra}`}>
            <Button variante="terciario">Ver obra</Button>
          </Link>
        </div>
      </div>
    </article>
  );
}

