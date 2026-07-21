import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { UploadCloud } from "lucide-react";
import { registrarArtista } from "../../api/auth";
import { subirDocumentoIdentidad } from "../../api/archivos";
import { useToast } from "../../context/ToastContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { AuthCard } from "./AuthCard";
import { obtenerMensajeError } from "../../api/client";

interface FormValues {
  correo_electronico: string;
  contrasenia: string;
  confirmar: string;
  biografia_profesional: string;
  informacion_bancaria: string;
}

export function RegistroArtistaPage() {
  const navigate = useNavigate();
  const { notificar } = useToast();
  const [archivo, setArchivo] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  const contrasenia = watch("contrasenia");

  const onSubmit = async (values: FormValues) => {
    if (!archivo) {
      notificar("Adjunta tu documento de identidad para continuar", "error");
      return;
    }
    try {
      const documento_identidad_url = await subirDocumentoIdentidad(archivo);
      await registrarArtista({
        correo_electronico: values.correo_electronico,
        contrasenia: values.contrasenia,
        biografia_profesional: values.biografia_profesional || undefined,
        informacion_bancaria: values.informacion_bancaria || undefined,
        documento_identidad_url,
      });
      notificar("Cuenta creada. Un curador revisará tu perfil antes de que puedas publicar obras.");
      navigate("/verificar-email", { state: { correo: values.correo_electronico } });
    } catch (error) {
      notificar(obtenerMensajeError(error, "No fue posible completar el registro"), "error");
    }
  };

  return (
    <AuthCard
      titulo="Cuenta de Artista"
      subtitulo="Tu perfil será revisado por un curador antes de poder publicar obras (RF 1.2.1)"
      ancho="max-w-lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          error={errors.correo_electronico?.message}
          {...register("correo_electronico", { required: "Ingresa tu correo" })}
        />
        <Input
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          error={errors.contrasenia?.message}
          {...register("contrasenia", {
            required: "Ingresa una contraseña",
            minLength: { value: 8, message: "Mínimo 8 caracteres" },
          })}
        />
        <Input
          label="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          error={errors.confirmar?.message}
          {...register("confirmar", {
            required: "Confirma tu contraseña",
            validate: (value) => value === contrasenia || "Las contraseñas no coinciden",
          })}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-marfil-suave">Biografía profesional (opcional)</label>
          <textarea
            rows={3}
            className="rounded-lg border border-antracita-suave bg-antracita px-4 py-2.5 text-sm text-marfil placeholder:text-marfil-suave/50 focus:outline-none focus:ring-1 focus:ring-ocre/60"
            {...register("biografia_profesional")}
          />
        </div>
        <Input label="Información bancaria (opcional)" {...register("informacion_bancaria")} />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-marfil-suave">Documento de identidad</label>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-antracita-suave px-4 py-4 text-sm text-marfil-suave hover:border-ocre/60 hover:text-ocre">
            <UploadCloud size={18} />
            {archivo ? archivo.name : "Subir foto o PDF del documento"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <Button type="submit" cargando={isSubmitting} className="mt-2 w-full">
          Crear cuenta
        </Button>
      </form>
    </AuthCard>
  );
}
