import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, FileCheck2, ShieldCheck, Undo2, X } from "lucide-react";
import { listarArtistasPendientes, validarArtista } from "../../api/artistas";
import { actualizarEstadoObra, listarObrasPendientes, urlPreviewObra } from "../../api/obras";
import { listarObrasSinCertificado } from "../../api/certificados";
import { listarCategorias } from "../../api/categorias";
import { DialogoEmitirCertificado } from "./DialogoEmitirCertificado";
import { useToast } from "../../context/ToastContext";
import { PanelShell } from "../../components/layout/PanelShell";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/Spinner";
import { DialogoMotivo } from "../../components/ui/DialogoMotivo";
import { formatearMoneda } from "../../lib/formato";
import { obtenerMensajeError } from "../../api/client";
import type { Obra, PerfilArtista } from "../../types";

type Pestania = "artistas" | "obras" | "certificados";

function TarjetaCertificar({ obra }: { obra: Obra }) {
  const [dialogoAbierto, setDialogoAbierto] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-5 rounded-lg border border-antracita-suave bg-antracita p-5">
      <img
        src={urlPreviewObra(obra.id_obra)}
        alt={obra.titulo}
        loading="lazy"
        className="h-20 w-20 shrink-0 rounded-md bg-carbon object-cover"
      />
      <div className="min-w-48 flex-1">
        <p className="text-[0.68rem] uppercase tracking-[0.16em] text-ocre">{obra.tecnica}</p>
        <h3 className="mt-0.5 font-[var(--font-display)] text-xl text-marfil">{obra.titulo}</h3>
        <p className="mt-1 font-mono text-[0.7rem] text-marfil-suave">{obra.uid}</p>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs uppercase tracking-wider text-marfil-suave">{obra.estado_obra}</span>
        <Button variante="contorno" onClick={() => setDialogoAbierto(true)}>
          <ShieldCheck size={16} /> Emitir certificado
        </Button>
      </div>

      <DialogoEmitirCertificado
        obra={obra}
        abierto={dialogoAbierto}
        onCerrar={() => setDialogoAbierto(false)}
      />
    </div>
  );
}

function TarjetaArtista({ perfil }: { perfil: PerfilArtista }) {
  const { notificar } = useToast();
  const queryClient = useQueryClient();
  const [dialogoAbierto, setDialogoAbierto] = useState(false);

  const mutacion = useMutation({
    mutationFn: ({ aprobar, motivos }: { aprobar: boolean; motivos?: string }) =>
      validarArtista(perfil.id_artista, aprobar, motivos),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["artistas-pendientes"] });
      queryClient.invalidateQueries({ queryKey: ["artista", perfil.id_artista] });
      notificar(
        variables.aprobar
          ? "Artista verificado. Ya puede postular obras."
          : "Vinculación rechazada. Se notificó al artista por correo."
      );
    },
    onError: (error) => notificar(obtenerMensajeError(error, "No fue posible registrar la decisión"), "error"),
  });

  return (
    <div className="rounded-lg border border-antracita-suave bg-antracita p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.16em] text-ocre">Solicitud de vinculación</p>
          <p className="mt-1 font-[var(--font-display)] text-xl text-marfil">Artista N.º {perfil.id_artista}</p>
        </div>
        <a
          href={perfil.documento_identidad_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm text-marfil-suave hover:text-ocre"
        >
          <FileCheck2 size={16} /> Ver documento de identidad
        </a>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-marfil-suave">
        {perfil.biografia_profesional ?? "El artista no registró una biografía profesional."}
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button
          onClick={() => mutacion.mutate({ aprobar: true })}
          cargando={mutacion.isPending && mutacion.variables?.aprobar === true}
        >
          <Check size={16} /> Verificar artista
        </Button>
        <Button variante="contorno" onClick={() => setDialogoAbierto(true)}>
          <X size={16} /> Rechazar
        </Button>
      </div>

      <DialogoMotivo
        abierto={dialogoAbierto}
        onCerrar={() => setDialogoAbierto(false)}
        titulo="Rechazar vinculación"
        descripcion="El motivo se guarda en el perfil del artista, se registra en auditoría y se le envía por correo."
        etiquetaCampo="Motivos del rechazo"
        etiquetaConfirmar="Rechazar vinculación"
        placeholder="El documento de identidad no es legible…"
        onConfirmar={async (motivo) => {
          await mutacion.mutateAsync({ aprobar: false, motivos: motivo });
          setDialogoAbierto(false);
        }}
      />
    </div>
  );
}

