import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ImagePlus, Loader2 } from "lucide-react";
import { actualizarObra, crearObra, obtenerObra, urlPreviewObra } from "../../api/obras";
import { subirFotografiaObra } from "../../api/archivos";
import { listarCategorias } from "../../api/categorias";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { PanelShell } from "../../components/layout/PanelShell";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Spinner } from "../../components/ui/Spinner";
import { obtenerMensajeError } from "../../api/client";

interface FormValues {
  titulo: string;
  tecnica: string;
  dimensiones: string;
  peso: string;
  anio_creacion: string;
  precio_venta: string;
  id_categoria: string;
}

export function ObraFormPage() {
  const { idObra } = useParams<{ idObra: string }>();
  const esEdicion = idObra !== undefined;
  const id = Number(idObra);

  const { user } = useAuth();
  const { notificar } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // La fotografía se sube aparte (`POST /archivos/obra`) y lo que viaja en el
  // JSON de la obra es solo la URL resultante.
  const [urlFoto, setUrlFoto] = useState<string>();
  const [subiendo, setSubiendo] = useState(false);
  const [errorFoto, setErrorFoto] = useState<string>();

  const { data: categorias } = useQuery({ queryKey: ["categorias"], queryFn: listarCategorias });
  const { data: obra, isLoading: cargandoObra } = useQuery({
    queryKey: ["obra", id],
    queryFn: () => obtenerObra(id),
    enabled: esEdicion && !Number.isNaN(id),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

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
    });
    setUrlFoto(obra.fotografia_hd_url);
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
      queryClient.invalidateQueries({ queryKey: ["mis-obras"] });
      if (esEdicion) queryClient.invalidateQueries({ queryKey: ["obra", id] });
      notificar(
        esEdicion
          ? "Obra actualizada. Sigue en revisión curatorial."
          : "Obra postulada. El equipo curatorial la revisará pronto."
      );
      navigate("/artista");
    },
    onError: (error) => {
      notificar(obtenerMensajeError(error, "No fue posible guardar la obra"), "error");
    },
  });

  const alSeleccionarArchivo = async (archivo: File | undefined) => {
    if (!archivo) return;
    setErrorFoto(undefined);
    setSubiendo(true);
    try {
      setUrlFoto(await subirFotografiaObra(archivo));
    } catch (error) {
      notificar(obtenerMensajeError(error, "No fue posible subir la fotografía"), "error");
    } finally {
      setSubiendo(false);
    }
  };

  const onSubmit = (values: FormValues) => {
    if (!urlFoto) {
      setErrorFoto("La fotografía en alta resolución es obligatoria.");
      return;
    }
    return mutacion.mutateAsync(values);
  };

  if (esEdicion && cargandoObra) return <Spinner etiqueta="Cargando obra…" />;

  if (esEdicion && obra && obra.id_artista !== user!.id_usuario) {
    return (
      <PanelShell eyebrow="Panel del artista" titulo="Obra no disponible">
        <p className="text-terracota">Esta obra no pertenece a tu portafolio.</p>
        <Link to="/artista" className="mt-4 inline-block text-sm text-ocre underline">
          Volver a mi portafolio
        </Link>
      </PanelShell>
    );
  }

  if (esEdicion && obra && obra.estado_obra !== "Pendiente") {
    return (
      <PanelShell eyebrow="Panel del artista" titulo="Esta obra ya no es editable">
        <p className="text-marfil-suave">
          Solo puedes modificar una obra mientras está en estado <span className="text-ocre">Pendiente</span>. Esta
          pieza ya se encuentra en <span className="text-ocre">{obra.estado_obra}</span>.
        </p>
        <Link to="/artista" className="mt-4 inline-block text-sm text-ocre underline">
          Volver a mi portafolio
        </Link>
      </PanelShell>
    );
  }

  return (
    <PanelShell
      eyebrow="Panel del artista"
      titulo={esEdicion ? "Editar obra" : "Postular una obra"}
      descripcion={
        esEdicion
          ? "Ajusta la ficha técnica mientras la pieza sigue en revisión curatorial."
          : "Completa la ficha técnica. La obra entrará a la cola de revisión curatorial antes de aparecer en el catálogo."
      }
    >
      <Link
        to="/artista"
        className="mb-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-marfil-suave hover:text-ocre"
      >
        <ArrowLeft size={14} /> Volver a mi portafolio
      </Link>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-marfil-suave">Fotografía en alta resolución</p>
          <label className="group relative flex aspect-[4/5] cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-antracita-suave bg-antracita transition-colors hover:border-ocre/60">
            {urlFoto ? (
              <img
                src={esEdicion && obra ? urlPreviewObra(obra.id_obra) : urlFoto}
                alt="Previsualización de la obra"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex flex-col items-center gap-2 text-sm text-marfil-suave group-hover:text-ocre">
                {subiendo ? <Loader2 size={26} className="animate-spin" /> : <ImagePlus size={26} />}
                {subiendo ? "Subiendo…" : "Seleccionar imagen"}
              </span>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => alSeleccionarArchivo(e.target.files?.[0])}
            />
          </label>
          {urlFoto && (
            <p className="text-xs text-marfil-suave">
              {subiendo ? "Subiendo nueva imagen…" : "Haz clic sobre la imagen para reemplazarla."}
            </p>
          )}
          {errorFoto && <p className="text-xs text-terracota">{errorFoto}</p>}
          <p className="text-xs leading-relaxed text-marfil-suave/70">
            El catálogo público nunca muestra este archivo directamente: se sirve una previsualización con marca de
            agua generada por el backend.
          </p>
        </div>

        <div className="flex flex-col gap-5">
          <Input
            label="Título"
            error={errors.titulo?.message}
            {...register("titulo", { required: "Ingresa el título de la obra" })}
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input
              label="Técnica"
              placeholder="Óleo sobre lienzo"
              error={errors.tecnica?.message}
              {...register("tecnica", { required: "Indica la técnica" })}
            />
            <Select
              label="Categoría"
              error={errors.id_categoria?.message}
              defaultValue=""
              {...register("id_categoria", { required: "Selecciona una categoría" })}
            >
              <option value="" disabled>
                Selecciona…
              </option>
              {categorias?.map((c) => (
                <option key={c.id_categoria} value={c.id_categoria}>
                  {c.nombre_categoria}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input
              label="Dimensiones"
              placeholder="80cm x 120cm"
              error={errors.dimensiones?.message}
              {...register("dimensiones", { required: "Indica las dimensiones" })}
            />
            <Input
              label="Peso (kg)"
              type="number"
              step="0.01"
              min="0"
              error={errors.peso?.message}
              {...register("peso", { required: "Indica el peso" })}
            />
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input
              label="Año de creación (opcional)"
              type="number"
              min="0"
              max={new Date().getFullYear()}
              {...register("anio_creacion")}
            />
            <Input
              label="Precio de venta (COP)"
              type="number"
              step="0.01"
              min="0"
              error={errors.precio_venta?.message}
              {...register("precio_venta", { required: "Indica el precio de venta" })}
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-4">
            <Button type="submit" cargando={isSubmitting} disabled={subiendo}>
              {esEdicion ? "Guardar cambios" : "Postular obra"}
            </Button>
            <Link to="/artista" className="text-sm text-marfil-suave hover:text-ocre">
              Cancelar
            </Link>
          </div>
        </div>
      </form>
    </PanelShell>
  );
}
