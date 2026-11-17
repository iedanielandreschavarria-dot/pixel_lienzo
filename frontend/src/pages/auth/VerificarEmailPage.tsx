import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  const [segundosEspera, setSegundosEspera] = useState(0);

  useEffect(() => {
    document.title = "Verifica tu correo · Pixel & Lienzo";
  }, []);

  useEffect(() => {
    if (segundosEspera <= 0) return;
    const timer = window.setInterval(() => {
      setSegundosEspera((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [segundosEspera]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    mode: "onBlur",
    defaultValues: { correo_electronico: correoPrevio },
  });

  const correoActual = watch("correo_electronico") || correoPrevio;

  const onSubmit = async (values: FormValues) => {
    try {
      await verificarEmail(values.correo_electronico, values.codigo);
      notificar("Correo verificado correctamente. Ya puedes iniciar sesión.", "exito");
      navigate("/login");
    } catch (error) {
      notificar(obtenerMensajeError(error, "Código inválido o expirado."), "error");
    }
  };

  const manejarReenvio = () => {
    if (segundosEspera > 0) return;
    setSegundosEspera(60);
    notificar("Si el correo está pendiente de verificación, enviamos un nuevo código.", "exito");
  };

  return (
    <AuthCard
      titulo="Verifica tu correo"
      subtitulo={
        correoActual
          ? `Enviamos un código de verificación a ${correoActual}`
          : "Ingresa el código que enviamos a tu correo"
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-[var(--espacio-24)]">
        <Input
          variante="subrayado"
          label="Correo"
          type="email"
          autoComplete="email"
          error={errors.correo_electronico?.message}
          {...register("correo_electronico", {
            required: "Ingresa un correo válido, por ejemplo nombre@dominio.com.",
          })}
        />
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
          Verificar
        </Button>

        <Button
          type="button"
          variante="secundario"
          disabled={segundosEspera > 0}
          onClick={manejarReenvio}
          className="w-full"
        >
          {segundosEspera > 0 ? `Reenviar correo (${segundosEspera} s)` : "Reenviar correo"}
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

