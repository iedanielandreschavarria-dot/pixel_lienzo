import { OBRAS_MUESTRA_PALACIO, type ObraMuestra } from "./obrasMuestraPalacio";

export interface ResenaArtista {
  id_resena: string;
  id_artista: number;
  autor: string;
  rol_autor: string;
  estrellas: 1 | 2 | 3 | 4 | 5;
  comentario: string;
  obra_adquirida?: string;
  fecha: string;
}

export interface ArtistaMuestraDetalle {
  id_artista: number;
  nombre: string;
  disciplina: string;
  ciudad: string;
  sala_palacio: string;
  foto_url: string;
  biografia: string;
  resenas_iniciales: ResenaArtista[];
}

const STORAGE_KEY_RESENAS_ARTISTAS = "pyl_resenas_artistas_v1";

/**
 * Directorio de artistas de prueba del Palacio Nacional de Medellín:
 * Cada artista tiene su nombre real, disciplina, sala/taller en el Palacio,
 * biografía curatorial, obras asociadas en `OBRAS_MUESTRA_PALACIO` y reseñas con estrellas.
 */
export const ARTISTAS_MUESTRA_PALACIO: ReadonlyArray<ArtistaMuestraDetalle> = [
  {
    id_artista: 101,
    nombre: "Vincent van Gogh",
    disciplina: "Pintura Postimpresionista · Óleo sobre lienzo",
    ciudad: "Zundert / Sala Patrimonial Piso 4",
    sala_palacio: "Sala 402 · Ala Norte",
    foto_url: "/obras/noche-estrellada.jpg",
    biografia:
      "Maestro del postimpresionismo cuya pincelada gestual y uso expresivo del color transformaron la pintura moderna. En esta muestra especial del Palacio Nacional se exhiben ediciones certificadas y estudios cromáticos de «La noche estrellada» y «Los lirios», con sello de trazabilidad SHA-256.",
    resenas_iniciales: [
      {
        id_resena: "RES-101-1",
        id_artista: 101,
        autor: "Carlos Eduardo Restrepo",
        rol_autor: "Coleccionista verificado · Medellín",
        estrellas: 5,
        comentario:
          "La riqueza del empaste y la fidelidad cromática de «La noche estrellada» en la sala del Palacio Nacional son extraordinarias. El certificado SHA-256 y la atención curatorial fueron impecables.",
        obra_adquirida: "La noche estrellada",
        fecha: "2026-11-10",
      },
      {
        id_resena: "RES-101-2",
        id_artista: 101,
        autor: "María Fernanda Gómez",
        rol_autor: "Arquitecta de interiores",
        estrellas: 5,
        comentario:
          "Adquirimos «Los lirios» para nuestro estudio. El visor 3D con escala humana nos ayudó a confirmar exactamente cómo luciría en el muro principal.",
        obra_adquirida: "Los lirios",
        fecha: "2026-10-28",
      },
      {
        id_resena: "RES-101-3",
        id_artista: 101,
        autor: "Dr. Julián Arango",
        rol_autor: "Coleccionista privado",
        estrellas: 5,
        comentario:
          "Una curaduría sobresaliente. La iluminación cálida de la obra y el marco de galería superaron nuestras expectativas.",
        fecha: "2026-10-14",
      },
    ],
  },
  {
    id_artista: 102,
    nombre: "Claude Monet",
    disciplina: "Impresionismo · Paisaje y Luz",
    ciudad: "París / Giverny · Sala 305",
    sala_palacio: "Sala 305 · Claustro Central",
    foto_url: "/obras/impresion-sol-naciente.jpg",
    biografia:
      "Pionero del impresionismo y estudioso incansable de las variaciones de la luz sobre el agua. Sus piezas «Impresión, sol naciente» y «Nenúfares» integran el ciclo de paisaje luminoso exhibido en el tercer nivel del Palacio Nacional de Medellín.",
    resenas_iniciales: [
      {
        id_resena: "RES-102-1",
        id_artista: 102,
        autor: "Laura Cristina Vélez",
        rol_autor: "Coleccionista verificada · Bogotá",
        estrellas: 5,
        comentario:
          "«Impresión, sol naciente» transmite una serenidad única. El proceso de compra y la entrega con su código QR verificable fueron sumamente transparentes.",
        obra_adquirida: "Impresión, sol naciente",
        fecha: "2026-11-12",
      },
      {
        id_resena: "RES-102-2",
        id_artista: 102,
        autor: "Andrés Felipe Mejía",
        rol_autor: "Visitante Noche de Galerías",
        estrellas: 5,
        comentario:
          "La serie de «Nenúfares» vista en persona durante la Noche de Galerías del Palacio Nacional es hipnótica. Excelente selección.",
        obra_adquirida: "Nenúfares",
        fecha: "2026-10-30",
      },
    ],
  },
  {
    id_artista: 103,
    nombre: "Johannes Vermeer",
    disciplina: "Pintura Barroca · Retrato y Claroscuro",
    ciudad: "Delft · Gabinete de Luz Piso 4",
    sala_palacio: "Sala 408 · Gabinete de Luz",
    foto_url: "/obras/joven-perla.jpg",
    biografia:
      "Reconocido por su dominio poético de la luz natural y los pigmentos de lapislázuli. Su obra «La joven de la perla» encabeza la colección de retrato patrimonial verificada por el comité curatorial de Pixel & Lienzo.",
    resenas_iniciales: [
      {
        id_resena: "RES-103-1",
        id_artista: 103,
        autor: "Sofía Londoño Posada",
        rol_autor: "Historiadora del Arte",
        estrellas: 5,
        comentario:
          "El contraste del fondo oscuro con el brillo de la perla y el turbante azul es magistral. Una joya dentro del catálogo del Palacio Nacional.",
        obra_adquirida: "La joven de la perla",
        fecha: "2026-11-08",
      },
      {
        id_resena: "RES-103-2",
        id_artista: 103,
        autor: "Esteban Correa",
        rol_autor: "Coleccionista verificado",
        estrellas: 5,
        comentario:
          "Impecable presentación y documentación técnica en la ficha de trazabilidad.",
        fecha: "2026-10-21",
      },
    ],
  },
  {
    id_artista: 104,
    nombre: "Gustav Klimt",
    disciplina: "Simbolismo & Pan de Oro sobre Lienzo",
    ciudad: "Viena · Bóveda Dorada Piso 5",
    sala_palacio: "Sala 501 · Nivel Terraza",
    foto_url: "/obras/el-beso-klimt.jpg",
    biografia:
      "Figura cumbre del modernismo vienés. Su obra «El beso» combina óleo con laminillas de oro y plata, dialogando en armonía con la paleta de piedra basalto y oro champán de la Sala Palacio Nacional.",
    resenas_iniciales: [
      {
        id_resena: "RES-104-1",
        id_artista: 104,
        autor: "Valentina Salazar",
        rol_autor: "Coleccionista verificada · Medellín",
        estrellas: 5,
        comentario:
          "El trabajo de pan de oro en «El beso» resalta de manera espectacular. Es la pieza central de nuestra sala.",
        obra_adquirida: "El beso",
        fecha: "2026-11-15",
      },
      {
        id_resena: "RES-104-2",
        id_artista: 104,
        autor: "Gabriel Echeverri",
        rol_autor: "Curador invitado",
        estrellas: 4,
        comentario:
          "Formato imponente (180 x 180 cm) y una presencia escénica extraordinaria bajo los arcos del quinto piso.",
        fecha: "2026-11-02",
      },
    ],
  },
  {
    id_artista: 105,
    nombre: "Caspar David Friedrich",
    disciplina: "Romanticismo · Paisaje Sublime",
    ciudad: "Dresde · Sala 312",
    sala_palacio: "Sala 312 · Corredor Carabobo",
    foto_url: "/obras/caminante-mar-nubes.jpg",
    biografia:
      "Máximo exponente del paisaje romántico y la contemplación de la naturaleza sublime. «El caminante sobre el mar de nubes» invita a la introspección frente a la inmensidad de las cumbres.",
    resenas_iniciales: [
      {
        id_resena: "RES-105-1",
        id_artista: 105,
        autor: "Santiago Botero",
        rol_autor: "Coleccionista verificado",
        estrellas: 5,
        comentario:
          "Una obra con una profundidad atmosférica impresionante. Las reseñas y la ficha técnica del Palacio nos dieron total confianza para adquirirla.",
        obra_adquirida: "El caminante sobre el mar de nubes",
        fecha: "2026-11-05",
      },
    ],
  },
  {
    id_artista: 106,
    nombre: "Katsushika Hokusai",
    disciplina: "Obra Gráfica · Xilografía Ukiyo-e",
    ciudad: "Edo (Tokio) · Gabinete Gráfico Piso 3",
    sala_palacio: "Sala 309 · Gabinete de Obra Gráfica",
    foto_url: "/obras/gran-ola-kanagawa.jpg",
    biografia:
      "Maestro del grabado japonés ukiyo-e. Su célebre xilografía policromada «La gran ola de Kanagawa» forma parte del acervo de obra gráfica histórica certificada en el Palacio Nacional.",
    resenas_iniciales: [
      {
        id_resena: "RES-106-1",
        id_artista: 106,
        autor: "Catalina Jaramillo",
        rol_autor: "Diseñadora y coleccionista",
        estrellas: 5,
        comentario:
          "La precisión de las líneas y el azul de Prusia en «La gran ola de Kanagawa» son sublimes. Muy recomendada.",
        obra_adquirida: "La gran ola de Kanagawa",
        fecha: "2026-11-11",
      },
      {
        id_resena: "RES-106-2",
        id_artista: 106,
        autor: "Mauricio Uribe",
        rol_autor: "Coleccionista de obra gráfica",
        estrellas: 5,
        comentario:
          "Excelente conservación y enmarcado de museo. Cinco estrellas.",
        fecha: "2026-10-19",
      },
    ],
  },
];

