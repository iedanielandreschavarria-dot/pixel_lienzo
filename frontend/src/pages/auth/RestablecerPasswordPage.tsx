import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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

  useEffect(() => {
    document.title = "Nueva contraseña · Pixel & Lienzo";
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ mode: "onBlur" });

  const nueva = watch("nueva_contrasenia");

  const onSubmit = async (values: FormValues) => {
    try {
      await restablecerPassword(token, values.nueva_contrasenia);
      notificar("Contraseña restablecida. Ya puedes iniciar sesión.", "exito");
      navigate("/login");
    } catch (error) {
      notificar(obtenerMensajeError(error, "El enlace es inválido o expiró."), "error");
    }
  };

  if (!token) {
    return (
      <AuthCard titulo="Enlace inválido" subtitulo="Solicita un nuevo enlace de recuperación">
        <div className="flex flex-col gap-[var(--espacio-24)]">
          <Button variante="primario" className="w-full" onClick={() => navigate("/recuperar-password")}>
            Enviar enlace
          </Button>
          <p className="text-center text-[length:var(--text-cuerpo)] text-[color:var(--tinta-suave)]">
            <Link to="/login" className="enlace-acceso">
              ← Volver a iniciar sesión
            </Link>
          </p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard titulo="Nueva contraseña" subtitulo="Elige una nueva contraseña para tu cuenta">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-[var(--espacio-24)]">
        <Input
          variante="subrayado"
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          ayuda="Usa al menos 8 caracteres."
          error={errors.nueva_contrasenia?.message}
          {...register("nueva_contrasenia", {
            required: "Usa al menos 8 caracteres.",
            minLength: { value: 8, message: "Usa al menos 8 caracteres." },
          })}
        />
        <Input
          variante="subrayado"
          label="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          error={errors.confirmar?.message}
          {...register("confirmar", {
            required: "Confirma tu contraseña.",
            validate: (value) => value === nueva || "Las contraseñas no coinciden.",
          })}
        />
        <Button type="submit" variante="primario" cargando={isSubmitting} className="w-full">
          Restablecer
        </Button>
      </form>
    </AuthCard>
  );
}

