import { type FormEvent, useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronRight, Upload } from "lucide-react";
import clsx from "clsx";
import { Ambiente } from "../../components/escena/Ambiente";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { rutaInicialPorRol } from "../../lib/navegacion";
import {
  guardarPostulacionArtista,
  leerArchivoComoDataUrl,
} from "../../lib/postulacionesArtistas";

const OPCIONES_P1_DEDICACION = [
  "Actividad principal",
  "Combinada con otras labores",
  "Emergente o estudiante",
  "Autodidacta",
] as const;

const OPCIONES_P2_OBRA_DISPONIBLE = [
  "Lista para exhibir y vender",
  "Requiere montaje",
  "En producción",
  "Sin obra disponible",
] as const;

const OPCIONES_P3_TRAYECTORIA = [
  "Galerías o museos",
  "Espacios independientes o ferias",
  "Sin exposiciones previas",
] as const;

const OPCIONES_P4_VINCULO_PALACIO = [
  "Tengo taller o galería aquí",
  "He expuesto aquí antes",
  "Artista externo",
] as const;

const OPCIONES_P5_ESPECIALIDAD = [
  "Pintura y Dibujo",
  "Escultura y Objeto",
  "Fotografía y Gráfica",
  "Instalación y Textil",
  "Nuevos Medios",
  "Multidisciplinar",
] as const;

const TOTAL_PREGUNTAS = 10;

interface MetaPregunta {
  numero: number;
  pregunta: string;
  obligatoria?: boolean;
}

const META_PREGUNTAS: readonly MetaPregunta[] = [
  {
    numero: 1,
    pregunta: "¿Te dedicas profesionalmente al arte?",
    obligatoria: true,
  },
  {
    numero: 2,
    pregunta: "¿Tienes obra producida y disponible actualmente?",
    obligatoria: true,
  },
  {
    numero: 3,
    pregunta: "¿Cuál es tu trayectoria expositiva previa?",
    obligatoria: true,
  },
  {
    numero: 4,
    pregunta: "¿Cuál es tu vínculo con el Palacio Nacional de Medellín?",
    obligatoria: true,
  },
  {
    numero: 5,
    pregunta: "¿En qué te especializas?",
    obligatoria: true,
  },
  {
    numero: 6,
    pregunta: "¿Cuál es tu nombre completo o nombre del colectivo?",
    obligatoria: true,
  },
  {
    numero: 7,
    pregunta: "¿Cuál es tu correo electrónico y WhatsApp de contacto?",
    obligatoria: true,
  },
  {
    numero: 8,
    pregunta: "¿Cuál es tu ciudad de residencia e Instagram profesional?",
    obligatoria: true,
  },
  {
    numero: 9,
    pregunta: "Biografía corta y declaración de obra (Artist Statement)",
    obligatoria: true,
  },
  {
    numero: 10,
    pregunta: "Portafolio del artista en PDF",
    obligatoria: true,
  },
];

/**
 * Formulario de postulación de artistas con diseño FormFlow (1 pregunta por pantalla):
 * - Barra superior delgada de progreso integrada en el borde de la tarjeta.
 * - Contador minimalista `X › 10`.
 * - Preguntas 1-5: Opciones apiladas verticalmente a ancho completo con círculo radio a la izquierda.
 * - Preguntas 6-9: Campos con línea inferior limpia ("Escribe tu respuesta aquí...").
 * - Pregunta 10: Carga de Portafolio del artista en PDF.
 * - Pie con `← Back` a la izquierda y botón `Siguiente →` a la derecha (activo al responder).
 */
