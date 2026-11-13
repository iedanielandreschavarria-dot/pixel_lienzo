import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
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

  useEffect(() => {
    document.title = "Verificación · Pixel & Lienzo";
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ mode: "onBlur" });

  if (!state?.correo) {
    return <Navigate to="/login" replace />;
  }

  const onSubmit = async (values: FormValues) => {
    try {
      const rol = await completarMfa(state.correo!, values.codigo);
      navigate(state.from ?? rutaInicialPorRol(rol), { replace: true });
    } catch (error) {
      notificar(obtenerMensajeError(error, "Código inválido o expirado."), "error");
    }
  };

  return (
    <AuthCard
      titulo="Verificación"
      subtitulo={`Enviamos un código de un solo uso a ${state.correo}.`}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-[var(--espacio-24)]">
        <Input
          variante="subrayado"
          label="Código de verificación"
          inputMode="numeric"
          autoComplete="one-time-code"
          className="codigo-certificado"
          error={errors.codigo?.message}
          {...register("codigo", { required: "Ingresa el código recibido." })}
        />
        <Button type="submit" variante="primario" cargando={isSubmitting} className="w-full">
          Confirmar
        </Button>

        <p className="text-center text-[length:var(--text-cuerpo)] text-[color:var(--tinta-suave)]">
          <Link to="/login" className="enlace-acceso">
            ← Volver a iniciar sesión
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}