function TarjetaObra({ obra, nombreCategoria }: { obra: Obra; nombreCategoria?: string }) {
  const { notificar } = useToast();
  const queryClient = useQueryClient();
  const [dialogoAbierto, setDialogoAbierto] = useState(false);

  const mutacion = useMutation({
    mutationFn: ({ publicar, motivo }: { publicar: boolean; motivo?: string }) =>
      actualizarEstadoObra(obra.id_obra, publicar ? "Publicado" : "Pendiente", motivo),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["obras-pendientes"] });
      queryClient.invalidateQueries({ queryKey: ["catalogo"] });
      queryClient.invalidateQueries({ queryKey: ["obra", obra.id_obra] });
      // Al publicarse, la obra pasa a la cola de piezas por certificar.
      queryClient.invalidateQueries({ queryKey: ["obras-sin-certificado"] });
      notificar(
        variables.publicar
          ? "Obra publicada. Ya tiene código QR y aparece en el catálogo."
          : "Observaciones enviadas al artista por correo. La obra sigue en la cola hasta que la corrija."
      );
    },
    onError: (error) => notificar(obtenerMensajeError(error, "No fue posible registrar la decisión"), "error"),
  });

  return (
    <div className="overflow-hidden rounded-lg border border-antracita-suave bg-antracita">
      <div className="flex flex-col sm:flex-row">
        <div className="w-full shrink-0 bg-carbon sm:w-56">
          <img
            src={urlPreviewObra(obra.id_obra)}
            alt={obra.titulo}
            loading="lazy"
            className="h-56 w-full object-cover sm:h-full"
          />
        </div>

        <div className="flex flex-1 flex-col p-5">
          <p className="text-[0.68rem] uppercase tracking-[0.16em] text-ocre">{obra.tecnica}</p>
          <h3 className="mt-1 font-[var(--font-display)] text-2xl text-marfil">{obra.titulo}</h3>
          <p className="mt-1 text-xs text-marfil-suave">
            Artista N.º {obra.id_artista}
            {nombreCategoria ? ` · ${nombreCategoria}` : ""}
          </p>

          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs uppercase tracking-wider text-marfil-suave/70">Dimensiones</dt>
              <dd className="mt-0.5 text-marfil">{obra.dimensiones}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-marfil-suave/70">Peso</dt>
              <dd className="mt-0.5 text-marfil">{obra.peso} kg</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-marfil-suave/70">Año</dt>
              <dd className="mt-0.5 text-marfil">{obra.anio_creacion ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-marfil-suave/70">Precio</dt>
              <dd className="mt-0.5 font-semibold text-ocre">{formatearMoneda(obra.precio_venta)}</dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              onClick={() => mutacion.mutate({ publicar: true })}
              cargando={mutacion.isPending && mutacion.variables?.publicar === true}
            >
              <Check size={16} /> Aprobar y publicar
            </Button>
            <Button variante="contorno" onClick={() => setDialogoAbierto(true)}>
              <Undo2 size={16} /> Devolver con observaciones
            </Button>
            <a
              href={obra.fotografia_hd_url}
              target="_blank"
              rel="noreferrer"
              className="text-xs uppercase tracking-wider text-marfil-suave hover:text-ocre"
            >
              Ver original
            </a>
          </div>
        </div>
      </div>

      <DialogoMotivo
        abierto={dialogoAbierto}
        onCerrar={() => setDialogoAbierto(false)}
        titulo="Devolver con observaciones"
        descripcion="Se envían al artista por correo y quedan registradas en auditoría. La obra permanece en la cola hasta que se corrija y se apruebe."
        etiquetaCampo="Observaciones"
        etiquetaConfirmar="Enviar observaciones"
        placeholder="La fotografía no tiene la resolución mínima requerida…"
        onConfirmar={async (motivo) => {
          await mutacion.mutateAsync({ publicar: false, motivo });
          setDialogoAbierto(false);
        }}
      />
    </div>
  );
}

