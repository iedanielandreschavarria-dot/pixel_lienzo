import api from "../api/client";
import type { PostulacionArtista } from "./postulacionesArtistas";

export interface ResumenCuratorialIA {
  puntaje_afinidad: number;
  nivel_prioridad: string;
  perfil_sintesis: string;
  analisis_statement: string;
  fortalezas: string[];
  aspectos_verificar: string[];
  recomendacion_curatorial: string;
  mensaje_sugerido_whatsapp: string;
  motor_utilizado: string;
  fecha_generacion: string;
}

/**
 * Motor de Inteligencia Curatorial local (instantáneo y determinista):
 * Analiza las 10 respuestas del formulario "Quiero formar parte" y el
 * perfil del artista para entregar al Curador un dictamen estructurado.
 */
export function generarResumenCuratorialLocal(
  postulacion: PostulacionArtista,
  enfoqueExtra?: "riguroso" | "comercial" | "estandar"
): ResumenCuratorialIA {
  let puntaje = 50;
  const fortalezas: string[] = [];
  const aspectosVerificar: string[] = [];

  // 1. Evaluación de dedicación profesional (Pregunta 1)
  if (postulacion.p1_dedicacion === "Actividad principal") {
    puntaje += 15;
    fortalezas.push("Dedicación exclusiva al oficio artístico");
  } else if (postulacion.p1_dedicacion === "Combinada con otras labores") {
    puntaje += 10;
    fortalezas.push("Producción artística constante combinada");
  } else if (postulacion.p1_dedicacion === "Emergente o estudiante") {
    puntaje += 7;
    fortalezas.push("Perfil emergente con proyección académica");
    aspectosVerificar.push("Validar madurez técnica y consistencia de serie en el PDF");
  } else {
    puntaje += 7;
    fortalezas.push("Formación autodidacta con búsqueda propia");
    aspectosVerificar.push("Revisar soporte técnico y conservación de materiales");
  }

  // 2. Disponibilidad de obra (Pregunta 2)
  if (postulacion.p2_obra_disponible === "Lista para exhibir y vender") {
    puntaje += 18;
    fortalezas.push("Obra terminada lista para sala y venta inmediata");
  } else if (postulacion.p2_obra_disponible === "Requiere montaje") {
    puntaje += 11;
    aspectosVerificar.push("Coordinar ficha de montaje especial en arcos/sala del Palacio");
  } else if (postulacion.p2_obra_disponible === "En producción") {
    puntaje += 6;
    aspectosVerificar.push("Confirmar fecha de finalización de obra en producción");
  } else {
    aspectosVerificar.push("Sin obra disponible actualmente para exhibición inmediata");
  }

  // 3. Trayectoria expositiva (Pregunta 3)
  if (postulacion.p3_trayectoria === "Galerías o museos") {
    puntaje += 12;
    fortalezas.push("Trayectoria comprobada en galerías o museos");
  } else if (postulacion.p3_trayectoria === "Espacios independientes o ferias") {
    puntaje += 9;
    fortalezas.push("Participación en ferias y espacios independientes");
  } else {
    puntaje += 3;
    aspectosVerificar.push("Primera exposición formal: acompañar curaduría de montaje");
  }

  // 4. Vínculo con el Palacio Nacional (Pregunta 4)
  if (postulacion.p4_vinculo_palacio === "Tengo taller o galería aquí") {
    puntaje += 10;
    fortalezas.push("Artista con taller o galería activa en el Palacio Nacional");
  } else if (postulacion.p4_vinculo_palacio === "He expuesto aquí antes") {
    puntaje += 8;
    fortalezas.push("Ya conoce la dinámica expositiva del Palacio Nacional");
  } else {
    fortalezas.push(`Nuevo talento externo desde ${postulacion.p8_ciudad}`);
  }

  // 5. Análisis semántico del Artist Statement (Pregunta 9)
  const textoStatement = postulacion.p9_statement.trim();
  const palabras = textoStatement.split(/\s+/).filter(Boolean);
  if (textoStatement.length >= 130) {
    puntaje += 7;
    fortalezas.push(`Artist Statement bien fundamentado (${palabras.length} palabras)`);
  } else {
    aspectosVerificar.push("Solicitar ampliación de la declaración de obra para ficha de sala");
  }

  // Detectar ejes temáticos en el statement
  const ejesDetectados: string[] = [];
  const stLower = textoStatement.toLowerCase();
  if (/memoria|historia|patrimonio|arquitectura|ciudad|territorio/.test(stLower)) {
    ejesDetectados.push("memoria y territorio");
  }
  if (/luz|color|óleo|oleo|materia|textura|pigmento|lienzo/.test(stLower)) {
    ejesDetectados.push("exploración matérica y lumínica");
  }
  if (/cuerpo|identidad|retrato|figura|humano/.test(stLower)) {
    ejesDetectados.push("identidad y figuración");
  }
  if (/abstrac|geometr|espacio|vacio|vacío|forma/.test(stLower)) {
    ejesDetectados.push("geometría y abstracción espacial");
  }
  if (/digital|video|instalaci|sonido|tecnolog/.test(stLower)) {
    ejesDetectados.push("experimentación medial");
  }
  const ejeTexto =
    ejesDetectados.length > 0
      ? ejesDetectados.join(", ")
      : `la disciplina de ${postulacion.p5_especialidad.toLowerCase()}`;

  if (enfoqueExtra === "comercial" && postulacion.p2_obra_disponible === "Lista para exhibir y vender") {
    puntaje = Math.min(99, puntaje + 3);
  } else if (enfoqueExtra === "riguroso" && postulacion.p3_trayectoria === "Sin exposiciones previas") {
    puntaje = Math.max(40, puntaje - 4);
  }

  puntaje = Math.max(38, Math.min(98, puntaje));

  let nivelPrioridad = "Afinidad Media · Revisar Portafolio";
  let recomendacion = "";

  if (puntaje >= 82) {
    nivelPrioridad = "Alta Prioridad · Recomendado para Sala";
    recomendacion = `Aprobar postulación. ${postulacion.p6_nombre} presenta alta madurez en ${postulacion.p5_especialidad}, cuenta con obra (${postulacion.p2_obra_disponible.toLowerCase()}) y su línea dialoga directamente con el perfil coleccionista del Palacio Nacional.`;
  } else if (puntaje >= 65) {
    nivelPrioridad = "Afinidad Media-Alta · Candidato Viable";
    recomendacion = `Perfil viable en ${postulacion.p5_especialidad}. Se recomienda revisar las obras del archivo «${postulacion.p10_portafolio_nombre}» y validar disponibilidad para el próximo ciclo expositivo.`;
  } else {
    nivelPrioridad = "En Desarrollo · Seguimiento Curatorial";
    recomendacion = `Se sugiere agendar revisión de portafolio o visita curatorial antes de asignar espacio en sala, verificando disponibilidad de obra terminada.`;
  }

  if (aspectosVerificar.length === 0) {
    aspectosVerificar.push(
      `Confirmar dimensiones y avalúos en COP dentro de ${postulacion.p10_portafolio_nombre}`
    );
  }

  const perfilSintesis = `${postulacion.p6_nombre} (${postulacion.p8_ciudad}) se especializa en ${postulacion.p5_especialidad}, con dedicación «${postulacion.p1_dedicacion.toLowerCase()}» y trayectoria en «${postulacion.p3_trayectoria.toLowerCase()}». Su vínculo con el Palacio Nacional es «${postulacion.p4_vinculo_palacio.toLowerCase()}» y dispone de obra «${postulacion.p2_obra_disponible.toLowerCase()}».`;

  const extracto =
    textoStatement.length > 190 ? `${textoStatement.slice(0, 187).trim()}…` : textoStatement;
  const analisisStatement = `El discurso curatorial del artista se articula en torno a ${ejeTexto}. En su declaración destaca: “${extracto}”. Adjunta portafolio en PDF (${postulacion.p10_portafolio_nombre}, ${postulacion.p10_portafolio_tamano_mb}) y galería rápida en Instagram (${postulacion.p8_instagram}).`;

  const mensajeSugeridoWhatsapp = `Hola ${postulacion.p6_nombre}, te escribimos del Comité Curatorial del Palacio Nacional de Medellín. Hemos analizado tu postulación (${postulacion.id_postulacion}) en la categoría de ${postulacion.p5_especialidad} junto con tu declaración de obra sobre ${ejeTexto} y tu portafolio PDF. Nos gustaría avanzar contigo al siguiente paso curatorial.`;

  return {
    puntaje_afinidad: puntaje,
    nivel_prioridad: nivelPrioridad,
    perfil_sintesis: perfilSintesis,
    analisis_statement: analisisStatement,
    fortalezas,
    aspectos_verificar: aspectosVerificar,
    recomendacion_curatorial: recomendacion,
    mensaje_sugerido_whatsapp: mensajeSugeridoWhatsapp,
    motor_utilizado: "IA Curatorial · Palacio Nacional",
    fecha_generacion: new Date().toISOString(),
  };
}

