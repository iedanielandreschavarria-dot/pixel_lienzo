import { useForm } from "react-hook-form";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { AuthCard } from "./AuthCard";
import { obtenerMensajeError } from "../../api/client";
import { rutaInicialPorRol } from "../../lib/navegacion";

interface FormValues {
  codigo: string;
}

export function MfaPage() {
  const { completarMfa } = useAuth();
  const { notificar } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { correo?: string; from?: string } | null;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  if (!state?.correo) {
    return <Navigate to="/login" replace />;
  }

  const onSubmit = async (values: FormValues) => {
    try {
      const rol = await completarMfa(state.correo!, values.codigo);
      navigate(state.from ?? rutaInicialPorRol(rol), { replace: true });
    } catch (error) {
      notificar(obtenerMensajeError(error, "Código inválido o expirado"), "error");
    }
  };

  return (
    <AuthCard
      titulo="Verificación en dos pasos"
      subtitulo={`Enviamos un código de un solo uso a ${state.correo}. Revisa tu correo (o la consola del servidor en modo desarrollo).`}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Código de verificación"
          inputMode="numeric"
          autoComplete="one-time-code"
          error={errors.codigo?.message}
          {...register("codigo", { required: "Ingresa el código recibido" })}
        />
        <Button type="submit" cargando={isSubmitting} className="mt-2 w-full">
          Confirmar
        </Button>
      </form>
    </AuthCard>
  );
}
