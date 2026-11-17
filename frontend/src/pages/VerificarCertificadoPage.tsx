import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { verificarSello } from "../api/certificados";
import { urlPreviewObra } from "../api/obras";
import { obtenerTrazabilidad } from "../api/trazabilidad";
import { Ambiente } from "../components/escena/Ambiente";
import { LineaTrazabilidad } from "../components/LineaTrazabilidad";
import { Banner } from "../components/ui/Banner";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { SelloCertificado } from "../components/ui/SelloCertificado";
import { PageProgressBar, Skeleton } from "../components/ui/Skeleton";
import { formatearFecha } from "../lib/formato";

/**
 * 6.7 Verificar certificado (Nivel 2):
 * Contenido centrado de 560 px. El sello (disco de 160 px) con "VERIFICAR" en Anton,
 * H1 "Verificar certificado", el texto "Escribe el código que aparece en tu certificado.",
 * un campo en formato caja y el botón "Verificar".
 * Resultado válido: el borde del sello pasa a --exito y aparece el banner salvia "Certificado válido",
 * ficha con miniatura de la obra, título, artista, año, fecha de emisión, titular actual y código,
 * más el botón "Ver obra".
 * No encontrado: banner ámbar "No encontramos un certificado con ese código. Revisa que esté completo e inténtalo de nuevo."
 */
