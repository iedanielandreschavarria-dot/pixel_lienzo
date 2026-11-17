import { useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listarCatalogo } from "../../api/obras";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { PanelShell } from "../../components/layout/PanelShell";
import { BadgeEstadoObra, BadgeEstadoValidacion } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { Input } from "../../components/ui/Input";
import { MetricaCard } from "../../components/ui/MetricaCard";
import { Modal } from "../../components/ui/Modal";
import { SectionError } from "../../components/ui/SectionError";
import { Select } from "../../components/ui/Select";
import { Skeleton } from "../../components/ui/Skeleton";
import { Table, type ColumnaTabla } from "../../components/ui/Table";
import { Tabs, type ItemPestana } from "../../components/ui/Tabs";
import { Textarea } from "../../components/ui/Textarea";
import { formatearFechaTabla, formatearMoneda } from "../../lib/formato";
import { ForbiddenPage } from "../NotFoundPage";

type SeccionInstitucional =
  | "resumen"
  | "colecciones"
  | "artistas"
  | "reportes"
  | "perfil"
  | "equipo";

type RolEquipo = "Lectura" | "Edición";

interface ColeccionInstitucional {
  id: string;
  titulo: string;
  curaduria: string;
  obrasConteo: number;
  fechaCreacion: string;
  descripcion: string;
}

interface MiembroEquipo {
  id: string;
  correo: string;
  rol: RolEquipo;
  fechaIngreso: string;
}

interface FilaReporte {
  id: number;
  fecha: string;
  tituloObra: string;
  artista: string;
  tecnica: string;
  valorAvaluo: string;
  estado: "Publicada" | "Vendida" | "En revisión";
}

interface PerfilInstitucionDatos {
  nombre: string;
  tipoEntidad: string;
  nit: string;
  ciudad: string;
  sitioWeb: string;
  descripcion: string;
}

const EQUIPO_INICIAL: MiembroEquipo[] = [
  {
    id: "eq-1",
    correo: "direccion.curatorial@institucion.org",
    rol: "Edición",
    fechaIngreso: "2026-02-14",
  },
  {
    id: "eq-2",
    correo: "archivo.coleccion@institucion.org",
    rol: "Lectura",
    fechaIngreso: "2026-06-20",
  },
];

const PERFIL_INSTITUCION_INICIAL: PerfilInstitucionDatos = {
  nombre: "Fundación Archivo Contemporáneo",
  tipoEntidad: "Museo",
  nit: "900.412.890-1",
  ciudad: "Bogotá, Colombia",
  sitioWeb: "https://archivo-contemporaneo.org",
  descripcion:
    "Espacio dedicado a la preservación, catalogación y exhibición de arte gráfico, pintura y medios digitales con trazabilidad criptográfica.",
};

/**
 * 6.15 Panel institucional (Nivel 1 — Funcional):
 * Estructura de la sección 6.12 (<PanelShell />).
 * Secciones oficiales (únicamente estas 6):
 * 1. Resumen (4 tarjetas métricas: Colecciones activas, Obras en sala, Artistas asociados, Certificados emitidos)
 * 2. Colecciones (estado vacío "Aún no hay colecciones." con botón "Crear colección")
 * 3. Artistas asociados
 * 4. Reportes (tablas con filtro de fechas y botón secundario "Exportar CSV" con la fecha en el nombre)
 * 5. Perfil de la institución
 * 6. Equipo (invitar por correo con rol de Lectura o Edición y revocar con modal destructivo)
 */
