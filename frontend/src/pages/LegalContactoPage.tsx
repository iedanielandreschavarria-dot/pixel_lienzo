import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Ambiente } from "../components/escena/Ambiente";
import { Banner } from "../components/ui/Banner";
import { Button } from "../components/ui/Button";
import { FormErrorSummary, type ErrorCampoItem } from "../components/ui/FormErrorSummary";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Tabs, type ItemPestana } from "../components/ui/Tabs";
import { Textarea } from "../components/ui/Textarea";
import { useToast } from "../context/ToastContext";

export type VistaLegal = "terminos" | "privacidad" | "acerca" | "contacto";

interface SeccionDocumento {
  id: string;
  titulo: string;
  parrafos: string[];
}

const SECCIONES_TERMINOS: SeccionDocumento[] = [
  {
    id: "objeto-alcance",
    titulo: "1. Objeto y alcance de la plataforma",
    parrafos: [
      "Pixel & Lienzo opera como un mercado curatorial de arte físico y en movimiento con certificados de autenticidad verificables mediante sello criptográfico SHA-256.",
      "Cada obra publicada en el catálogo ha superado un proceso de validación documental del artista y una revisión técnica por parte del comité de curaduría.",
    ],
  },
  {
    id: "registro-roles",
    titulo: "2. Registro de cuentas y roles",
    parrafos: [
      "Las personas usuarias pueden registrarse bajo el perfil de Coleccionista o de Artista. La vinculación como Artista exige la entrega de documento de identidad y validación curatorial previa a la publicación de obras.",
      "Cada titular es responsable de resguardar sus credenciales de acceso y, cuando esté activo, su segundo factor de autenticación.",
    ],
  },
  {
    id: "adquisicion-pagos",
    titulo: "3. Adquisición de obras y liquidación",
    parrafos: [
      "Todas las obras del catálogo se ofrecen como piezas únicas o ediciones certificadas expresamente numeradas. Los precios se expresan en pesos colombianos ($ COP) con impuestos detallados antes del pago.",
      "El procesamiento del pago se realiza a través de la pasarela aliada Wompi. Una vez confirmado el pago por la entidad financiera, se registra el cambio de titularidad en la cadena de trazabilidad de la obra.",
    ],
  },
  {
    id: "certificados-autenticidad",
    titulo: "4. Certificados de autenticidad y verificación",
    parrafos: [
      "Cada certificado emitido por Curaduría incorpora un código único y un sello SHA-256 calculado sobre la ficha técnica de la pieza. Cualquier persona puede comprobar su validez de forma pública sin necesidad de iniciar sesión.",
      "Incluso si una cuenta de usuario se cierra en el futuro, los certificados emitidos y el historial de procedencia de las obras se conservan de manera permanente para proteger su valor cultural y patrimonial.",
    ],
  },
  {
    id: "propiedad-intelectual",
    titulo: "5. Propiedad intelectual y derechos morales",
    parrafos: [
      "La adquisición de una obra transfiere la titularidad material o el ejemplar certificado al coleccionista, conservando el artista la totalidad de los derechos morales de autoría conforme a la legislación colombiana e internacional.",
      "Las imágenes del catálogo público se sirven con protección de previsualización y no pueden reproducirse con fines comerciales sin autorización expresa.",
    ],
  },
];

const SECCIONES_PRIVACIDAD: SeccionDocumento[] = [
  {
    id: "responsable-datos",
    titulo: "1. Responsable del tratamiento",
    parrafos: [
      "Pixel & Lienzo trata los datos personales conforme a la Ley 1581 de 2012 y sus decretos reglamentarios en Colombia, aplicando principios de finalidad legítima, minimización y seguridad.",
    ],
  },
  {
    id: "datos-recolectados",
    titulo: "2. Información que recolectamos",
    parrafos: [
      "Recolectamos únicamente los datos necesarios para la operación de la cuenta, la validación de identidad de los artistas, la facturación y el despacho de obras físicas.",
      "La información bancaria de liquidación de los artistas se almacena cifrada en el servidor y nunca se expone de vuelta al navegador.",
    ],
  },
  {
    id: "privacidad-certificados",
    titulo: "3. Privacidad en la verificación pública",
    parrafos: [
      "La consulta pública de un certificado de autenticidad muestra únicamente la ficha técnica de la obra y el nombre abreviado del titular actual (por ejemplo, «Camila R.»).",
      "Nunca se exponen públicamente el correo electrónico, la dirección postal, el documento de identidad, el método de pago ni el precio de adquisición.",
    ],
  },
  {
    id: "derechos-titulares",
    titulo: "4. Derechos de las personas titulares",
    parrafos: [
      "En cualquier momento puedes conocer, actualizar, rectificar tus datos o solicitar la eliminación de tu cuenta desde la sección Cuenta o mediante nuestro canal oficial de contacto.",
    ],
  },
];

