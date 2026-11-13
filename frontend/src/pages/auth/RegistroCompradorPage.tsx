import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { registrarComprador } from "../../api/auth";
import { listarCategorias } from "../../api/categorias";
import { useToast } from "../../context/ToastContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { FormErrorSummary, type ErrorCampoItem } from "../../components/ui/FormErrorSummary";
import { AuthCard } from "./AuthCard";
import { obtenerMensajeError } from "../../api/client";

interface FormValues {
  correo_electronico: string;
  contrasenia: string;
  confirmar: string;
  categorias_interes: number[];
  acepta_terminos: boolean;
}

export function RegistroCompradorPage() {
  const navigate = useNavigate();
  const { notificar } = useToast();
  const { data: categorias } = useQuery({ queryKey: ["categorias"], queryFn: listarCategorias });

  useEffect(() => {
    document.title = "Crear cuenta · Pixel & Lienzo";
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    mode: "onBlur",
    defaultValues: { categorias_interes: [], acepta_terminos: false },
  });

  const contrasenia = watch("contrasenia");

  const listaErrores = [
    errors.correo_electronico?.message
      ? { idCampo: "campo-correo-comprador", etiqueta: "Correo", mensaje: errors.correo_electronico.message }
      : null,
    errors.contrasenia?.message
      ? { idCampo: "campo-clave-comprador", etiqueta: "Contraseña", mensaje: errors.contrasenia.message }
      : null,
    errors.confirmar?.message
      ? { idCampo: "campo-confirmar-comprador", etiqueta: "Confirmar contraseña", mensaje: errors.confirmar.message }
      : null,
    errors.acepta_terminos?.message
      ? { idCampo: "campo-terminos-comprador", etiqueta: "Términos", mensaje: errors.acepta_terminos.message }
      : null,
  ].filter((item): item is ErrorCampoItem => item !== null);

  const onSubmit = async (values: FormValues) => {
    try {
      await registrarComprador({
        correo_electronico: values.correo_electronico,
        contrasenia: values.contrasenia,
        categorias_interes: (values.categorias_interes ?? []).map(Number),
      });
      notificar("Cuenta creada. Revisa tu correo para el código de verificación.", "exito");
      navigate("/verificar-email", { state: { correo: values.correo_electronico } });
    } catch (error) {
      notificar(obtenerMensajeError(error, "No fue posible completar el registro."), "error");
    }
  };

  return (
    <AuthCard titulo="Crear cuenta" subtitulo="Tu lugar en la sala">
      <div className="roles-acceso mb-[var(--espacio-24)]" role="group" aria-label="Tipo de cuenta">
        <Link to="/registro/comprador" aria-current="page" className="rol-acceso rol-acceso--activo">
          <span className="rol-acceso__titulo">Coleccionista</span>
          <span className="rol-acceso__detalle">Compra y colecciona obras</span>
        </Link>
        <Link to="/registro/artista" className="rol-acceso">
          <span className="rol-acceso__titulo">Artista</span>
          <span className="rol-acceso__detalle">Publica y vende tu trabajo</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-[var(--espacio-24)]">
        <FormErrorSummary errores={listaErrores.length > 2 ? listaErrores : []} />

        <Input
          id="campo-correo-comprador"
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
          id="campo-clave-comprador"
          variante="subrayado"
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          ayuda="Usa al menos 8 caracteres."
          error={errors.contrasenia?.message}
          {...register("contrasenia", {
            required: "Usa al menos 8 caracteres.",
            minLength: { value: 8, message: "Usa al menos 8 caracteres." },
          })}
        />

        <Input
          id="campo-confirmar-comprador"
          variante="subrayado"
          label="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          error={errors.confirmar?.message}
          {...register("confirmar", {
            required: "Confirma tu contraseña.",
            validate: (value) => value === contrasenia || "Las contraseñas no coinciden.",
          })}
        />

        {categorias && categorias.length > 0 && (
          <fieldset className="border-0 p-0">
            <legend className="mb-[var(--espacio-8)] font-[var(--fuente-acento)] text-[length:1.1rem] italic font-medium text-[color:var(--tinta-suave)]">
              Categorías de interés (opcional)
            </legend>
            <div className="flex flex-wrap gap-[var(--espacio-8)]">
              {categorias.map((c) => (
                <label
                  key={c.id_categoria}
                  className="inline-flex min-h-[var(--alto-control-compacto)] cursor-pointer items-center gap-[var(--espacio-8)] rounded-[var(--radio-pildora)] border border-[color:var(--borde-reposo)] px-[var(--espacio-16)] py-[var(--espacio-4)] text-[length:var(--text-cuerpo-pequeno)] text-[color:var(--tinta-suave)] transition-colors duration-[var(--duracion-hover)] hover:border-[color:var(--borde-hover)] has-checked:border-[color:var(--riel)] has-checked:bg-[color:var(--carmesi)]/30 has-checked:text-[color:var(--tinta)]"
                >
                  <input
                    type="checkbox"
                    value={c.id_categoria}
                    className="accent-[color:var(--carmesi)]"
                    {...register("categorias_interes")}
                  />
                  {c.nombre_categoria}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <div>
          <label className="flex cursor-pointer items-start gap-[var(--espacio-12)] text-[length:var(--text-cuerpo-pequeno)] text-[color:var(--tinta-suave)]">
            <input
              id="campo-terminos-comprador"
              type="checkbox"
              className="mt-[var(--espacio-4)] h-[var(--espacio-16)] w-[var(--espacio-16)] cursor-pointer accent-[color:var(--carmesi)]"
              {...register("acepta_terminos", {
                required: "Acepta los términos y la política de privacidad para continuar.",
              })}
            />
            <span>Acepto los términos y la política de privacidad</span>
          </label>
          {errors.acepta_terminos?.message && (
            <p role="alert" className="mt-[var(--espacio-4)] flex items-center gap-[var(--espacio-8)] text-[length:var(--text-cuerpo-pequeno)] text-[color:var(--aviso)]">
              <span
                aria-hidden="true"
                className="inline-grid h-[1.15rem] w-[1.15rem] shrink-0 place-items-center rounded-[var(--radio-circulo)] border border-[color:var(--aviso)] font-[var(--fuente-poster)] text-[length:0.75rem] leading-none"
              >
                !
              </span>
              <span>{errors.acepta_terminos.message}</span>
            </p>
          )}
        </div>

        <Button type="submit" variante="primario" cargando={isSubmitting} className="w-full">
          Crear cuenta
        </Button>

        <div className="divisor-riel">
          <span>¿Ya tienes cuenta?</span>
        </div>

        <p className="text-center text-[length:var(--text-cuerpo)] text-[color:var(--tinta-suave)]">
          <Link to="/login" className="enlace-acceso">
            ← Volver a iniciar sesión
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}

