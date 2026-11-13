import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FileText, Maximize2, QrCode, ShieldCheck, X } from "lucide-react";
import clsx from "clsx";
import { listarCatalogo, obtenerObra, obtenerObraPorUid, urlPreviewObra, urlQrObra } from "../api/obras";
import { obtenerPerfilArtista } from "../api/artistas";
import { obtenerCertificado, urlQrCertificado } from "../api/certificados";
import { obtenerTrazabilidad } from "../api/trazabilidad";
import { crearTransaccion } from "../api/transacciones";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Ambiente } from "../components/escena/Ambiente";
import { ObraCard } from "../components/ObraCard";
import { LineaTrazabilidad } from "../components/LineaTrazabilidad";
import { Button } from "../components/ui/Button";
import { BadgeEstadoObra } from "../components/ui/Badge";
import { Banner } from "../components/ui/Banner";
import { Breadcrumbs } from "../components/ui/Breadcrumbs";
import { SelloCertificado } from "../components/ui/SelloCertificado";
import { PageProgressBar, Skeleton } from "../components/ui/Skeleton";
import { formatearFecha, formatearMoneda } from "../lib/formato";
import { obtenerMensajeError } from "../api/client";
import { CheckoutPage } from "./CheckoutPage";
import { NotFoundPage } from "./NotFoundPage";

type VistaEscenario = "obra" | "qr";

/**
 * 6.4 Detalle de obra (Nivel 2):
 * Dos columnas en escritorio (60 % obra sobre --vacio con luz roja suave de encendido 800 ms,
 * contain, máx 80 vh y visor "Ampliar"; 40 % migas, H1, artista en cursiva, etiquetas de
 * técnica/año/dimensiones, precio en H2, estado, "Comprar obra" a ancho completo, bloque
 * "Certificado de autenticidad" con SelloCertificado, descripción, ficha técnica clave-valor
 * y procedencia). Debajo, "Más de [Artista]" con 4 tarjetas de obra. En móvil, barra inferior
 * fija de 72 px al pasar el bloque de compra.
 */
