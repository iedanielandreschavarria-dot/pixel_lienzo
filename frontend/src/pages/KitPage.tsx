import { useState } from "react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Textarea } from "../components/ui/Textarea";
import { FileUpload } from "../components/ui/FileUpload";
import { FormErrorSummary } from "../components/ui/FormErrorSummary";
import { BadgeEstado, type EstadoGuia } from "../components/ui/Badge";
import { ObraCard } from "../components/ObraCard";
import { ArtistaCard } from "../components/ui/ArtistaCard";
import { CompraCard } from "../components/ui/CompraCard";
import { SelloCertificado } from "../components/ui/SelloCertificado";
import { MetricaCard } from "../components/ui/MetricaCard";
import { Modal } from "../components/ui/Modal";
import { Banner, OfflineBanner } from "../components/ui/Banner";
import { EmptyState } from "../components/ui/EmptyState";
import { SectionError } from "../components/ui/SectionError";
import { Skeleton, SkeletonCardGrid } from "../components/ui/Skeleton";
import { Table, type ColumnaTabla } from "../components/ui/Table";
import { Tabs } from "../components/ui/Tabs";
import { Pagination } from "../components/ui/Pagination";
import { Breadcrumbs } from "../components/ui/Breadcrumbs";
import { LogoMarca } from "../components/ui/LogoMarca";
import { CATALOGO_LOGOS } from "../assets/logos";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { Ambiente, type NivelIntensidad } from "../components/escena/Ambiente";
import { Arco } from "../components/escena/Arco";
import { Columna } from "../components/escena/Columna";
import { Disco } from "../components/escena/Disco";
import { useToast } from "../context/ToastContext";
import { formatearFechaTabla, formatearMoneda } from "../lib/formato";
import type { Obra } from "../types";

const ESTADOS_TABLA_4_7: EstadoGuia[] = [
  "Borrador",
  "En revisión",
  "Requiere cambios",
  "Publicada",
  "Vendida",
  "Retirada",
  "Pago pendiente",
  "Pago aprobado",
  "Pago rechazado",
  "Reembolsado",
];

const OBRA_DEMO: Obra = {
  id_obra: 1,
  uid: "PYL-2026-001",
  titulo: "Umbral en penumbra N.º 12",
  tecnica: "Óleo sobre lienzo",
  dimensiones: "120 x 90 cm",
  peso: "4.5",
  anio_creacion: 2026,
  precio_venta: "1250000",
  fotografia_hd_url: "",
  codigo_qr_obra: null,
  estado_obra: "Publicado",
  es_patrimonio_historico: false,
  id_artista: 1,
  id_categoria: 1,
};

interface FilaDemo {
  id: number;
  titulo: string;
  estado: EstadoGuia;
  precio: number;
  fecha: string;
}

const FILAS_DEMO: FilaDemo[] = [
  { id: 1, titulo: "Umbral en penumbra", estado: "Publicada", precio: 1250000, fecha: "2026-11-11T14:30:00Z" },
  { id: 2, titulo: "Estudio de luz roja", estado: "En revisión", precio: 2400000, fecha: "2026-11-09T10:15:00Z" },
  { id: 3, titulo: "Memoria del vacío", estado: "Vendida", precio: 3800000, fecha: "2026-11-02T18:00:00Z" },
];

/**
 * Ruta solo de desarrollo (/kit) para inspeccionar visualmente todos los componentes
 * de la sección 4 con sus variantes y estados.
 */
