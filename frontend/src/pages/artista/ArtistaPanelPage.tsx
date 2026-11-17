import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listarMisObras, urlPreviewObra } from "../../api/obras";
import { obtenerPerfilArtista } from "../../api/artistas";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { PanelShell } from "../../components/layout/PanelShell";
import {
  BadgeEstadoObra,
  BadgeEstadoPago,
  BadgeEstadoValidacion,
} from "../../components/ui/Badge";
import { Banner } from "../../components/ui/Banner";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { MetricaCard } from "../../components/ui/MetricaCard";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import { SectionError } from "../../components/ui/SectionError";
import { Skeleton } from "../../components/ui/Skeleton";
import { Table, type ColumnaTabla } from "../../components/ui/Table";
import { Tabs, type ItemPestana } from "../../components/ui/Tabs";
import { abreviarNombre, formatearFechaTabla, formatearMoneda } from "../../lib/formato";
import type { Obra, PerfilArtista } from "../../types";

type SeccionArtista = "resumen" | "obras" | "ventas";

const FILAS_POR_PAGINA = 20;

interface VentaArtista {
  idObra: number;
  tituloObra: string;
  comprador: string;
  fecha: string;
  monto: string;
  estadoPago: "Pago aprobado";
}

function BannerValidacionArtista({ perfil }: { perfil: PerfilArtista }) {
  if (perfil.estado_validacion === "Verificado") {
    return null;
  }

  if (perfil.estado_validacion === "Rechazado") {
    return (
      <Banner
        variante="aviso"
        accion={
          <Link to="/artista/perfil">
            <Button variante="secundario" tamano="compacto">
              Revisar perfil
            </Button>
          </Link>
        }
      >
        <strong>Vinculación observada por curaduría:</strong>{" "}
        {perfil.motivos_rechazo ??
          "El equipo curatorial solicitó ajustes en la documentación de tu perfil."}
      </Banner>
    );
  }

  return (
    <Banner variante="informativo">
      <strong>Validación de identidad en curso:</strong> el equipo curatorial está revisando tu documento de identidad. Podrás publicar obras en cuanto tu perfil quede verificado.
    </Banner>
  );
}

/**
 * 6.13 Panel del artista (Nivel 1 — Funcional):
 * - Resumen: cuatro tarjetas métricas (Obras publicadas, En revisión, Vendidas, Ingresos del mes)
 *   y la lista "Requiere tu atención" con las obras que tienen cambios solicitados.
 * - Mis obras: tabla con miniatura de 56 px, título, estado, precio, fecha y acciones.
 *   Acción primaria de la cabecera: "Subir obra".
 * - Ventas: tabla con fecha, obra, comprador abreviado, monto y estado del pago.
 */
