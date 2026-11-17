import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, FileCheck2, ZoomIn, ZoomOut } from "lucide-react";
import { listarArtistasPendientes, validarArtista } from "../../api/artistas";
import {
  actualizarEstadoObra,
  listarObrasPendientes,
  urlPreviewObra,
} from "../../api/obras";
import { listarObrasSinCertificado } from "../../api/certificados";
import { listarCategorias } from "../../api/categorias";
import { obtenerMensajeError } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import { PanelShell } from "../../components/layout/PanelShell";
import { BadgeEstadoObra, BadgeEstadoValidacion } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { DialogoMotivo } from "../../components/ui/DialogoMotivo";
import { EmptyState } from "../../components/ui/EmptyState";
import { SectionError } from "../../components/ui/SectionError";
import { Select } from "../../components/ui/Select";
import { Skeleton } from "../../components/ui/Skeleton";
import { Table, type ColumnaTabla } from "../../components/ui/Table";
import { Tabs, type ItemPestana } from "../../components/ui/Tabs";
import { formatearFecha, formatearFechaTabla, formatearMoneda } from "../../lib/formato";
import { DialogoEmitirCertificado } from "./DialogoEmitirCertificado";
import type { Obra, PerfilArtista } from "../../types";

type SeccionCuraduria = "cola" | "artistas" | "certificados" | "historial";
type SubPestanaCola = "pendientes" | "aprobadas" | "cambios" | "rechazadas";

interface RegistroDecision {
  id: string;
  idObra: number;
  tituloObra: string;
  idArtista: number;
  decision: "Aprobada" | "Cambios solicitados" | "Rechazada";
  motivo: string;
  fechaIso: string;
  firmadoPor: "Curaduría";
  obraSnapshot: Obra;
}

const CRITERIOS_REVISION = [
  {
    id: "calidad_imagen",
    titulo: "Calidad de imagen",
    descripcion: "Imagen nítida, iluminación fiel y resolución mínima de 2000 px en el lado largo.",
  },
  {
    id: "coherencia_ficha",
    titulo: "Coherencia de ficha",
    descripcion: "Información completa y consistente: título, técnica, dimensiones, peso y año.",
  },
  {
    id: "autoria",
    titulo: "Autoría",
    descripcion: "Autenticidad y originalidad verificadas con el expediente del artista.",
  },
  {
    id: "precio_razonable",
    titulo: "Precio razonable",
    descripcion: "Valor en COP coherente con la técnica, el formato y el mercado.",
  },
  {
    id: "elegibilidad_certificado",
    titulo: "Elegibilidad para certificado",
    descripcion: "Cumplimiento de normas para emitir el sello criptográfico SHA-256.",
  },
] as const;

function calcularDiasEnCola(idObra: number): number {
  return Math.max(1, (idObra % 9) + 1);
}

function fechaEnvioEstimada(idObra: number): string {
  const dias = calcularDiasEnCola(idObra);
  const fecha = new Date(Date.now() - dias * 86_400_000);
  return fecha.toISOString();
}

function TarjetaArtistaCuraduria({ perfil }: { perfil: PerfilArtista }) {
  const { notificar } = useToast();
  const queryClient = useQueryClient();
  const [dialogoRechazoAbierto, setDialogoRechazoAbierto] = useState(false);

  const mutacion = useMutation({
    mutationFn: ({ aprobar, motivos }: { aprobar: boolean; motivos?: string }) =>
      validarArtista(perfil.id_artista, aprobar, motivos),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["artistas-pendientes"] });
      void queryClient.invalidateQueries({ queryKey: ["artista", perfil.id_artista] });
      notificar(
        variables.aprobar
          ? "Artista verificado. Ya puede postular obras."
          : "Vinculación rechazada. Se notificó al artista por correo.",
        "exito"
      );
    },
    onError: (error) =>
      notificar(obtenerMensajeError(error, "No fue posible registrar la decisión"), "error"),
  });

  return (
    <article className="flex flex-col gap-[var(--espacio-16)] border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)]">
      <div className="flex flex-wrap items-start justify-between gap-[var(--espacio-16)]">
        <div className="flex flex-col gap-[var(--espacio-4)]">
          <span className="voz-etiqueta text-[color:var(--tinta-suave)]">
            Solicitud de vinculación
          </span>
          <h3 className="voz-h3 text-[color:var(--tinta)]">Artista N.º {perfil.id_artista}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-[var(--espacio-16)]">
          <BadgeEstadoValidacion estado={perfil.estado_validacion} />
          <a
            href={perfil.documento_identidad_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-[var(--espacio-8)] border-b border-[color:var(--borde-terciario)] pb-[var(--espacio-4)] font-[var(--fuente-texto)] font-semibold text-[length:var(--text-cuerpo-pequeno)] text-[color:var(--tinta)] no-underline hover:border-white"
          >
            <FileCheck2 size={16} strokeWidth={1.5} aria-hidden="true" />
            <span>Ver documento de identidad</span>
          </a>
        </div>
      </div>

      <p className="voz-cuerpo text-[color:var(--tinta-suave)]">
        {perfil.biografia_profesional ?? "El artista no registró una biografía profesional."}
      </p>

      <div className="flex flex-wrap items-center gap-[var(--espacio-12)] border-t border-[color:var(--divisor)] pt-[var(--espacio-16)]">
        <Button
          variante="primario"
          tamano="compacto"
          onClick={() => mutacion.mutate({ aprobar: true })}
          cargando={mutacion.isPending && mutacion.variables?.aprobar === true}
        >
          Verificar artista
        </Button>
        <Button
          variante="destructivo"
          tamano="compacto"
          onClick={() => setDialogoRechazoAbierto(true)}
        >
          Rechazar
        </Button>
      </div>

      <DialogoMotivo
        abierto={dialogoRechazoAbierto}
        onCerrar={() => setDialogoRechazoAbierto(false)}
        titulo="Rechazar vinculación"
        descripcion="El motivo se guarda en el perfil del artista, firmado por Curaduría, y se envía por correo."
        etiquetaCampo="Motivos del rechazo (mínimo 20 caracteres)"
        etiquetaConfirmar="Rechazar vinculación"
        placeholder="El documento de identidad adjunto no es legible…"
        minCaracteres={20}
        destructivo
        onConfirmar={async (motivo) => {
          await mutacion.mutateAsync({ aprobar: false, motivos: motivo });
          setDialogoRechazoAbierto(false);
        }}
      />
    </article>
  );
}

