import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, FileText, ShieldCheck, ShieldX } from "lucide-react";
import { verificarSello } from "../api/certificados";
import { obtenerTrazabilidad } from "../api/trazabilidad";
import { LineaTrazabilidad } from "../components/LineaTrazabilidad";
import { Spinner } from "../components/ui/Spinner";
import { formatearFecha } from "../lib/formato";

/** Destino público del QR de validación del Trust Engine
 * (`{FRONTEND_URL}/verificar/{sello}`). Accesible sin sesión: cualquier persona
 * frente a la obra debe poder comprobar su autenticidad. */
export function VerificarCertificadoPage() {
  const { sello } = useParams<{ sello: string }>();

  const {
    data: verificacion,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["verificar-certificado", sello],
    queryFn: () => verificarSello(sello!),
    enabled: !!sello,
    retry: false,
  });

  const { data: trazabilidad } = useQuery({
    queryKey: ["trazabilidad", verificacion?.obra.id_obra],
    queryFn: () => obtenerTrazabilidad(verificacion!.obra.id_obra),
    enabled: !!verificacion,
  });

  if (isLoading) return <Spinner etiqueta="Verificando sello de autenticidad…" />;

  if (isError || !verificacion) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <ShieldX size={44} className="mx-auto text-terracota" />
        <h1 className="mt-7 font-[var(--font-display)] text-3xl font-medium text-marfil">
          Sello no reconocido
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-marfil-suave">
          No existe ningún certificado de autenticidad asociado a este código en Pixel y Lienzo. Si lo
          obtuviste escaneando un QR junto a una obra, desconfía de su procedencia.
        </p>
        {sello && (
          <p className="mt-6 break-all font-mono text-[0.7rem] text-marfil-suave/60">{sello}</p>
        )}
        <Link to="/" className="mt-9 inline-block text-sm text-ocre underline">
          Ir al catálogo
        </Link>
      </div>
    );
  }

  const { sello_valido, certificado, obra } = verificacion;

  return (
    <div className="mx-auto max-w-4xl px-6 py-16 sm:px-10">
      <div className="relative overflow-hidden rounded-lg border border-antracita-suave bg-antracita p-9 text-center sm:p-12">
        <div
          className="pointer-events-none absolute inset-0 -z-0"
          style={{
            background: sello_valido
              ? "radial-gradient(circle at 50% 0%, rgba(201,162,75,0.16), transparent 60%)"
              : "radial-gradient(circle at 50% 0%, rgba(194,86,74,0.16), transparent 60%)",
          }}
        />
        <div className="relative">
          {sello_valido ? (
            <ShieldCheck size={52} className="mx-auto text-ocre" />
          ) : (
            <AlertTriangle size={52} className="mx-auto text-terracota" />
          )}
          <p className="mt-6 text-[0.68rem] uppercase tracking-[0.2em] text-marfil-suave">
            Verificación de autenticidad
          </p>
          <h1 className="mt-3 font-[var(--font-display)] text-3xl font-medium text-marfil sm:text-4xl">
            {sello_valido ? "Certificado auténtico" : "El sello no coincide"}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-marfil-suave">
            {sello_valido
              ? "El sello criptográfico coincide con la ficha técnica registrada en Pixel y Lienzo: los datos de la obra no han sido alterados desde su certificación."
              : "Existe un certificado con este código, pero la ficha técnica de la obra ya no coincide con lo que se certificó. Recomendamos contactar a la galería antes de cualquier transacción."}
          </p>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-2">
        <div>
          <h2 className="font-[var(--font-display)] text-2xl font-medium text-marfil">Obra certificada</h2>
          <dl className="mt-6 divide-y divide-antracita-suave/70 border-y border-antracita-suave/70 text-sm">
            {[
              ["Título", obra.titulo],
              ["Técnica", obra.tecnica],
              ["Dimensiones", obra.dimensiones],
              ["Año de creación", obra.anio_creacion ? String(obra.anio_creacion) : "No declarado"],
              ["Artista", `N.º ${obra.id_artista}`],
              ["Emisión del certificado", formatearFecha(certificado.sello_tiempo)],
            ].map(([etiqueta, valor]) => (
              <div key={etiqueta} className="flex items-baseline justify-between gap-6 py-3.5">
                <dt className="text-xs uppercase tracking-wider text-marfil-suave/70">{etiqueta}</dt>
                <dd className="text-right font-medium text-marfil">{valor}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-7 text-xs uppercase tracking-wider text-marfil-suave/70">Sello SHA-256</p>
          <p className="mt-1.5 break-all font-mono text-[0.7rem] leading-relaxed text-marfil-suave">
            {certificado.codigo_qr_validacion}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-6">
            <a
              href={certificado.pdf_certificado_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-ocre hover:underline"
            >
              <FileText size={16} /> Ver certificado
            </a>
            <Link
              to={`/obras/${obra.uid}`}
              className="inline-flex items-center gap-2 text-sm text-marfil-suave hover:text-ocre"
            >
              Ficha completa de la obra <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        <div>
          <h2 className="font-[var(--font-display)] text-2xl font-medium text-marfil">Trazabilidad</h2>
          <p className="mt-2 text-sm leading-relaxed text-marfil-suave">
            Cadena de propiedad registrada por la galería desde el ingreso de la pieza.
          </p>
          <div className="mt-7">
            {trazabilidad ? (
              <LineaTrazabilidad registros={trazabilidad} idArtista={obra.id_artista} />
            ) : (
              <Spinner etiqueta="" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
