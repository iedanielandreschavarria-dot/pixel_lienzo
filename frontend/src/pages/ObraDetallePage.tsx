import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck, FileText, QrCode, ShieldCheck, ShieldOff } from "lucide-react";
import { obtenerObra, obtenerObraPorUid, urlPreviewObra, urlQrObra } from "../api/obras";
import { obtenerPerfilArtista } from "../api/artistas";
import { obtenerCertificado, urlQrCertificado } from "../api/certificados";
import { obtenerTrazabilidad } from "../api/trazabilidad";
import { crearTransaccion } from "../api/transacciones";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Button } from "../components/ui/Button";
import { BadgeEstadoObra } from "../components/ui/Badge";
import { Spinner } from "../components/ui/Spinner";
import { LineaTrazabilidad } from "../components/LineaTrazabilidad";
import { formatearFecha, formatearMoneda } from "../lib/formato";
import { obtenerMensajeError } from "../api/client";
import type { Certificado } from "../types";

function BloqueCertificado({ certificado }: { certificado: Certificado }) {
  return (
    <div className="rounded-lg border border-ocre/30 bg-ocre/5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.16em] text-ocre">
            <BadgeCheck size={14} /> Certificado de autenticidad
          </p>
          <p className="mt-2 text-sm text-marfil">
            Emitido el {formatearFecha(certificado.sello_tiempo)}
          </p>
          {certificado.codigo_qr_validacion && (
            <>
              <p className="mt-4 text-xs uppercase tracking-wider text-marfil-suave/70">Sello SHA-256</p>
              <p className="mt-1 max-w-md break-all font-mono text-[0.7rem] leading-relaxed text-marfil-suave">
                {certificado.codigo_qr_validacion}
              </p>
            </>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <a
              href={certificado.pdf_certificado_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-ocre hover:underline"
            >
              <FileText size={16} /> Descargar certificado
            </a>
            {certificado.codigo_qr_validacion && (
              <Link
                to={`/verificar/${certificado.codigo_qr_validacion}`}
                className="inline-flex items-center gap-2 text-sm text-marfil-suave hover:text-ocre"
              >
                <ShieldCheck size={16} /> Verificar autenticidad
              </Link>
            )}
          </div>
        </div>

        {certificado.codigo_qr_validacion && (
          <div className="shrink-0">
            {/* El QR es denso (codifica el sello de 64 caracteres), así que se
                enlaza al PNG a tamaño completo para poder escanearlo. */}
            <a href={urlQrCertificado(certificado.id_obra)} target="_blank" rel="noreferrer">
              <img
                src={urlQrCertificado(certificado.id_obra)}
                alt="Código QR de validación del certificado"
                className="h-32 w-32 rounded-md bg-marfil p-2 transition-transform duration-300 hover:scale-105"
              />
            </a>
            <p className="mt-2 text-center text-[0.65rem] uppercase tracking-wider text-marfil-suave/70">
              Validación
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function ObraDetallePage() {
  const { idObra } = useParams<{ idObra: string }>();
  const { user } = useAuth();
  const { notificar } = useToast();
  const navigate = useNavigate();
  const [comprando, setComprando] = useState(false);

  // El parámetro puede ser la clave primaria (enlaces internos del catálogo) o
  // el UID de la pieza, que es lo que codifican los QR físicos junto a la obra.
  const esIdNumerico = /^\d+$/.test(idObra ?? "");

  const {
    data: obra,
    isLoading,
    isError,
  } = useQuery({
    queryKey: esIdNumerico ? ["obra", Number(idObra)] : ["obra-uid", idObra],
    queryFn: () => (esIdNumerico ? obtenerObra(Number(idObra)) : obtenerObraPorUid(idObra!)),
    enabled: !!idObra,
  });

  const { data: perfilArtista } = useQuery({
    queryKey: ["artista", obra?.id_artista],
    queryFn: () => obtenerPerfilArtista(obra!.id_artista),
    enabled: !!obra,
  });

  // El certificado solo existe si el curador lo emitió: un 404 es un resultado
  // esperado, no un error que deba reintentarse.
  const { data: certificado } = useQuery({
    queryKey: ["certificado", obra?.id_obra],
    queryFn: () => obtenerCertificado(obra!.id_obra),
    enabled: !!obra,
    retry: false,
  });

  const { data: trazabilidad } = useQuery({
    queryKey: ["trazabilidad", obra?.id_obra],
    queryFn: () => obtenerTrazabilidad(obra!.id_obra),
    enabled: !!obra,
  });

  if (isLoading) return <Spinner etiqueta="Cargando obra…" />;
  if (isError || !obra) {
    return (
      <div className="py-24 text-center">
        <p className="text-terracota">No se encontró esta obra.</p>
        <Link to="/" className="mt-4 inline-block text-sm text-ocre underline">
          Volver al catálogo
        </Link>
      </div>
    );
  }

  const disponible = obra.estado_obra === "Publicado";

  const comprar = async () => {
    if (!user) {
      navigate("/login", { state: { from: { pathname: `/obras/${obra.id_obra}` } } });
      return;
    }
    if (user.rol !== "Comprador") {
      notificar("Solo una cuenta de Comprador puede adquirir obras.", "error");
      return;
    }
    setComprando(true);
    try {
      const transaccion = await crearTransaccion(obra.id_obra);
      window.location.href = transaccion.checkout_url;
    } catch (error) {
      notificar(obtenerMensajeError(error, "No fue posible iniciar el pago"), "error");
      setComprando(false);
    }
  };

  return (
    <div className="bg-carbon">
      <div className="mx-auto max-w-7xl px-6 pt-8 sm:px-10">
        <Link to="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-marfil-suave hover:text-ocre">
          <ArrowLeft size={14} /> Volver al catálogo
        </Link>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 px-6 py-10 sm:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div className="relative">
          <div
            className="pointer-events-none absolute -inset-8 -z-10 opacity-60 blur-3xl"
            style={{ background: "radial-gradient(circle at 50% 40%, rgba(201,162,75,0.12), transparent 65%)" }}
          />
          <img
            src={urlPreviewObra(obra.id_obra)}
            alt={obra.titulo}
            className="w-full bg-antracita object-cover shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
          />
        </div>

        <div className="flex flex-col lg:sticky lg:top-28">
          <div className="mb-4 flex items-center gap-3">
            <BadgeEstadoObra estado={obra.estado_obra} />
            {obra.es_patrimonio_historico && (
              <span className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-ocre">
                <ShieldCheck size={14} /> Patrimonio histórico
              </span>
            )}
          </div>

          <p className="text-xs uppercase tracking-[0.2em] text-ocre">{obra.tecnica}</p>
          <h1 className="mt-3 font-[var(--font-display)] text-4xl font-medium leading-tight text-marfil sm:text-5xl">
            {obra.titulo}
          </h1>

          {perfilArtista && (
            <p className="mt-3 text-sm leading-relaxed text-marfil-suave">
              Artista N.º {perfilArtista.id_artista}
              {perfilArtista.biografia_profesional ? ` — ${perfilArtista.biografia_profesional}` : ""}
            </p>
          )}

          <dl className="mt-8 grid grid-cols-2 gap-6 border-y border-antracita-suave py-7 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wider text-marfil-suave/70">Dimensiones</dt>
              <dd className="mt-1 font-medium text-marfil">{obra.dimensiones}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-marfil-suave/70">Peso</dt>
              <dd className="mt-1 font-medium text-marfil">{obra.peso} kg</dd>
            </div>
            {obra.anio_creacion && (
              <div>
                <dt className="text-xs uppercase tracking-wider text-marfil-suave/70">Año de creación</dt>
                <dd className="mt-1 font-medium text-marfil">{obra.anio_creacion}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs uppercase tracking-wider text-marfil-suave/70">Código de la obra</dt>
              <dd className="mt-1 font-mono text-xs text-marfil-suave">{obra.uid}</dd>
            </div>
          </dl>

          <p className="mt-8 font-[var(--font-display)] text-4xl font-medium text-ocre">
            {formatearMoneda(obra.precio_venta)}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Button onClick={comprar} disabled={!disponible} cargando={comprando} className="!px-9 !py-3.5 text-sm">
              {disponible ? "Comprar ahora" : "No disponible"}
            </Button>
            {obra.codigo_qr_obra && (
              <a
                href={urlQrObra(obra.id_obra)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-marfil-suave hover:text-ocre"
              >
                <QrCode size={16} /> Código QR físico
              </a>
            )}
          </div>

          {!user && (
            <p className="mt-5 text-sm text-marfil-suave">
              <Link to="/login" className="text-ocre underline">
                Inicia sesión
              </Link>{" "}
              o{" "}
              <Link to="/registro" className="text-ocre underline">
                crea una cuenta de Comprador
              </Link>{" "}
              para adquirir esta obra.
            </p>
          )}
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-6 pb-24 sm:px-10">
        <div className="grid grid-cols-1 gap-12 border-t border-antracita-suave/60 pt-14 lg:grid-cols-2">
          <div>
            <h2 className="font-[var(--font-display)] text-2xl font-medium text-marfil">Autenticidad</h2>
            <div className="mt-6">
              {certificado ? (
                <BloqueCertificado certificado={certificado} />
              ) : (
                <div className="flex items-start gap-3 rounded-lg border border-antracita-suave bg-antracita p-6">
                  <ShieldOff size={20} className="mt-0.5 shrink-0 text-marfil-suave" />
                  <div>
                    <p className="font-medium text-marfil">Certificado pendiente de emisión</p>
                    <p className="mt-1 text-sm leading-relaxed text-marfil-suave">
                      El equipo curatorial aún no ha emitido el certificado de autenticidad de esta pieza. Se
                      publicará aquí, junto con su sello criptográfico y su código QR de validación.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="font-[var(--font-display)] text-2xl font-medium text-marfil">Trazabilidad</h2>
            <p className="mt-2 text-sm leading-relaxed text-marfil-suave">
              Historial de propiedad de la pieza, registrado de forma incremental por la galería.
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
      </section>
    </div>
  );
}