const SECCIONES_ACERCA: SeccionDocumento[] = [
  {
    id: "mision-curatorial",
    titulo: "1. Nuestra misión curatorial",
    parrafos: [
      "Pixel & Lienzo nació para tender un puente entre la contemplación propia de una sala de exposición y la certeza técnica de la verificación criptográfica.",
      "Acompañamos a artistas visuales, grabadores, pintores y creadores de imagen en movimiento en la catalogación rigurosa de su obra.",
    ],
  },
  {
    id: "arquitectura-confianza",
    titulo: "2. Trazabilidad y permanencia",
    parrafos: [
      "Cada pieza publicada cuenta con una ficha técnica verificada por curaduría y un sello SHA-256 que respalda su autoría, dimensiones, técnica y procedencia a lo largo del tiempo.",
    ],
  },
  {
    id: "aliados-institucionales",
    titulo: "3. Trabajo con museos, galerías y colectivos",
    parrafos: [
      "A través de nuestro módulo institucional colaboramos con espacios expositivos, universidades y archivos para documentar colecciones y emitir reportes verificables de acervo.",
    ],
  },
];

const ASUNTOS_CONTACTO = [
  "Consulta sobre una obra",
  "Soy artista",
  "Soporte con una compra",
  "Prensa o instituciones",
  "Otro",
] as const;

const CORREO_CONTACTO = "contacto@pixelylienzo.co";

function resolverVistaDesdePathname(pathname: string): VistaLegal {
  if (pathname.includes("privacidad")) return "privacidad";
  if (pathname.includes("acerca")) return "acerca";
  if (pathname.includes("contacto")) return "contacto";
  return "terminos";
}

/**
 * 6.16 Páginas legales y de contacto (Nivel 1 — Funcional):
 * - Textos legales (Términos y condiciones, Política de privacidad, Acerca de):
 *   columna de 720 px (--contenedor-lectura), cuerpo de 1.25 rem, índice fijo a la izquierda
 *   en escritorio con los H2, y la línea "Última actualización: 11 de noviembre de 2026".
 *   Estilos de impresión con fondo blanco y texto negro.
 * - Contacto: formulario de 520 px (--contenedor-formulario) con Nombre, Correo, Asunto (selector)
 *   y Mensaje (hasta 1000 caracteres con contador). Confirmación:
 *   "Recibimos tu mensaje. Te responderemos en un plazo de 2 días hábiles."
 */
