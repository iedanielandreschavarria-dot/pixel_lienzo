import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileCheck2 } from "lucide-react";
import { actualizarPerfilArtista, obtenerPerfilArtista } from "../../api/artistas";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { PanelShell } from "../../components/layout/PanelShell";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Spinner } from "../../components/ui/Spinner";
import { BadgeEstadoValidacion } from "../../components/ui/Badge";
import { obtenerMensajeError } from "../../api/client";

interface FormValues {
  biografia_profesional: string;
  informacion_bancaria: string;
}

export function ArtistaPerfilPage() {
  const { user } = useAuth();
  const idArtista = user!.id_usuario;
  const { notificar } = useToast();
  const queryClient = useQueryClient();

  const { data: perfil, isLoading } = useQuery({
    queryKey: ["artista", idArtista],
    queryFn: () => obtenerPerfilArtista(idArtista),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>();

  useEffect(() => {
    if (!perfil) return;
    // `informacion_bancaria` nunca se devuelve por la API (se guarda cifrada),
    // así que el campo arranca vacío y solo se envía si el artista lo reescribe.
    reset({ biografia_profesional: perfil.biografia_profesional ?? "", informacion_bancaria: "" });
  }, [perfil, reset]);

  const mutacion = useMutation({
    mutationFn: (values: FormValues) =>
      actualizarPerfilArtista(idArtista, {
        biografia_profesional: values.biografia_profesional,
        ...(values.informacion_bancaria.trim() !== ""
          ? { informacion_bancaria: values.informacion_bancaria.trim() }
          : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artista", idArtista] });
      notificar("Perfil actualizado.");
    },
    onError: (error) => notificar(obtenerMensajeError(error, "No fue posible actualizar el perfil"), "error"),
  });

  if (isLoading) return <Spinner etiqueta="Cargando tu perfil…" />;

  return (
    <PanelShell
      eyebrow="Panel del artista"
      titulo="Mi perfil"
      descripcion="Tu biografía acompaña a cada obra en el catálogo. La información bancaria se usa para dispersar los pagos de tus ventas."
      acciones={perfil && <BadgeEstadoValidacion estado={perfil.estado_validacion} />}
    >
      <Link
        to="/artista"
        className="mb-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-marfil-suave hover:text-ocre"
      >
        <ArrowLeft size={14} /> Volver a mi portafolio
      </Link>

      {perfil?.estado_validacion === "Rechazado" && perfil.motivos_rechazo && (
        <div className="mb-8 rounded-lg border border-terracota/40 bg-terracota/5 p-5">
          <p className="font-medium text-marfil">Motivo del rechazo</p>
          <p className="mt-1 text-sm text-marfil-suave">{perfil.motivos_rechazo}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit((values) => mutacion.mutateAsync(values))}
        className="flex max-w-2xl flex-col gap-6"
      >
        <Textarea
          label="Biografía profesional"
          rows={6}
          placeholder="Trayectoria, exposiciones, técnica predominante…"
          {...register("biografia_profesional")}
        />

        <Input
          label="Información bancaria"
          placeholder="Deja el campo vacío para conservar la actual"
          autoComplete="off"
          {...register("informacion_bancaria")}
        />
        <p className="-mt-3 text-xs leading-relaxed text-marfil-suave/70">
          Se almacena cifrada en el servidor y nunca se devuelve al navegador. Escribe un valor nuevo solo si
          necesitas reemplazarla.
        </p>

        {perfil && (
          <a
            href={perfil.documento_identidad_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-marfil-suave hover:text-ocre"
          >
            <FileCheck2 size={16} /> Ver documento de identidad entregado
          </a>
        )}

        <div className="mt-2">
          <Button type="submit" cargando={isSubmitting}>
            Guardar cambios
          </Button>
        </div>
      </form>
    </PanelShell>
  );
}