export function KitPage() {
  const { notificar } = useToast();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalDestructivo, setModalDestructivo] = useState(false);
  const [pestana, setPestana] = useState<"obras" | "acerca" | "ventas">("obras");
  const [pagina, setPagina] = useState(1);
  const [nivelEscena, setNivelEscena] = useState<NivelIntensidad>(3);
  const [textoDemo, setTextoDemo] = useState("Obra de gran formato trabajada por veladuras.");

  const columnasDemo: ColumnaTabla<FilaDemo>[] = [
    {
      id: "titulo",
      encabezado: "Obra",
      ordenable: true,
      valorOrden: (f) => f.titulo,
      render: (f) => f.titulo,
    },
    {
      id: "estado",
      encabezado: "Estado",
      render: (f) => <BadgeEstado estado={f.estado} />,
    },
    {
      id: "fecha",
      encabezado: "Fecha",
      ordenable: true,
      valorOrden: (f) => f.fecha,
      render: (f) => formatearFechaTabla(f.fecha),
    },
    {
      id: "precio",
      encabezado: "Precio",
      alineacion: "derecha",
      ordenable: true,
      valorOrden: (f) => f.precio,
      render: (f) => formatearMoneda(f.precio),
    },
  ];

  return (
    <div className="contenedor-pyl flex flex-col gap-[var(--espacio-64)] py-[var(--espacio-48)]">
      <header className="flex flex-col gap-[var(--espacio-12)] border-b border-[color:var(--divisor)] pb-[var(--espacio-24)]">
        <Breadcrumbs items={[{ etiqueta: "Inicio", to: "/" }, { etiqueta: "Kit de componentes" }]} />
        <h1 className="voz-h1">Kit de componentes · Sección 4</h1>
        <p className="voz-cursiva text-[color:var(--tinta-suave)]">
          Vista de verificación de desarrollo para todos los componentes base y sus estados.
        </p>
      </header>

      {/* Isotipo y Marca Oficial (8 variantes cromáticas de la paleta) */}
      <section className="flex flex-col gap-[var(--espacio-24)]">
        <h2 className="voz-h2">Isotipo y Marca Oficial (8 variantes cromáticas)</h2>
        <div className="grid grid-cols-2 gap-[var(--espacio-16)] min-[600px]:grid-cols-4">
          {CATALOGO_LOGOS.map((item) => {
            const bgClase =
              item.fondoRecomendado === "claro"
                ? "bg-[color:var(--tinta)] text-[color:var(--vacio)]"
                : item.fondoRecomendado === "carmesi"
                  ? "bg-[color:var(--carmesi)] text-[color:var(--tinta)]"
                  : "bg-[color:var(--vacio)] text-[color:var(--tinta)]";

            return (
              <div
                key={item.variante}
                className="flex flex-col border border-[color:var(--borde-reposo)] bg-[color:var(--fondo)]"
              >
                <div className={`flex h-[128px] items-center justify-center p-[var(--espacio-24)] ${bgClase}`}>
                  <LogoMarca variante={item.variante} tamano="xl" conTexto={false} />
                </div>
                <div className="flex flex-col gap-[var(--espacio-4)] border-t border-[color:var(--divisor)] p-[var(--espacio-12)]">
                  <span className="voz-etiqueta text-[color:var(--riel)]">{item.nombre}</span>
                  <span className="voz-cuerpo-pequeno text-[color:var(--tinta)]">{item.token}</span>
                  <span className="precio-obra text-[length:var(--text-minimo)] text-[color:var(--tinta-suave)]">
                    {item.hex}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4.3 Botones */}
      <section className="flex flex-col gap-[var(--espacio-24)]">
        <h2 className="voz-h2">4.3 Botones</h2>
        <div className="flex flex-wrap items-center gap-[var(--espacio-16)]">
          <Button variante="primario">Comprar obra</Button>
          <Button variante="secundario">Ver obras</Button>
          <Button variante="terciario">Ver certificado</Button>
          <Button variante="destructivo">Retirar obra</Button>
        </div>
        <div className="flex flex-wrap items-center gap-[var(--espacio-16)]">
          <Button variante="primario" cargando>
            Comprar obra
          </Button>
          <Button variante="primario" disabled>
            Obra adquirida
          </Button>
          <Button variante="secundario" tamano="compacto">
            Compacto 40 px
          </Button>
        </div>
      </section>

      {/* 4.4 Campos de formulario */}
      <section className="flex flex-col gap-[var(--espacio-24)]">
        <h2 className="voz-h2">4.4 Campos de formulario</h2>
        <div className="grid grid-cols-1 gap-[var(--espacio-32)] min-[1024px]:grid-cols-2">
          <div className="flex flex-col gap-[var(--espacio-16)] border border-[color:var(--borde-reposo)] p-[var(--espacio-24)]">
            <h3 className="voz-h3">Variante Caja (Nivel 1)</h3>
            <Input id="kit-correo" label="Correo" placeholder="nombre@dominio.com" ayuda="Te enviaremos el comprobante a esta dirección." />
            <Input id="kit-clave" label="Contraseña" type="password" defaultValue="secreto123" ayuda="Usa al menos 8 caracteres." />
            <Input
              id="kit-error"
              label="Código de certificado"
              defaultValue="123"
              error="No encontramos un certificado con ese código. Revisa que esté completo e inténtalo de nuevo."
            />
            <Select label="Técnica" opcional defaultValue="oleo">
              <option value="oleo">Óleo sobre lienzo</option>
              <option value="acrilico">Acrílico</option>
              <option value="grabado">Grabado</option>
            </Select>
            <Textarea
              label="Descripción"
              contadorMaximo={1000}
              value={textoDemo}
              onChange={(e) => setTextoDemo(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-[var(--espacio-16)] border border-[color:var(--borde-reposo)] bg-[color:var(--vacio)] p-[var(--espacio-24)]">
            <h3 className="voz-h3">Variante Subrayado (Nivel 3) y Carga</h3>
            <Input variante="subrayado" label="Correo" defaultValue="coleccionista@dominio.com" />
            <Input variante="subrayado" label="Contraseña" type="password" defaultValue="12345678" />
            <Input
              variante="subrayado"
              label="Confirmar contraseña"
              type="password"
              error="Las contraseñas no coinciden."
            />
            <FileUpload
              label="Fotografía de la obra"
              ayuda="JPG, PNG o WebP, máximo 20 MB."
              progreso={65}
              archivoActual={{ nombre: "umbral-12.webp", tamanoBytes: 4_200_000 }}
            />
            <FormErrorSummary
              errores={[
                { idCampo: "kit-error", etiqueta: "Código de certificado", mensaje: "Revisa que esté completo." },
              ]}
            />
          </div>
        </div>
      </section>

      {/* 4.5 Tarjetas */}
      <section className="flex flex-col gap-[var(--espacio-24)]">
        <h2 className="voz-h2">4.5 Tarjetas</h2>
        <div className="rejilla-obras">
          <ObraCard obra={OBRA_DEMO} nombreArtista="Camila R." />
          <ObraCard obra={{ ...OBRA_DEMO, id_obra: 2, estado_obra: "Vendido" }} nombreArtista="Camila R." />
          <ArtistaCard
            idArtista={1}
            nombre="Camila Restrepo"
            disciplina="Pintura y grabado"
            obrasPublicadas={12}
          />
          <div className="flex flex-col justify-between gap-[var(--espacio-16)]">
            <MetricaCard
              etiqueta="Obras publicadas"
              cifra={12}
              variacion={{ texto: "+2 este mes", tipo: "exito" }}
            />
            <SelloCertificado etiqueta="CERTIFICADO" codigo="9F86D081884C7D659A2FEAA0C55AD015" />
          </div>
        </div>

        <CompraCard
          idTransaccion={101}
          idObra={1}
          titulo="Umbral en penumbra N.º 12"
          artista="Camila R."
          fechaIso="2026-11-11T14:30:00Z"
          precio={1250000}
          estado="Pago aprobado"
          selloVerificacion="9F86D081884C7D659A2FEAA0C55AD015"
        />
      </section>

      {/* 4.6 Tablas, Pestañas y Paginación */}
      <section className="flex flex-col gap-[var(--espacio-24)]">
        <h2 className="voz-h2">4.6 Tablas, pestañas y paginación</h2>
        <Tabs
          activa={pestana}
          onChange={setPestana}
          items={[
            { id: "obras", etiqueta: "Obras", conteo: 3 },
            { id: "acerca", etiqueta: "Acerca de" },
            { id: "ventas", etiqueta: "Ventas", conteo: 1 },
          ]}
        />
        <Table
          columnas={columnasDemo}
          datos={FILAS_DEMO}
          obtenerClave={(f) => f.id}
          acciones={() => [
            { etiqueta: "Editar", onClick: () => notificar("Cambios guardados") },
            { etiqueta: "Ver obra", onClick: () => notificar("Abriendo detalle") },
            { etiqueta: "Retirar obra", onClick: () => setModalDestructivo(true) },
          ]}
        />
        <Pagination paginaActual={pagina} totalPaginas={4} onChange={setPagina} />
      </section>

      {/* 4.7 Estados (etiquetas) */}
      <section className="flex flex-col gap-[var(--espacio-24)]">
        <h2 className="voz-h2">4.7 Estados (etiquetas)</h2>
        <div className="flex flex-wrap gap-[var(--espacio-12)]">
          {ESTADOS_TABLA_4_7.map((estado) => (
            <BadgeEstado key={estado} estado={estado} />
          ))}
        </div>
      </section>

      {/* 4.8 Modales, Toasts y Banners */}
      <section className="flex flex-col gap-[var(--espacio-24)]">
        <h2 className="voz-h2">4.8 Modales, avisos y mensajes</h2>
        <div className="flex flex-wrap gap-[var(--espacio-16)]">
          <Button variante="secundario" onClick={() => setModalAbierto(true)}>
            Abrir modal
          </Button>
          <Button variante="destructivo" onClick={() => setModalDestructivo(true)}>
            Retirar obra
          </Button>
          <Button
            variante="primario"
            onClick={() =>
              notificar("Cambios guardados", "exito", {
                accion: { etiqueta: "Deshacer", onClick: () => {} },
              })
            }
          >
            Mostrar toast éxito
          </Button>
          <Button
            variante="secundario"
            onClick={() =>
              notificar("No pudimos procesar el pago. Revisa los datos e inténtalo de nuevo.", "error")
            }
          >
            Mostrar toast error
          </Button>
        </div>

        <Banner variante="exito">Certificado válido</Banner>
        <Banner
          variante="aviso"
          accion={
            <Button variante="secundario" tamano="compacto">
              Corregir y reenviar
            </Button>
          }
        >
          No pudimos procesar el pago. Revisa los datos e inténtalo de nuevo.
        </Banner>
        <Banner variante="informativo">Tienes 10:00 minutos para completar el pago.</Banner>
        <OfflineBanner forzarVisible />

        <Modal
          abierto={modalAbierto}
          onCerrar={() => setModalAbierto(false)}
          titulo="Detalles de revisión"
          descripcion="El foco queda atrapado dentro del modal y regresa al botón al cerrarse con Esc, X o clic fuera."
        >
          <div className="flex justify-end gap-[var(--espacio-12)]">
            <Button variante="secundario" onClick={() => setModalAbierto(false)}>
              Cerrar
            </Button>
            <Button variante="primario" onClick={() => setModalAbierto(false)}>
              Aceptar
            </Button>
          </div>
        </Modal>

        <Modal
          abierto={modalDestructivo}
          onCerrar={() => setModalDestructivo(false)}
          titulo="Retirar obra"
          descripcion="La obra dejará de mostrarse en el catálogo público. Esta confirmación destructiva solo se cierra con sus botones."
          destructivo
        >
          <div className="flex justify-end gap-[var(--espacio-12)]">
            <Button variante="secundario" onClick={() => setModalDestructivo(false)}>
              Cancelar
            </Button>
            <Button variante="destructivo" onClick={() => setModalDestructivo(false)}>
              Retirar obra
            </Button>
          </div>
        </Modal>
      </section>

      {/* 4.9 Vacíos, cargas y errores */}
      <section className="flex flex-col gap-[var(--espacio-24)]">
        <h2 className="voz-h2">4.9 Vacíos, cargas y errores</h2>
        <div className="grid grid-cols-1 gap-[var(--espacio-24)] min-[1024px]:grid-cols-2">
          <div className="border border-[color:var(--borde-reposo)] p-[var(--espacio-24)]">
            <EmptyState
              titulo="Aún no tienes compras."
              descripcion="Cuando adquieras una obra, tu certificado aparecerá aquí."
              accion={<Button variante="primario">Explorar obras</Button>}
            />
          </div>
          <div className="border border-[color:var(--borde-reposo)] p-[var(--espacio-24)]">
            <SectionError recurso="las obras" onReintentar={() => notificar("Reintentando…")} />
          </div>
        </div>
        <div className="flex flex-col gap-[var(--espacio-12)]">
          <Skeleton className="h-[var(--espacio-24)] w-1/4" />
          <SkeletonCardGrid cantidad={4} />
        </div>
      </section>

      {/* 4.1 y 4.2 Variantes de Cabecera y Pie */}
      <section className="flex flex-col gap-[var(--espacio-24)]">
        <h2 className="voz-h2">4.1 y 4.2 Variantes de Cabecera y Pie</h2>
        <div className="flex flex-col gap-[var(--espacio-16)] border border-[color:var(--borde-reposo)] p-[var(--espacio-16)]">
          <p className="voz-etiqueta text-[color:var(--tinta-suave)]">Cabecera de Checkout</p>
          <Header variante="checkout" hrefVolverObra="/obras/1" className="!static" />
        </div>
        <div className="border border-[color:var(--borde-reposo)]">
          <Footer />
        </div>
      </section>

      {/* Fase 3 — Escena (Ambiente, Arco, Disco, Columna) */}
      <section className="flex flex-col gap-[var(--espacio-24)]">
        <div className="flex flex-wrap items-center justify-between gap-[var(--espacio-16)]">
          <h2 className="voz-h2">Fase 3 · Escena (Nivel {nivelEscena})</h2>
          <div className="flex items-center gap-[var(--espacio-8)]">
            {([1, 2, 3] as NivelIntensidad[]).map((n) => (
              <Button
                key={n}
                variante={nivelEscena === n ? "primario" : "secundario"}
                tamano="compacto"
                onClick={() => setNivelEscena(n)}
              >
                Nivel {n}
              </Button>
            ))}
          </div>
        </div>

        <div className="relative h-[540px] w-full overflow-hidden border border-[color:var(--borde-reposo)] bg-[color:var(--fondo)]">
          <Ambiente nivel={nivelEscena} fijo={false} />
          <Arco nivel={nivelEscena} className="!top-[24px]" />
          <div className="relative z-10 flex h-full items-center justify-center">
            <Disco
              nivel={nivelEscena}
              variante="error"
              titulo="Pixel & Lienzo"
              subtitulo="Arte con certificado verificable"
            />
          </div>
        </div>

        <div className="relative h-[480px] w-full overflow-hidden border border-[color:var(--borde-reposo)] bg-[color:var(--fondo)]">
          <Ambiente nivel={3} fijo={false} />
          <Columna nivel={3}>
            <div className="mx-auto flex max-w-[400px] flex-col gap-[var(--espacio-16)] pt-[var(--espacio-16)] text-center">
              <h3 className="voz-h2">Entrar</h3>
              <p className="voz-cursiva text-[color:var(--tinta-suave)]">Cápsula negra dentro de la columna roja</p>
            </div>
          </Columna>
        </div>
      </section>
    </div>
  );
}