function cargarMapaResenasExtra(): Record<number, ResenaArtista[]> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_RESENAS_ARTISTAS);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<number, ResenaArtista[]>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function obtenerArtistaMuestra(idArtista: number): ArtistaMuestraDetalle | undefined {
  return ARTISTAS_MUESTRA_PALACIO.find((a) => a.id_artista === idArtista);
}

export function listarObrasDeArtistaMuestra(idArtista: number): ObraMuestra[] {
  return OBRAS_MUESTRA_PALACIO.filter((o) => o.id_artista === idArtista);
}

export function listarResenasDeArtista(idArtista: number): ResenaArtista[] {
  const base = obtenerArtistaMuestra(idArtista)?.resenas_iniciales ?? [
    {
      id_resena: `RES-GEN-${idArtista}-1`,
      id_artista: idArtista,
      autor: "Coleccionista del Palacio Nacional",
      rol_autor: "Adquisición certificada",
      estrellas: 5,
      comentario:
        "Excelente propuesta artística, acabados de primer nivel y certificado de autenticidad verificado en sala.",
      fecha: "2026-11-01",
    },
  ];
  const mapaExtra = cargarMapaResenasExtra();
  const extras = mapaExtra[idArtista] ?? [];
  return [...extras, ...base];
}

export function calcularPromedioEstrellas(resenas: ReadonlyArray<ResenaArtista>): {
  promedio: number;
  total: number;
} {
  if (resenas.length === 0) return { promedio: 5.0, total: 0 };
  const suma = resenas.reduce((acc, r) => acc + r.estrellas, 0);
  return {
    promedio: Number((suma / resenas.length).toFixed(1)),
    total: resenas.length,
  };
}

export function agregarResenaArtista(nueva: {
  id_artista: number;
  autor: string;
  rol_autor?: string;
  estrellas: 1 | 2 | 3 | 4 | 5;
  comentario: string;
  obra_adquirida?: string;
}): ResenaArtista[] {
  const mapaExtra = cargarMapaResenasExtra();
  const registro: ResenaArtista = {
    id_resena: `RES-${nueva.id_artista}-${Date.now()}`,
    id_artista: nueva.id_artista,
    autor: nueva.autor.trim(),
    rol_autor: nueva.rol_autor?.trim() || "Coleccionista · Sala Palacio Nacional",
    estrellas: nueva.estrellas,
    comentario: nueva.comentario.trim(),
    obra_adquirida: nueva.obra_adquirida?.trim() || undefined,
    fecha: new Date().toISOString().slice(0, 10),
  };
  const actualesExtra = mapaExtra[nueva.id_artista] ?? [];
  mapaExtra[nueva.id_artista] = [registro, ...actualesExtra];
  try {
    window.localStorage.setItem(STORAGE_KEY_RESENAS_ARTISTAS, JSON.stringify(mapaExtra));
  } catch {
    // ignore storage errors
  }
  return listarResenasDeArtista(nueva.id_artista);
}