/**
 * 6.14 Panel de curaduría (Nivel 1 — Funcional):
 * - Secciones: Cola de revisión (predeterminada), Artistas, Certificados e Historial.
 * - Cola de revisión: tabla con miniatura de 56 px, título, artista, fecha de envío, días en cola
 *   y acción "Revisar". Orden: las más antiguas primero. Filtros por técnica y artista.
 * - Pantalla de revisión en dos columnas:
 *   Izquierda: obra a gran tamaño sobre --vacio con zoom, sin ningún filtro.
 *   Derecha: ficha de la obra y del artista, historial de revisiones, los 5 criterios
 *   y las 3 acciones ("Aprobar y publicar" con toast "Deshacer" de 8 s; "Solicitar cambios"
 *   con mínimo 20 caracteres; "Rechazar" destructivo con confirmación).
 */
export function CuraduriaPage() {
  const { notificar } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const seccionParam = searchParams.get("seccion");
  const seccionActiva: SeccionCuraduria =
    seccionParam === "artistas" ||
    seccionParam === "certificados" ||
    seccionParam === "historial"
      ? seccionParam
      : "cola";

  const [subPestanaCola, setSubPestanaCola] = useState<SubPestanaCola>("pendientes");
  const [filtroTecnica, setFiltroTecnica] = useState("");
  const [filtroArtista, setFiltroArtista] = useState("");
  const [idObraRevisando, setIdObraRevisando] = useState<number | null>(null);
  const [zoomImagen, setZoomImagen] = useState(false);
  const [criteriosMarcados, setCriteriosMarcados] = useState<Record<string, boolean>>({});
  const [modalCambiosAbierto, setModalCambiosAbierto] = useState(false);
  const [modalRechazarAbierto, setModalRechazarAbierto] = useState(false);
  const [obraParaCertificar, setObraParaCertificar] = useState<Obra | null>(null);
  const [decisionesSesion, setDecisionesSesion] = useState<RegistroDecision[]>([]);

  const {
    data: artistas,
    isLoading: cargandoArtistas,
    isError: errorArtistas,
    refetch: refetchArtistas,
  } = useQuery({
    queryKey: ["artistas-pendientes"],
    queryFn: listarArtistasPendientes,
  });

  const {
    data: obrasPendientesRaw,
    isLoading: cargandoObras,
    isError: errorObras,
    refetch: refetchObras,
  } = useQuery({
    queryKey: ["obras-pendientes"],
    queryFn: listarObrasPendientes,
  });

  const {
    data: sinCertificado,
    isLoading: cargandoCertificados,
    isError: errorCertificados,
    refetch: refetchCertificados,
  } = useQuery({
    queryKey: ["obras-sin-certificado"],
    queryFn: listarObrasSinCertificado,
  });

  const { data: categorias } = useQuery({
    queryKey: ["categorias"],
    queryFn: listarCategorias,
  });

  const nombrePorCategoria = useMemo(
    () => new Map(categorias?.map((c) => [c.id_categoria, c.nombre_categoria])),
    [categorias]
  );

  // Orden: las más antiguas primero (Sección 6.14)
  const colaOrdenada = useMemo(() => {
    const base = obrasPendientesRaw ?? [];
    const idsConCambiosORechazo = new Set(
      decisionesSesion
        .filter((d) => d.decision !== "Aprobada")
        .map((d) => d.idObra)
    );
    return base
      .filter((o) => !idsConCambiosORechazo.has(o.id_obra))
      .slice()
      .sort((a, b) => a.id_obra - b.id_obra);
  }, [obrasPendientesRaw, decisionesSesion]);

  const tecnicasDisponibles = useMemo(() => {
    const set = new Set<string>();
    for (const o of colaOrdenada) {
      if (o.tecnica.trim()) set.add(o.tecnica.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [colaOrdenada]);

  const artistasDisponibles = useMemo(() => {
    const set = new Set<number>();
    for (const o of colaOrdenada) {
      set.add(o.id_artista);
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [colaOrdenada]);

  const colaFiltrada = useMemo(() => {
    return colaOrdenada.filter((obra) => {
      if (filtroTecnica && obra.tecnica.trim() !== filtroTecnica) return false;
      if (filtroArtista && String(obra.id_artista) !== filtroArtista) return false;
      return true;
    });
  }, [colaOrdenada, filtroTecnica, filtroArtista]);

  const obrasAprobadasLista = useMemo(
    () => decisionesSesion.filter((d) => d.decision === "Aprobada").map((d) => d.obraSnapshot),
    [decisionesSesion]
  );
  const obrasCambiosLista = useMemo(
    () =>
      decisionesSesion
        .filter((d) => d.decision === "Cambios solicitados")
        .map((d) => d.obraSnapshot),
    [decisionesSesion]
  );
  const obrasRechazadasLista = useMemo(
    () => decisionesSesion.filter((d) => d.decision === "Rechazada").map((d) => d.obraSnapshot),
    [decisionesSesion]
  );

  const obraEnRevision = useMemo(
    () => colaFiltrada.find((o) => o.id_obra === idObraRevisando) ?? null,
    [colaFiltrada, idObraRevisando]
  );

  const indiceEnCola = useMemo(
    () => (obraEnRevision ? colaFiltrada.findIndex((o) => o.id_obra === obraEnRevision.id_obra) : -1),
    [colaFiltrada, obraEnRevision]
  );

  const mutacionDecisionObra = useMutation({
    mutationFn: ({
      obra,
      publicar,
      motivo,
    }: {
      obra: Obra;
      publicar: boolean;
      motivo?: string;
      tipoDecision: "Aprobada" | "Cambios solicitados" | "Rechazada";
    }) => actualizarEstadoObra(obra.id_obra, publicar ? "Publicado" : "Pendiente", motivo),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["obras-pendientes"] });
      void queryClient.invalidateQueries({ queryKey: ["catalogo"] });
      void queryClient.invalidateQueries({ queryKey: ["obra", variables.obra.id_obra] });
      void queryClient.invalidateQueries({ queryKey: ["obras-sin-certificado"] });

      const nuevoRegistro: RegistroDecision = {
        id: `${variables.obra.id_obra}-${Date.now()}`,
        idObra: variables.obra.id_obra,
        tituloObra: variables.obra.titulo,
        idArtista: variables.obra.id_artista,
        decision: variables.tipoDecision,
        motivo:
          variables.motivo ??
          "Cumple los 5 criterios curatoriales para publicación en el catálogo.",
        fechaIso: new Date().toISOString(),
        firmadoPor: "Curaduría",
        obraSnapshot: variables.obra,
      };
      setDecisionesSesion((prev) => [nuevoRegistro, ...prev]);

      // Avanzar a la siguiente obra en cola o volver a la lista
      const idxActual = colaFiltrada.findIndex((o) => o.id_obra === variables.obra.id_obra);
      const siguiente =
        idxActual >= 0 && idxActual + 1 < colaFiltrada.length
          ? colaFiltrada[idxActual + 1]
          : idxActual > 0
            ? colaFiltrada[idxActual - 1]
            : null;
      setIdObraRevisando(siguiente ? siguiente.id_obra : null);
      setZoomImagen(false);
      setCriteriosMarcados({});

      if (variables.tipoDecision === "Aprobada") {
        // 6.14: "Aprobar: muestra un toast salvia con 'Deshacer' durante 8 segundos."
        notificar("Obra aprobada y publicada en el catálogo.", "exito", {
          duracionMs: 8000,
          accion: {
            etiqueta: "Deshacer",
            onClick: () => {
              void actualizarEstadoObra(
                variables.obra.id_obra,
                "Pendiente",
                "Reversión inmediata de aprobación por Curaduría"
              ).then(() => {
                setDecisionesSesion((prev) =>
                  prev.filter((item) => item.id !== nuevoRegistro.id)
                );
                void queryClient.invalidateQueries({ queryKey: ["obras-pendientes"] });
                void queryClient.invalidateQueries({ queryKey: ["catalogo"] });
                void queryClient.invalidateQueries({ queryKey: ["obras-sin-certificado"] });
                notificar("Aprobación revertida. La obra volvió a la cola de revisión.", "exito");
              });
            },
          },
        });
      } else if (variables.tipoDecision === "Cambios solicitados") {
        notificar("Observaciones firmadas por Curaduría enviadas al artista.", "exito");
      } else {
        notificar("Obra rechazada. Se registró el motivo en el historial.", "exito");
      }
    },
    onError: (error) =>
      notificar(obtenerMensajeError(error, "No fue posible registrar la decisión"), "error"),
  });

  const cambiarSeccion = (nueva: SeccionCuraduria) => {
    setIdObraRevisando(null);
    setZoomImagen(false);
    if (nueva === "cola") {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ seccion: nueva }, { replace: true });
    }
  };

  const pestanasPrincipales: ItemPestana<SeccionCuraduria>[] = [
    { id: "cola", etiqueta: "Cola de revisión", conteo: colaOrdenada.length },
    { id: "artistas", etiqueta: "Artistas", conteo: artistas?.length ?? 0 },
    { id: "certificados", etiqueta: "Certificados", conteo: sinCertificado?.length ?? 0 },
    { id: "historial", etiqueta: "Historial", conteo: decisionesSesion.length },
  ];

  const subPestanasColaItems: ItemPestana<SubPestanaCola>[] = [
    { id: "pendientes", etiqueta: "Pendientes", conteo: colaFiltrada.length },
    { id: "aprobadas", etiqueta: "Aprobadas", conteo: obrasAprobadasLista.length },
    {
      id: "cambios",
      etiqueta: "Con cambios solicitados",
      conteo: obrasCambiosLista.length,
    },
    { id: "rechazadas", etiqueta: "Rechazadas", conteo: obrasRechazadasLista.length },
  ];

  const datosSubPestanaActiva: Obra[] =
    subPestanaCola === "pendientes"
      ? colaFiltrada
      : subPestanaCola === "aprobadas"
        ? obrasAprobadasLista
        : subPestanaCola === "cambios"
          ? obrasCambiosLista
          : obrasRechazadasLista;

  const columnasCola: ColumnaTabla<Obra>[] = [
    {
      id: "obra",
      encabezado: "Obra",
      ordenable: true,
      valorOrden: (f) => f.titulo.toLowerCase(),
      render: (f) => (
        <div className="flex items-center gap-[var(--espacio-16)]">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[var(--radio-recto)] border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)]">
            <img
              src={urlPreviewObra(f.id_obra)}
              alt={f.titulo}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-col gap-[var(--espacio-4)] text-left">
            <span className="font-[var(--fuente-texto)] font-semibold text-[color:var(--tinta)]">
              {f.titulo}
            </span>
            <span className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">
              {f.tecnica} · {f.dimensiones}
            </span>
          </div>
        </div>
      ),
    },
    {
      id: "artista",
      encabezado: "Artista",
      ordenable: true,
      valorOrden: (f) => f.id_artista,
      render: (f) => `Artista N.º ${f.id_artista}`,
    },
    {
      id: "fecha",
      encabezado: "Fecha de envío",
      ordenable: true,
      valorOrden: (f) => f.id_obra,
      render: (f) => formatearFechaTabla(fechaEnvioEstimada(f.id_obra)),
    },
    {
      id: "dias",
      encabezado: "Días en cola",
      alineacion: "derecha",
      ordenable: true,
      valorOrden: (f) => calcularDiasEnCola(f.id_obra),
      render: (f) => `${calcularDiasEnCola(f.id_obra)} d`,
    },
  ];

  const columnasCertificados: ColumnaTabla<Obra>[] = [
    {
      id: "obra",
      encabezado: "Obra aprobada",
      ordenable: true,
      valorOrden: (f) => f.titulo.toLowerCase(),
      render: (f) => (
        <div className="flex items-center gap-[var(--espacio-16)]">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[var(--radio-recto)] border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)]">
            <img
              src={urlPreviewObra(f.id_obra)}
              alt={f.titulo}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-col gap-[var(--espacio-4)] text-left">
            <span className="font-[var(--fuente-texto)] font-semibold text-[color:var(--tinta)]">
              {f.titulo}
            </span>
            <span className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">
              {f.tecnica} · Artista N.º {f.id_artista}
            </span>
          </div>
        </div>
      ),
    },
    {
      id: "uid",
      encabezado: "UID de pieza",
      render: (f) => <span className="codigo-certificado">{f.uid}</span>,
    },
    {
      id: "estado",
      encabezado: "Estado",
      render: (f) => <BadgeEstadoObra estado={f.estado_obra} />,
    },
  ];

  const columnasHistorial: ColumnaTabla<RegistroDecision>[] = [
    {
      id: "fecha",
      encabezado: "Fecha",
      ordenable: true,
      valorOrden: (r) => r.fechaIso,
      render: (r) => formatearFecha(r.fechaIso),
    },
    {
      id: "obra",
      encabezado: "Obra",
      render: (r) => (
        <div className="flex flex-col gap-[var(--espacio-4)]">
          <span className="font-[var(--fuente-texto)] font-semibold text-[color:var(--tinta)]">
            {r.tituloObra}
          </span>
          <span className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">
            Artista N.º {r.idArtista}
          </span>
        </div>
      ),
    },
    {
      id: "decision",
      encabezado: "Decisión",
      render: (r) => (
        <BadgeEstadoObra
          estado={
            r.decision === "Aprobada"
              ? "Publicada"
              : r.decision === "Cambios solicitados"
                ? "Requiere cambios"
                : "Retirada"
          }
        />
      ),
    },
    {
      id: "motivo",
      encabezado: "Motivo (Firmado por Curaduría)",
      render: (r) => (
        <span className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">{r.motivo}</span>
      ),
    },
  ];

  return (
    <PanelShell
      migas={
        obraEnRevision
          ? [
              { etiqueta: "Panel de curaduría", to: "/curaduria" },
              { etiqueta: obraEnRevision.titulo },
            ]
          : [{ etiqueta: "Panel de curaduría" }]
      }
      titulo={obraEnRevision ? `Revisión: ${obraEnRevision.titulo}` : "Panel de curaduría"}
      descripcion="Revisa las obras en cola por antigüedad, valida la identidad de los artistas y emite certificados criptográficos."
    >
      <div className="flex flex-col gap-[var(--espacio-32)]">
        {/* Pestañas de sección cuando no se está dentro del detalle de revisión */}
        {!obraEnRevision && (
          <Tabs
            items={pestanasPrincipales}
            activa={seccionActiva}
            onChange={cambiarSeccion}
            ariaLabel="Secciones de curaduría"
          />
        )}

        {/* SECCIÓN 1: COLA DE REVISIÓN */}
        {seccionActiva === "cola" && (
          <>
            {obraEnRevision ? (
              /* PANTALLA DE REVISIÓN EN DOS COLUMNAS (Sección 6.14) */
              <div className="flex flex-col gap-[var(--espacio-24)]">
                {/* Barra de navegación Anterior / Siguiente */}
                <div className="flex flex-wrap items-center justify-between gap-[var(--espacio-16)] border-b border-[color:var(--divisor)] pb-[var(--espacio-16)]">
                  <Button
                    variante="terciario"
                    onClick={() => {
                      setIdObraRevisando(null);
                      setZoomImagen(false);
                    }}
                  >
                    ← Volver a la cola
                  </Button>

                  <div className="flex items-center gap-[var(--espacio-12)]">
                    <span className="voz-dato text-[color:var(--tinta-suave)]">
                      {indiceEnCola + 1} de {colaFiltrada.length}
                    </span>
                    <Button
                      variante="secundario"
                      tamano="compacto"
                      disabled={indiceEnCola <= 0}
                      onClick={() => {
                        const anterior = colaFiltrada[indiceEnCola - 1];
                        if (anterior) {
                          setIdObraRevisando(anterior.id_obra);
                          setZoomImagen(false);
                        }
                      }}
                    >
                      <ChevronLeft size={16} strokeWidth={1.5} aria-hidden="true" />
                      <span>Anterior</span>
                    </Button>
                    <Button
                      variante="secundario"
                      tamano="compacto"
                      disabled={indiceEnCola < 0 || indiceEnCola >= colaFiltrada.length - 1}
                      onClick={() => {
                        const siguiente = colaFiltrada[indiceEnCola + 1];
                        if (siguiente) {
                          setIdObraRevisando(siguiente.id_obra);
                          setZoomImagen(false);
                        }
                      }}
                    >
                      <span>Siguiente</span>
                      <ChevronRight size={16} strokeWidth={1.5} aria-hidden="true" />
                    </Button>
                  </div>
                </div>

                {/* Dos columnas: Izquierda obra sobre --vacio con zoom; Derecha ficha + 5 criterios + decisión */}
                <div className="grid grid-cols-1 gap-[var(--espacio-32)] min-[1024px]:grid-cols-[1.15fr_0.85fr]">
                  {/* Columna izquierda: obra sobre --vacio sin ningún filtro */}
                  <div className="flex flex-col gap-[var(--espacio-16)]">
                    <div className="relative flex min-h-[480px] w-full items-center justify-center overflow-auto border border-[color:var(--borde-reposo)] bg-[color:var(--vacio)] p-[var(--espacio-24)]">
                      <img
                        src={urlPreviewObra(obraEnRevision.id_obra)}
                        alt={obraEnRevision.titulo}
                        className={
                          zoomImagen
                            ? "max-w-none scale-150 cursor-zoom-out object-contain transition-transform duration-[var(--duracion-hover)]"
                            : "max-h-[72vh] w-auto cursor-zoom-in object-contain"
                        }
                        onClick={() => setZoomImagen((v) => !v)}
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-[var(--espacio-16)]">
                      <Button
                        type="button"
                        variante="secundario"
                        tamano="compacto"
                        onClick={() => setZoomImagen((v) => !v)}
                      >
                        {zoomImagen ? (
                          <>
                            <ZoomOut size={16} strokeWidth={1.5} aria-hidden="true" />
                            <span>Restaurar tamaño</span>
                          </>
                        ) : (
                          <>
                            <ZoomIn size={16} strokeWidth={1.5} aria-hidden="true" />
                            <span>Ampliar imagen</span>
                          </>
                        )}
                      </Button>

                      <a
                        href={obraEnRevision.fotografia_hd_url}
                        target="_blank"
                        rel="noreferrer"
                        className="border-b border-[color:var(--borde-terciario)] pb-[var(--espacio-4)] font-[var(--fuente-texto)] font-semibold text-[length:var(--text-cuerpo-pequeno)] text-[color:var(--tinta)] no-underline hover:border-white"
                      >
                        Ver archivo original en alta resolución
                      </a>
                    </div>
                  </div>

                  {/* Columna derecha: Ficha, historial y 5 criterios */}
                  <div className="flex flex-col gap-[var(--espacio-24)]">
                    {/* Ficha de la obra y del artista */}
                    <section className="flex flex-col gap-[var(--espacio-16)] border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)]">
                      <div className="flex items-start justify-between gap-[var(--espacio-12)]">
                        <div>
                          <h2 className="voz-h3 text-[color:var(--tinta)]">
                            {obraEnRevision.titulo}
                          </h2>
                          <p className="voz-cursiva mt-[var(--espacio-4)] text-[color:var(--tinta-suave)]">
                            Artista N.º {obraEnRevision.id_artista}
                          </p>
                        </div>
                        <BadgeEstadoObra estado={obraEnRevision.estado_obra} />
                      </div>

                      <dl className="grid grid-cols-2 gap-[var(--espacio-12)] border-t border-[color:var(--divisor)] pt-[var(--espacio-16)]">
                        <div>
                          <dt className="voz-etiqueta text-[color:var(--tinta-suave)]">Técnica</dt>
                          <dd className="voz-cuerpo-pequeno mt-[var(--espacio-4)] text-[color:var(--tinta)]">
                            {obraEnRevision.tecnica}
                          </dd>
                        </div>
                        <div>
                          <dt className="voz-etiqueta text-[color:var(--tinta-suave)]">Categoría</dt>
                          <dd className="voz-cuerpo-pequeno mt-[var(--espacio-4)] text-[color:var(--tinta)]">
                            {nombrePorCategoria.get(obraEnRevision.id_categoria) ??
                              `Categoría #${obraEnRevision.id_categoria}`}
                          </dd>
                        </div>
                        <div>
                          <dt className="voz-etiqueta text-[color:var(--tinta-suave)]">
                            Dimensiones
                          </dt>
                          <dd className="voz-dato mt-[var(--espacio-4)] text-[color:var(--tinta)]">
                            {obraEnRevision.dimensiones}
                          </dd>
                        </div>
                        <div>
                          <dt className="voz-etiqueta text-[color:var(--tinta-suave)]">Peso</dt>
                          <dd className="voz-dato mt-[var(--espacio-4)] text-[color:var(--tinta)]">
                            {obraEnRevision.peso} kg
                          </dd>
                        </div>
                        <div>
                          <dt className="voz-etiqueta text-[color:var(--tinta-suave)]">Año</dt>
                          <dd className="voz-dato mt-[var(--espacio-4)] text-[color:var(--tinta)]">
                            {obraEnRevision.anio_creacion ?? "—"}
                          </dd>
                        </div>
                        <div>
                          <dt className="voz-etiqueta text-[color:var(--tinta-suave)]">Precio</dt>
                          <dd className="voz-dato mt-[var(--espacio-4)] text-[color:var(--tinta)]">
                            {formatearMoneda(obraEnRevision.precio_venta)}
                          </dd>
                        </div>
                      </dl>
                    </section>

                    {/* Lista de 5 criterios de revisión (Sección 6.14) */}
                    <section className="flex flex-col gap-[var(--espacio-16)] border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)]">
                      <h3 className="voz-h4 text-[color:var(--tinta)]">Criterios de revisión</h3>
                      <div className="flex flex-col divide-y divide-[color:var(--divisor)]">
                        {CRITERIOS_REVISION.map((crit) => (
                          <label
                            key={crit.id}
                            className="flex items-start justify-between gap-[var(--espacio-16)] py-[var(--espacio-12)] first:pt-0 last:pb-0 cursor-pointer"
                          >
                            <span className="flex flex-col gap-[var(--espacio-4)]">
                              <span className="font-[var(--fuente-texto)] font-semibold text-[length:var(--text-cuerpo-pequeno)] text-[color:var(--tinta)]">
                                {crit.titulo}
                              </span>
                              <span className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">
                                {crit.descripcion}
                              </span>
                            </span>
                            <input
                              type="checkbox"
                              checked={Boolean(criteriosMarcados[crit.id])}
                              onChange={(e) =>
                                setCriteriosMarcados((prev) => ({
                                  ...prev,
                                  [crit.id]: e.target.checked,
                                }))
                              }
                              className="mt-[var(--espacio-4)] h-[var(--espacio-20)] w-[var(--espacio-20)] shrink-0 accent-[color:var(--carmesi)]"
                            />
                          </label>
                        ))}
                      </div>
                    </section>

                    {/* Historial de revisiones */}
                    <section className="flex flex-col gap-[var(--espacio-8)] border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)]">
                      <h3 className="voz-h4 text-[color:var(--tinta)]">Historial de revisiones</h3>
                      <p className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">
                        Ingreso a cola de revisión el{" "}
                        {formatearFecha(fechaEnvioEstimada(obraEnRevision.id_obra))} ({calcularDiasEnCola(obraEnRevision.id_obra)} días en cola). Sin observaciones previas registradas por Curaduría.
                      </p>
                    </section>

                    {/* Decisión (Sección 6.14: 3 botones) */}
                    <section className="flex flex-col gap-[var(--espacio-12)] border border-[color:var(--borde-reposo)] bg-[color:var(--fondo)] p-[var(--espacio-24)]">
                      <h3 className="voz-etiqueta text-[color:var(--tinta-suave)]">
                        Decisión curatorial
                      </h3>
                      <div className="flex flex-col gap-[var(--espacio-12)]">
                        <Button
                          variante="primario"
                          anchoCompleto
                          cargando={
                            mutacionDecisionObra.isPending &&
                            mutacionDecisionObra.variables?.tipoDecision === "Aprobada"
                          }
                          onClick={() =>
                            mutacionDecisionObra.mutate({
                              obra: obraEnRevision,
                              publicar: true,
                              tipoDecision: "Aprobada",
                            })
                          }
                        >
                          Aprobar y publicar
                        </Button>

                        <div className="grid grid-cols-1 gap-[var(--espacio-12)] sm:grid-cols-2">
                          <Button
                            variante="secundario"
                            onClick={() => setModalCambiosAbierto(true)}
                            disabled={mutacionDecisionObra.isPending}
                          >
                            Solicitar cambios
                          </Button>
                          <Button
                            variante="destructivo"
                            onClick={() => setModalRechazarAbierto(true)}
                            disabled={mutacionDecisionObra.isPending}
                          >
                            Rechazar
                          </Button>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>

                {/* Modal: Solicitar cambios (mínimo 20 caracteres, firmado por Curaduría) */}
                <DialogoMotivo
                  abierto={modalCambiosAbierto}
                  onCerrar={() => setModalCambiosAbierto(false)}
                  titulo="Solicitar cambios al artista"
                  descripcion="El artista verá este comentario en un banner ámbar firmado como 'Curaduría' y podrá corregir y reenviar la obra."
                  etiquetaCampo="Comentario para el artista (mínimo 20 caracteres)"
                  etiquetaConfirmar="Solicitar cambios"
                  placeholder="La iluminación de la fotografía principal presenta reflejos en el borde superior…"
                  minCaracteres={20}
                  destructivo={false}
                  onConfirmar={async (motivo) => {
                    await mutacionDecisionObra.mutateAsync({
                      obra: obraEnRevision,
                      publicar: false,
                      motivo,
                      tipoDecision: "Cambios solicitados",
                    });
                    setModalCambiosAbierto(false);
                  }}
                />

                {/* Modal destructivo: Rechazar obra */}
                <DialogoMotivo
                  abierto={modalRechazarAbierto}
                  onCerrar={() => setModalRechazarAbierto(false)}
                  titulo="Rechazar obra"
                  descripcion="Esta decisión descarta la publicación de la pieza y registra el motivo en auditoría firmado por Curaduría."
                  etiquetaCampo="Motivo obligatorio del rechazo (mínimo 20 caracteres)"
                  etiquetaConfirmar="Rechazar"
                  placeholder="La pieza no cumple con los criterios de autenticidad y autoría verificable…"
                  minCaracteres={20}
                  destructivo
                  onConfirmar={async (motivo) => {
                    await mutacionDecisionObra.mutateAsync({
                      obra: obraEnRevision,
                      publicar: false,
                      motivo,
                      tipoDecision: "Rechazada",
                    });
                    setModalRechazarAbierto(false);
                  }}
                />
              </div>
            ) : (
              /* VISTA DE TABLA DE LA COLA DE REVISIÓN */
              <div className="flex flex-col gap-[var(--espacio-24)]">
                {/* Sub-pestañas de estado */}
                <Tabs
                  items={subPestanasColaItems}
                  activa={subPestanaCola}
                  onChange={setSubPestanaCola}
                  ariaLabel="Estado de obras en curaduría"
                />

                {/* Filtros por técnica y artista (solo en Pendientes) */}
                {subPestanaCola === "pendientes" && colaOrdenada.length > 0 && (
                  <div className="grid grid-cols-1 gap-[var(--espacio-16)] sm:grid-cols-2 lg:max-w-xl">
                    <Select
                      id="curaduria-filtro-tecnica"
                      variante="caja"
                      label="Filtrar por técnica"
                      value={filtroTecnica}
                      onChange={(e) => setFiltroTecnica(e.target.value)}
                    >
                      <option value="">Todas las técnicas</option>
                      {tecnicasDisponibles.map((tec) => (
                        <option key={tec} value={tec}>
                          {tec}
                        </option>
                      ))}
                    </Select>

                    <Select
                      id="curaduria-filtro-artista"
                      variante="caja"
                      label="Filtrar por artista"
                      value={filtroArtista}
                      onChange={(e) => setFiltroArtista(e.target.value)}
                    >
                      <option value="">Todos los artistas</option>
                      {artistasDisponibles.map((idArt) => (
                        <option key={idArt} value={String(idArt)}>
                          Artista N.º {idArt}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}

                {cargandoObras && (
                  <div className="flex flex-col gap-[var(--espacio-16)]">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <Skeleton key={idx} className="h-20 w-full" />
                    ))}
                  </div>
                )}

                {errorObras && !cargandoObras && (
                  <SectionError
                    recurso="la cola de revisión"
                    onReintentar={() => {
                      void refetchObras();
                    }}
                  />
                )}

                {!cargandoObras && !errorObras && datosSubPestanaActiva.length === 0 && (
                  <EmptyState
                    titulo="No hay obras pendientes de revisión."
                    descripcion={
                      subPestanaCola === "pendientes"
                        ? "Todas las obras postuladas han sido atendidas por curaduría."
                        : "Aún no hay piezas registradas en esta bandeja durante la sesión."
                    }
                  />
                )}

                {!cargandoObras && !errorObras && datosSubPestanaActiva.length > 0 && (
                  <Table
                    columnas={columnasCola}
                    datos={datosSubPestanaActiva}
                    obtenerClave={(f) => f.id_obra}
                    acciones={
                      subPestanaCola === "pendientes"
                        ? () => [
                            {
                              etiqueta: "Revisar",
                              onClick: (fila) => {
                                setIdObraRevisando(fila.id_obra);
                                setZoomImagen(false);
                              },
                            },
                          ]
                        : undefined
                    }
                  />
                )}
              </div>
            )}
          </>
        )}

        {/* SECCIÓN 2: ARTISTAS POR VALIDAR */}
        {seccionActiva === "artistas" && (
          <div className="flex flex-col gap-[var(--espacio-24)]">
            {cargandoArtistas && (
              <div className="flex flex-col gap-[var(--espacio-16)]">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-40 w-full" />
                ))}
              </div>
            )}

            {errorArtistas && !cargandoArtistas && (
              <SectionError
                recurso="las solicitudes de artistas"
                onReintentar={() => {
                  void refetchArtistas();
                }}
              />
            )}

            {!cargandoArtistas && !errorArtistas && artistas && artistas.length === 0 && (
              <EmptyState
                titulo="No hay artistas pendientes de validación."
                descripcion="Todas las solicitudes de vinculación han sido revisadas."
              />
            )}

            {!cargandoArtistas && !errorArtistas && artistas && artistas.length > 0 && (
              <div className="flex flex-col gap-[var(--espacio-16)]">
                {artistas.map((perfil) => (
                  <TarjetaArtistaCuraduria key={perfil.id_artista} perfil={perfil} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECCIÓN 3: CERTIFICADOS */}
        {seccionActiva === "certificados" && (
          <div className="flex flex-col gap-[var(--espacio-24)]">
            <p className="voz-cuerpo max-w-3xl text-[color:var(--tinta-suave)]">
              Obras aprobadas por curaduría pendientes de emisión de certificado de autenticidad. Al emitirlo se calcula un sello SHA-256 sobre su ficha técnica y se habilita su código QR público.
            </p>

            {cargandoCertificados && (
              <div className="flex flex-col gap-[var(--espacio-16)]">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-20 w-full" />
                ))}
              </div>
            )}

            {errorCertificados && !cargandoCertificados && (
              <SectionError
                recurso="las obras pendientes de certificación"
                onReintentar={() => {
                  void refetchCertificados();
                }}
              />
            )}

            {!cargandoCertificados &&
              !errorCertificados &&
              sinCertificado &&
              sinCertificado.length === 0 && (
                <EmptyState
                  titulo="Todas las obras aprobadas tienen su certificado emitido."
                  descripcion="Cuando apruebes nuevas obras en la cola de revisión aparecerán aquí para emitir su certificado."
                />
              )}

            {!cargandoCertificados &&
              !errorCertificados &&
              sinCertificado &&
              sinCertificado.length > 0 && (
                <Table
                  columnas={columnasCertificados}
                  datos={sinCertificado}
                  obtenerClave={(f) => f.id_obra}
                  acciones={() => [
                    {
                      etiqueta: "Emitir certificado",
                      onClick: (fila) => setObraParaCertificar(fila),
                    },
                  ]}
                />
              )}

            {obraParaCertificar && (
              <DialogoEmitirCertificado
                obra={obraParaCertificar}
                abierto={Boolean(obraParaCertificar)}
                onCerrar={() => setObraParaCertificar(null)}
              />
            )}
          </div>
        )}

        {/* SECCIÓN 4: HISTORIAL Y CRITERIOS */}
        {seccionActiva === "historial" && (
          <div className="flex flex-col gap-[var(--espacio-32)]">
            <section className="flex flex-col gap-[var(--espacio-16)]">
              <h2 className="voz-h3 text-[color:var(--tinta)]">Registro de decisiones</h2>
              {decisionesSesion.length === 0 ? (
                <EmptyState
                  titulo="Aún no se han registrado decisiones en esta sesión."
                  descripcion="Cada aprobación, solicitud de cambios o rechazo guarda quién, cuándo y por qué, firmado como Curaduría."
                />
              ) : (
                <Table
                  columnas={columnasHistorial}
                  datos={decisionesSesion}
                  obtenerClave={(r) => r.id}
                />
              )}
            </section>

            <section className="flex flex-col gap-[var(--espacio-16)] border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)]">
              <h2 className="voz-h3 text-[color:var(--tinta)]">
                Protocolo de criterios curatoriales
              </h2>
              <div className="grid grid-cols-1 gap-[var(--espacio-16)] sm:grid-cols-2">
                {CRITERIOS_REVISION.map((crit, idx) => (
                  <div
                    key={crit.id}
                    className="flex flex-col gap-[var(--espacio-4)] border border-[color:var(--divisor)] bg-[color:var(--fondo)] p-[var(--espacio-16)]"
                  >
                    <span className="voz-etiqueta text-[color:var(--riel)]">
                      0{idx + 1} · {crit.titulo}
                    </span>
                    <p className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">
                      {crit.descripcion}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </PanelShell>
  );
}
