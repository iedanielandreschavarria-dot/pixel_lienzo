import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { registrarComprador } from "../../api/auth";
import { listarCategorias } from "../../api/categorias";
import { useToast } from "../../context/ToastContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { AuthCard } from "./AuthCard";
import { obtenerMensajeError } from "../../api/client";

interface FormValues {
  correo_electronico: string;
  contrasenia: string;
  confirmar: string;
  categorias_interes: number[];
}

export function RegistroCompradorPage() {
  const navigate = useNavigate();
  const { notificar } = useToast();
  const { data: categorias } = useQuery({ queryKey: ["categorias"], queryFn: listarCategorias });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { categorias_interes: [] } });

  const contrasenia = watch("contrasenia");

  const onSubmit = async (values: FormValues) => {
    try {
      await registrarComprador({
        correo_electronico: values.correo_electronico,
        contrasenia: values.contrasenia,
        categorias_interes: (values.categorias_interes ?? []).map(Number),
      });
      notificar("Cuenta creada. Revisa tu correo para el código de verificación.");
      navigate("/verificar-email", { state: { correo: values.correo_electronico } });
    } catch (error) {
      notificar(obtenerMensajeError(error, "No fue posible completar el registro"), "error");
    }
  };

  return (
    <AuthCard titulo="Cuenta de Comprador" subtitulo="Descubre y adquiere obras originales" ancho="max-w-lg">
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
          autoComplete="new-password"
          error={errors.contrasenia?.message}
          {...register("contrasenia", {
            required: "Ingresa una contraseña",
            minLength: { value: 8, message: "Mínimo 8 caracteres" },
          })}
        />
        <Input
          label="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          error={errors.confirmar?.message}
          {...register("confirmar", {
            required: "Confirma tu contraseña",
            validate: (value) => value === contrasenia || "Las contraseñas no coinciden",
          })}
        />

        {categorias && categorias.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-marfil-suave">Categorías de interés (opcional)</p>
            <div className="flex flex-wrap gap-2">
              {categorias.map((c) => (
                <label
                  key={c.id_categoria}
                  className="flex items-center gap-2 rounded-full border border-antracita-suave px-3 py-1.5 text-sm text-marfil has-checked:border-ocre has-checked:bg-ocre/10 has-checked:text-ocre"
                >
                  <input type="checkbox" value={c.id_categoria} className="accent-ocre" {...register("categorias_interes")} />
                  {c.nombre_categoria}
                </label>
              ))}
            </div>
          </div>
        )}

        <Button type="submit" cargando={isSubmitting} className="mt-2 w-full">
          Crear cuenta
        </Button>
      </form>
    </AuthCard>
  );
}
