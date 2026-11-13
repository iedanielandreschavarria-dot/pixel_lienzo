import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileCheck2 } from "lucide-react";
import { actualizarPerfilArtista, obtenerPerfilArtista } from "../../api/artistas";
import { obtenerMensajeError } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { PanelShell } from "../../components/layout/PanelShell";
import { BadgeEstadoValidacion } from "../../components/ui/Badge";
import { Banner } from "../../components/ui/Banner";
import { Button } from "../../components/ui/Button";
import { FileUpload } from "../../components/ui/FileUpload";
import { Input } from "../../components/ui/Input";
import { SectionError } from "../../components/ui/SectionError";
import { Skeleton } from "../../components/ui/Skeleton";
import { Textarea } from "../../components/ui/Textarea";

interface FormValues {
  biografia_profesional: string;
  informacion_bancaria: string;
  enlace_1: string;
  enlace_2: string;
  enlace_3: string;
  enlace_4: string;
}

/**
 * 6.13 Perfil público del artista (Nivel 1 — Funcional):
 * Biografía profesional (con contador hasta 1000 caracteres), retrato, hasta 4 enlaces externos
 * e información bancaria cifrada. Campos en formato caja y toast salvia "Cambios guardados".
 */
export function ArtistaPerfilPage() {
  const { user } = useAuth();
  const idArtista = user!.id_usuario;
  const { notificar } = useToast();
  const queryClient = useQueryClient();

  const [retratoArchivo, setRetratoArchivo] = useState<{
    nombre: string;
    tamanoBytes?: number;
  } | null>(null);

  const {
    data: perfil,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["artista", idArtista],
    queryFn: () => obtenerPerfilArtista(idArtista),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting, isDirty },
  } = useForm<FormValues>({
    defaultValues: {
      biografia_profesional: "",
      informacion_bancaria: "",
      enlace_1: "",
      enlace_2: "",
      enlace_3: "",
      enlace_4: "",
    },
  });

  const biografiaActual = watch("biografia_profesional") ?? "";

  useEffect(() => {
    if (!perfil) return;
    // `informacion_bancaria` nunca se devuelve por la API (se guarda cifrada),
    // así que el campo arranca vacío y solo se envía si el artista lo reescribe.
    reset({
      biografia_profesional: perfil.biografia_profesional ?? "",
      informacion_bancaria: "",
      enlace_1: "",
      enlace_2: "",
      enlace_3: "",
      enlace_4: "",
    });
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
      void queryClient.invalidateQueries({ queryKey: ["artista", idArtista] });
      notificar("Cambios guardados", "exito");
    },
    onError: (error) =>
      notificar(obtenerMensajeError(error, "No fue posible actualizar el perfil"), "error"),
  });

  const hayCambios = isDirty || retratoArchivo !== null;

  return (
    <PanelShell
      migas={[
        { etiqueta: "Panel del artista", to: "/artista" },
        { etiqueta: "Perfil público" },
      ]}
      titulo="Perfil público"
      descripcion="Tu biografía, retrato y enlaces acompañan cada obra en el catálogo. La información bancaria se utiliza para dispersar los pagos de tus ventas."
      acciones={
        <div className="flex flex-wrap items-center gap-[var(--espacio-12)]">
          {perfil && <BadgeEstadoValidacion estado={perfil.estado_validacion} />}
          <Link to={`/?perfil_artista=${idArtista}`}>
            <Button variante="secundario" tamano="compacto">
              Ver perfil público
            </Button>
          </Link>
        </div>
      }
    >
      {isLoading && (
        <div className="max-w-[var(--contenedor-formulario-amplio)] flex flex-col gap-[var(--espacio-24)]">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {isError && !isLoading && (
        <SectionError
          recurso="tu perfil de artista"
          onReintentar={() => {
            void refetch();
          }}
        />
      )}

      {!isLoading && !isError && (
        <div className="max-w-[var(--contenedor-formulario-amplio)] flex flex-col gap-[var(--espacio-32)]">
          {perfil?.estado_validacion === "Rechazado" && perfil.motivos_rechazo && (
            <Banner variante="aviso">
              <strong>Motivo de observación curatorial:</strong> {perfil.motivos_rechazo}
            </Banner>
          )}

          <form
            onSubmit={handleSubmit((values) => mutacion.mutateAsync(values))}
            noValidate
            className="flex flex-col gap-[var(--espacio-32)] border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)] sm:p-[var(--espacio-32)]"
          >
            {/* Sección 1: Retrato y biografía */}
            <div className="flex flex-col gap-[var(--espacio-24)]">
              <h2 className="voz-h4 text-[color:var(--tinta)]">Retrato y biografía</h2>

              <FileUpload
                label="Retrato del artista"
                ayuda="Formato cuadrado sugerido (mínimo 560 × 560 px). JPG, PNG o WebP."
                accept="image/jpeg,image/png,image/webp"
                archivoActual={retratoArchivo}
                onSelectFile={(file) =>
                  setRetratoArchivo({ nombre: file.name, tamanoBytes: file.size })
                }
              />

              <Textarea
                id="artista-biografia"
                variante="caja"
                label="Biografía profesional"
                rows={6}
                contadorMaximo={1000}
                value={biografiaActual}
                placeholder="Trayectoria, exposiciones individuales y colectivas, investigación plástica…"
                {...register("biografia_profesional")}
              />
            </div>

            {/* Sección 2: Enlaces externos (hasta 4) */}
            <div className="flex flex-col gap-[var(--espacio-16)] border-t border-[color:var(--divisor)] pt-[var(--espacio-24)]">
              <div>
                <h2 className="voz-h4 text-[color:var(--tinta)]">Enlaces externos</h2>
                <p className="voz-cuerpo-pequeno mt-[var(--espacio-4)] text-[color:var(--tinta-suave)]">
                  Hasta 4 enlaces públicos para mostrar en tu ficha de artista (sitio web, portafolio, archivo o catálogo).
                </p>
              </div>

              <div className="grid grid-cols-1 gap-[var(--espacio-16)] sm:grid-cols-2">
                <Input
                  id="artista-enlace-1"
                  variante="caja"
                  type="url"
                  label="Enlace 1"
                  opcional
                  placeholder="https://..."
                  {...register("enlace_1")}
                />
                <Input
                  id="artista-enlace-2"
                  variante="caja"
                  type="url"
                  label="Enlace 2"
                  opcional
                  placeholder="https://..."
                  {...register("enlace_2")}
                />
                <Input
                  id="artista-enlace-3"
                  variante="caja"
                  type="url"
                  label="Enlace 3"
                  opcional
                  placeholder="https://..."
                  {...register("enlace_3")}
                />
                <Input
                  id="artista-enlace-4"
                  variante="caja"
                  type="url"
                  label="Enlace 4"
                  opcional
                  placeholder="https://..."
                  {...register("enlace_4")}
                />
              </div>
            </div>

            {/* Sección 3: Información bancaria y verificación */}
            <div className="flex flex-col gap-[var(--espacio-16)] border-t border-[color:var(--divisor)] pt-[var(--espacio-24)]">
              <h2 className="voz-h4 text-[color:var(--tinta)]">Liquidación y documentos</h2>

              <Input
                id="artista-info-bancaria"
                variante="caja"
                label="Información bancaria"
                placeholder="Deja el campo vacío para conservar la cuenta registrada"
                ayuda="Se almacena cifrada en el servidor y nunca se devuelve al navegador. Escribe un valor nuevo solo si deseas reemplazarla."
                autoComplete="off"
                {...register("informacion_bancaria")}
              />

              {perfil?.documento_identidad_url && (
                <div className="pt-[var(--espacio-4)]">
                  <a
                    href={perfil.documento_identidad_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-[var(--espacio-8)] border-b border-[color:var(--borde-terciario)] pb-[var(--espacio-4)] font-[var(--fuente-texto)] font-semibold text-[length:var(--text-cuerpo-pequeno)] text-[color:var(--tinta)] no-underline hover:border-white"
                  >
                    <FileCheck2 size={16} strokeWidth={1.5} aria-hidden="true" />
                    <span>Ver documento de identidad entregado</span>
                  </a>
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="flex flex-wrap items-center justify-end gap-[var(--espacio-16)] border-t border-[color:var(--divisor)] pt-[var(--espacio-24)]">
              <Link to="/artista">
                <Button type="button" variante="secundario">
                  Volver al resumen
                </Button>
              </Link>
              <Button
                type="submit"
                variante="primario"
                cargando={isSubmitting}
                disabled={!hayCambios}
              >
                Guardar cambios
              </Button>
            </div>
          </form>
        </div>
      )}
    </PanelShell>
  );
}
