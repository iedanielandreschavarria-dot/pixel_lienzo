import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { solicitarRecuperacion } from "../../api/auth";
import { useToast } from "../../context/ToastContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { AuthCard } from "./AuthCard";
import { obtenerMensajeError } from "../../api/client";

interface FormValues {
  correo_electronico: string;
}

export function RecuperarPasswordPage() {
  const { notificar } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<FormValues>();

  const onSubmit = async (values: FormValues) => {
    try {
      await solicitarRecuperacion(values.correo_electronico);
      notificar("Si el correo existe, se envió un enlace de recuperación.");
      reset(values);
    } catch (error) {
      notificar(obtenerMensajeError(error), "error");
    }
  };

  return (
    <AuthCard titulo="Recuperar contraseña" subtitulo="Te enviaremos un enlace para restablecerla">
      {isSubmitSuccessful ? (
        <p className="text-sm text-marfil-suave">
          Revisa tu correo (o la consola del servidor en modo desarrollo) para continuar. Vuelve a{" "}
          <Link to="/login" className="text-ocre underline">
            iniciar sesión
          </Link>
          .
        </p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Correo electrónico"
            type="email"
            error={errors.correo_electronico?.message}
            {...register("correo_electronico", { required: "Ingresa tu correo" })}
          />
          <Button type="submit" cargando={isSubmitting} className="mt-2 w-full">
            Enviar enlace
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