export function PanelInstitucionalPage() {
  const { user, cargando } = useAuth();
  const { notificar } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const seccionParam = searchParams.get("seccion");
  const seccionActiva: SeccionInstitucional =
    seccionParam === "colecciones" ||
    seccionParam === "artistas" ||
    seccionParam === "reportes" ||
    seccionParam === "perfil" ||
    seccionParam === "equipo"
      ? seccionParam
      : "resumen";

  // Estado: Colecciones (inicia vacío para contemplar el estado 6.15 "Aún no hay colecciones.")
  const [colecciones, setColecciones] = useState<ColeccionInstitucional[]>([]);
  const [modalCrearColeccion, setModalCrearColeccion] = useState(false);
  const [tituloColeccion, setTituloColeccion] = useState("");
  const [curaduriaColeccion, setCuraduriaColeccion] = useState("");
  const [descripcionColeccion, setDescripcionColeccion] = useState("");
  const [errorColeccion, setErrorColeccion] = useState<string>();

  // Estado: Reportes
  const [fechaDesde, setFechaDesde] = useState("2026-01-01");
  const [fechaHasta, setFechaHasta] = useState("2026-12-31");

  // Estado: Perfil de la institución
  const [perfilBase, setPerfilBase] = useState<PerfilInstitucionDatos>(
    PERFIL_INSTITUCION_INICIAL
  );
  const [perfilForm, setPerfilForm] = useState<PerfilInstitucionDatos>(
    PERFIL_INSTITUCION_INICIAL
  );

  // Estado: Equipo
  const [equipo, setEquipo] = useState<MiembroEquipo[]>(EQUIPO_INICIAL);
  const [correoInvitado, setCorreoInvitado] = useState("");
  const [rolInvitado, setRolInvitado] = useState<RolEquipo>("Lectura");
  const [errorInvitado, setErrorInvitado] = useState<string>();
  const [miembroParaRevocar, setMiembroParaRevocar] = useState<MiembroEquipo | null>(null);

  const {
    data: obrasCatalogo,
    isLoading: cargandoCatalogo,
    isError: errorCatalogo,
    refetch: refetchCatalogo,
  } = useQuery({
    queryKey: ["catalogo", "institucional"],
    queryFn: () => listarCatalogo(),
  });

  const obras = useMemo(() => obrasCatalogo ?? [], [obrasCatalogo]);

  const artistasAsociados = useMemo(() => {
    const mapa = new Map<
      number,
      { idArtista: number; nombre: string; obrasEnSala: number; tecnicaPrincipal: string }
    >();
    for (const obra of obras) {
      const actual = mapa.get(obra.id_artista);
      if (actual) {
        actual.obrasEnSala += 1;
      } else {
        mapa.set(obra.id_artista, {
          idArtista: obra.id_artista,
          nombre: `Artista N.º ${obra.id_artista}`,
          obrasEnSala: 1,
          tecnicaPrincipal: obra.tecnica,
        });
      }
    }
    return Array.from(mapa.values()).sort((a, b) => a.idArtista - b.idArtista);
  }, [obras]);

  const certificadosEmitidos = useMemo(
    () => obras.filter((o) => Boolean(o.codigo_qr_obra) || o.estado_obra === "Publicado").length,
    [obras]
  );

  const filasReporte = useMemo<FilaReporte[]>(() => {
    return obras.map((o, idx) => {
      const mes = String((idx % 11) + 1).padStart(2, "0");
      const dia = String(((idx * 3) % 27) + 1).padStart(2, "0");
      const fecha = `2026-${mes}-${dia}`;
      return {
        id: o.id_obra,
        fecha,
        tituloObra: o.titulo,
        artista: `Artista N.º ${o.id_artista}`,
        tecnica: o.tecnica,
        valorAvaluo: o.precio_venta,
        estado:
          o.estado_obra === "Vendido"
            ? "Vendida"
            : o.estado_obra === "Publicado"
              ? "Publicada"
              : "En revisión",
      };
    });
  }, [obras]);

  const filasReporteFiltradas = useMemo(() => {
    return filasReporte.filter((f) => {
      if (fechaDesde && f.fecha < fechaDesde) return false;
      if (fechaHasta && f.fecha > fechaHasta) return false;
      return true;
    });
  }, [filasReporte, fechaDesde, fechaHasta]);

  if (!cargando && (!user || user.rol !== "Administrador")) {
    return <ForbiddenPage />;
  }

  const cambiarSeccion = (nueva: SeccionInstitucional) => {
    if (nueva === "resumen") {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ seccion: nueva }, { replace: true });
    }
  };

  const pestanasItems: ItemPestana<SeccionInstitucional>[] = [
    { id: "resumen", etiqueta: "Resumen" },
    { id: "colecciones", etiqueta: "Colecciones", conteo: colecciones.length },
    { id: "artistas", etiqueta: "Artistas asociados", conteo: artistasAsociados.length },
    { id: "reportes", etiqueta: "Reportes", conteo: filasReporteFiltradas.length },
    { id: "perfil", etiqueta: "Perfil de la institución" },
    { id: "equipo", etiqueta: "Equipo", conteo: equipo.length },
  ];

  const crearNuevaColeccion = (e: FormEvent) => {
    e.preventDefault();
    if (!tituloColeccion.trim()) {
      setErrorColeccion("Ingresa el título de la colección.");
      return;
    }
    const hoy = new Date().toISOString().slice(0, 10);
    setColecciones((prev) => [
      {
        id: `col-${Date.now()}`,
        titulo: tituloColeccion.trim(),
        curaduria: curaduriaColeccion.trim() || "Curaduría institucional",
        obrasConteo: obras.length,
        fechaCreacion: hoy,
        descripcion: descripcionColeccion.trim(),
      },
      ...prev,
    ]);
    setTituloColeccion("");
    setCuraduriaColeccion("");
    setDescripcionColeccion("");
    setErrorColeccion(undefined);
    setModalCrearColeccion(false);
    notificar("Cambios guardados", "exito");
  };

  // 6.15 Reportes: botón secundario "Exportar CSV". El archivo lleva la fecha en el nombre.
  const exportarCsv = () => {
    const fechaArchivo = new Date().toISOString().slice(0, 10);
    const encabezados = ["ID", "Fecha", "Obra", "Artista", "Tecnica", "Valor_COP", "Estado"];
    const lineas = filasReporteFiltradas.map((f) =>
      [
        f.id,
        f.fecha,
        `"${f.tituloObra.replace(/"/g, '""')}"`,
        `"${f.artista}"`,
        `"${f.tecnica.replace(/"/g, '""')}"`,
        f.valorAvaluo,
        f.estado,
      ].join(",")
    );
    const contenidoCsv = "\uFEFF" + [encabezados.join(","), ...lineas].join("\n");
    const blob = new Blob([contenidoCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-institucional-${fechaArchivo}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notificar(`Archivo reporte-institucional-${fechaArchivo}.csv exportado.`, "exito");
  };

  const hayCambiosPerfil =
    perfilForm.nombre.trim() !== perfilBase.nombre.trim() ||
    perfilForm.tipoEntidad !== perfilBase.tipoEntidad ||
    perfilForm.nit.trim() !== perfilBase.nit.trim() ||
    perfilForm.ciudad.trim() !== perfilBase.ciudad.trim() ||
    perfilForm.sitioWeb.trim() !== perfilBase.sitioWeb.trim() ||
    perfilForm.descripcion.trim() !== perfilBase.descripcion.trim();

  const guardarPerfilInstitucion = (e: FormEvent) => {
    e.preventDefault();
    if (!hayCambiosPerfil) return;
    setPerfilBase(perfilForm);
    notificar("Cambios guardados", "exito");
  };

  const invitarMiembro = (e: FormEvent) => {
    e.preventDefault();
    const correoLimpio = correoInvitado.trim().toLowerCase();
    if (!correoLimpio || !correoLimpio.includes("@")) {
      setErrorInvitado("Ingresa un correo electrónico válido.");
      return;
    }
    if (equipo.some((m) => m.correo.toLowerCase() === correoLimpio)) {
      setErrorInvitado("Este correo ya forma parte del equipo.");
      return;
    }
    const hoy = new Date().toISOString().slice(0, 10);
    setEquipo((prev) => [
      ...prev,
      {
        id: `eq-${Date.now()}`,
        correo: correoLimpio,
        rol: rolInvitado,
        fechaIngreso: hoy,
      },
    ]);
    setCorreoInvitado("");
    setErrorInvitado(undefined);
    notificar("Cambios guardados", "exito");
  };

  const confirmarRevocarMiembro = () => {
    if (!miembroParaRevocar) return;
    setEquipo((prev) => prev.filter((m) => m.id !== miembroParaRevocar.id));
    setMiembroParaRevocar(null);
    notificar("Cambios guardados", "exito");
  };

  const columnasColecciones: ColumnaTabla<ColeccionInstitucional>[] = [
    {
      id: "titulo",
      encabezado: "Colección",
      ordenable: true,
      valorOrden: (c) => c.titulo.toLowerCase(),
      render: (c) => (
        <div className="flex flex-col gap-[var(--espacio-4)]">
          <span className="font-[var(--fuente-texto)] font-semibold text-[color:var(--tinta)]">
            {c.titulo}
          </span>
          {c.descripcion && (
            <span className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">
              {c.descripcion}
            </span>
          )}
        </div>
      ),
    },
    {
      id: "curaduria",
      encabezado: "Curaduría",
      render: (c) => c.curaduria,
    },
    {
      id: "obras",
      encabezado: "Obras",
      alineacion: "derecha",
      ordenable: true,
      valorOrden: (c) => c.obrasConteo,
      render: (c) => c.obrasConteo,
    },
    {
      id: "fecha",
      encabezado: "Fecha",
      ordenable: true,
      valorOrden: (c) => c.fechaCreacion,
      render: (c) => formatearFechaTabla(c.fechaCreacion),
    },
  ];

  const columnasArtistas: ColumnaTabla<{
    idArtista: number;
    nombre: string;
    obrasEnSala: number;
    tecnicaPrincipal: string;
  }>[] = [
    {
      id: "nombre",
      encabezado: "Artista",
      ordenable: true,
      valorOrden: (a) => a.idArtista,
      render: (a) => (
        <span className="font-[var(--fuente-texto)] font-semibold text-[color:var(--tinta)]">
          {a.nombre}
        </span>
      ),
    },
    {
      id: "tecnica",
      encabezado: "Disciplina predominante",
      render: (a) => a.tecnicaPrincipal,
    },
    {
      id: "obras",
      encabezado: "Obras en sala",
      alineacion: "derecha",
      ordenable: true,
      valorOrden: (a) => a.obrasEnSala,
      render: (a) => a.obrasEnSala,
    },
    {
      id: "estado",
      encabezado: "Estado",
      render: () => <BadgeEstadoValidacion estado="Verificado" />,
    },
  ];

  const columnasReportes: ColumnaTabla<FilaReporte>[] = [
    {
      id: "fecha",
      encabezado: "Fecha",
      ordenable: true,
      valorOrden: (r) => r.fecha,
      render: (r) => formatearFechaTabla(r.fecha),
    },
    {
      id: "obra",
      encabezado: "Obra",
      ordenable: true,
      valorOrden: (r) => r.tituloObra.toLowerCase(),
      render: (r) => (
        <span className="font-[var(--fuente-texto)] font-semibold text-[color:var(--tinta)]">
          {r.tituloObra}
        </span>
      ),
    },
    {
      id: "artista",
      encabezado: "Artista",
      render: (r) => r.artista,
    },
    {
      id: "tecnica",
      encabezado: "Técnica",
      render: (r) => r.tecnica,
    },
    {
      id: "valor",
      encabezado: "Avalúo / Precio",
      alineacion: "derecha",
      ordenable: true,
      valorOrden: (r) => Number(r.valorAvaluo) || 0,
      render: (r) => formatearMoneda(r.valorAvaluo),
    },
    {
      id: "estado",
      encabezado: "Estado",
      render: (r) => <BadgeEstadoObra estado={r.estado} />,
    },
  ];

  const columnasEquipo: ColumnaTabla<MiembroEquipo>[] = [
    {
      id: "correo",
      encabezado: "Correo electrónico",
      ordenable: true,
      valorOrden: (m) => m.correo,
      render: (m) => (
        <span className="font-[var(--fuente-texto)] font-semibold text-[color:var(--tinta)]">
          {m.correo}
        </span>
      ),
    },
    {
      id: "rol",
      encabezado: "Rol de acceso",
      render: (m) => (
        <span className="inline-flex h-[var(--alto-estado)] items-center rounded-[var(--radio-recto)] border border-[color:var(--riel)] px-[var(--espacio-8)] font-[var(--fuente-poster)] text-[length:var(--text-etiqueta)] uppercase tracking-[0.12em] text-[color:var(--tinta)]">
          {m.rol}
        </span>
      ),
    },
    {
      id: "fecha",
      encabezado: "Vinculación",
      ordenable: true,
      valorOrden: (m) => m.fechaIngreso,
      render: (m) => formatearFechaTabla(m.fechaIngreso),
    },
  ];

  return (
    <PanelShell
      migas={[{ etiqueta: "Panel institucional" }]}
      titulo="Panel institucional"
      descripcion="Gestiona las colecciones de tu institución, los artistas asociados, los reportes de inventario y los permisos de tu equipo."
      acciones={
        <Button variante="primario" onClick={() => setModalCrearColeccion(true)}>
          Crear colección
        </Button>
      }
    >
      <div className="flex flex-col gap-[var(--espacio-32)]">
        {/* Pestañas de las 6 secciones oficiales (6.15) */}
        <Tabs
          items={pestanasItems}
          activa={seccionActiva}
          onChange={cambiarSeccion}
          ariaLabel="Secciones del panel institucional"
        />

        {cargandoCatalogo && (
          <div className="grid grid-cols-1 gap-[var(--espacio-16)] sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-32 w-full" />
            ))}
          </div>
        )}

        {errorCatalogo && !cargandoCatalogo && (
          <SectionError
            recurso="los datos institucionales"
            onReintentar={() => {
              void refetchCatalogo();
            }}
          />
        )}

        {/* 1. RESUMEN */}
        {!cargandoCatalogo && !errorCatalogo && seccionActiva === "resumen" && (
          <div className="flex flex-col gap-[var(--espacio-48)]">
            <dl className="grid grid-cols-1 gap-[var(--espacio-16)] sm:grid-cols-2 lg:grid-cols-4">
              <MetricaCard etiqueta="Colecciones activas" cifra={colecciones.length} />
              <MetricaCard etiqueta="Obras en sala" cifra={obras.length} />
              <MetricaCard etiqueta="Artistas asociados" cifra={artistasAsociados.length} />
              <MetricaCard etiqueta="Certificados emitidos" cifra={certificadosEmitidos} />
            </dl>

            <section className="flex flex-col gap-[var(--espacio-16)]">
              <div className="flex flex-wrap items-center justify-between gap-[var(--espacio-16)]">
                <h2 className="voz-h3 text-[color:var(--tinta)]">Colecciones de la institución</h2>
                {colecciones.length > 0 && (
                  <Button variante="terciario" onClick={() => cambiarSeccion("colecciones")}>
                    Ver todas las colecciones
                  </Button>
                )}
              </div>

              {colecciones.length === 0 ? (
                <EmptyState
                  titulo="Aún no hay colecciones."
                  descripcion="Agrupa las obras de tu acervo o exposición actual en una colección institucional."
                  accion={
                    <Button variante="primario" onClick={() => setModalCrearColeccion(true)}>
                      Crear colección
                    </Button>
                  }
                />
              ) : (
                <Table
                  columnas={columnasColecciones}
                  datos={colecciones}
                  obtenerClave={(c) => c.id}
                />
              )}
            </section>
          </div>
        )}

        {/* 2. COLECCIONES */}
        {!cargandoCatalogo && !errorCatalogo && seccionActiva === "colecciones" && (
          <div className="flex flex-col gap-[var(--espacio-24)]">
            {colecciones.length === 0 ? (
              <EmptyState
                titulo="Aún no hay colecciones."
                descripcion="Crea la primera colección para organizar las obras en sala y compartir su catálogo curatorial."
                accion={
                  <Button variante="primario" onClick={() => setModalCrearColeccion(true)}>
                    Crear colección
                  </Button>
                }
              />
            ) : (
              <Table
                columnas={columnasColecciones}
                datos={colecciones}
                obtenerClave={(c) => c.id}
              />
            )}
          </div>
        )}

        {/* 3. ARTISTAS ASOCIADOS */}
        {!cargandoCatalogo && !errorCatalogo && seccionActiva === "artistas" && (
          <div className="flex flex-col gap-[var(--espacio-24)]">
            {artistasAsociados.length === 0 ? (
              <EmptyState
                titulo="No hay artistas asociados registrados."
                descripcion="Los artistas con obra activa dentro del acervo institucional aparecerán listados aquí."
              />
            ) : (
              <Table
                columnas={columnasArtistas}
                datos={artistasAsociados}
                obtenerClave={(a) => a.idArtista}
              />
            )}
          </div>
        )}

        {/* 4. REPORTES */}
        {!cargandoCatalogo && !errorCatalogo && seccionActiva === "reportes" && (
          <div className="flex flex-col gap-[var(--espacio-24)]">
            <div className="flex flex-wrap items-end justify-between gap-[var(--espacio-16)] border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)]">
              <div className="grid grid-cols-1 gap-[var(--espacio-16)] sm:grid-cols-2">
                <Input
                  id="reporte-fecha-desde"
                  variante="caja"
                  type="date"
                  label="Desde"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                />
                <Input
                  id="reporte-fecha-hasta"
                  variante="caja"
                  type="date"
                  label="Hasta"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                />
              </div>

              <Button
                variante="secundario"
                onClick={exportarCsv}
                disabled={filasReporteFiltradas.length === 0}
              >
                Exportar CSV
              </Button>
            </div>

            {filasReporteFiltradas.length === 0 ? (
              <EmptyState
                titulo="No hay registros en el rango de fechas seleccionado."
                descripcion="Amplía el rango de fechas para consultar el inventario certificado."
              />
            ) : (
              <Table
                columnas={columnasReportes}
                datos={filasReporteFiltradas}
                obtenerClave={(r) => r.id}
              />
            )}
          </div>
        )}

        {/* 5. PERFIL DE LA INSTITUCIÓN */}
        {seccionActiva === "perfil" && (
          <form
            onSubmit={guardarPerfilInstitucion}
            noValidate
            className="max-w-[var(--contenedor-formulario-amplio)] flex flex-col gap-[var(--espacio-24)] border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)] sm:p-[var(--espacio-32)]"
          >
            <h2 className="voz-h3 text-[color:var(--tinta)]">Perfil de la institución</h2>

            <Input
              id="inst-nombre"
              variante="caja"
              label="Nombre de la institución"
              value={perfilForm.nombre}
              onChange={(e) => setPerfilForm((prev) => ({ ...prev, nombre: e.target.value }))}
            />

            <div className="grid grid-cols-1 gap-[var(--espacio-16)] sm:grid-cols-2">
              <Select
                id="inst-tipo"
                variante="caja"
                label="Tipo de entidad"
                value={perfilForm.tipoEntidad}
                onChange={(e) =>
                  setPerfilForm((prev) => ({ ...prev, tipoEntidad: e.target.value }))
                }
              >
                <option value="Museo">Museo</option>
                <option value="Galería">Galería</option>
                <option value="Universidad">Universidad</option>
                <option value="Fundación o colectivo">Fundación o colectivo</option>
              </Select>

              <Input
                id="inst-nit"
                variante="caja"
                label="NIT o identificación tributaria"
                value={perfilForm.nit}
                onChange={(e) => setPerfilForm((prev) => ({ ...prev, nit: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 gap-[var(--espacio-16)] sm:grid-cols-2">
              <Input
                id="inst-ciudad"
                variante="caja"
                label="Ciudad y país"
                value={perfilForm.ciudad}
                onChange={(e) => setPerfilForm((prev) => ({ ...prev, ciudad: e.target.value }))}
              />

              <Input
                id="inst-web"
                variante="caja"
                type="url"
                label="Sitio web oficial"
                opcional
                value={perfilForm.sitioWeb}
                onChange={(e) => setPerfilForm((prev) => ({ ...prev, sitioWeb: e.target.value }))}
              />
            </div>

            <Textarea
              id="inst-descripcion"
              variante="caja"
              label="Reseña institucional"
              rows={5}
              contadorMaximo={1000}
              value={perfilForm.descripcion}
              onChange={(e) =>
                setPerfilForm((prev) => ({ ...prev, descripcion: e.target.value }))
              }
            />

            <div className="flex justify-end border-t border-[color:var(--divisor)] pt-[var(--espacio-24)]">
              <Button type="submit" variante="primario" disabled={!hayCambiosPerfil}>
                Guardar cambios
              </Button>
            </div>
          </form>
        )}

        {/* 6. EQUIPO */}
        {seccionActiva === "equipo" && (
          <div className="flex flex-col gap-[var(--espacio-32)]">
            <form
              onSubmit={invitarMiembro}
              noValidate
              className="max-w-[var(--contenedor-formulario-amplio)] flex flex-col gap-[var(--espacio-24)] border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)] sm:p-[var(--espacio-32)]"
            >
              <div>
                <h2 className="voz-h3 text-[color:var(--tinta)]">Invitar al equipo</h2>
                <p className="voz-cuerpo-pequeno mt-[var(--espacio-4)] text-[color:var(--tinta-suave)]">
                  Asigna permisos de Lectura (consulta y exportación de reportes) o Edición (gestión de colecciones y perfil).
                </p>
              </div>

              <div className="grid grid-cols-1 gap-[var(--espacio-16)] sm:grid-cols-[1.4fr_0.6fr]">
                <Input
                  id="equipo-correo"
                  variante="caja"
                  type="email"
                  label="Correo electrónico"
                  placeholder="integrante@institucion.org"
                  value={correoInvitado}
                  error={errorInvitado}
                  onChange={(e) => {
                    setCorreoInvitado(e.target.value);
                    if (errorInvitado) setErrorInvitado(undefined);
                  }}
                />

                <Select
                  id="equipo-rol"
                  variante="caja"
                  label="Rol"
                  value={rolInvitado}
                  onChange={(e) => setRolInvitado(e.target.value as RolEquipo)}
                >
                  <option value="Lectura">Lectura</option>
                  <option value="Edición">Edición</option>
                </Select>
              </div>

              <div className="flex justify-end">
                <Button type="submit" variante="primario" disabled={!correoInvitado.trim()}>
                  Enviar invitación
                </Button>
              </div>
            </form>

            <section className="flex flex-col gap-[var(--espacio-16)]">
              <h2 className="voz-h3 text-[color:var(--tinta)]">Miembros con acceso</h2>
              <Table
                columnas={columnasEquipo}
                datos={equipo}
                obtenerClave={(m) => m.id}
                acciones={(miembro) => [
                  {
                    etiqueta:
                      miembro.rol === "Lectura" ? "Cambiar a Edición" : "Cambiar a Lectura",
                    onClick: (m) => {
                      setEquipo((prev) =>
                        prev.map((item) =>
                          item.id === m.id
                            ? {
                                ...item,
                                rol: item.rol === "Lectura" ? "Edición" : "Lectura",
                              }
                            : item
                        )
                      );
                      notificar("Cambios guardados", "exito");
                    },
                  },
                  {
                    etiqueta: "Revocar acceso",
                    onClick: (m) => setMiembroParaRevocar(m),
                  },
                ]}
              />
            </section>
          </div>
        )}
      </div>

      {/* Modal: Crear colección */}
      <Modal
        abierto={modalCrearColeccion}
        onCerrar={() => setModalCrearColeccion(false)}
        titulo="Crear colección"
        descripcion="Define el nombre y la curaduría de la nueva colección institucional."
      >
        <form onSubmit={crearNuevaColeccion} noValidate className="flex flex-col gap-[var(--espacio-20)]">
          <Input
            id="col-titulo"
            variante="caja"
            label="Título de la colección"
            placeholder="Gráfica Latinoamericana del Siglo XXI"
            value={tituloColeccion}
            error={errorColeccion}
            onChange={(e) => {
              setTituloColeccion(e.target.value);
              if (errorColeccion) setErrorColeccion(undefined);
            }}
          />

          <Input
            id="col-curaduria"
            variante="caja"
            label="Curaduría responsable"
            opcional
            placeholder="Departamento de Curaduría"
            value={curaduriaColeccion}
            onChange={(e) => setCuraduriaColeccion(e.target.value)}
          />

          <Textarea
            id="col-descripcion"
            variante="caja"
            label="Descripción curatorial"
            opcional
            rows={4}
            contadorMaximo={500}
            value={descripcionColeccion}
            onChange={(e) => setDescripcionColeccion(e.target.value)}
          />

          <div className="flex justify-end gap-[var(--espacio-12)] pt-[var(--espacio-8)]">
            <Button
              type="button"
              variante="secundario"
              onClick={() => setModalCrearColeccion(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variante="primario">
              Crear colección
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal destructivo: Revocar acceso de miembro */}
      <Modal
        abierto={Boolean(miembroParaRevocar)}
        onCerrar={() => setMiembroParaRevocar(null)}
        titulo="Revocar acceso del equipo"
        descripcion={
          miembroParaRevocar
            ? `¿Confirmas que deseas revocar el acceso de ${miembroParaRevocar.correo} al panel institucional?`
            : undefined
        }
        destructivo
      >
        <div className="flex justify-end gap-[var(--espacio-12)]">
          <Button variante="secundario" onClick={() => setMiembroParaRevocar(null)}>
            Cancelar
          </Button>
          <Button variante="destructivo" onClick={confirmarRevocarMiembro}>
            Revocar acceso
          </Button>
        </div>
      </Modal>
    </PanelShell>
  );
}