export function CuraduriaPage() {
  const [pestania, setPestania] = useState<Pestania>("artistas");

  const { data: artistas, isLoading: cargandoArtistas, isError: errorArtistas } = useQuery({
    queryKey: ["artistas-pendientes"],
    queryFn: listarArtistasPendientes,
  });

  const { data: obras, isLoading: cargandoObras, isError: errorObras } = useQuery({
    queryKey: ["obras-pendientes"],
    queryFn: listarObrasPendientes,
  });

  const {
    data: sinCertificado,
    isLoading: cargandoCertificados,
    isError: errorCertificados,
  } = useQuery({
    queryKey: ["obras-sin-certificado"],
    queryFn: listarObrasSinCertificado,
  });

  const { data: categorias } = useQuery({ queryKey: ["categorias"], queryFn: listarCategorias });
  const nombrePorCategoria = new Map(categorias?.map((c) => [c.id_categoria, c.nombre_categoria]));

  const pestanias: { id: Pestania; etiqueta: string; conteo: number }[] = [
    { id: "artistas", etiqueta: "Artistas por validar", conteo: artistas?.length ?? 0 },
    { id: "obras", etiqueta: "Obras por revisar", conteo: obras?.length ?? 0 },
    { id: "certificados", etiqueta: "Por certificar", conteo: sinCertificado?.length ?? 0 },
  ];

  return (
    <PanelShell
      eyebrow="Curaduría"
      titulo="Cola de revisión"
      descripcion="Valida la identidad de los artistas y decide qué obras entran al catálogo. Cada decisión se registra en el log de auditoría y se notifica por correo."
    >
      <div className="flex flex-wrap gap-2 border-b border-antracita-suave/60 pb-px">
        {pestanias.map((p) => (
          <button
            key={p.id}
            onClick={() => setPestania(p.id)}
            className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium uppercase tracking-[0.12em] transition-colors ${
              pestania === p.id
                ? "border-ocre text-ocre"
                : "border-transparent text-marfil-suave hover:text-marfil"
            }`}
          >
            {p.etiqueta}
            <span
              className={`rounded-full px-2 py-0.5 text-[0.7rem] ${
                pestania === p.id ? "bg-ocre/15 text-ocre" : "bg-antracita text-marfil-suave"
              }`}
            >
              {p.conteo}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-8">
        {pestania === "artistas" && (
          <>
            {cargandoArtistas && <Spinner etiqueta="Cargando solicitudes…" />}
            {errorArtistas && <p className="text-terracota">No fue posible cargar las solicitudes.</p>}
            {artistas && artistas.length === 0 && (
              <p className="rounded-lg border border-dashed border-antracita-suave p-10 text-center text-marfil-suave">
                No hay artistas pendientes de validación.
              </p>
            )}
            {artistas && artistas.length > 0 && (
              <div className="flex flex-col gap-5">
                {artistas.map((perfil) => (
                  <TarjetaArtista key={perfil.id_artista} perfil={perfil} />
                ))}
              </div>
            )}
          </>
        )}

        {pestania === "obras" && (
          <>
            {cargandoObras && <Spinner etiqueta="Cargando obras postuladas…" />}
            {errorObras && <p className="text-terracota">No fue posible cargar las obras postuladas.</p>}
            {obras && obras.length === 0 && (
              <div className="rounded-lg border border-dashed border-antracita-suave p-10 text-center">
                <p className="text-marfil-suave">No hay obras esperando revisión curatorial.</p>
                <Link to="/" className="mt-2 inline-block text-sm text-ocre underline">
                  Ver el catálogo publicado
                </Link>
              </div>
            )}
            {obras && obras.length > 0 && (
              <div className="flex flex-col gap-6">
                {obras.map((obra) => (
                  <TarjetaObra
                    key={obra.id_obra}
                    obra={obra}
                    nombreCategoria={nombrePorCategoria.get(obra.id_categoria)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {pestania === "certificados" && (
          <>
            <p className="mb-6 max-w-2xl text-sm leading-relaxed text-marfil-suave">
              Obras ya aprobadas que aún no tienen certificado de autenticidad. Al emitirlo se calcula un
              sello SHA-256 sobre su ficha técnica y se publica un QR con el que cualquiera puede verificar
              la pieza.
            </p>
            {cargandoCertificados && <Spinner etiqueta="Cargando obras por certificar…" />}
            {errorCertificados && <p className="text-terracota">No fue posible cargar las obras por certificar.</p>}
            {sinCertificado && sinCertificado.length === 0 && (
              <p className="rounded-lg border border-dashed border-antracita-suave p-10 text-center text-marfil-suave">
                Todas las obras aprobadas tienen su certificado emitido.
              </p>
            )}
            {sinCertificado && sinCertificado.length > 0 && (
              <div className="flex flex-col gap-4">
                {sinCertificado.map((obra) => (
                  <TarjetaCertificar key={obra.id_obra} obra={obra} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </PanelShell>
  );
}
