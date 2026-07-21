import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { verificarEmail } from "../../api/auth";
import { useToast } from "../../context/ToastContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { AuthCard } from "./AuthCard";
import { obtenerMensajeError } from "../../api/client";

interface FormValues {
  correo_electronico: string;
  codigo: string;
}

export function VerificarEmailPage() {
  const navigate = useNavigate();
  const { notificar } = useToast();
  const location = useLocation();
  const correoPrevio = (location.state as { correo?: string } | null)?.correo ?? "";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { correo_electronico: correoPrevio } });

  const onSubmit = async (values: FormValues) => {
    try {
      await verificarEmail(values.correo_electronico, values.codigo);
      notificar("Correo verificado correctamente. Ya puedes iniciar sesión.");
      navigate("/login");
    } catch (error) {
      notificar(obtenerMensajeError(error, "Código inválido o expirado"), "error");
    }
  };

  return (
    <AuthCard
      titulo="Verifica tu correo"
      subtitulo="Ingresa el código que enviamos a tu correo (o revisa la consola del servidor en modo desarrollo)"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Correo electrónico"
          type="email"
          error={errors.correo_electronico?.message}
          {...register("correo_electronico", { required: "Ingresa tu correo" })}
        />
        <Input
          label="Código de verificación"
          inputMode="numeric"
          error={errors.codigo?.message}
          {...register("codigo", { required: "Ingresa el código recibido" })}
        />
        <Button type="submit" cargando={isSubmitting} className="mt-2 w-full">
          Verificar
        </Button>
      </form>
    </AuthCard>
  );
}
