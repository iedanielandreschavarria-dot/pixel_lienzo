import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, QrCode, ArrowLeft } from "lucide-react";
import { obtenerObra, urlPreviewObra, urlQrObra } from "../api/obras";
import { obtenerPerfilArtista } from "../api/artistas";
import { crearTransaccion } from "../api/transacciones";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Button } from "../components/ui/Button";
import { BadgeEstadoObra } from "../components/ui/Badge";
import { Spinner } from "../components/ui/Spinner";
import { formatearMoneda } from "../lib/formato";
import { obtenerMensajeError } from "../api/client";

export function ObraDetallePage() {
  const { idObra } = useParams<{ idObra: string }>();
  const id = Number(idObra);
  const { user } = useAuth();
  const { notificar } = useToast();
  const navigate = useNavigate();
  const [comprando, setComprando] = useState(false);

  const {
    data: obra,
    isLoading,
    isError,
  } = useQuery({ queryKey: ["obra", id], queryFn: () => obtenerObra(id), enabled: !Number.isNaN(id) });

  const { data: perfilArtista } = useQuery({
    queryKey: ["artista", obra?.id_artista],
    queryFn: () => obtenerPerfilArtista(obra!.id_artista),
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
      navigate("/login", { state: { from: { pathname: `/obras/${id}` } } });
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
        {/* La obra ocupa el máximo espacio posible, sin recortes forzados;
            un halo dorado muy sutil enmarca la pieza como en una sala con
            iluminación dirigida. */}
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
    </div>
  );
}
