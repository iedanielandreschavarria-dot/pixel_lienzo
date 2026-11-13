import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { solicitarRecuperacion } from "../../api/auth";
import { useToast } from "../../context/ToastContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Banner } from "../../components/ui/Banner";
import { AuthCard } from "./AuthCard";
import { obtenerMensajeError } from "../../api/client";

interface FormValues {
  correo_electronico: string;
}

const CONFIRMACION_NEUTRA = "Si el correo está registrado, recibirás un enlace en unos minutos.";

export function RecuperarPasswordPage() {
  const { notificar } = useToast();

  useEffect(() => {
    document.title = "Recuperar contraseña · Pixel & Lienzo";
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<FormValues>({ mode: "onBlur" });

  const onSubmit = async (values: FormValues) => {
    try {
      await solicitarRecuperacion(values.correo_electronico);
      notificar(CONFIRMACION_NEUTRA, "exito");
      reset(values);
    } catch (error) {
      notificar(obtenerMensajeError(error), "error");
    }
  };

  return (
    <AuthCard titulo="Recuperar" subtitulo="Te enviaremos un enlace para restablecer tu contraseña">
      {isSubmitSuccessful ? (
        <div className="flex flex-col gap-[var(--espacio-24)]">
          <Banner variante="exito">{CONFIRMACION_NEUTRA}</Banner>

          <p className="text-center text-[length:var(--text-cuerpo)] text-[color:var(--tinta-suave)]">
            <Link to="/login" className="enlace-acceso">
              ← Volver a iniciar sesión
            </Link>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-[var(--espacio-24)]">
          <Input
            variante="subrayado"
            label="Correo"
            type="email"
            autoComplete="email"
            error={errors.correo_electronico?.message}
            {...register("correo_electronico", {
              required: "Ingresa un correo válido, por ejemplo nombre@dominio.com.",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Ingresa un correo válido, por ejemplo nombre@dominio.com.",
              },
            })}
          />
          <Button type="submit" variante="primario" cargando={isSubmitting} className="w-full">
            Enviar enlace
          </Button>

          <p className="text-center text-[length:var(--text-cuerpo)] text-[color:var(--tinta-suave)]">
            <Link to="/login" className="enlace-acceso">
              ← Volver a iniciar sesión
            </Link>
          </p>
        </form>
      )}
    </AuthCard>
  );
}