export function QuieroFormarPartePage() {
  const { user } = useAuth();
  const { notificar } = useToast();
  const navigate = useNavigate();

  // Un usuario que ya es Artista, Curador o Administrador no debe llenar el formulario de postulación de artista nuevo:
  // se le redirige directamente a su panel correspondiente.
  if (user && (user.rol === "Artista" || user.rol === "Curador" || user.rol === "Administrador")) {
    const destino =
      user.rol === "Curador"
        ? "/curaduria?seccion=artistas"
        : rutaInicialPorRol(user.rol);
    return <Navigate to={destino} replace />;
  }

  const [pasoActual, setPasoActual] = useState(0);

  // Bloque 1 (Preguntas 1 a 5)
  const [p1Dedicacion, setP1Dedicacion] = useState("");
  const [p2ObraDisponible, setP2ObraDisponible] = useState("");
  const [p3Trayectoria, setP3Trayectoria] = useState("");
  const [p4VinculoPalacio, setP4VinculoPalacio] = useState("");
  const [p5Especialidad, setP5Especialidad] = useState("");

  // Bloque 2 (Preguntas 6 a 10)
  const [p6Nombre, setP6Nombre] = useState("");
  const [p7Correo, setP7Correo] = useState("");
  const [p7Whatsapp, setP7Whatsapp] = useState("");
  const [p8Ciudad, setP8Ciudad] = useState("");
  const [p8Instagram, setP8Instagram] = useState("");
  const [p9Statement, setP9Statement] = useState("");
  const [p10ArchivoPdf, setP10ArchivoPdf] = useState<File | null>(null);

  const [errorActual, setErrorActual] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [postulacionEnviada, setPostulacionEnviada] = useState(false);

  useEffect(() => {
    document.title = "Formulario artistas · Palacio Nacional · Pixel & Lienzo";
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const meta = META_PREGUNTAS[pasoActual] ?? META_PREGUNTAS[0];
  const porcentajeProgreso = Math.round(((pasoActual + 1) / TOTAL_PREGUNTAS) * 100);

  const validarPaso = (indice: number): string | null => {
    switch (indice) {
      case 0:
        return p1Dedicacion ? null : "Selecciona una opción para continuar.";
      case 1:
        return p2ObraDisponible ? null : "Selecciona una opción para continuar.";
      case 2:
        return p3Trayectoria ? null : "Selecciona una opción para continuar.";
      case 3:
        return p4VinculoPalacio ? null : "Selecciona una opción para continuar.";
      case 4:
        return p5Especialidad ? null : "Selecciona una opción para continuar.";
      case 5:
        return p6Nombre.trim().length >= 2
          ? null
          : "Escribe tu nombre artístico o el del colectivo.";
      case 6:
        if (!p7Correo.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p7Correo.trim())) {
          return "Ingresa un correo electrónico válido.";
        }
        if (!p7Whatsapp.trim() || p7Whatsapp.trim().length < 7) {
          return "Ingresa tu número de WhatsApp de contacto.";
        }
        return null;
      case 7:
        if (!p8Ciudad.trim()) return "Ingresa tu ciudad de residencia.";
        if (!p8Instagram.trim()) return "Ingresa tu usuario o enlace de Instagram profesional.";
        return null;
      case 8:
        if (!p9Statement.trim() || p9Statement.trim().length < 20) {
          return "Escribe tu biografía corta y declaración de obra (mínimo 20 caracteres).";
        }
        if (p9Statement.length > 1200) {
          return "Máximo 1.200 caracteres.";
        }
        return null;
      case 9:
        return p10ArchivoPdf ? null : "Adjunta tu portafolio del artista en PDF.";
      default:
        return null;
    }
  };

  const pasoRespondido = validarPaso(pasoActual) === null;

  const avanzarPregunta = () => {
    const mensajeError = validarPaso(pasoActual);
    if (mensajeError) {
      setErrorActual(mensajeError);
      return;
    }
    setErrorActual(null);
    if (pasoActual < TOTAL_PREGUNTAS - 1) {
      setPasoActual((prev) => prev + 1);
    }
  };

  const retrocederPregunta = () => {
    setErrorActual(null);
    if (pasoActual > 0) {
      setPasoActual((prev) => prev - 1);
    } else {
      navigate("/artistas");
    }
  };

  const manejarSeleccionPdf = (file: File | undefined) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setErrorActual("El portafolio debe ser un archivo en formato PDF.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setErrorActual("El archivo PDF no debe superar los 25 MB.");
      return;
    }
    setP10ArchivoPdf(file);
    setErrorActual(null);
  };

  const manejarSubmitPaso = async (e: FormEvent) => {
    e.preventDefault();
    if (pasoActual < TOTAL_PREGUNTAS - 1) {
      avanzarPregunta();
      return;
    }

    const errorFinal = validarPaso(9);
    if (errorFinal || !p10ArchivoPdf) {
      setErrorActual(errorFinal);
      return;
    }

    setEnviando(true);
    const dataUrlPdf = await leerArchivoComoDataUrl(p10ArchivoPdf);
    guardarPostulacionArtista({
      p1_dedicacion: p1Dedicacion,
      p2_obra_disponible: p2ObraDisponible,
      p3_trayectoria: p3Trayectoria,
      p4_vinculo_palacio: p4VinculoPalacio,
      p5_especialidad: p5Especialidad,
      p6_nombre: p6Nombre.trim(),
      p7_correo: p7Correo.trim(),
      p7_whatsapp: p7Whatsapp.trim(),
      p8_ciudad: p8Ciudad.trim(),
      p8_instagram: p8Instagram.trim(),
      p9_statement: p9Statement.trim(),
      p10_portafolio_nombre: p10ArchivoPdf.name,
      p10_portafolio_tamano_mb: `${(p10ArchivoPdf.size / (1024 * 1024)).toFixed(2)} MB`,
      p10_portafolio_data_url: dataUrlPdf,
    });

    window.setTimeout(() => {
      setEnviando(false);
      setPostulacionEnviada(true);
      notificar(
        "Postulación registrada en la bandeja del Curador (/curaduria?seccion=artistas).",
        "exito"
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 450);
  };

  const renderListaRadioVertical = (
    opciones: readonly string[],
    valorActual: string,
    guardar: (val: string) => void
  ) => (
    <div
      role="radiogroup"
      aria-label={meta.pregunta}
      className="flex flex-col gap-3.5"
    >
      {opciones.map((opcion) => {
        const seleccionada = valorActual === opcion;
        return (
          <button
            key={opcion}
            type="button"
            role="radio"
            aria-checked={seleccionada}
            onClick={() => {
              guardar(opcion);
              setErrorActual(null);
            }}
            className={clsx(
              "flex w-full items-center gap-3.5 rounded-lg border px-5 py-4 text-left font-[var(--fuente-texto)] text-[1.15rem] font-medium transition-all duration-200 cursor-pointer",
              seleccionada
                ? "border-[color:var(--riel)] bg-[color:var(--carmesi)]/25 text-[color:var(--tinta)] shadow-[0_4px_18px_rgba(216,184,136,0.12)]"
                : "border-[color:var(--divisor)] bg-[rgba(246,243,236,0.02)] text-[color:var(--tinta)] hover:border-[color:var(--borde-reposo)] hover:bg-[rgba(246,243,236,0.05)]"
            )}
          >
            <span
              aria-hidden="true"
              className={clsx(
                "inline-grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border transition-colors",
                seleccionada
                  ? "border-[color:var(--riel)] bg-[color:var(--riel)]"
                  : "border-[color:var(--tinta-suave)] bg-transparent"
              )}
            >
              {seleccionada && <span className="h-2 w-2 rounded-full bg-[#181614]" />}
            </span>
            <span>{opcion}</span>
          </button>
        );
      })}
    </div>
  );

  if (postulacionEnviada) {
    return (
      <div className="relative min-h-screen py-[var(--espacio-48)] animate-[aparecer-pagina_500ms_ease_forwards]">
        <Ambiente nivel={2} />
        <div className="contenedor-pyl relative z-10 mx-auto max-w-[760px] flex flex-col gap-[var(--espacio-32)]">
          <h1 className="voz-h1 text-[color:var(--tinta)]">Formulario artistas</h1>

          <section className="overflow-hidden rounded-xl border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-32)] sm:p-[var(--espacio-48)] shadow-[var(--sombra-tarjeta)]">
            <div className="flex items-center gap-3 text-[color:var(--exito)]">
              <CheckCircle2 size={28} strokeWidth={1.6} />
              <span className="voz-etiqueta">Postulación Completada (10 / 10)</span>
            </div>

            <h2 className="voz-h2 mt-4 text-[color:var(--tinta)]">
              Gracias por postularte, {p6Nombre}
            </h2>
            <p className="voz-cuerpo mt-4 text-[color:var(--tinta-suave)]">
              El comité curatorial del Palacio Nacional de Medellín revisará tus respuestas y tu
              portafolio en PDF (<strong className="text-[color:var(--tinta)]">{p10ArchivoPdf?.name}</strong>
              ). Nos pondremos en contacto contigo al correo{" "}
              <strong className="text-[color:var(--tinta)]">{p7Correo}</strong> o vía WhatsApp al{" "}
              <strong className="text-[color:var(--tinta)]">{p7Whatsapp}</strong>.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[color:var(--divisor)] pt-6">
              <Link to="/artistas">
                <Button variante="secundario">← Volver a Artistas</Button>
              </Link>
              <a
                href={`https://wa.me/573106332874?text=${encodeURIComponent(
                  `Hola, soy ${p6Nombre} (${p5Especialidad}) y acabo de completar mi postulación en el Formulario de Artistas del Palacio Nacional.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline"
              >
                <Button variante="primario">Confirmar por WhatsApp al Palacio</Button>
              </a>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen py-[var(--espacio-32)] sm:py-[var(--espacio-48)] animate-[aparecer-pagina_500ms_ease_forwards]">
      <Ambiente nivel={2} />

      <div className="contenedor-pyl relative z-10 mx-auto max-w-[820px] flex flex-col gap-[var(--espacio-24)]">
        {/* Título superior externo tal como en la referencia */}
        <h1 className="font-[var(--fuente-titulo)] text-[2.2rem] sm:text-[2.6rem] font-black tracking-tight text-[color:var(--tinta)]">
          Formulario artistas
        </h1>

        {/* Tarjeta central estilo FormFlow */}
        <div className="relative overflow-hidden rounded-xl border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] shadow-[0_24px_64px_rgba(0,0,0,0.45)]">
          {/* Barra superior delgada de progreso pegada al borde superior de la tarjeta */}
          <div className="h-[4px] w-full bg-[color:var(--divisor)]">
            <div
              className="h-full bg-[color:var(--riel)] transition-all duration-300"
              style={{ width: `${porcentajeProgreso}%` }}
            />
          </div>

          <form
            key={pasoActual}
            onSubmit={manejarSubmitPaso}
            noValidate
            className="mx-auto flex min-h-[460px] w-full max-w-[600px] flex-col justify-between px-6 py-10 sm:px-10 sm:py-14 animate-[aparecer-pagina_260ms_ease_forwards]"
          >
            {/* Encabezado centrado: ARTISTA NUEVO PALACIO NACIONAL */}
            <div>
              <p className="text-center font-[var(--fuente-poster)] text-[1.1rem] sm:text-[1.25rem] uppercase tracking-[0.08em] text-[color:var(--tinta)]">
                ARTISTA NUEVO PALACIO NACIONAL
              </p>

              {/* Contador X › 10 y título de la pregunta */}
              <div className="mt-10">
                <div className="inline-flex items-center gap-1.5 font-[var(--fuente-texto)] text-[1rem] font-medium text-[color:var(--tinta-suave)]">
                  <span>{pasoActual + 1}</span>
                  <ChevronRight size={14} strokeWidth={1.8} />
                  <span>{TOTAL_PREGUNTAS}</span>
                </div>

                <h2 className="mt-2 font-[var(--fuente-titulo)] text-[1.65rem] sm:text-[2rem] font-black leading-[1.2] text-[color:var(--tinta)]">
                  {meta.pregunta}
                  {meta.obligatoria && (
                    <span className="ml-1.5 text-[color:var(--riel)]" aria-hidden="true">
                      *
                    </span>
                  )}
                </h2>
              </div>

              {/* Cuerpo de respuesta según el paso (1 a 10) */}
              <div className="mt-7">
                {pasoActual === 0 &&
                  renderListaRadioVertical(
                    OPCIONES_P1_DEDICACION,
                    p1Dedicacion,
                    setP1Dedicacion
                  )}

                {pasoActual === 1 &&
                  renderListaRadioVertical(
                    OPCIONES_P2_OBRA_DISPONIBLE,
                    p2ObraDisponible,
                    setP2ObraDisponible
                  )}

                {pasoActual === 2 &&
                  renderListaRadioVertical(
                    OPCIONES_P3_TRAYECTORIA,
                    p3Trayectoria,
                    setP3Trayectoria
                  )}

                {pasoActual === 3 &&
                  renderListaRadioVertical(
                    OPCIONES_P4_VINCULO_PALACIO,
                    p4VinculoPalacio,
                    setP4VinculoPalacio
                  )}

                {pasoActual === 4 &&
                  renderListaRadioVertical(
                    OPCIONES_P5_ESPECIALIDAD,
                    p5Especialidad,
                    setP5Especialidad
                  )}

                {/* Pregunta 6: Texto corto con línea inferior limpia */}
                {pasoActual === 5 && (
                  <div className="pt-2">
                    <input
                      id="p6-nombre"
                      type="text"
                      autoFocus
                      placeholder="Escribe tu respuesta aquí..."
                      value={p6Nombre}
                      onChange={(e) => {
                        setP6Nombre(e.target.value);
                        if (errorActual) setErrorActual(null);
                      }}
                      className="w-full border-0 border-b-2 border-[color:var(--borde-reposo)] bg-transparent px-0 py-3 font-[var(--fuente-texto)] text-[1.35rem] text-[color:var(--tinta)] placeholder:text-[color:var(--tinta-suave)]/65 transition-colors focus:border-[color:var(--riel)] focus:outline-none"
                    />
                  </div>
                )}

                {/* Pregunta 7: Correo electrónico y WhatsApp en la misma fila con línea inferior */}
                {pasoActual === 6 && (
                  <div className="grid grid-cols-1 gap-6 pt-2 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="p7-correo"
                        className="block font-[var(--fuente-texto)] text-[0.95rem] text-[color:var(--tinta-suave)]"
                      >
                        Correo electrónico
                      </label>
                      <input
                        id="p7-correo"
                        type="email"
                        autoFocus
                        placeholder="Escribe tu correo aquí..."
                        value={p7Correo}
                        onChange={(e) => {
                          setP7Correo(e.target.value);
                          if (errorActual) setErrorActual(null);
                        }}
                        className="mt-1 w-full border-0 border-b-2 border-[color:var(--borde-reposo)] bg-transparent px-0 py-2.5 font-[var(--fuente-texto)] text-[1.25rem] text-[color:var(--tinta)] placeholder:text-[color:var(--tinta-suave)]/65 transition-colors focus:border-[color:var(--riel)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="p7-whatsapp"
                        className="block font-[var(--fuente-texto)] text-[0.95rem] text-[color:var(--tinta-suave)]"
                      >
                        WhatsApp de contacto
                      </label>
                      <input
                        id="p7-whatsapp"
                        type="tel"
                        placeholder="Ej. 310 000 0000"
                        value={p7Whatsapp}
                        onChange={(e) => {
                          setP7Whatsapp(e.target.value);
                          if (errorActual) setErrorActual(null);
                        }}
                        className="mt-1 w-full border-0 border-b-2 border-[color:var(--borde-reposo)] bg-transparent px-0 py-2.5 font-[var(--fuente-texto)] text-[1.25rem] text-[color:var(--tinta)] placeholder:text-[color:var(--tinta-suave)]/65 transition-colors focus:border-[color:var(--riel)] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Pregunta 8: Ciudad de residencia e Instagram profesional en la misma fila */}
                {pasoActual === 7 && (
                  <div className="grid grid-cols-1 gap-6 pt-2 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="p8-ciudad"
                        className="block font-[var(--fuente-texto)] text-[0.95rem] text-[color:var(--tinta-suave)]"
                      >
                        Ciudad de residencia
                      </label>
                      <input
                        id="p8-ciudad"
                        type="text"
                        autoFocus
                        placeholder="Ej. Medellín"
                        value={p8Ciudad}
                        onChange={(e) => {
                          setP8Ciudad(e.target.value);
                          if (errorActual) setErrorActual(null);
                        }}
                        className="mt-1 w-full border-0 border-b-2 border-[color:var(--borde-reposo)] bg-transparent px-0 py-2.5 font-[var(--fuente-texto)] text-[1.25rem] text-[color:var(--tinta)] placeholder:text-[color:var(--tinta-suave)]/65 transition-colors focus:border-[color:var(--riel)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="p8-instagram"
                        className="block font-[var(--fuente-texto)] text-[0.95rem] text-[color:var(--tinta-suave)]"
                      >
                        Instagram profesional
                      </label>
                      <input
                        id="p8-instagram"
                        type="text"
                        placeholder="@tuusuario"
                        value={p8Instagram}
                        onChange={(e) => {
                          setP8Instagram(e.target.value);
                          if (errorActual) setErrorActual(null);
                        }}
                        className="mt-1 w-full border-0 border-b-2 border-[color:var(--borde-reposo)] bg-transparent px-0 py-2.5 font-[var(--fuente-texto)] text-[1.25rem] text-[color:var(--tinta)] placeholder:text-[color:var(--tinta-suave)]/65 transition-colors focus:border-[color:var(--riel)] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Pregunta 9: Biografía corta y declaración de obra (máx. 1.200 caracteres) */}
                {pasoActual === 8 && (
                  <div className="pt-2">
                    <textarea
                      id="p9-statement"
                      rows={4}
                      autoFocus
                      placeholder="Escribe tu respuesta aquí (máx. 1.200 caracteres)..."
                      value={p9Statement}
                      onChange={(e) => {
                        setP9Statement(e.target.value.slice(0, 1200));
                        if (errorActual) setErrorActual(null);
                      }}
                      className="w-full resize-y border-0 border-b-2 border-[color:var(--borde-reposo)] bg-transparent px-0 py-2.5 font-[var(--fuente-texto)] text-[1.2rem] text-[color:var(--tinta)] placeholder:text-[color:var(--tinta-suave)]/65 transition-colors focus:border-[color:var(--riel)] focus:outline-none"
                    />
                    <div className="mt-2 flex justify-end font-[var(--fuente-texto)] text-[0.9rem] text-[color:var(--tinta-suave)]">
                      {p9Statement.length} / 1200
                    </div>
                  </div>
                )}

                {/* Pregunta 10: Portafolio del artista en PDF */}
                {pasoActual === 9 && (
                  <label
                    htmlFor="p10-dossier-pdf"
                    className={clsx(
                      "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8 text-center transition-colors cursor-pointer",
                      errorActual
                        ? "border-[color:var(--aviso)] bg-[rgba(246,243,236,0.02)]"
                        : p10ArchivoPdf
                          ? "border-[color:var(--riel)] bg-[color:var(--carmesi)]/20"
                          : "border-[color:var(--borde-reposo)] bg-[rgba(246,243,236,0.02)] hover:border-[color:var(--riel)]"
                    )}
                  >
                    <Upload size={26} strokeWidth={1.5} className="text-[color:var(--riel)]" />
                    {p10ArchivoPdf ? (
                      <div>
                        <p className="font-[var(--fuente-titulo)] text-[1.15rem] font-black text-[color:var(--tinta)]">
                          {p10ArchivoPdf.name}
                        </p>
                        <p className="voz-cuerpo-pequeno mt-1 text-[color:var(--riel)]">
                          {(p10ArchivoPdf.size / (1024 * 1024)).toFixed(2)} MB · Haz clic para
                          cambiar el archivo PDF
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-[var(--fuente-texto)] text-[1.15rem] font-semibold text-[color:var(--tinta)]">
                          Subir portafolio del artista en PDF
                        </p>
                        <p className="voz-cuerpo-pequeno mt-1 text-[color:var(--tinta-suave)]">
                          Formato PDF (máx. 25 MB).
                        </p>
                      </div>
                    )}
                    <input
                      id="p10-dossier-pdf"
                      type="file"
                      accept="application/pdf,.pdf"
                      className="sr-only"
                      onChange={(e) => manejarSeleccionPdf(e.target.files?.[0])}
                    />
                  </label>
                )}

                {errorActual && (
                  <p
                    role="alert"
                    className="mt-3 font-[var(--fuente-texto)] text-[0.98rem] font-medium text-[color:var(--aviso)]"
                  >
                    {errorActual}
                  </p>
                )}
              </div>
            </div>

            {/* Fila inferior idéntica a la referencia: `← Back` a la izquierda y `Siguiente →` a la derecha */}
            <div className="mt-10 flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={retrocederPregunta}
                className="inline-flex items-center gap-2 bg-transparent border-0 p-0 font-[var(--fuente-texto)] text-[1.08rem] font-medium text-[color:var(--tinta-suave)] transition-colors hover:text-[color:var(--tinta)] cursor-pointer"
              >
                <ArrowLeft size={16} strokeWidth={1.8} />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={enviando}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-md px-6 py-2.5 font-[var(--fuente-texto)] text-[1.08rem] font-semibold transition-all duration-200 cursor-pointer",
                  pasoRespondido
                    ? "border border-[color:var(--riel)] bg-[color:var(--carmesi)] text-[color:var(--tinta-inversa)] shadow-[0_6px_18px_rgba(0,0,0,0.3)] hover:bg-[color:var(--incandescente)]"
                    : "border border-transparent bg-[rgba(246,243,236,0.14)] text-[color:var(--tinta-suave)] hover:bg-[rgba(246,243,236,0.2)]"
                )}
              >
                <span>
                  {pasoActual < TOTAL_PREGUNTAS - 1
                    ? "Siguiente"
                    : enviando
                      ? "Enviando…"
                      : "Enviar"}
                </span>
                {pasoActual < TOTAL_PREGUNTAS - 1 ? (
                  <ArrowRight size={16} strokeWidth={1.8} />
                ) : (
                  <Check size={16} strokeWidth={1.8} />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
