import { TarjetaExpandible, type PiezaTarjeta } from "../components/motion/TarjetaExpandible";

const PIEZAS: PiezaTarjeta[] = [
  {
    id: "noche-sobre-el-rio",
    titulo: "Noche sobre el río",
    tecnica: "Óleo",
    imagen:
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1200&q=80",
    imagenAlt: "Pincelada abstracta en ocres y negros",
    artista: "Estudio Palacio",
    anio: "2024",
    precio: "$4.800.000",
    descripcion:
      "Una superficie casi negra interrumpida por una franja de ocre. La pieza se pensó para leerse de cerca: la textura cambia con la luz de la sala.",
  },
  {
    id: "geometria-de-sal",
    titulo: "Geometría de sal",
    tecnica: "Mixta",
    imagen:
      "https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=1200&q=80",
    imagenAlt: "Composición geométrica en blanco y azul",
    artista: "Estudio Palacio",
    anio: "2023",
    precio: "$3.200.000",
    descripcion:
      "Planos superpuestos que dejan ver el soporte. El diálogo se abre desde la misma tarjeta para no perder de vista la obra mientras se leen los datos.",
  },
  {
    id: "umbral",
    titulo: "Umbral",
    tecnica: "Acrílico",
    imagen:
      "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=1200&q=80",
    imagenAlt: "Pintura abstracta con una abertura clara al centro",
    artista: "Estudio Palacio",
    anio: "2025",
    precio: "$6.150.000",
    descripcion:
      "Un claro en el centro del lienzo. El movimiento de apertura usa un muelle corto para que la obra llegue al centro de la pantalla sin rebote de interfaz.",
  },
];

/** Demostración de la tarjeta expandible. No forma parte del catálogo comercial. */
export function EstudioMotionPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10">
      <p className="text-[0.68rem] uppercase tracking-[0.2em] text-ocre">Estudio de movimiento</p>
      <h1 className="mt-3 max-w-xl font-[var(--font-display)] text-4xl text-marfil sm:text-5xl">
        La obra se abre sin salir de la sala
      </h1>
      <p className="mt-4 max-w-lg text-sm leading-relaxed text-marfil-suave">
        Cada tarjeta comparte su marco, su imagen y su título con el diálogo. Escape cierra. Si el
        sistema pide menos movimiento, la expansión ocurre sin el muelle.
      </p>

      <div className="mt-14 flex flex-wrap gap-8">
        {PIEZAS.map((pieza) => (
          <TarjetaExpandible key={pieza.id} pieza={pieza} />
        ))}
      </div>
    </div>
  );
}
