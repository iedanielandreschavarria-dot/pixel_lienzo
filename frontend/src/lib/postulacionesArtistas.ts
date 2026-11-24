import {
  generarResumenCuratorialLocal,
  type ResumenCuratorialIA,
} from "./iaCuraduria";

export type EstadoPostulacionArtista = "Pendiente" | "Aprobada" | "Rechazada";

export interface PostulacionArtista {
  id_postulacion: string;
  fecha_envio: string;
  estado: EstadoPostulacionArtista;
  motivos_rechazo: string | null;
  // Bloque 1: Perfilamiento Rápido (Preguntas 1 a 5)
  p1_dedicacion: string;
  p2_obra_disponible: string;
  p3_trayectoria: string;
  p4_vinculo_palacio: string;
  p5_especialidad: string;
  // Bloque 2: Información Personal y Curatorial (Preguntas 6 a 10)
  p6_nombre: string;
  p7_correo: string;
  p7_whatsapp: string;
  p8_ciudad: string;
  p8_instagram: string;
  p9_statement: string;
  p10_portafolio_nombre: string;
  p10_portafolio_tamano_mb: string;
  p10_portafolio_data_url: string;
  // Resumen de Inteligencia Curatorial generado por IA
  resumen_ia?: ResumenCuratorialIA;
}

const STORAGE_KEY_POSTULACIONES = "pyl_postulaciones_artistas_v1";

/**
 * Postulación de muestra inicial para que el Curador pueda ver de inmediato
 * cómo luce una solicitud completa con las 10 respuestas en `/curaduria?seccion=artistas`,
 * además de todas las que se envíen desde `/artistas/quiero-formar-parte`.
 */
const POSTULACIONES_INICIALES: PostulacionArtista[] = [
  {
    id_postulacion: "POST-PAL-2026-001",
    fecha_envio: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    estado: "Pendiente",
    motivos_rechazo: null,
    p1_dedicacion: "Actividad principal",
    p2_obra_disponible: "Lista para exhibir y vender",
    p3_trayectoria: "Galerías o museos",
    p4_vinculo_palacio: "He expuesto aquí antes",
    p5_especialidad: "Pintura y Dibujo",
    p6_nombre: "Alejandro Montoya Vélez",
    p7_correo: "alejandro.montoya@arteantioquia.co",
    p7_whatsapp: "310 482 9104",
    p8_ciudad: "Medellín",
    p8_instagram: "@alejandromontoya.arte",
    p9_statement:
      "Pintor e investigador plástico radicado en Medellín. Mi obra explora la memoria arquitectónica del centro histórico y la luz sobre el ladrillo y la piedra neorrománica a través de veladuras al óleo y pigmentos minerales sobre lino crudo.",
    p10_portafolio_nombre: "Portafolio_Alejandro_Montoya_2026.pdf",
    p10_portafolio_tamano_mb: "3.42 MB",
    p10_portafolio_data_url: "",
  },
];

export function listarPostulacionesArtistas(): PostulacionArtista[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_POSTULACIONES);
    const base = !raw
      ? POSTULACIONES_INICIALES
      : (JSON.parse(raw) as PostulacionArtista[]);
    const lista = Array.isArray(base) && base.length > 0 ? base : POSTULACIONES_INICIALES;
    // Asegurar que toda postulación tenga su resumen IA precalculado listo para el Curador
    const enriquecidas = lista.map((item) =>
      item.resumen_ia
        ? item
        : {
          ...item,
          resumen_ia: generarResumenCuratorialLocal(item),
        }
    );
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY_POSTULACIONES, JSON.stringify(enriquecidas));
    }
    return enriquecidas;
  } catch {
    return POSTULACIONES_INICIALES.map((item) => ({
      ...item,
      resumen_ia: generarResumenCuratorialLocal(item),
    }));
  }
}

export function guardarPostulacionArtista(
  nueva: Omit<
    PostulacionArtista,
    "id_postulacion" | "fecha_envio" | "estado" | "motivos_rechazo" | "resumen_ia"
  >,
  resumenIaPrecalculado?: ResumenCuratorialIA
): PostulacionArtista {
  const actuales = listarPostulacionesArtistas();
  const consecutivo = String(actuales.length + 1).padStart(3, "0");
  const borrador: PostulacionArtista = {
    ...nueva,
    id_postulacion: `POST-PAL-2026-${consecutivo}`,
    fecha_envio: new Date().toISOString(),
    estado: "Pendiente",
    motivos_rechazo: null,
  };
  const registro: PostulacionArtista = {
    ...borrador,
    resumen_ia: resumenIaPrecalculado ?? generarResumenCuratorialLocal(borrador),
  };
  const actualizadas = [registro, ...actuales];
  try {
    window.localStorage.setItem(STORAGE_KEY_POSTULACIONES, JSON.stringify(actualizadas));
  } catch {
    const registroLigero: PostulacionArtista = {
      ...registro,
      p10_portafolio_data_url: "",
    };
    window.localStorage.setItem(
      STORAGE_KEY_POSTULACIONES,
      JSON.stringify([registroLigero, ...actuales])
    );
    return registroLigero;
  }
  return registro;
}

export function actualizarResumenIAPostulacion(
  idPostulacion: string,
  nuevoResumen: ResumenCuratorialIA
): PostulacionArtista[] {
  const actuales = listarPostulacionesArtistas();
  const actualizadas = actuales.map((item) =>
    item.id_postulacion === idPostulacion
      ? {
        ...item,
        resumen_ia: nuevoResumen,
      }
      : item
  );
  try {
    window.localStorage.setItem(STORAGE_KEY_POSTULACIONES, JSON.stringify(actualizadas));
  } catch {
    // ignore storage errors
  }
  return actualizadas;
}

export function decidirPostulacionArtista(
  idPostulacion: string,
  aprobar: boolean,
  motivosRechazo?: string
): PostulacionArtista[] {
  const actuales = listarPostulacionesArtistas();
  const actualizadas = actuales.map((item) => {
    if (item.id_postulacion !== idPostulacion) return item;
    return {
      ...item,
      estado: (aprobar ? "Aprobada" : "Rechazada") as EstadoPostulacionArtista,
      motivos_rechazo: aprobar ? null : (motivosRechazo ?? null),
    };
  });
  try {
    window.localStorage.setItem(STORAGE_KEY_POSTULACIONES, JSON.stringify(actualizadas));
  } catch {
    // ignore storage errors
  }
  return actualizadas;
}

export function leerArchivoComoDataUrl(file: File): Promise<string> {
  // Si pesa más de 3.5 MB evitamos saturar localStorage y guardamos referencia directa
  if (file.size > 3.5 * 1024 * 1024) {
    return Promise.resolve("");
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(typeof reader.result === "string" ? reader.result : "");
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