export function VerificarCertificadoPage() {
  const { sello } = useParams<{ sello: string }>();
  const navigate = useNavigate();

  const selloUrl = (sello ?? "").trim();
  const esMarcadorInicial = selloUrl === "" || selloUrl.toLowerCase() === "buscar";

  const [codigoInput, setCodigoInput] = useState(esMarcadorInicial ? "" : selloUrl);
  const [errorCampo, setErrorCampo] = useState<string | undefined>(undefined);

  useEffect(() => {
    document.title = "Verificar certificado · Pixel & Lienzo";
  }, []);

  useEffect(() => {
    setCodigoInput(esMarcadorInicial ? "" : selloUrl);
  }, [esMarcadorInicial, selloUrl]);

  const codigoConsulta = esMarcadorInicial ? "" : selloUrl;

  const {
    data: verificacion,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["verificar-certificado", codigoConsulta],
    queryFn: () => verificarSello(codigoConsulta),
    enabled: codigoConsulta.length > 0,
    retry: false,
  });

  const { data: trazabilidad } = useQuery({
    queryKey: ["trazabilidad", verificacion?.obra.id_obra],
    queryFn: () => obtenerTrazabilidad(verificacion!.obra.id_obra),
    enabled: !!verificacion,
  });

  const alEnviar = (e: FormEvent) => {
    e.preventDefault();
    const limpio = codigoInput.trim().replace(/\s+/g, "");
    if (limpio.length < 8) {
      setErrorCampo("Ingresa un código de al menos 8 caracteres.");
      return;
    }
    setErrorCampo(undefined);
    navigate(`/verificar/${encodeURIComponent(limpio)}`);
  };

  const esValido = Boolean(verificacion && verificacion.sello_valido);
  const ultimoRegistro =
    trazabilidad && trazabilidad.length > 0
      ? trazabilidad[trazabilidad.length - 1]
      : undefined;
  const titularActual = ultimoRegistro
    ? `Coleccionista N.º ${ultimoRegistro.id_propietario_nuevo}`
    : verificacion
      ? `Artista N.º ${verificacion.obra.id_artista}`
      : "";

  return (
    <div className="relative min-h-screen py-[var(--espacio-64)]">
      {isLoading && <PageProgressBar etiqueta="Verificando certificado…" />}
      <Ambiente nivel={2} />

      <div className="relative z-10 mx-auto w-full max-w-[var(--contenedor-verificar)] px-[var(--espacio-16)]">
        {/* Cabecera centrada con el Sello de 160 px */}
        <div className="flex flex-col items-center text-center">
          <SelloCertificado
            etiqueta="VERIFICAR"
            codigo={verificacion?.certificado.codigo_qr_validacion ?? (codigoConsulta || undefined)}
            valido={esValido}
          />

          <h1 className="voz-h1 mt-[var(--espacio-24)] text-[color:var(--tinta)]">
            Verificar certificado
          </h1>

          <p className="voz-cuerpo mt-[var(--espacio-8)] text-[color:var(--tinta-suave)]">
            Escribe el código que aparece en tu certificado.
          </p>
        </div>

        {/* Formulario con campo en formato caja y botón "Verificar" */}
        <form
          onSubmit={alEnviar}
          noValidate
          className="mt-[var(--espacio-32)] flex flex-col gap-[var(--espacio-16)]"
        >
          <Input
            variante="caja"
            label="Código del certificado"
            placeholder="Ej. PYL-2026-0001 o sello SHA-256"
            value={codigoInput}
            onChange={(e) => {
              setCodigoInput(e.target.value);
              if (errorCampo) setErrorCampo(undefined);
            }}
            error={errorCampo}
            className="codigo-certificado"
          />

          <Button type="submit" variante="primario" cargando={isLoading} className="w-full">
            Verificar
          </Button>
        </form>

        {/* Estados de verificación */}
        <div className="mt-[var(--espacio-32)] flex flex-col gap-[var(--espacio-24)]">
          {isLoading && (
            <div className="flex flex-col gap-[var(--espacio-16)]" role="status" aria-label="Verificando certificado">
              <Skeleton className="h-[var(--espacio-48)] w-full" />
              <Skeleton className="h-[240px] w-full" />
            </div>
          )}

          {!isLoading && isError && codigoConsulta.length > 0 && (
            <Banner variante="aviso">
              No encontramos un certificado con ese código. Revisa que esté completo e inténtalo de nuevo.
            </Banner>
          )}

          {!isLoading && verificacion && !verificacion.sello_valido && (
            <Banner variante="aviso">
              Este certificado presenta una discrepancia con la ficha técnica actual de la obra.
            </Banner>
          )}

          {!isLoading && verificacion && verificacion.sello_valido && (
            <>
              <Banner variante="exito">Certificado válido</Banner>

              {/* Ficha de la obra certificada (sin correo, dirección, método de pago ni precio por privacidad 6.7) */}
              <article className="border border-[color:var(--borde-reposo)] bg-[color:var(--fondo)] p-[var(--espacio-24)] shadow-[var(--sombra-tarjeta)]">
                <div className="flex flex-col gap-[var(--espacio-24)] sm:flex-row sm:items-center">
                  <div className="flex h-[var(--miniatura-lista)] w-[var(--miniatura-lista)] shrink-0 items-center justify-center border border-[color:var(--divisor)] bg-[color:var(--vacio)] p-[var(--espacio-8)]">
                    <img
                      src={urlPreviewObra(verificacion.obra.id_obra)}
                      alt={verificacion.obra.titulo}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="voz-h3 text-[color:var(--tinta)]">
                      {verificacion.obra.titulo}
                    </h2>
                    <p className="voz-cursiva mt-[var(--espacio-4)] text-[color:var(--tinta-suave)]">
                      Artista N.º {verificacion.obra.id_artista}
                      {verificacion.obra.anio_creacion ? ` · ${verificacion.obra.anio_creacion}` : ""}
                    </p>
                    <p className="voz-cuerpo-pequeno mt-[var(--espacio-4)] text-[color:var(--tinta-suave)]">
                      {verificacion.obra.tecnica} · {verificacion.obra.dimensiones}
                    </p>
                  </div>
                </div>

                <dl className="mt-[var(--espacio-24)] divide-y divide-[color:var(--divisor)] border-y border-[color:var(--divisor)]">
                  <div className="flex items-baseline justify-between gap-[var(--espacio-16)] py-[var(--espacio-12)]">
                    <dt className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">
                      Fecha de emisión
                    </dt>
                    <dd className="voz-cuerpo-pequeno font-semibold text-[color:var(--tinta)]">
                      {formatearFecha(verificacion.certificado.sello_tiempo)}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-[var(--espacio-16)] py-[var(--espacio-12)]">
                    <dt className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">
                      Titular actual
                    </dt>
                    <dd className="voz-cuerpo-pequeno font-semibold text-[color:var(--tinta)]">
                      {titularActual}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-[var(--espacio-4)] py-[var(--espacio-12)]">
                    <dt className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">
                      Código del certificado
                    </dt>
                    <dd className="codigo-certificado break-all text-[length:var(--text-minimo)] text-[color:var(--tinta)]">
                      {verificacion.certificado.codigo_qr_validacion ?? codigoConsulta}
                    </dd>
                  </div>
                </dl>

                <div className="mt-[var(--espacio-24)] flex flex-wrap items-center justify-between gap-[var(--espacio-16)]">
                  <Link to={`/obras/${verificacion.obra.uid}`}>
                    <Button variante="secundario">Ver obra</Button>
                  </Link>

                  <a
                    href={verificacion.certificado.pdf_certificado_url}
                    target="_blank"
                    rel="noreferrer"
                    className="enlace-acceso inline-flex items-center gap-[var(--espacio-8)] text-[length:var(--text-cuerpo-pequeno)]"
                  >
                    <FileText size={16} strokeWidth={1.5} aria-hidden="true" />
                    <span>Descargar certificado</span>
                  </a>
                </div>
              </article>

              {trazabilidad && (
                <section
                  aria-labelledby="heading-trazabilidad-verificacion"
                  className="border border-[color:var(--divisor)] bg-[color:var(--fondo)] p-[var(--espacio-24)]"
                >
                  <h3
                    id="heading-trazabilidad-verificacion"
                    className="voz-etiqueta mb-[var(--espacio-16)] text-[color:var(--tinta-suave)]"
                  >
                    Procedencia registrada
                  </h3>
                  <LineaTrazabilidad
                    registros={trazabilidad}
                    idArtista={verificacion.obra.id_artista}
                  />
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
