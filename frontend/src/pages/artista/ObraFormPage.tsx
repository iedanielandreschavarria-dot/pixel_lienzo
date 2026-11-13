import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { actualizarObra, crearObra, obtenerObra, urlPreviewObra } from "../../api/obras";
import { subirFotografiaObra } from "../../api/archivos";
import { listarCategorias } from "../../api/categorias";
import { obtenerMensajeError } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { PanelShell } from "../../components/layout/PanelShell";
import { BadgeEstadoObra } from "../../components/ui/Badge";
import { Banner } from "../../components/ui/Banner";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { FileUpload } from "../../components/ui/FileUpload";
import { FormErrorSummary, type ErrorCampoItem } from "../../components/ui/FormErrorSummary";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import { Skeleton } from "../../components/ui/Skeleton";
import { Textarea } from "../../components/ui/Textarea";
import { formatearMoneda } from "../../lib/formato";

interface FormValues {
  titulo: string;
  tecnica: string;
  dimensiones: string;
  peso: string;
  anio_creacion: string;
  precio_venta: string;
  id_categoria: string;
  descripcion: string;
  tipo_obra: "fisica" | "digital";
}

interface ArchivoAdicional {
  id: string;
  nombre: string;
  tamanoBytes: number;
}

/**
 * 6.13 Formulario de obra (Nueva obra y Editar obra, Nivel 1):
 * Una sola columna de 720 px (--contenedor-formulario-amplio) dividida en cuatro secciones con H4:
 * 1. Información básica (Título, Categoría, Técnica, Año, Descripción hasta 1000 caracteres con contador)
 * 2. Imágenes (una principal obligatoria y hasta 6 adicionales; JPG, PNG o WebP, máx. 20 MB, mín. 2000 px)
 * 3. Ficha técnica (Dimensiones y Peso)
 * 4. Precio y disponibilidad (Precio en COP y Tipo de obra: física o digital)
 * Botones: "Enviar a revisión" (primario), "Guardar borrador" (secundario) y "Ver como coleccionista".
 */