/**
 * Solicita el resumen curatorial al endpoint `/artistas/resumen-ia` del backend
 * (que usa Gemini 2.5 Flash si está configurado) y si el servidor no está activo
 * utiliza de inmediato el motor local sin fallar nunca.
 */
export async function obtenerResumenCuratorialIA(
  postulacion: PostulacionArtista,
  enfoqueExtra?: "riguroso" | "comercial" | "estandar"
): Promise<ResumenCuratorialIA> {
  try {
    const { data } = await api.post<Omit<ResumenCuratorialIA, "fecha_generacion">>(
      "/artistas/resumen-ia",
      {
        p1_dedicacion: postulacion.p1_dedicacion,
        p2_obra_disponible: postulacion.p2_obra_disponible,
        p3_trayectoria: postulacion.p3_trayectoria,
        p4_vinculo_palacio: postulacion.p4_vinculo_palacio,
        p5_especialidad: postulacion.p5_especialidad,
        p6_nombre: postulacion.p6_nombre,
        p7_correo: postulacion.p7_correo,
        p7_whatsapp: postulacion.p7_whatsapp,
        p8_ciudad: postulacion.p8_ciudad,
        p8_instagram: postulacion.p8_instagram,
        p9_statement: postulacion.p9_statement,
        p10_portafolio_nombre: postulacion.p10_portafolio_nombre,
      }
    );
    return {
      ...data,
      fecha_generacion: new Date().toISOString(),
    };
  } catch {
    return generarResumenCuratorialLocal(postulacion, enfoqueExtra);
  }
}
