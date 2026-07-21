import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { restablecerPassword } from "../../api/auth";
import { useToast } from "../../context/ToastContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { AuthCard } from "./AuthCard";
import { obtenerMensajeError } from "../../api/client";

interface FormValues {
  nueva_contrasenia: string;
  confirmar: string;
}

export function RestablecerPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const navigate = useNavigate();
  const { notificar } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  const nueva = watch("nueva_contrasenia");

  const onSubmit = async (values: FormValues) => {
    try {
      await restablecerPassword(token, values.nueva_contrasenia);
      notificar("Contraseña restablecida. Ya puedes iniciar sesión.");
      navigate("/login");
    } catch (error) {
      notificar(obtenerMensajeError(error, "El enlace es inválido o expiró"), "error");
    }
  };

  if (!token) {
    return (
      <AuthCard titulo="Enlace inválido" subtitulo="Solicita un nuevo enlace de recuperación">
        <Button className="w-full" onClick={() => navigate("/recuperar-password")}>
          Volver a solicitar
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard titulo="Restablecer contraseña">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Nueva contraseña"
          type="password"
          error={errors.nueva_contrasenia?.message}
          {...register("nueva_contrasenia", {
            required: "Ingresa una contraseña",
            minLength: { value: 8, message: "Mínimo 8 caracteres" },
          })}
        />
        <Input
          label="Confirmar contraseña"
          type="password"
          error={errors.confirmar?.message}
          {...register("confirmar", {
            required: "Confirma tu contraseña",
            validate: (value) => value === nueva || "Las contraseñas no coinciden",
          })}
        />
        <Button type="submit" cargando={isSubmitting} className="mt-2 w-full">
          Restablecer
        </Button>
      </form>
    </AuthCard>
  );
}