export function ObraFormPage() {
  const { idObra } = useParams<{ idObra: string }>();
  const esEdicion = idObra !== undefined;
  const id = Number(idObra);

  const { user } = useAuth();
  const { notificar } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // La fotografía principal se sube mediante `POST /archivos/obra`
  const [urlFoto, setUrlFoto] = useState<string>();
  const [archivoPrincipalMeta, setArchivoPrincipalMeta] = useState<{
    nombre: string;
    tamanoBytes?: number;
  } | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [errorFoto, setErrorFoto] = useState<string>();
  const [adicionales, setAdicionales] = useState<ArchivoAdicional[]>([]);
  const [vistaPreviaAbierta, setVistaPreviaAbierta] = useState(false);

  const { data: categorias } = useQuery({
    queryKey: ["categorias"],
    queryFn: listarCategorias,
  });

  const { data: obra, isLoading: cargandoObra } = useQuery({
    queryKey: ["obra", id],
    queryFn: () => obtenerObra(id),
    enabled: esEdicion && !Number.isNaN(id),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      titulo: "",
      tecnica: "",
      dimensiones: "",
      peso: "",
      anio_creacion: "",
      precio_venta: "",
      id_categoria: "",
      descripcion: "",
      tipo_obra: "fisica",
    },
  });

  const valoresActuales = watch();

  useEffect(() => {
    if (!obra) return;
    reset({
      titulo: obra.titulo,
      tecnica: obra.tecnica,
      dimensiones: obra.dimensiones,
      peso: obra.peso,
      anio_creacion: obra.anio_creacion?.toString() ?? "",
      precio_venta: obra.precio_venta,
      id_categoria: obra.id_categoria.toString(),
      descripcion: "",
      tipo_obra: "fisica",
    });
    setUrlFoto(obra.fotografia_hd_url);
    setArchivoPrincipalMeta({
      nombre: obra.fotografia_hd_url.split("/").pop() ?? "portada-obra.jpg",
    });
  }, [obra, reset]);

  const mutacion = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        titulo: values.titulo,
        tecnica: values.tecnica,
        dimensiones: values.dimensiones,
        peso: values.peso,
        anio_creacion: values.anio_creacion === "" ? null : Number(values.anio_creacion),
        precio_venta: values.precio_venta,
        fotografia_hd_url: urlFoto!,
        id_categoria: Number(values.id_categoria),
      };
      return esEdicion ? actualizarObra(id, payload) : crearObra(payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["mis-obras"] });
      if (esEdicion) void queryClient.invalidateQueries({ queryKey: ["obra", id] });
      notificar("Cambios guardados", "exito");
      navigate("/artista");
    },
    onError: (error) => {
      notificar(obtenerMensajeError(error, "No fue posible guardar la obra"), "error");
    },
  });

  const alSeleccionarArchivoPrincipal = async (archivo: File) => {
    setErrorFoto(undefined);
    setArchivoPrincipalMeta({ nombre: archivo.name, tamanoBytes: archivo.size });
    setSubiendo(true);
    try {
      const urlResultante = await subirFotografiaObra(archivo);
      setUrlFoto(urlResultante);
    } catch (error) {
      notificar(obtenerMensajeError(error, "No fue posible subir la fotografía"), "error");
    } finally {
      setSubiendo(false);
    }
  };

  const agregarImagenAdicional = (archivo: File) => {
    if (adicionales.length >= 6) {
      notificar("Puedes adjuntar hasta 6 imágenes adicionales.", "error");
      return;
    }
    setAdicionales((prev) => [
      ...prev,
      {
        id: `${archivo.name}-${Date.now()}`,
        nombre: archivo.name,
        tamanoBytes: archivo.size,
      },
    ]);
  };

  const moverAdicional = (indice: number, direccion: -1 | 1) => {
    const destino = indice + direccion;
    if (destino < 0 || destino >= adicionales.length) return;
    setAdicionales((prev) => {
      const copia = [...prev];
      const temp = copia[indice];
      copia[indice] = copia[destino];
      copia[destino] = temp;
      return copia;
    });
  };

  const quitarAdicional = (idArchivo: string) => {
    setAdicionales((prev) => prev.filter((item) => item.id !== idArchivo));
  };

  const guardarBorrador = () => {
    try {
      localStorage.setItem(
        `pyl_borrador_obra_${esEdicion ? id : "nueva"}`,
        JSON.stringify(valoresActuales)
      );
    } catch {
      // Ignorar fallo de cuota en localStorage
    }
    notificar("Cambios guardados", "exito");
  };

  const onSubmit = (values: FormValues) => {
    if (!urlFoto) {
      setErrorFoto("La fotografía principal en alta resolución es obligatoria.");
      return;
    }
    return mutacion.mutateAsync(values);
  };

  const resumenErrores = useMemo<ErrorCampoItem[]>(() => {
    const lista: ErrorCampoItem[] = [];
    if (errors.titulo?.message) {
      lista.push({ idCampo: "obra-titulo", etiqueta: "Título", mensaje: errors.titulo.message });
    }
    if (errors.id_categoria?.message) {
      lista.push({
        idCampo: "obra-categoria",
        etiqueta: "Categoría",
        mensaje: errors.id_categoria.message,
      });
    }
    if (errors.tecnica?.message) {
      lista.push({ idCampo: "obra-tecnica", etiqueta: "Técnica", mensaje: errors.tecnica.message });
    }
    if (errorFoto) {
      lista.push({
        idCampo: "obra-imagen-principal",
        etiqueta: "Imagen principal",
        mensaje: errorFoto,
      });
    }
    if (errors.dimensiones?.message) {
      lista.push({
        idCampo: "obra-dimensiones",
        etiqueta: "Dimensiones",
        mensaje: errors.dimensiones.message,
      });
    }
    if (errors.peso?.message) {
      lista.push({ idCampo: "obra-peso", etiqueta: "Peso", mensaje: errors.peso.message });
    }
    if (errors.precio_venta?.message) {
      lista.push({
        idCampo: "obra-precio",
        etiqueta: "Precio en COP",
        mensaje: errors.precio_venta.message,
      });
    }
    return lista;
  }, [errors, errorFoto]);

  if (esEdicion && cargandoObra) {
    return (
      <PanelShell
        migas={[
          { etiqueta: "Panel del artista", to: "/artista" },
          { etiqueta: "Editar obra" },
        ]}
        titulo="Editar obra"
      >
        <div className="max-w-[var(--contenedor-formulario-amplio)] flex flex-col gap-[var(--espacio-24)]">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PanelShell>
    );
  }

  if (esEdicion && obra && obra.id_artista !== user!.id_usuario) {
    return (
      <PanelShell
        migas={[
          { etiqueta: "Panel del artista", to: "/artista" },
          { etiqueta: "Obra no disponible" },
        ]}
        titulo="Obra no disponible"
      >
        <EmptyState
          titulo="Esta obra no pertenece a tu portafolio."
          accion={
            <Link to="/artista">
              <Button variante="primario">Volver al panel</Button>
            </Link>
          }
        />
      </PanelShell>
    );
  }

  if (esEdicion && obra && obra.estado_obra !== "Pendiente" && obra.estado_obra !== "Mantenimiento") {
    return (
      <PanelShell
        migas={[
          { etiqueta: "Panel del artista", to: "/artista" },
          { etiqueta: obra.titulo },
        ]}
        titulo="Esta obra ya no es editable"
        acciones={<BadgeEstadoObra estado={obra.estado_obra} />}
      >
        <div className="max-w-[var(--contenedor-formulario-amplio)] flex flex-col gap-[var(--espacio-24)]">
          <Banner variante="informativo">
            Solo puedes modificar una obra mientras se encuentra en revisión o con solicitud de cambios. Si editas una obra publicada, deberá regresar a revisión curatorial.
          </Banner>
          <div>
            <Link to="/artista">
              <Button variante="secundario">Volver a mis obras</Button>
            </Link>
          </div>
        </div>
      </PanelShell>
    );
  }

  const imagenVistaPrevia =
    esEdicion && obra ? urlPreviewObra(obra.id_obra) : urlFoto;

  return (
    <PanelShell
      migas={[
        { etiqueta: "Panel del artista", to: "/artista" },
        { etiqueta: esEdicion ? "Editar obra" : "Subir obra" },
      ]}
      titulo={esEdicion ? "Editar obra" : "Subir obra"}
      descripcion="Completa los cuatro bloques de la ficha. La pieza ingresará a la cola de revisión curatorial antes de publicarse en el catálogo."
      acciones={
        <div className="flex flex-wrap items-center gap-[var(--espacio-12)]">
          {obra && <BadgeEstadoObra estado={obra.estado_obra} />}
          <Button
            type="button"
            variante="terciario"
            onClick={() => setVistaPreviaAbierta(true)}
          >
            Ver como coleccionista
          </Button>
        </div>
      }
    >
      <div className="max-w-[var(--contenedor-formulario-amplio)] flex flex-col gap-[var(--espacio-32)]">
        {/* Banner ámbar cuando Curaduría solicitó cambios (Sección 6.13) */}
        {esEdicion && obra?.estado_obra === "Mantenimiento" && (
          <Banner
            variante="aviso"
            accion={
              <a href="#obra-titulo">
                <Button type="button" variante="secundario" tamano="compacto">
                  Corregir y reenviar
                </Button>
              </a>
            }
          >
            <strong>Curaduría:</strong> Revisa las dimensiones y la nitidez de la fotografía principal antes de reenviar la pieza a revisión.
          </Banner>
        )}

        {resumenErrores.length > 0 && <FormErrorSummary errores={resumenErrores} />}

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-[var(--espacio-32)]"
        >
          {/* BLOQUE 1: Información básica */}
          <section className="flex flex-col gap-[var(--espacio-24)] border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)] sm:p-[var(--espacio-32)]">
            <h2 className="voz-h4 text-[color:var(--tinta)]">1. Información básica</h2>

            <Input
              id="obra-titulo"
              variante="caja"
              label="Título"
              error={errors.titulo?.message}
              {...register("titulo", { required: "Ingresa el título de la obra." })}
            />

            <div className="grid grid-cols-1 gap-[var(--espacio-16)] sm:grid-cols-2">
              <Select
                id="obra-categoria"
                variante="caja"
                label="Categoría"
                error={errors.id_categoria?.message}
                defaultValue=""
                {...register("id_categoria", { required: "Selecciona una categoría." })}
              >
                <option value="" disabled>
                  Selecciona una categoría…
                </option>
                {categorias?.map((c) => (
                  <option key={c.id_categoria} value={c.id_categoria}>
                    {c.nombre_categoria}
                  </option>
                ))}
              </Select>

              <Input
                id="obra-tecnica"
                variante="caja"
                label="Técnica"
                placeholder="Óleo sobre lino, grabado en metal, video monocanal…"
                error={errors.tecnica?.message}
                {...register("tecnica", { required: "Indica la técnica empleada." })}
              />
            </div>

            <div className="grid grid-cols-1 gap-[var(--espacio-16)] sm:grid-cols-2">
              <Input
                id="obra-anio"
                variante="caja"
                label="Año de creación"
                opcional
                type="number"
                min="1000"
                max={new Date().getFullYear()}
                placeholder={String(new Date().getFullYear())}
                {...register("anio_creacion")}
              />
            </div>

            <Textarea
              id="obra-descripcion"
              variante="caja"
              label="Descripción"
              opcional
              rows={5}
              contadorMaximo={1000}
              value={valoresActuales.descripcion}
              placeholder="Contexto de creación, serie a la que pertenece, notas de montaje o conservación…"
              {...register("descripcion")}
            />
          </section>

          {/* BLOQUE 2: Imágenes */}
          <section
            id="obra-imagen-principal"
            className="flex flex-col gap-[var(--espacio-24)] border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)] sm:p-[var(--espacio-32)]"
          >
            <div>
              <h2 className="voz-h4 text-[color:var(--tinta)]">2. Imágenes</h2>
              <p className="voz-cuerpo-pequeno mt-[var(--espacio-4)] text-[color:var(--tinta-suave)]">
                Una imagen principal obligatoria (portada) y hasta 6 adicionales. JPG, PNG o WebP, máximo 20 MB, mínimo 2000 px en el lado largo.
              </p>
            </div>

            <FileUpload
              label="Fotografía principal (Portada)"
              ayuda="El catálogo público nunca expone el archivo original directamente: sirve una previsualización protegida."
              accept="image/jpeg,image/png,image/webp"
              progreso={subiendo ? 65 : undefined}
              archivoActual={archivoPrincipalMeta}
              error={errorFoto}
              onSelectFile={(archivo) => {
                void alSeleccionarArchivoPrincipal(archivo);
              }}
            />

            {imagenVistaPrevia && (
              <div className="flex flex-col gap-[var(--espacio-8)]">
                <span className="voz-etiqueta text-[color:var(--tinta-suave)]">
                  Vista previa de portada
                </span>
                <div className="flex max-h-80 w-full items-center justify-center overflow-hidden border border-[color:var(--borde-reposo)] bg-[color:var(--vacio)] p-[var(--espacio-16)]">
                  <img
                    src={imagenVistaPrevia}
                    alt="Previsualización de la obra"
                    className="max-h-72 w-auto object-contain"
                  />
                </div>
              </div>
            )}

            {/* Imágenes adicionales (hasta 6) */}
            <div className="flex flex-col gap-[var(--espacio-16)] border-t border-[color:var(--divisor)] pt-[var(--espacio-24)]">
              <FileUpload
                label={`Imágenes adicionales (${adicionales.length} / 6)`}
                ayuda="Vistas de detalle, reverso, firma o montaje en sala."
                accept="image/jpeg,image/png,image/webp"
                onSelectFile={agregarImagenAdicional}
              />

              {adicionales.length > 0 && (
                <ul className="flex flex-col gap-[var(--espacio-8)] list-none p-0 m-0">
                  {adicionales.map((item, idx) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-[var(--espacio-12)] border border-[color:var(--borde-reposo)] bg-[color:var(--fondo)] px-[var(--espacio-16)] py-[var(--espacio-12)]"
                    >
                      <span className="voz-cuerpo-pequeno text-[color:var(--tinta)]">
                        {idx + 2}. {item.nombre}
                      </span>
                      <div className="flex items-center gap-[var(--espacio-12)]">
                        <Button
                          type="button"
                          variante="terciario"
                          disabled={idx === 0}
                          onClick={() => moverAdicional(idx, -1)}
                        >
                          Subir
                        </Button>
                        <Button
                          type="button"
                          variante="terciario"
                          disabled={idx === adicionales.length - 1}
                          onClick={() => moverAdicional(idx, 1)}
                        >
                          Bajar
                        </Button>
                        <Button
                          type="button"
                          variante="terciario"
                          onClick={() => quitarAdicional(item.id)}
                        >
                          Quitar
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* BLOQUE 3: Ficha técnica */}
          <section className="flex flex-col gap-[var(--espacio-24)] border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)] sm:p-[var(--espacio-32)]">
            <h2 className="voz-h4 text-[color:var(--tinta)]">3. Ficha técnica</h2>

            <div className="grid grid-cols-1 gap-[var(--espacio-16)] sm:grid-cols-2">
              <Input
                id="obra-dimensiones"
                variante="caja"
                label="Dimensiones"
                placeholder="80 × 120 cm"
                error={errors.dimensiones?.message}
                {...register("dimensiones", { required: "Indica las dimensiones de la obra." })}
              />

              <Input
                id="obra-peso"
                variante="caja"
                label="Peso (kg)"
                type="number"
                step="0.01"
                min="0"
                placeholder="2.5"
                error={errors.peso?.message}
                {...register("peso", { required: "Indica el peso estimado en kg." })}
              />
            </div>
          </section>

          {/* BLOQUE 4: Precio y disponibilidad */}
          <section className="flex flex-col gap-[var(--espacio-24)] border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)] sm:p-[var(--espacio-32)]">
            <h2 className="voz-h4 text-[color:var(--tinta)]">4. Precio y disponibilidad</h2>

            <div className="grid grid-cols-1 gap-[var(--espacio-16)] sm:grid-cols-2">
              <Input
                id="obra-precio"
                variante="caja"
                label="Precio en COP"
                type="number"
                step="1"
                min="0"
                placeholder="1250000"
                ayuda={
                  valoresActuales.precio_venta
                    ? `Se mostrará como: ${formatearMoneda(valoresActuales.precio_venta)}`
                    : "Ingresa el valor total en pesos colombianos."
                }
                error={errors.precio_venta?.message}
                {...register("precio_venta", { required: "Indica el precio de venta en COP." })}
              />

              <Select
                id="obra-tipo"
                variante="caja"
                label="Tipo de obra"
                {...register("tipo_obra")}
              >
                <option value="fisica">Obra física (requiere envío)</option>
                <option value="digital">Obra digital (entrega certificada)</option>
              </Select>
            </div>
          </section>

          {/* Barra de acciones de envío (Sección 6.13) */}
          <div className="flex flex-wrap items-center justify-between gap-[var(--espacio-16)] border-t border-[color:var(--divisor)] pt-[var(--espacio-24)]">
            <Button
              type="button"
              variante="terciario"
              onClick={() => setVistaPreviaAbierta(true)}
            >
              Ver como coleccionista
            </Button>

            <div className="flex flex-wrap items-center gap-[var(--espacio-12)]">
              <Button
                type="button"
                variante="secundario"
                onClick={guardarBorrador}
                disabled={isSubmitting || subiendo}
              >
                Guardar borrador
              </Button>
              <Button
                type="submit"
                variante="primario"
                cargando={isSubmitting}
                disabled={subiendo}
              >
                {esEdicion && obra?.estado_obra === "Mantenimiento"
                  ? "Corregir y reenviar"
                  : "Enviar a revisión"}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Modal de vista previa "Ver como coleccionista" */}
      <Modal
        abierto={vistaPreviaAbierta}
        onCerrar={() => setVistaPreviaAbierta(false)}
        titulo={valoresActuales.titulo || "Vista previa de la obra"}
        descripcion="Así se presentará tu ficha en el detalle para coleccionistas."
      >
        <div className="flex flex-col gap-[var(--espacio-24)]">
          <div className="flex h-64 w-full items-center justify-center border border-[color:var(--borde-reposo)] bg-[color:var(--vacio)] p-[var(--espacio-16)]">
            {imagenVistaPrevia ? (
              <img
                src={imagenVistaPrevia}
                alt={valoresActuales.titulo || "Obra"}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <span className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">
                Sin imagen principal seleccionada
              </span>
            )}
          </div>

          <dl className="flex flex-col gap-[var(--espacio-8)] border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-16)]">
            <div className="flex justify-between gap-[var(--espacio-12)]">
              <dt className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">Técnica</dt>
              <dd className="voz-cuerpo-pequeno text-[color:var(--tinta)]">
                {valoresActuales.tecnica || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-[var(--espacio-12)]">
              <dt className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">Dimensiones</dt>
              <dd className="voz-dato text-[color:var(--tinta)]">
                {valoresActuales.dimensiones || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-[var(--espacio-12)]">
              <dt className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">Año</dt>
              <dd className="voz-dato text-[color:var(--tinta)]">
                {valoresActuales.anio_creacion || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-[var(--espacio-12)] border-t border-[color:var(--divisor)] pt-[var(--espacio-8)]">
              <dt className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">Precio</dt>
              <dd className="voz-dato text-[color:var(--tinta)]">
                {valoresActuales.precio_venta
                  ? formatearMoneda(valoresActuales.precio_venta)
                  : "—"}
              </dd>
            </div>
          </dl>

          <div className="flex justify-end">
            <Button variante="secundario" onClick={() => setVistaPreviaAbierta(false)}>
              Cerrar vista previa
            </Button>
          </div>
        </div>
      </Modal>
    </PanelShell>
  );
}