export function LegalContactoPage({ vistaInicial }: { vistaInicial?: VistaLegal }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { notificar } = useToast();

  const vistaActiva: VistaLegal = vistaInicial ?? resolverVistaDesdePathname(location.pathname);

  // Estado del formulario de Contacto
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [asunto, setAsunto] = useState<string>(ASUNTOS_CONTACTO[0]);
  const [mensaje, setMensaje] = useState("");
  const [erroresContacto, setErroresContacto] = useState<ErrorCampoItem[]>([]);
  const [mensajeEnviado, setMensajeEnviado] = useState(false);

  useEffect(() => {
    const titulos: Record<VistaLegal, string> = {
      terminos: "Términos y condiciones · Pixel & Lienzo",
      privacidad: "Política de privacidad · Pixel & Lienzo",
      acerca: "Acerca de · Pixel & Lienzo",
      contacto: "Contacto · Pixel & Lienzo",
    };
    document.title = titulos[vistaActiva];
  }, [vistaActiva]);

  const pestanasItems: ItemPestana<VistaLegal>[] = [
    { id: "terminos", etiqueta: "Términos y condiciones" },
    { id: "privacidad", etiqueta: "Política de privacidad" },
    { id: "acerca", etiqueta: "Acerca de" },
    { id: "contacto", etiqueta: "Contacto" },
  ];

  const cambiarVista = (nueva: VistaLegal) => {
    const rutas: Record<VistaLegal, string> = {
      terminos: "/legal/terminos",
      privacidad: "/legal/privacidad",
      acerca: "/legal/acerca",
      contacto: "/legal/contacto",
    };
    navigate(rutas[nueva]);
  };

  const seccionesDocumento: SeccionDocumento[] =
    vistaActiva === "privacidad"
      ? SECCIONES_PRIVACIDAD
      : vistaActiva === "acerca"
        ? SECCIONES_ACERCA
        : SECCIONES_TERMINOS;

  const tituloPagina: Record<VistaLegal, string> = {
    terminos: "Términos y condiciones",
    privacidad: "Política de privacidad",
    acerca: "Acerca de Pixel & Lienzo",
    contacto: "Contacto",
  };

  const enviarContacto = (e: FormEvent) => {
    e.preventDefault();
    const nuevosErrores: ErrorCampoItem[] = [];

    if (!nombre.trim()) {
      nuevosErrores.push({
        idCampo: "contacto-nombre",
        etiqueta: "Nombre",
        mensaje: "Ingresa tu nombre completo.",
      });
    }
    if (!correo.trim() || !correo.includes("@")) {
      nuevosErrores.push({
        idCampo: "contacto-correo",
        etiqueta: "Correo",
        mensaje: "Ingresa un correo electrónico válido.",
      });
    }
    if (!mensaje.trim() || mensaje.trim().length < 10) {
      nuevosErrores.push({
        idCampo: "contacto-mensaje",
        etiqueta: "Mensaje",
        mensaje: "Escribe tu mensaje (mínimo 10 caracteres).",
      });
    }

    setErroresContacto(nuevosErrores);
    if (nuevosErrores.length > 0) return;

    setMensajeEnviado(true);
    setNombre("");
    setCorreo("");
    setMensaje("");
  };

  const copiarCorreoOficial = async () => {
    try {
      await navigator.clipboard.writeText(CORREO_CONTACTO);
      notificar("Correo copiado al portapapeles", "exito");
    } catch {
      notificar("No pudimos copiar el correo automáticamente", "error");
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-var(--alto-cabecera))] print:bg-white print:text-black">
      <div className="print:hidden">
        <Ambiente nivel={1} />
      </div>

      <div className="relative z-10 mx-auto max-w-[var(--contenedor-max)] px-[var(--espacio-16)] py-[var(--espacio-48)] sm:px-[var(--espacio-24)]">
        {/* Navegación entre páginas legales y contacto */}
        <div className="mb-[var(--espacio-32)] print:hidden">
          <Tabs
            items={pestanasItems}
            activa={vistaActiva}
            onChange={cambiarVista}
            ariaLabel="Documentos legales y contacto"
          />
        </div>

        {vistaActiva !== "contacto" ? (
          /* TEXTOS LEGALES (Sección 6.16): Índice fijo a la izquierda en escritorio + columna de lectura de 720 px */
          <div className="grid grid-cols-1 gap-[var(--espacio-48)] min-[1024px]:grid-cols-[260px_minmax(0,var(--contenedor-lectura))] print:block">
            {/* Índice fijo a la izquierda con los H2 */}
            <aside
              aria-label="Índice del documento"
              className="hidden min-[1024px]:block print:hidden"
            >
              <div className="sticky top-[calc(var(--alto-cabecera)+var(--espacio-32))] flex flex-col gap-[var(--espacio-12)] border-l border-[color:var(--divisor)] pl-[var(--espacio-16)]">
                <span className="voz-etiqueta text-[color:var(--tinta-suave)]">Contenido</span>
                <ul className="flex flex-col gap-[var(--espacio-8)] list-none p-0 m-0">
                  {seccionesDocumento.map((sec) => (
                    <li key={sec.id}>
                      <a
                        href={`#${sec.id}`}
                        className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)] no-underline transition-colors duration-[var(--duracion-hover)] hover:text-[color:var(--tinta)]"
                      >
                        {sec.titulo}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            {/* Columna de lectura de 720 px con cuerpo de 1.25 rem */}
            <article className="w-full max-w-[var(--contenedor-lectura)] flex flex-col gap-[var(--espacio-32)]">
              <header className="flex flex-col gap-[var(--espacio-12)] border-b border-[color:var(--divisor)] pb-[var(--espacio-24)]">
                <h1 className="voz-h1 text-[color:var(--tinta)] print:text-black">
                  {tituloPagina[vistaActiva]}
                </h1>
                <div className="regla-titulo print:hidden" aria-hidden="true" />
                <p className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)] print:text-black">
                  Última actualización: 11 de noviembre de 2026
                </p>
              </header>

              <div className="flex flex-col gap-[var(--espacio-32)]">
                {seccionesDocumento.map((sec) => (
                  <section
                    key={sec.id}
                    id={sec.id}
                    className="scroll-mt-[calc(var(--alto-cabecera)+var(--espacio-24))] flex flex-col gap-[var(--espacio-16)]"
                  >
                    <h2 className="voz-h2 text-[color:var(--tinta)] print:text-black">
                      {sec.titulo}
                    </h2>
                    {sec.parrafos.map((parrafo, idx) => (
                      <p
                        key={idx}
                        className="voz-cuerpo text-[color:var(--tinta)] print:text-black"
                      >
                        {parrafo}
                      </p>
                    ))}
                  </section>
                ))}
              </div>
            </article>
          </div>
        ) : (
          /* CONTACTO (Sección 6.16): Formulario centrado de 520 px (--contenedor-formulario) */
          <div className="mx-auto w-full max-w-[var(--contenedor-formulario)] flex flex-col gap-[var(--espacio-32)]">
            <header className="flex flex-col gap-[var(--espacio-12)]">
              <h1 className="voz-h1 text-[color:var(--tinta)]">Contacto</h1>
              <div className="regla-titulo" aria-hidden="true" />
              <p className="voz-cuerpo text-[color:var(--tinta-suave)]">
                Escríbenos sobre una obra, tu postulación como artista o cualquier consulta institucional.
              </p>
            </header>

            {mensajeEnviado && (
              <Banner variante="exito">
                Recibimos tu mensaje. Te responderemos en un plazo de 2 días hábiles.
              </Banner>
            )}

            {erroresContacto.length > 0 && <FormErrorSummary errores={erroresContacto} />}

            <form
              onSubmit={enviarContacto}
              noValidate
              className="flex flex-col gap-[var(--espacio-24)] border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-24)] sm:p-[var(--espacio-32)]"
            >
              <Input
                id="contacto-nombre"
                variante="caja"
                label="Nombre"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  if (mensajeEnviado) setMensajeEnviado(false);
                }}
                error={erroresContacto.find((e) => e.idCampo === "contacto-nombre")?.mensaje}
                autoComplete="name"
              />

              <Input
                id="contacto-correo"
                variante="caja"
                type="email"
                label="Correo"
                value={correo}
                onChange={(e) => {
                  setCorreo(e.target.value);
                  if (mensajeEnviado) setMensajeEnviado(false);
                }}
                error={erroresContacto.find((e) => e.idCampo === "contacto-correo")?.mensaje}
                autoComplete="email"
              />

              <Select
                id="contacto-asunto"
                variante="caja"
                label="Asunto"
                value={asunto}
                onChange={(e) => setAsunto(e.target.value)}
              >
                {ASUNTOS_CONTACTO.map((opcion) => (
                  <option key={opcion} value={opcion}>
                    {opcion}
                  </option>
                ))}
              </Select>

              <Textarea
                id="contacto-mensaje"
                variante="caja"
                label="Mensaje"
                rows={5}
                contadorMaximo={1000}
                value={mensaje}
                onChange={(e) => {
                  setMensaje(e.target.value);
                  if (mensajeEnviado) setMensajeEnviado(false);
                }}
                error={erroresContacto.find((e) => e.idCampo === "contacto-mensaje")?.mensaje}
                placeholder="Describe tu consulta con el mayor detalle posible…"
              />

              <Button type="submit" variante="primario" anchoCompleto>
                Enviar mensaje
              </Button>
            </form>

            {/* Correo oficial como texto copiable (nunca mailto: en solitario) */}
            <div className="flex flex-wrap items-center justify-between gap-[var(--espacio-16)] border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-20)]">
              <div className="flex flex-col gap-[var(--espacio-4)]">
                <span className="voz-etiqueta text-[color:var(--tinta-suave)]">
                  Correo directo
                </span>
                <span className="font-[var(--fuente-texto)] font-semibold text-[length:var(--text-dato)] text-[color:var(--tinta)] select-all">
                  {CORREO_CONTACTO}
                </span>
              </div>
              <Button
                type="button"
                variante="secundario"
                tamano="compacto"
                onClick={() => void copiarCorreoOficial()}
              >
                Copiar correo
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