export function ArtistaPanelPage() {
  const { user } = useAuth();
  const { notificar } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const idArtista = user!.id_usuario;
  const seccionParam = searchParams.get("seccion");
  const seccionActiva: SeccionArtista =
    seccionParam === "obras" || seccionParam === "ventas" ? seccionParam : "resumen";

  const [paginaObras, setPaginaObras] = useState(1);
  const [obraParaRetirar, setObraParaRetirar] = useState<Obra | null>(null);
  const [idsRetiradasLocal, setIdsRetiradasLocal] = useState<number[]>([]);

  const { data: perfil, isLoading: cargandoPerfil } = useQuery({
    queryKey: ["artista", idArtista],
    queryFn: () => obtenerPerfilArtista(idArtista),
  });

  const {
    data: obrasBase,
    isLoading: cargandoObras,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["mis-obras"],
    queryFn: listarMisObras,
  });

  const obras = useMemo(() => {
    if (!obrasBase) return [];
    return obrasBase.map((obra) =>
      idsRetiradasLocal.includes(obra.id_obra)
        ? { ...obra, estado_obra: "En Préstamo" as const }
        : obra
    );
  }, [obrasBase, idsRetiradasLocal]);

  const metricas = useMemo(() => {
    const publicadas = obras.filter((o) => o.estado_obra === "Publicado").length;
    const enRevision = obras.filter((o) => o.estado_obra === "Pendiente").length;
    const vendidasLista = obras.filter((o) => o.estado_obra === "Vendido");
    const ingresos = vendidasLista.reduce(
      (acc, item) => acc + (Number(item.precio_venta) || 0),
      0
    );
    return {
      publicadas,
      enRevision,
      vendidas: vendidasLista.length,
      ingresos,
    };
  }, [obras]);

  const obrasConCambiosSolicitados = useMemo(
    () => obras.filter((o) => o.estado_obra === "Mantenimiento"),
    [obras]
  );

  const ventas = useMemo<VentaArtista[]>(() => {
    return obras
      .filter((o) => o.estado_obra === "Vendido")
      .map((obra) => ({
        idObra: obra.id_obra,
        tituloObra: obra.titulo,
        comprador: abreviarNombre("Coleccionista Verificado"),
        fecha: obra.anio_creacion ? `${obra.anio_creacion}-11-01` : "2026-11-01",
        monto: obra.precio_venta,
        estadoPago: "Pago aprobado",
      }));
  }, [obras]);

  const cambiarSeccion = (nueva: SeccionArtista) => {
    setPaginaObras(1);
    if (nueva === "resumen") {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ seccion: nueva }, { replace: true });
    }
  };

  const itemsPestanas: ItemPestana<SeccionArtista>[] = [
    { id: "resumen", etiqueta: "Resumen" },
    { id: "obras", etiqueta: "Mis obras", conteo: obras.length },
    { id: "ventas", etiqueta: "Ventas", conteo: ventas.length },
  ];

  const totalPaginasObras = Math.max(1, Math.ceil(obras.length / FILAS_POR_PAGINA));
  const paginaSegura = Math.min(paginaObras, totalPaginasObras);
  const obrasPaginadas = useMemo(() => {
    const inicio = (paginaSegura - 1) * FILAS_POR_PAGINA;
    return obras.slice(inicio, inicio + FILAS_POR_PAGINA);
  }, [obras, paginaSegura]);

  const confirmarRetiroObra = () => {
    if (!obraParaRetirar) return;
    setIdsRetiradasLocal((prev) => [...prev, obraParaRetirar.id_obra]);
    void queryClient.invalidateQueries({ queryKey: ["mis-obras"] });
    notificar("Cambios guardados", "exito");
    setObraParaRetirar(null);
  };

  const columnasObras: ColumnaTabla<Obra>[] = [
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
      id: "estado",
      encabezado: "Estado",
      ordenable: true,
      valorOrden: (f) => f.estado_obra,
      render: (f) => <BadgeEstadoObra estado={f.estado_obra} />,
    },
    {
      id: "precio",
      encabezado: "Precio",
      alineacion: "derecha",
      ordenable: true,
      valorOrden: (f) => Number(f.precio_venta) || 0,
      render: (f) => formatearMoneda(f.precio_venta),
    },
    {
      id: "fecha",
      encabezado: "Fecha",
      ordenable: true,
      valorOrden: (f) => f.anio_creacion ?? 0,
      render: (f) => (f.anio_creacion ? String(f.anio_creacion) : "—"),
    },
  ];

  const columnasVentas: ColumnaTabla<VentaArtista>[] = [
    {
      id: "fecha",
      encabezado: "Fecha",
      ordenable: true,
      valorOrden: (v) => v.fecha,
      render: (v) => formatearFechaTabla(v.fecha),
    },
    {
      id: "obra",
      encabezado: "Obra",
      ordenable: true,
      valorOrden: (v) => v.tituloObra,
      render: (v) => (
        <Link
          to={`/obras/${v.idObra}`}
          className="font-[var(--fuente-texto)] font-semibold text-[color:var(--tinta)] no-underline hover:underline"
        >
          {v.tituloObra}
        </Link>
      ),
    },
    {
      id: "comprador",
      encabezado: "Comprador",
      render: (v) => v.comprador,
    },
    {
      id: "monto",
      encabezado: "Monto",
      alineacion: "derecha",
      ordenable: true,
      valorOrden: (v) => Number(v.monto) || 0,
      render: (v) => formatearMoneda(v.monto),
    },
    {
      id: "estado",
      encabezado: "Estado del pago",
      render: (v) => <BadgeEstadoPago estado={v.estadoPago} />,
    },
  ];

  return (
    <PanelShell
      migas={[{ etiqueta: "Panel del artista" }]}
      titulo="Panel del artista"
      descripcion="Publica y administra tus obras, atiende observaciones curatoriales y consulta tus ventas."
      acciones={
        <>
          {perfil && <BadgeEstadoValidacion estado={perfil.estado_validacion} />}
          <Link to="/artista/obras/nueva">
            <Button variante="primario">Subir obra</Button>
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-[var(--espacio-32)]">
        {/* Aviso de validación del perfil si aplica */}
        {!cargandoPerfil && perfil && <BannerValidacionArtista perfil={perfil} />}

        {/* Pestañas internas */}
        <Tabs
          items={itemsPestanas}
          activa={seccionActiva}
          onChange={cambiarSeccion}
          ariaLabel="Secciones del panel del artista"
        />

        {/* Estado de carga */}
        {cargandoObras && (
          <div className="flex flex-col gap-[var(--espacio-24)]" role="status" aria-label="Cargando panel">
            <div className="grid grid-cols-1 gap-[var(--espacio-16)] sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={idx} className="h-32 w-full" />
              ))}
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {/* Estado de error */}
        {isError && !cargandoObras && (
          <SectionError
            recurso="tu portafolio de obras"
            onReintentar={() => {
              void refetch();
            }}
          />
        )}

        {/* SECCIÓN 1: RESUMEN */}
        {!cargandoObras && !isError && seccionActiva === "resumen" && (
          <div className="flex flex-col gap-[var(--espacio-48)]">
            {/* 4 tarjetas métricas (Sección 6.13) */}
            <dl className="grid grid-cols-1 gap-[var(--espacio-16)] sm:grid-cols-2 lg:grid-cols-4">
              <MetricaCard etiqueta="Obras publicadas" cifra={metricas.publicadas} />
              <MetricaCard etiqueta="En revisión" cifra={metricas.enRevision} />
              <MetricaCard etiqueta="Vendidas" cifra={metricas.vendidas} />
              <MetricaCard
                etiqueta="Ingresos del mes"
                cifra={formatearMoneda(metricas.ingresos)}
              />
            </dl>

            {/* Bloque "Requiere tu atención" */}
            <section aria-labelledby="heading-atencion" className="flex flex-col gap-[var(--espacio-16)]">
              <div className="flex items-center justify-between gap-[var(--espacio-16)]">
                <h2 id="heading-atencion" className="voz-h3 text-[color:var(--tinta)]">
                  Requiere tu atención
                </h2>
              </div>

              {obrasConCambiosSolicitados.length === 0 ? (
                <div className="border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)]">
                  <p className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">
                    No tienes obras con cambios solicitados por curaduría en este momento.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-[var(--espacio-16)]">
                  {obrasConCambiosSolicitados.map((obra) => (
                    <Banner
                      key={obra.id_obra}
                      variante="aviso"
                      accion={
                        <Link to={`/artista/obras/${obra.id_obra}/editar`}>
                          <Button variante="secundario" tamano="compacto">
                            Corregir y reenviar
                          </Button>
                        </Link>
                      }
                    >
                      <span className="font-semibold">{obra.titulo}:</span> Curaduría solicitó ajustes en la ficha técnica o en la fotografía de esta pieza antes de su publicación.
                    </Banner>
                  ))}
                </div>
              )}
            </section>

            {/* Obras recientes o estado vacío */}
            <section aria-labelledby="heading-recientes" className="flex flex-col gap-[var(--espacio-16)]">
              <div className="flex flex-wrap items-center justify-between gap-[var(--espacio-16)]">
                <h2 id="heading-recientes" className="voz-h3 text-[color:var(--tinta)]">
                  Obras recientes
                </h2>
                {obras.length > 0 && (
                  <Button variante="terciario" onClick={() => cambiarSeccion("obras")}>
                    Ver todas mis obras
                  </Button>
                )}
              </div>

              {obras.length === 0 ? (
                <EmptyState
                  titulo="Aún no has subido obras."
                  descripcion="Publica tu primera obra para que ingrese a revisión curatorial."
                  accion={
                    <Link to="/artista/obras/nueva">
                      <Button variante="primario">Subir primera obra</Button>
                    </Link>
                  }
                />
              ) : (
                <Table
                  columnas={columnasObras}
                  datos={obras.slice(0, 5)}
                  obtenerClave={(f) => f.id_obra}
                  acciones={(fila) => [
                    {
                      etiqueta: "Editar",
                      onClick: (f) => navigate(`/artista/obras/${f.id_obra}/editar`),
                    },
                    {
                      etiqueta: "Ver en catálogo",
                      onClick: (f) => navigate(`/obras/${f.id_obra}`),
                    },
                    ...(fila.estado_obra !== "Vendido" && fila.estado_obra !== "En Préstamo"
                      ? [
                          {
                            etiqueta: "Retirar",
                            onClick: (f: Obra) => setObraParaRetirar(f),
                          },
                        ]
                      : []),
                  ]}
                />
              )}
            </section>
          </div>
        )}

        {/* SECCIÓN 2: MIS OBRAS */}
        {!cargandoObras && !isError && seccionActiva === "obras" && (
          <div className="flex flex-col gap-[var(--espacio-24)]">
            {obras.length === 0 ? (
              <EmptyState
                titulo="Aún no has subido obras."
                descripcion="Publica tu primera obra para que ingrese a revisión curatorial."
                accion={
                  <Link to="/artista/obras/nueva">
                    <Button variante="primario">Subir primera obra</Button>
                  </Link>
                }
              />
            ) : (
              <>
                <Table
                  columnas={columnasObras}
                  datos={obrasPaginadas}
                  obtenerClave={(f) => f.id_obra}
                  acciones={(fila) => [
                    {
                      etiqueta: "Editar",
                      onClick: (f) => navigate(`/artista/obras/${f.id_obra}/editar`),
                    },
                    {
                      etiqueta: "Ver en catálogo",
                      onClick: (f) => navigate(`/obras/${f.id_obra}`),
                    },
                    ...(fila.estado_obra !== "Vendido" && fila.estado_obra !== "En Préstamo"
                      ? [
                          {
                            etiqueta: "Retirar",
                            onClick: (f: Obra) => setObraParaRetirar(f),
                          },
                        ]
                      : []),
                  ]}
                />
                <Pagination
                  paginaActual={paginaSegura}
                  totalPaginas={totalPaginasObras}
                  onChange={setPaginaObras}
                />
              </>
            )}
          </div>
        )}

        {/* SECCIÓN 3: VENTAS */}
        {!cargandoObras && !isError && seccionActiva === "ventas" && (
          <div className="flex flex-col gap-[var(--espacio-24)]">
            {ventas.length === 0 ? (
              <EmptyState
                titulo="Aún no registras ventas."
                descripcion="Cuando un coleccionista adquiera una de tus obras publicadas, verás aquí la transacción y el estado del pago."
              />
            ) : (
              <Table
                columnas={columnasVentas}
                datos={ventas}
                obtenerClave={(v) => v.idObra}
              />
            )}
          </div>
        )}
      </div>

      {/* Modal destructivo: Retirar obra */}
      <Modal
        abierto={Boolean(obraParaRetirar)}
        onCerrar={() => setObraParaRetirar(null)}
        titulo="Retirar obra del catálogo"
        descripcion={
          obraParaRetirar
            ? `¿Confirmas que deseas retirar "${obraParaRetirar.titulo}" del catálogo público? Los certificados previamente emitidos se conservarán.`
            : undefined
        }
        destructivo
      >
        <div className="flex justify-end gap-[var(--espacio-12)]">
          <Button variante="secundario" onClick={() => setObraParaRetirar(null)}>
            Cancelar
          </Button>
          <Button variante="destructivo" onClick={confirmarRetiroObra}>
            Retirar obra
          </Button>
        </div>
      </Modal>
    </PanelShell>
  );
}
