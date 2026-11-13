import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Ambiente } from "../components/escena/Ambiente";
import { BadgeEstadoValidacion } from "../components/ui/Badge";
import { Banner } from "../components/ui/Banner";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { FileUpload } from "../components/ui/FileUpload";
import { FormErrorSummary, type ErrorCampoItem } from "../components/ui/FormErrorSummary";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Select } from "../components/ui/Select";
import { Skeleton } from "../components/ui/Skeleton";
import { Tabs, type ItemPestana } from "../components/ui/Tabs";
import { formatearFecha } from "../lib/formato";

type PestanaCuenta = "perfil" | "seguridad" | "notificaciones" | "facturacion";

interface DatosPerfil {
  nombreCompleto: string;
  correo: string;
  telefono: string;
  fotoNombre: string | null;
  fotoTamano?: number;
}

interface DatosNotificaciones {
  comprasYCertificados: boolean;
  estadoDePagos: boolean;
  novedadesCatalogo: boolean;
}

interface DatosFacturacion {
  tipoDocumento: string;
  numeroDocumento: string;
  nombreFiscal: string;
  direccion: string;
  ciudad: string;
  departamento: string;
}

interface SesionActiva {
  id: string;
  dispositivo: string;
  ubicacion: string;
  ultimaActividad: string;
  actual: boolean;
}

const SESIONES_INICIALES: SesionActiva[] = [
  {
    id: "ses-actual",
    dispositivo: "Navegador actual · Windows",
    ubicacion: "Bogotá, Colombia",
    ultimaActividad: "Activa ahora",
    actual: true,
  },
  {
    id: "ses-movil",
    dispositivo: "Safari · iPhone",
    ubicacion: "Medellín, Colombia",
    ultimaActividad: "Hace 2 días",
    actual: false,
  },
];

function nombreInicialDesdeCorreo(correo: string): string {
  const local = correo.split("@")[0] ?? "Usuario";
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join(" ");
}

/**
 * 6.11 Cuenta (Nivel 1 — Funcional):
 * Navegación interna con pestañas: Perfil, Seguridad, Notificaciones y Datos de facturación.
 * Campos en formato caja y guardado explícito ("Guardar cambios" deshabilitado hasta que algo cambia).
 * Al guardar aparece un toast salvia: "Cambios guardados".
 * Al final, zona de peligro con "Eliminar cuenta" y modal destructivo que pide contraseña.
 */
