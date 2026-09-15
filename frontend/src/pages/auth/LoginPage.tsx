import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { AuthCard } from "./AuthCard";
import { obtenerMensajeError } from "../../api/client";
import { rutaInicialPorRol } from "../../lib/navegacion";

interface FormValues {
  correo_electronico: string;
  contrasenia: string;
}

export function LoginPage() {
  const { login } = useAuth();
  const { notificar } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  // Si el usuario llegó aquí porque intentaba entrar a una ruta protegida, se
  // respeta ese destino; si no, cada rol va a su propia vista principal.
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  const onSubmit = async (values: FormValues) => {
    try {
      const resultado = await login(values.correo_electronico, values.contrasenia);
      if (resultado.requiereMfa) {
        navigate("/mfa", { state: { correo: values.correo_electronico, from } });
        return;
      }
      navigate(from ?? rutaInicialPorRol(resultado.rol), { replace: true });
    } catch (error) {
      notificar(obtenerMensajeError(error, "Credenciales inválidas"), "error");
    }
  };

  return (
    <AuthCard titulo="Iniciar sesión" subtitulo="Accede a tu cuenta de Pixel y Lienzo">
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
          autoComplete="current-password"
          error={errors.contrasenia?.message}
          {...register("contrasenia", { required: "Ingresa tu contraseña" })}
        />
        <Link to="/recuperar-password" className="-mt-2 self-end text-xs text-marfil-suave hover:text-ocre">
          ¿Olvidaste tu contraseña?
        </Link>
        <Button type="submit" cargando={isSubmitting} className="mt-2 w-full">
          Entrar
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-marfil-suave">
        ¿No tienes cuenta?{" "}
        <Link to="/registro" className="font-medium text-ocre hover:underline">
          Regístrate
        </Link>
      </p>
    </AuthCard>
  );
}
