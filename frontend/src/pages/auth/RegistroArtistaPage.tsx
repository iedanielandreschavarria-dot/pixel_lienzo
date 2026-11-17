import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { registrarArtista } from "../../api/auth";
import { subirDocumentoIdentidad } from "../../api/archivos";
import { useToast } from "../../context/ToastContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { FileUpload } from "../../components/ui/FileUpload";
import { FormErrorSummary, type ErrorCampoItem } from "../../components/ui/FormErrorSummary";
import { AuthCard } from "./AuthCard";
import { obtenerMensajeError } from "../../api/client";

interface FormValues {
  correo_electronico: string;
  contrasenia: string;
  confirmar: string;
  biografia_profesional: string;
  informacion_bancaria: string;
  acepta_terminos: boolean;
}

export function RegistroArtistaPage() {
  const navigate = useNavigate();
  const { notificar } = useToast();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [errorArchivo, setErrorArchivo] = useState<string | undefined>(undefined);

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
    defaultValues: { acepta_terminos: false },
  });

  const contrasenia = watch("contrasenia");

  const listaErrores = [
    errors.correo_electronico?.message
      ? { idCampo: "campo-correo-artista", etiqueta: "Correo", mensaje: errors.correo_electronico.message }
      : null,
    errors.contrasenia?.message
      ? { idCampo: "campo-clave-artista", etiqueta: "Contraseña", mensaje: errors.contrasenia.message }
      : null,
    errors.confirmar?.message
      ? { idCampo: "campo-confirmar-artista", etiqueta: "Confirmar contraseña", mensaje: errors.confirmar.message }
      : null,
    errorArchivo
      ? { idCampo: "campo-documento-artista", etiqueta: "Documento de identidad", mensaje: errorArchivo }
      : null,
    errors.acepta_terminos?.message
      ? { idCampo: "campo-terminos-artista", etiqueta: "Términos", mensaje: errors.acepta_terminos.message }
      : null,
  ].filter((item): item is ErrorCampoItem => item !== null);

  const onSubmit = async (values: FormValues) => {
    if (!archivo) {
      setErrorArchivo("Adjunta tu documento de identidad para continuar.");
      notificar("Adjunta tu documento de identidad para continuar.", "error");
      return;
    }
    setErrorArchivo(undefined);
    try {
      const documento_identidad_url = await subirDocumentoIdentidad(archivo);
      await registrarArtista({
        correo_electronico: values.correo_electronico,
        contrasenia: values.contrasenia,
        biografia_profesional: values.biografia_profesional || undefined,
        informacion_bancaria: values.informacion_bancaria || undefined,
        documento_identidad_url,
      });
      notificar("Cuenta creada. Un curador revisará tu perfil antes de que puedas publicar obras.", "exito");
      navigate("/verificar-email", { state: { correo: values.correo_electronico } });
    } catch (error) {
      notificar(obtenerMensajeError(error, "No fue posible completar el registro."), "error");
    }
  };

  return (
    <AuthCard titulo="Crear cuenta" subtitulo="Tu lugar en la sala">
      <div className="roles-acceso mb-[var(--espacio-24)]" role="group" aria-label="Tipo de cuenta">
        <Link to="/registro/comprador" className="rol-acceso">
          <span className="rol-acceso__titulo">Coleccionista</span>
          <span className="rol-acceso__detalle">Compra y colecciona obras</span>
        </Link>
        <Link to="/registro/artista" aria-current="page" className="rol-acceso rol-acceso--activo">
          <span className="rol-acceso__titulo">Artista</span>
          <span className="rol-acceso__detalle">Publica y vende tu trabajo</span>
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-[var(--espacio-24)]">
        <FormErrorSummary errores={listaErrores.length > 2 ? listaErrores : []} />

        <Input
          id="campo-correo-artista"
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
          id="campo-clave-artista"
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
          id="campo-confirmar-artista"
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

        <Textarea
          variante="subrayado"
          label="Biografía profesional (opcional)"
          rows={3}
          {...register("biografia_profesional")}
        />

        <Input
          variante="subrayado"
          label="Información bancaria (opcional)"
          {...register("informacion_bancaria")}
        />

        <div id="campo-documento-artista">
          <FileUpload
            label="Documento de identidad"
            archivoActual={archivo ? { nombre: archivo.name, tamanoBytes: archivo.size } : null}
            onSelectFile={(file: File) => {
              setArchivo(file);
              setErrorArchivo(undefined);
            }}
            accept="image/jpeg,image/png,image/webp,application/pdf"
            ayuda="JPG, PNG, WEBP o PDF · Máximo 10 MB"
            error={errorArchivo}
          />
        </div>

        <div>
          <label className="flex cursor-pointer items-start gap-[var(--espacio-12)] text-[length:var(--text-cuerpo-pequeno)] text-[color:var(--tinta-suave)]">
            <input
              id="campo-terminos-artista"
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