export function CuentaPage() {
  const { user, cargando: loading, logout } = useAuth();
  const { notificar } = useToast();
  const navigate = useNavigate();

  const [pestana, setPestana] = useState<PestanaCuenta>("perfil");

  // Estado base y editable: Perfil
  const [perfilBase, setPerfilBase] = useState<DatosPerfil>({
    nombreCompleto: "",
    correo: "",
    telefono: "+57 300 000 0000",
    fotoNombre: null,
  });
  const [perfilForm, setPerfilForm] = useState<DatosPerfil>(perfilBase);

  // Estado: Seguridad (contraseña y sesiones)
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordConfirmar, setPasswordConfirmar] = useState("");
  const [erroresPassword, setErroresPassword] = useState<ErrorCampoItem[]>([]);
  const [sesiones, setSesiones] = useState<SesionActiva[]>(SESIONES_INICIALES);

  // Estado base y editable: Notificaciones
  const [notifBase, setNotifBase] = useState<DatosNotificaciones>({
    comprasYCertificados: true,
    estadoDePagos: true,
    novedadesCatalogo: false,
  });
  const [notifForm, setNotifForm] = useState<DatosNotificaciones>(notifBase);

  // Estado base y editable: Facturación
  const [factBase, setFactBase] = useState<DatosFacturacion>({
    tipoDocumento: "CC",
    numeroDocumento: "",
    nombreFiscal: "",
    direccion: "",
    ciudad: "Bogotá",
    departamento: "Cundinamarca",
  });
  const [factForm, setFactForm] = useState<DatosFacturacion>(factBase);

  // Modal destructivo: Eliminar cuenta
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [passwordEliminar, setPasswordEliminar] = useState("");
  const [errorEliminar, setErrorEliminar] = useState<string | undefined>(undefined);

  useEffect(() => {
    document.title = "Cuenta · Pixel & Lienzo";
  }, []);

  useEffect(() => {
    if (!user) return;
    const nombreSugerido = nombreInicialDesdeCorreo(user.correo_electronico);
    const inicialPerfil: DatosPerfil = {
      nombreCompleto: nombreSugerido,
      correo: user.correo_electronico,
      telefono: "+57 300 000 0000",
      fotoNombre: null,
    };
    setPerfilBase(inicialPerfil);
    setPerfilForm(inicialPerfil);

    setFactBase((prev) => {
      const actualizado = { ...prev, nombreFiscal: prev.nombreFiscal || nombreSugerido };
      setFactForm(actualizado);
      return actualizado;
    });
  }, [user]);

  const itemsPestanas: ItemPestana<PestanaCuenta>[] = [
    { id: "perfil", etiqueta: "Perfil" },
    { id: "seguridad", etiqueta: "Seguridad" },
    { id: "notificaciones", etiqueta: "Notificaciones" },
    { id: "facturacion", etiqueta: "Datos de facturación" },
  ];

  const hayCambiosPerfil =
    perfilForm.nombreCompleto.trim() !== perfilBase.nombreCompleto.trim() ||
    perfilForm.correo.trim() !== perfilBase.correo.trim() ||
    perfilForm.telefono.trim() !== perfilBase.telefono.trim() ||
    perfilForm.fotoNombre !== perfilBase.fotoNombre;

  const hayCambiosPassword =
    passwordActual.length > 0 || passwordNueva.length > 0 || passwordConfirmar.length > 0;

  const hayCambiosNotif =
    notifForm.comprasYCertificados !== notifBase.comprasYCertificados ||
    notifForm.estadoDePagos !== notifBase.estadoDePagos ||
    notifForm.novedadesCatalogo !== notifBase.novedadesCatalogo;

  const hayCambiosFact =
    factForm.tipoDocumento !== factBase.tipoDocumento ||
    factForm.numeroDocumento.trim() !== factBase.numeroDocumento.trim() ||
    factForm.nombreFiscal.trim() !== factBase.nombreFiscal.trim() ||
    factForm.direccion.trim() !== factBase.direccion.trim() ||
    factForm.ciudad.trim() !== factBase.ciudad.trim() ||
    factForm.departamento.trim() !== factBase.departamento.trim();

  const guardarPerfil = (e: FormEvent) => {
    e.preventDefault();
    if (!hayCambiosPerfil) return;
    setPerfilBase(perfilForm);
    notificar("Cambios guardados", "exito");
  };

  const guardarPassword = (e: FormEvent) => {
    e.preventDefault();
    const nuevosErrores: ErrorCampoItem[] = [];

    if (!passwordActual) {
      nuevosErrores.push({
        idCampo: "cuenta-password-actual",
        etiqueta: "Contraseña actual",
        mensaje: "Ingresa tu contraseña actual.",
      });
    }
    if (passwordNueva.length < 8) {
      nuevosErrores.push({
        idCampo: "cuenta-password-nueva",
        etiqueta: "Nueva contraseña",
        mensaje: "La nueva contraseña debe tener al menos 8 caracteres.",
      });
    }
    if (passwordNueva !== passwordConfirmar) {
      nuevosErrores.push({
        idCampo: "cuenta-password-confirmar",
        etiqueta: "Confirmar contraseña",
        mensaje: "Las contraseñas no coinciden.",
      });
    }

    setErroresPassword(nuevosErrores);
    if (nuevosErrores.length > 0) return;

    setPasswordActual("");
    setPasswordNueva("");
    setPasswordConfirmar("");
    notificar("Cambios guardados", "exito");
  };

  const cerrarTodasLasSesiones = () => {
    setSesiones((prev) => prev.filter((s) => s.actual));
    notificar("Cambios guardados", "exito");
  };

  const guardarNotificaciones = (e: FormEvent) => {
    e.preventDefault();
    if (!hayCambiosNotif) return;
    setNotifBase(notifForm);
    notificar("Cambios guardados", "exito");
  };

  const guardarFacturacion = (e: FormEvent) => {
    e.preventDefault();
    if (!hayCambiosFact) return;
    setFactBase(factForm);
    notificar("Cambios guardados", "exito");
  };

  const confirmarEliminarCuenta = async (e: FormEvent) => {
    e.preventDefault();
    if (!passwordEliminar.trim()) {
      setErrorEliminar("Ingresa tu contraseña para confirmar la eliminación.");
      return;
    }
    setErrorEliminar(undefined);
    setModalEliminarAbierto(false);
    await logout();
    notificar("Tu solicitud de eliminación de cuenta fue registrada.", "exito");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="relative min-h-[calc(100vh-var(--alto-cabecera))]">
        <Ambiente nivel={1} />
        <div className="relative z-10 mx-auto max-w-[var(--contenedor-formulario-amplio)] px-[var(--espacio-16)] py-[var(--espacio-48)] sm:px-[var(--espacio-24)]">
          <Skeleton className="h-[var(--espacio-48)] w-48" />
          <Skeleton className="mt-[var(--espacio-24)] h-[var(--alto-control)] w-full" />
          <Skeleton className="mt-[var(--espacio-32)] h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative min-h-[calc(100vh-var(--alto-cabecera))]">
        <Ambiente nivel={1} />
        <div className="relative z-10 mx-auto max-w-[var(--contenedor-max)] px-[var(--espacio-16)] py-[var(--espacio-64)] sm:px-[var(--espacio-24)]">
          <EmptyState
            titulo="Inicia sesión para gestionar tu cuenta."
            descripcion="Desde aquí puedes actualizar tus datos personales, seguridad, notificaciones y facturación."
            accion={
              <Link to="/login">
                <Button variante="primario">Ingresar</Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-var(--alto-cabecera))]">
      <Ambiente nivel={1} />

      <div className="relative z-10 mx-auto max-w-[var(--contenedor-formulario-amplio)] px-[var(--espacio-16)] py-[var(--espacio-48)] sm:px-[var(--espacio-24)]">
        {/* Cabecera */}
        <header className="mb-[var(--espacio-32)]">
          <div className="flex flex-wrap items-center justify-between gap-[var(--espacio-16)]">
            <div>
              <h1 className="voz-h1 text-[color:var(--tinta)]">Cuenta</h1>
              <div className="regla-titulo mt-[var(--espacio-12)]" aria-hidden="true" />
            </div>
            <div className="flex items-center gap-[var(--espacio-12)]">
              <span className="inline-flex h-[var(--alto-estado)] items-center rounded-[var(--radio-recto)] border border-[color:var(--riel)] px-[var(--espacio-8)] font-[var(--fuente-poster)] text-[length:var(--text-etiqueta)] uppercase tracking-[0.12em] text-[color:var(--tinta)]">
                {user.rol}
              </span>
              <span className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">
                Registro: {formatearFecha(user.fecha_registro)}
              </span>
            </div>
          </div>
        </header>

        {/* Pestañas */}
        <Tabs<PestanaCuenta>
          items={itemsPestanas}
          activa={pestana}
          onChange={(nuevaPestana) => setPestana(nuevaPestana)}
          ariaLabel="Secciones de cuenta"
          className="mb-[var(--espacio-32)]"
        />

        {/* Pestaña 1: Perfil */}
        {pestana === "perfil" && (
          <form
            onSubmit={guardarPerfil}
            noValidate
            className="flex flex-col gap-[var(--espacio-24)] border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)] sm:p-[var(--espacio-32)]"
          >
            <h2 className="voz-h3 text-[color:var(--tinta)]">Datos personales</h2>

            <Input
              id="cuenta-nombre"
              variante="caja"
              label="Nombre completo"
              value={perfilForm.nombreCompleto}
              onChange={(e) =>
                setPerfilForm((prev) => ({ ...prev, nombreCompleto: e.target.value }))
              }
              autoComplete="name"
            />

            <Input
              id="cuenta-correo"
              variante="caja"
              type="email"
              label="Correo electrónico"
              value={perfilForm.correo}
              onChange={(e) => setPerfilForm((prev) => ({ ...prev, correo: e.target.value }))}
              ayuda="Enviaremos comprobantes y avisos de seguridad a esta dirección."
              autoComplete="email"
            />

            <Input
              id="cuenta-telefono"
              variante="caja"
              type="tel"
              label="Teléfono"
              value={perfilForm.telefono}
              onChange={(e) => setPerfilForm((prev) => ({ ...prev, telefono: e.target.value }))}
              autoComplete="tel"
            />

            <FileUpload
              label="Fotografía de perfil"
              ayuda="JPG, PNG o WebP, máximo 5 MB."
              accept="image/jpeg,image/png,image/webp"
              archivoActual={
                perfilForm.fotoNombre
                  ? { nombre: perfilForm.fotoNombre, tamanoBytes: perfilForm.fotoTamano }
                  : null
              }
              onSelectFile={(file) =>
                setPerfilForm((prev) => ({
                  ...prev,
                  fotoNombre: file.name,
                  fotoTamano: file.size,
                }))
              }
            />

            <div className="flex justify-end border-t border-[color:var(--divisor)] pt-[var(--espacio-24)]">
              <Button type="submit" variante="primario" disabled={!hayCambiosPerfil}>
                Guardar cambios
              </Button>
            </div>
          </form>
        )}

        {/* Pestaña 2: Seguridad */}
        {pestana === "seguridad" && (
          <div className="flex flex-col gap-[var(--espacio-32)]">
            <form
              onSubmit={guardarPassword}
              noValidate
              className="flex flex-col gap-[var(--espacio-24)] border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)] sm:p-[var(--espacio-32)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-[var(--espacio-12)]">
                <h2 className="voz-h3 text-[color:var(--tinta)]">Cambiar contraseña</h2>
                <BadgeEstadoValidacion estado={user.mfa_activado ? "Verificado" : "Pendiente"} />
              </div>

              {erroresPassword.length > 0 && <FormErrorSummary errores={erroresPassword} />}

              <Input
                id="cuenta-password-actual"
                variante="caja"
                type="password"
                label="Contraseña actual"
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                autoComplete="current-password"
                error={erroresPassword.find((e) => e.idCampo === "cuenta-password-actual")?.mensaje}
              />

              <Input
                id="cuenta-password-nueva"
                variante="caja"
                type="password"
                label="Nueva contraseña"
                value={passwordNueva}
                onChange={(e) => setPasswordNueva(e.target.value)}
                ayuda="Mínimo 8 caracteres."
                autoComplete="new-password"
                error={erroresPassword.find((e) => e.idCampo === "cuenta-password-nueva")?.mensaje}
              />

              <Input
                id="cuenta-password-confirmar"
                variante="caja"
                type="password"
                label="Confirmar nueva contraseña"
                value={passwordConfirmar}
                onChange={(e) => setPasswordConfirmar(e.target.value)}
                autoComplete="new-password"
                error={
                  erroresPassword.find((e) => e.idCampo === "cuenta-password-confirmar")?.mensaje
                }
              />

              <div className="flex justify-end border-t border-[color:var(--divisor)] pt-[var(--espacio-24)]">
                <Button type="submit" variante="primario" disabled={!hayCambiosPassword}>
                  Guardar cambios
                </Button>
              </div>
            </form>

            {/* Sesiones activas */}
            <section className="flex flex-col gap-[var(--espacio-24)] border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)] sm:p-[var(--espacio-32)]">
              <div className="flex flex-wrap items-center justify-between gap-[var(--espacio-16)]">
                <div>
                  <h2 className="voz-h3 text-[color:var(--tinta)]">Sesiones activas</h2>
                  <p className="voz-cuerpo-pequeno mt-[var(--espacio-4)] text-[color:var(--tinta-suave)]">
                    Dispositivos con acceso activo a tu cuenta.
                  </p>
                </div>
                {sesiones.length > 1 && (
                  <Button variante="secundario" tamano="compacto" onClick={cerrarTodasLasSesiones}>
                    Cerrar todas las sesiones
                  </Button>
                )}
              </div>

              <ul className="flex flex-col divide-y divide-[color:var(--divisor)] list-none p-0 m-0">
                {sesiones.map((sesion) => (
                  <li
                    key={sesion.id}
                    className="flex flex-wrap items-center justify-between gap-[var(--espacio-16)] py-[var(--espacio-16)] first:pt-0 last:pb-0"
                  >
                    <div className="flex flex-col gap-[var(--espacio-4)]">
                      <span className="voz-cuerpo text-[color:var(--tinta)]">
                        {sesion.dispositivo}
                      </span>
                      <span className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">
                        {sesion.ubicacion} · {sesion.ultimaActividad}
                      </span>
                    </div>
                    {sesion.actual ? (
                      <span className="inline-flex h-[var(--alto-estado)] items-center rounded-[var(--radio-recto)] border border-[color:var(--exito)] px-[var(--espacio-8)] font-[var(--fuente-poster)] text-[length:var(--text-etiqueta)] uppercase tracking-[0.12em] text-[color:var(--exito)]">
                        Sesión actual
                      </span>
                    ) : (
                      <Button
                        variante="terciario"
                        onClick={() => {
                          setSesiones((prev) => prev.filter((item) => item.id !== sesion.id));
                          notificar("Cambios guardados", "exito");
                        }}
                      >
                        Cerrar sesión
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}

        {/* Pestaña 3: Notificaciones */}
        {pestana === "notificaciones" && (
          <form
            onSubmit={guardarNotificaciones}
            className="flex flex-col gap-[var(--espacio-24)] border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)] sm:p-[var(--espacio-32)]"
          >
            <h2 className="voz-h3 text-[color:var(--tinta)]">Preferencias de notificación</h2>

            <div className="flex flex-col divide-y divide-[color:var(--divisor)]">
              <label className="flex items-start justify-between gap-[var(--espacio-16)] py-[var(--espacio-16)] first:pt-0 cursor-pointer">
                <span className="flex flex-col gap-[var(--espacio-4)]">
                  <span className="voz-cuerpo text-[color:var(--tinta)]">
                    Compras y certificados de autenticidad
                  </span>
                  <span className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">
                    Avisos cuando se emite un certificado verificable o cambia la titularidad de una obra.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={notifForm.comprasYCertificados}
                  onChange={(e) =>
                    setNotifForm((prev) => ({
                      ...prev,
                      comprasYCertificados: e.target.checked,
                    }))
                  }
                  className="mt-[var(--espacio-4)] h-[var(--espacio-20)] w-[var(--espacio-20)] shrink-0 accent-[color:var(--carmesi)]"
                />
              </label>

              <label className="flex items-start justify-between gap-[var(--espacio-16)] py-[var(--espacio-16)] cursor-pointer">
                <span className="flex flex-col gap-[var(--espacio-4)]">
                  <span className="voz-cuerpo text-[color:var(--tinta)]">
                    Confirmaciones de pago y facturación
                  </span>
                  <span className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">
                    Comprobantes y actualizaciones bancarias sobre transacciones en curso.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={notifForm.estadoDePagos}
                  onChange={(e) =>
                    setNotifForm((prev) => ({ ...prev, estadoDePagos: e.target.checked }))
                  }
                  className="mt-[var(--espacio-4)] h-[var(--espacio-20)] w-[var(--espacio-20)] shrink-0 accent-[color:var(--carmesi)]"
                />
              </label>

              <label className="flex items-start justify-between gap-[var(--espacio-16)] py-[var(--espacio-16)] last:pb-0 cursor-pointer">
                <span className="flex flex-col gap-[var(--espacio-4)]">
                  <span className="voz-cuerpo text-[color:var(--tinta)]">
                    Nuevas obras y exposiciones del catálogo
                  </span>
                  <span className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">
                    Selección mensual de piezas publicadas por curaduría.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={notifForm.novedadesCatalogo}
                  onChange={(e) =>
                    setNotifForm((prev) => ({ ...prev, novedadesCatalogo: e.target.checked }))
                  }
                  className="mt-[var(--espacio-4)] h-[var(--espacio-20)] w-[var(--espacio-20)] shrink-0 accent-[color:var(--carmesi)]"
                />
              </label>
            </div>

            <div className="flex justify-end border-t border-[color:var(--divisor)] pt-[var(--espacio-24)]">
              <Button type="submit" variante="primario" disabled={!hayCambiosNotif}>
                Guardar cambios
              </Button>
            </div>
          </form>
        )}

        {/* Pestaña 4: Datos de facturación */}
        {pestana === "facturacion" && (
          <form
            onSubmit={guardarFacturacion}
            noValidate
            className="flex flex-col gap-[var(--espacio-24)] border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)] sm:p-[var(--espacio-32)]"
          >
            <h2 className="voz-h3 text-[color:var(--tinta)]">Datos de facturación</h2>

            <div className="grid grid-cols-1 gap-[var(--espacio-16)] sm:grid-cols-2">
              <Select
                id="cuenta-tipo-doc"
                variante="caja"
                label="Tipo de documento"
                value={factForm.tipoDocumento}
                onChange={(e) =>
                  setFactForm((prev) => ({ ...prev, tipoDocumento: e.target.value }))
                }
              >
                <option value="CC">Cédula de ciudadanía (CC)</option>
                <option value="CE">Cédula de extranjería (CE)</option>
                <option value="NIT">NIT</option>
                <option value="PAS">Pasaporte</option>
              </Select>

              <Input
                id="cuenta-num-doc"
                variante="caja"
                label="Número de documento"
                value={factForm.numeroDocumento}
                onChange={(e) =>
                  setFactForm((prev) => ({ ...prev, numeroDocumento: e.target.value }))
                }
              />
            </div>

            <Input
              id="cuenta-nombre-fiscal"
              variante="caja"
              label="Nombre completo o razón social"
              value={factForm.nombreFiscal}
              onChange={(e) =>
                setFactForm((prev) => ({ ...prev, nombreFiscal: e.target.value }))
              }
            />

            <Input
              id="cuenta-direccion"
              variante="caja"
              label="Dirección fiscal"
              value={factForm.direccion}
              onChange={(e) => setFactForm((prev) => ({ ...prev, direccion: e.target.value }))}
            />

            <div className="grid grid-cols-1 gap-[var(--espacio-16)] sm:grid-cols-2">
              <Input
                id="cuenta-ciudad"
                variante="caja"
                label="Ciudad"
                value={factForm.ciudad}
                onChange={(e) => setFactForm((prev) => ({ ...prev, ciudad: e.target.value }))}
              />

              <Input
                id="cuenta-departamento"
                variante="caja"
                label="Departamento"
                value={factForm.departamento}
                onChange={(e) =>
                  setFactForm((prev) => ({ ...prev, departamento: e.target.value }))
                }
              />
            </div>

            <div className="flex justify-end border-t border-[color:var(--divisor)] pt-[var(--espacio-24)]">
              <Button type="submit" variante="primario" disabled={!hayCambiosFact}>
                Guardar cambios
              </Button>
            </div>
          </form>
        )}

        {/* Zona de peligro: Eliminar cuenta */}
        <section
          aria-labelledby="titulo-zona-peligro"
          className="mt-[var(--espacio-48)] flex flex-col gap-[var(--espacio-16)] border border-[color:var(--peligro)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)] sm:flex-row sm:items-center sm:justify-between sm:p-[var(--espacio-32)]"
        >
          <div className="flex flex-col gap-[var(--espacio-4)]">
            <h2 id="titulo-zona-peligro" className="voz-h3 text-[color:var(--tinta)]">
              Eliminar cuenta
            </h2>
            <p className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">
              Desactiva de forma permanente tu acceso. Las compras y los certificados ya emitidos se conservan.
            </p>
          </div>
          <Button
            variante="destructivo"
            onClick={() => {
              setPasswordEliminar("");
              setErrorEliminar(undefined);
              setModalEliminarAbierto(true);
            }}
          >
            Eliminar cuenta
          </Button>
        </section>
      </div>

      {/* Modal destructivo: Eliminar cuenta */}
      <Modal
        abierto={modalEliminarAbierto}
        onCerrar={() => setModalEliminarAbierto(false)}
        titulo="Eliminar cuenta"
        descripcion="Esta acción cerrará tu cuenta de forma permanente. Las compras y los certificados de autenticidad ya emitidos se conservan para garantizar su verificación pública."
        destructivo
      >
        <form onSubmit={(e) => void confirmarEliminarCuenta(e)} className="flex flex-col gap-[var(--espacio-24)]">
          <Banner variante="aviso">
            Para confirmar que eres el titular de la cuenta, escribe tu contraseña actual.
          </Banner>

          <Input
            id="confirmar-password-eliminar"
            variante="caja"
            type="password"
            label="Contraseña actual"
            value={passwordEliminar}
            onChange={(e) => {
              setPasswordEliminar(e.target.value);
              if (errorEliminar) setErrorEliminar(undefined);
            }}
            error={errorEliminar}
            autoComplete="current-password"
          />

          <div className="flex justify-end gap-[var(--espacio-12)]">
            <Button
              type="button"
              variante="secundario"
              onClick={() => setModalEliminarAbierto(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variante="destructivo"
              disabled={!passwordEliminar.trim()}
            >
              Eliminar cuenta
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
