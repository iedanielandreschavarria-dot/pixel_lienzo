import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { BotonGoogle, type DatosCuentaGoogle } from "../../components/auth/BotonGoogle";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Banner } from "../../components/ui/Banner";
import { AuthCard } from "./AuthCard";
import { rutaInicialPorRol } from "../../lib/navegacion";
import { obtenerMensajeError } from "../../api/client";

interface FormValues {
  correo_electronico: string;
  contrasenia: string;
}

const MENSAJE_CREDENCIALES = "El correo o la contraseña no son correctos.";

export function LoginPage() {
  const { login, loginGoogle } = useAuth();
  const { notificar } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [errorCredenciales, setErrorCredenciales] = useState<string | null>(null);
  // Si el usuario llegó aquí porque intentaba entrar a una ruta protegida, se
  // respeta ese destino; si no, cada rol va a su propia vista principal.
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;

  useEffect(() => {
    document.title = "Entrar · Pixel & Lienzo";
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ mode: "onBlur" });

  const onSubmit = async (values: FormValues) => {
    setErrorCredenciales(null);
    try {
      const resultado = await login(values.correo_electronico, values.contrasenia);
      if (resultado.requiereMfa) {
        navigate("/mfa", { state: { correo: values.correo_electronico, from } });
        return;
      }
      navigate(from ?? rutaInicialPorRol(resultado.rol), { replace: true });
    } catch {
      setErrorCredenciales(MENSAJE_CREDENCIALES);
      notificar(MENSAJE_CREDENCIALES, "error");
    }
  };

  const handleGoogleLogin = async (datos: DatosCuentaGoogle) => {
    setErrorCredenciales(null);
    try {
      const resultado = await loginGoogle(datos.credential);
      if (resultado.requiereMfa) {
        navigate("/mfa", { state: { correo: datos.email, from } });
        return;
      }
      navigate(from ?? rutaInicialPorRol(resultado.rol), { replace: true });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        notificar("Completa tu registro eligiendo si eres Coleccionista o Artista.", "exito");
        navigate("/registro", { state: { googleAuth: datos } });
        return;
      }
      const msg = obtenerMensajeError(error, "No fue posible iniciar sesión con Google.");
      setErrorCredenciales(msg);
      notificar(msg, "error");
    }
  };

  return (
    <AuthCard titulo="Entrar" subtitulo="Vuelve a la sala">
      <div className="mb-[var(--espacio-24)] flex flex-col gap-[var(--espacio-16)]">
        <BotonGoogle
          texto="signin_with"
          etiquetaFallback="Iniciar sesión con Google"
          onSuccess={handleGoogleLogin}
          onError={(msg) => notificar(msg, "error")}
        />
        <div className="divisor-riel">
          <span>o con tu correo</span>
        </div>
      </div>

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
        <Input
          variante="subrayado"
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          error={errors.contrasenia?.message}
          {...register("contrasenia", { required: "Ingresa tu contraseña." })}
        />

        <div className="text-right">
          <Link to="/recuperar-password" className="enlace-acceso text-[length:var(--text-cuerpo-pequeno)]">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {errorCredenciales && <Banner variante="aviso">{errorCredenciales}</Banner>}

        <Button type="submit" variante="primario" cargando={isSubmitting} className="w-full">
          Entrar
        </Button>

        <div className="divisor-riel">
          <span>¿Primera vez?</span>
        </div>

        <p className="text-center text-[length:var(--text-cuerpo)] text-[color:var(--tinta-suave)]">
          <Link to="/registro" className="enlace-acceso">
            Crear cuenta
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}