export function ObraDetallePage() {
  const { idObra } = useParams<{ idObra: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { notificar } = useToast();
  const navigate = useNavigate();

  const enModoCheckout = searchParams.get("checkout") === "1";

  const [comprando, setComprando] = useState(false);
  const [luzEncendida, setLuzEncendida] = useState(false);
  const [vistaActiva, setVistaActiva] = useState<VistaEscenario>("obra");
  const [visorAbierto, setVisorAbierto] = useState(false);
  const [zoomVisor, setZoomVisor] = useState(false);
  const [mostrarBarraMovil, setMostrarBarraMovil] = useState(false);

  const bloqueCompraRef = useRef<HTMLDivElement>(null);
  const botonAmpliarRef = useRef<HTMLButtonElement>(null);

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

  const { data: obrasDelArtista } = useQuery({
    queryKey: ["catalogo", "mas-del-artista", obra?.id_artista],
    queryFn: () => listarCatalogo({ id_artista: obra!.id_artista }),
    enabled: !!obra,
  });

  const masObras = useMemo(
    () => (obrasDelArtista ?? []).filter((item) => item.id_obra !== obra?.id_obra).slice(0, 4),
    [obrasDelArtista, obra?.id_obra]
  );

  // Momento teatral: la luz detrás de la obra se enciende de 0 a 1 en 800 ms al entrar
  useEffect(() => {
    setLuzEncendida(false);
    setVistaActiva("obra");
    const timer = window.setTimeout(() => setLuzEncendida(true), 40);
    return () => window.clearTimeout(timer);
  }, [obra?.id_obra]);

  useEffect(() => {
    if (obra?.titulo) {
      document.title = `${obra.titulo} · Pixel & Lienzo`;
    }
  }, [obra?.titulo]);

  // Cierre del visor a pantalla completa con Escape
  useEffect(() => {
    if (!visorAbierto) return;
    const alTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setVisorAbierto(false);
        setZoomVisor(false);
        botonAmpliarRef.current?.focus();
      }
    };
    window.addEventListener("keydown", alTecla);
    return () => window.removeEventListener("keydown", alTecla);
  }, [visorAbierto]);

  // En móvil, al pasar el bloque de compra, "Comprar obra" queda fijo en una barra inferior de 72 px
  useEffect(() => {
    const el = bloqueCompraRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const pasoHaciaAbajo = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        setMostrarBarraMovil(pasoHaciaAbajo);
      },
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [obra?.id_obra]);

  if (isLoading) {
    return (
      <div className="relative min-h-screen py-[var(--espacio-48)]">
        <PageProgressBar etiqueta="Cargando obra…" />
        <Ambiente nivel={2} />
        <div className="contenedor-pyl relative z-10 grid grid-cols-1 gap-[var(--espacio-48)] min-[1024px]:grid-cols-[3fr_2fr]">
          <Skeleton className="h-[68vh] w-full" />
          <div className="flex flex-col gap-[var(--espacio-16)]">
            <Skeleton className="h-[var(--espacio-16)] w-1/3" />
            <Skeleton className="h-[var(--espacio-48)] w-3/4" />
            <Skeleton className="h-[var(--espacio-24)] w-1/2" />
            <Skeleton className="mt-[var(--espacio-16)] h-[var(--espacio-48)] w-1/3" />
            <Skeleton className="mt-[var(--espacio-16)] h-[var(--alto-control)] w-full rounded-[var(--radio-pildora)]" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !obra) {
    return <NotFoundPage />;
  }

  if (enModoCheckout) {
    return <CheckoutPage idObraProp={obra.id_obra} />;
  }

  // 6.4: "En revisión o retirada, el público ve una 404 y su artista ve un banner con el estado."
  const enRevisionORetirada =
    obra.estado_obra === "Pendiente" ||
    obra.estado_obra === "Mantenimiento" ||
    obra.estado_obra === "En Préstamo";

  const esAutorizadoParaVerNoPublicada =
    user?.rol === "Artista" || user?.rol === "Curador" || user?.rol === "Administrador";

  if (enRevisionORetirada && !esAutorizadoParaVerNoPublicada) {
    return <NotFoundPage />;
  }

  const disponible = obra.estado_obra === "Publicado";
  const vendida = obra.estado_obra === "Vendido";
  const reservada = obra.estado_obra === "Reservado";

  const comprar = async () => {
    if (!user) {
      navigate("/login", { state: { from: { pathname: `/obras/${obra.id_obra}` } } });
      return;
    }
    if (user.rol !== "Comprador") {
      notificar("Solo una cuenta de Coleccionista puede adquirir obras.", "error");
      return;
    }
    setComprando(true);
    try {
      const transaccion = await crearTransaccion(obra.id_obra);
      window.location.href = transaccion.checkout_url;
    } catch (error) {
      notificar(obtenerMensajeError(error, "No fue posible iniciar el pago."), "error");
      setComprando(false);
    }
  };

  const urlImagenPrincipal = urlPreviewObra(obra.id_obra);
  const urlImagenActiva =
    vistaActiva === "qr" && obra.codigo_qr_obra ? urlQrObra(obra.id_obra) : urlImagenPrincipal;
  const nombreArtista = `Artista N.º ${obra.id_artista}`;

  return (
    <div className="relative min-h-screen pb-[calc(var(--alto-barra-compra-movil)+var(--espacio-48))] pt-[var(--espacio-32)] min-[1024px]:pb-[var(--espacio-96)]">
      <Ambiente nivel={2} />

      <div className="contenedor-pyl relative z-10">
        {enRevisionORetirada && (
          <div className="mb-[var(--espacio-24)]">
            <Banner variante="informativo">
              Esta obra se encuentra en estado <strong>{obra.estado_obra}</strong> y no es visible para el público general.
            </Banner>
          </div>
        )}

        {/* Estructura en escritorio: dos columnas 60 % / 40 % */}
        <div className="grid grid-cols-1 gap-[var(--espacio-48)] min-[1024px]:grid-cols-[3fr_2fr] min-[1024px]:items-start">
          {/* Columna izquierda (60 %): la obra sobre escenario --vacio con luz roja suave de encendido 800 ms */}
          <div className="flex flex-col gap-[var(--espacio-16)]">
            <div className="relative flex min-h-[360px] items-center justify-center border border-[color:var(--borde-reposo)] bg-[color:var(--vacio)] p-[var(--espacio-24)] min-[768px]:p-[var(--espacio-32)]">
              {/* Momento teatral: luz roja suave detrás de la obra (0 -> 1 en 800 ms) */}
              <div
                aria-hidden="true"
                className={clsx(
                  "pointer-events-none absolute inset-0 transition-opacity duration-[var(--duracion-momento-min)] ease-[var(--curva-base)]",
                  luzEncendida ? "opacity-100" : "opacity-0"
                )}
                style={{
                  background:
                    "radial-gradient(ellipse 65% 60% at 50% 50%, var(--luz-escenario-obra), transparent 72%)",
                }}
              />

              <img
                src={urlImagenActiva}
                alt={vistaActiva === "qr" ? `Código QR de ${obra.titulo}` : obra.titulo}
                decoding="async"
                className="relative z-10 max-h-[80vh] w-full object-contain"
              />
            </div>

            {/* Bajo la obra: miniaturas de vistas y botón "Ampliar" */}
            <div className="flex flex-wrap items-center justify-between gap-[var(--espacio-16)]">
              <div className="flex items-center gap-[var(--espacio-12)]">
                <button
                  type="button"
                  onClick={() => setVistaActiva("obra")}
                  aria-label="Vista principal de la obra"
                  aria-pressed={vistaActiva === "obra"}
                  className={clsx(
                    "h-[var(--espacio-64)] w-[var(--espacio-64)] overflow-hidden border bg-[color:var(--vacio)] p-[var(--espacio-4)] transition-colors duration-[var(--duracion-hover)] cursor-pointer",
                    vistaActiva === "obra"
                      ? "border-[color:var(--riel)]"
                      : "border-[color:var(--divisor)] hover:border-[color:var(--borde-hover)]"
                  )}
                >
                  <img
                    src={urlImagenPrincipal}
                    alt=""
                    className="h-full w-full object-contain"
                  />
                </button>

                {obra.codigo_qr_obra && (
                  <button
                    type="button"
                    onClick={() => setVistaActiva("qr")}
                    aria-label="Ver código QR físico de la obra"
                    aria-pressed={vistaActiva === "qr"}
                    className={clsx(
                      "inline-flex h-[var(--espacio-64)] w-[var(--espacio-64)] flex-col items-center justify-center gap-[var(--espacio-4)] border bg-[color:var(--vacio)] p-[var(--espacio-4)] text-[color:var(--tinta-suave)] transition-colors duration-[var(--duracion-hover)] cursor-pointer",
                      vistaActiva === "qr"
                        ? "border-[color:var(--riel)] text-[color:var(--tinta)]"
                        : "border-[color:var(--divisor)] hover:border-[color:var(--borde-hover)]"
                    )}
                  >
                    <QrCode size={20} strokeWidth={1.5} aria-hidden="true" />
                    <span className="font-[var(--fuente-poster)] text-[length:var(--text-minimo)] uppercase">
                      QR
                    </span>
                  </button>
                )}
              </div>

              <Button
                ref={botonAmpliarRef}
                type="button"
                variante="secundario"
                onClick={() => {
                  setZoomVisor(false);
                  setVisorAbierto(true);
                }}
              >
                <Maximize2 size={20} strokeWidth={1.5} aria-hidden="true" />
                <span>Ampliar</span>
              </Button>
            </div>
          </div>

          {/* Columna derecha (40 %): migas, H1, artista en cursiva, etiquetas, precio en H2, estado, acción y ficha */}
          <div className="flex flex-col gap-[var(--espacio-24)]">
            <Breadcrumbs
              items={[
                { etiqueta: "Obras", to: "/#coleccion" },
                { etiqueta: obra.titulo },
              ]}
            />

            <div>
              <h1 className="voz-h1 text-[color:var(--tinta)]">{obra.titulo}</h1>
              <p className="mt-[var(--espacio-8)]">
                <Link
                  to={`/?perfil_artista=${obra.id_artista}#artistas`}
                  className="voz-acento text-[color:var(--tinta-suave)] underline-offset-4 hover:text-[color:var(--tinta)] hover:underline"
                >
                  {nombreArtista}
                </Link>
              </p>
            </div>

            {/* Etiquetas de técnica, año y dimensiones */}
            <div className="flex flex-wrap items-center gap-[var(--espacio-8)]">
              <span className="inline-flex items-center border border-[color:var(--borde-reposo)] px-[var(--espacio-12)] py-[var(--espacio-4)] font-[var(--fuente-poster)] text-[length:var(--text-minimo)] uppercase tracking-[0.12em] text-[color:var(--tinta)]">
                {obra.tecnica}
              </span>
              {obra.anio_creacion && (
                <span className="inline-flex items-center border border-[color:var(--borde-reposo)] px-[var(--espacio-12)] py-[var(--espacio-4)] font-[var(--fuente-poster)] text-[length:var(--text-minimo)] uppercase tracking-[0.12em] text-[color:var(--tinta)]">
                  {obra.anio_creacion}
                </span>
              )}
              <span className="inline-flex items-center border border-[color:var(--borde-reposo)] px-[var(--espacio-12)] py-[var(--espacio-4)] font-[var(--fuente-poster)] text-[length:var(--text-minimo)] uppercase tracking-[0.12em] text-[color:var(--tinta)]">
                {obra.dimensiones}
              </span>
            </div>

            {/* Precio en H2 y Estado */}
            <div className="flex flex-wrap items-center justify-between gap-[var(--espacio-16)] border-y border-[color:var(--divisor)] py-[var(--espacio-16)]">
              <h2 className="voz-h2 precio-obra text-[color:var(--tinta)]">
                {formatearMoneda(obra.precio_venta)}
              </h2>
              <BadgeEstadoObra estado={obra.estado_obra} />
            </div>

            {/* Bloque de compra según el estado de la obra */}
            <div ref={bloqueCompraRef} className="flex flex-col gap-[var(--espacio-12)]">
              {reservada && (
                <Banner variante="informativo">
                  Otra persona está comprando esta obra. Vuelve en unos minutos.
                </Banner>
              )}

              {vendida ? (
                <>
                  <Button type="button" variante="secundario" disabled className="w-full">
                    Obra adquirida
                  </Button>
                  <div className="text-center">
                    <Link
                      to={`/#coleccion?categoria=${obra.id_categoria}`}
                      className="enlace-acceso text-[length:var(--text-cuerpo-pequeno)]"
                    >
                      Ver obras similares
                    </Link>
                  </div>
                </>
              ) : (
                <Button
                  type="button"
                  variante="primario"
                  disabled={!disponible}
                  cargando={comprando}
                  onClick={comprar}
                  className="w-full"
                >
                  Comprar obra
                </Button>
              )}
            </div>

            {/* Bloque "Certificado de autenticidad" con el sello y la frase de la guía */}
            <section
              aria-labelledby="heading-certificado-obra"
              className="border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)]"
            >
              <div className="flex flex-col items-center gap-[var(--espacio-24)] text-center sm:flex-row sm:text-left">
                <SelloCertificado
                  etiqueta="CERTIFICADO"
                  codigo={certificado?.codigo_qr_validacion ?? obra.uid}
                />

                <div className="flex-1">
                  <h3 id="heading-certificado-obra" className="voz-h4 text-[color:var(--tinta)]">
                    Certificado de autenticidad
                  </h3>
                  <p className="voz-cuerpo-pequeno mt-[var(--espacio-8)] text-[color:var(--tinta-suave)]">
                    Esta obra incluye un certificado verificable.
                  </p>

                  {certificado ? (
                    <div className="mt-[var(--espacio-16)] flex flex-col gap-[var(--espacio-8)]">
                      <p className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">
                        Emitido el {formatearFecha(certificado.sello_tiempo)}
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-[var(--espacio-16)] sm:justify-start">
                        <a
                          href={certificado.pdf_certificado_url}
                          target="_blank"
                          rel="noreferrer"
                          className="enlace-acceso inline-flex items-center gap-[var(--espacio-8)] text-[length:var(--text-cuerpo-pequeno)]"
                        >
                          <FileText size={16} strokeWidth={1.5} aria-hidden="true" />
                          <span>Descargar certificado</span>
                        </a>
                        {certificado.codigo_qr_validacion && (
                          <Link
                            to={`/verificar/${certificado.codigo_qr_validacion}`}
                            className="enlace-acceso inline-flex items-center gap-[var(--espacio-8)] text-[length:var(--text-cuerpo-pequeno)]"
                          >
                            <ShieldCheck size={16} strokeWidth={1.5} aria-hidden="true" />
                            <span>Verificar certificado</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="voz-cuerpo-pequeno mt-[var(--espacio-12)] text-[color:var(--tinta-suave)]">
                      Código de registro: <span className="codigo-certificado text-[color:var(--tinta)]">{obra.uid}</span>
                    </p>
                  )}
                </div>

                {certificado?.codigo_qr_validacion && (
                  <a
                    href={urlQrCertificado(certificado.id_obra)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Abrir código QR del certificado"
                    className="shrink-0 border border-[color:var(--divisor)] bg-[color:var(--vacio)] p-[var(--espacio-8)]"
                  >
                    <img
                      src={urlQrCertificado(certificado.id_obra)}
                      alt="Código QR de validación del certificado"
                      className="h-[var(--espacio-64)] w-[var(--espacio-64)] object-contain"
                    />
                  </a>
                )}
              </div>
            </section>

            {/* Descripción / trayectoria del artista si está disponible */}
            {perfilArtista?.biografia_profesional && (
              <section aria-labelledby="heading-descripcion-obra">
                <h3
                  id="heading-descripcion-obra"
                  className="voz-etiqueta mb-[var(--espacio-8)] text-[color:var(--tinta-suave)]"
                >
                  Acerca del autor
                </h3>
                <p className="voz-cuerpo text-[color:var(--tinta-suave)]">
                  {perfilArtista.biografia_profesional}
                </p>
              </section>
            )}

            {/* Ficha técnica: tabla de clave y valor */}
            <section aria-labelledby="heading-ficha-tecnica">
              <h3
                id="heading-ficha-tecnica"
                className="voz-etiqueta mb-[var(--espacio-12)] text-[color:var(--tinta-suave)]"
              >
                Ficha técnica
              </h3>
              <table className="w-full border-collapse text-left">
                <tbody>
                  <tr className="border-b border-[color:var(--divisor)]">
                    <th scope="row" className="py-[var(--espacio-12)] pr-[var(--espacio-16)] font-[var(--fuente-texto)] text-[length:var(--text-cuerpo-pequeno)] font-normal text-[color:var(--tinta-suave)]">
                      Técnica
                    </th>
                    <td className="py-[var(--espacio-12)] font-[var(--fuente-texto)] text-[length:var(--text-cuerpo-pequeno)] font-semibold text-[color:var(--tinta)]">
                      {obra.tecnica}
                    </td>
                  </tr>
                  {obra.anio_creacion && (
                    <tr className="border-b border-[color:var(--divisor)]">
                      <th scope="row" className="py-[var(--espacio-12)] pr-[var(--espacio-16)] font-[var(--fuente-texto)] text-[length:var(--text-cuerpo-pequeno)] font-normal text-[color:var(--tinta-suave)]">
                        Año
                      </th>
                      <td className="precio-obra py-[var(--espacio-12)] font-[var(--fuente-texto)] text-[length:var(--text-cuerpo-pequeno)] font-semibold text-[color:var(--tinta)]">
                        {obra.anio_creacion}
                      </td>
                    </tr>
                  )}
                  <tr className="border-b border-[color:var(--divisor)]">
                    <th scope="row" className="py-[var(--espacio-12)] pr-[var(--espacio-16)] font-[var(--fuente-texto)] text-[length:var(--text-cuerpo-pequeno)] font-normal text-[color:var(--tinta-suave)]">
                      Dimensiones
                    </th>
                    <td className="precio-obra py-[var(--espacio-12)] font-[var(--fuente-texto)] text-[length:var(--text-cuerpo-pequeno)] font-semibold text-[color:var(--tinta)]">
                      {obra.dimensiones}
                    </td>
                  </tr>
                  <tr className="border-b border-[color:var(--divisor)]">
                    <th scope="row" className="py-[var(--espacio-12)] pr-[var(--espacio-16)] font-[var(--fuente-texto)] text-[length:var(--text-cuerpo-pequeno)] font-normal text-[color:var(--tinta-suave)]">
                      Peso
                    </th>
                    <td className="precio-obra py-[var(--espacio-12)] font-[var(--fuente-texto)] text-[length:var(--text-cuerpo-pequeno)] font-semibold text-[color:var(--tinta)]">
                      {obra.peso} kg
                    </td>
                  </tr>
                  <tr className="border-b border-[color:var(--divisor)]">
                    <th scope="row" className="py-[var(--espacio-12)] pr-[var(--espacio-16)] font-[var(--fuente-texto)] text-[length:var(--text-cuerpo-pequeno)] font-normal text-[color:var(--tinta-suave)]">
                      Código de la obra
                    </th>
                    <td className="codigo-certificado py-[var(--espacio-12)] text-[length:var(--text-cuerpo-pequeno)] text-[color:var(--tinta)]">
                      {obra.uid}
                    </td>
                  </tr>
                  {obra.es_patrimonio_historico && (
                    <tr className="border-b border-[color:var(--divisor)]">
                      <th scope="row" className="py-[var(--espacio-12)] pr-[var(--espacio-16)] font-[var(--fuente-texto)] text-[length:var(--text-cuerpo-pequeno)] font-normal text-[color:var(--tinta-suave)]">
                        Clasificación
                      </th>
                      <td className="py-[var(--espacio-12)] font-[var(--fuente-texto)] text-[length:var(--text-cuerpo-pequeno)] font-semibold text-[color:var(--tinta)]">
                        Patrimonio histórico
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>

            {/* Procedencia / Trazabilidad */}
            <section aria-labelledby="heading-procedencia">
              <h3
                id="heading-procedencia"
                className="voz-etiqueta mb-[var(--espacio-16)] text-[color:var(--tinta-suave)]"
              >
                Procedencia
              </h3>
              {trazabilidad ? (
                <LineaTrazabilidad registros={trazabilidad} idArtista={obra.id_artista} />
              ) : (
                <Skeleton className="h-[var(--espacio-96)] w-full" />
              )}
            </section>
          </div>
        </div>

        {/* Ancho completo: "Más de [Artista]" con hasta 4 tarjetas de obra */}
        {masObras.length > 0 && (
          <section
            aria-labelledby="heading-mas-artista"
            className="mt-[var(--espacio-64)] border-t border-[color:var(--divisor)] pt-[var(--espacio-48)]"
          >
            <h2 id="heading-mas-artista" className="voz-h2 mb-[var(--espacio-32)] text-[color:var(--tinta)]">
              Más de {nombreArtista}
            </h2>
            <div className="rejilla-obras">
              {masObras.map((item) => (
                <ObraCard key={item.id_obra} obra={item} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Móvil: barra inferior fija de 72 px al pasar el bloque de compra */}
      {mostrarBarraMovil && disponible && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex h-[var(--alto-barra-compra-movil)] items-center justify-between gap-[var(--espacio-16)] border-t border-[color:var(--riel)] bg-[color:var(--fondo)] px-[var(--espacio-16)] min-[1024px]:hidden">
          <div className="min-w-0">
            <p className="truncate font-[var(--fuente-titulo)] text-[length:var(--text-cuerpo)] font-black text-[color:var(--tinta)]">
              {obra.titulo}
            </p>
            <p className="precio-obra text-[length:var(--text-cuerpo-pequeno)] font-semibold text-[color:var(--tinta-suave)]">
              {formatearMoneda(obra.precio_venta)}
            </p>
          </div>
          <Button
            type="button"
            variante="primario"
            cargando={comprando}
            onClick={comprar}
            className="shrink-0"
          >
            Comprar obra
          </Button>
        </div>
      )}

      {/* Visor a pantalla completa ("Ampliar") con zoom por clic y cierre con Esc */}
      {visorAbierto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Visor de ${obra.titulo}`}
          onClick={() => {
            setVisorAbierto(false);
            setZoomVisor(false);
            botonAmpliarRef.current?.focus();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--vacio)]/95 p-[var(--espacio-24)]"
        >
          <button
            type="button"
            aria-label="Cerrar visor"
            onClick={() => {
              setVisorAbierto(false);
              setZoomVisor(false);
              botonAmpliarRef.current?.focus();
            }}
            className="fixed right-[var(--espacio-24)] top-[var(--espacio-24)] z-50 inline-grid h-[var(--area-tactil-min)] w-[var(--area-tactil-min)] place-items-center rounded-[var(--radio-pildora)] border border-[color:var(--riel)] bg-[color:var(--fondo)] text-[color:var(--tinta)] hover:border-white cursor-pointer"
          >
            <X size={24} strokeWidth={1.5} aria-hidden="true" />
          </button>

          <img
            src={urlImagenActiva}
            alt={obra.titulo}
            onClick={(e) => {
              e.stopPropagation();
              setZoomVisor((z) => !z);
            }}
            className={clsx(
              "max-h-[90vh] max-w-[92vw] object-contain transition-transform duration-[var(--duracion-hover)] ease-[var(--curva-base)]",
              zoomVisor ? "scale-150 cursor-zoom-out" : "scale-100 cursor-zoom-in"
            )}
          />
        </div>
      )}
    </div>
  );
}
