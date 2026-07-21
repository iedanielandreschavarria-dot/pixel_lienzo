import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listarCatalogo } from "../api/obras";
import { listarCategorias } from "../api/categorias";
import { ObraCard } from "../components/ObraCard";
import { Spinner } from "../components/ui/Spinner";

export function CatalogoPage() {
  const [idCategoria, setIdCategoria] = useState<number | "">("");
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");

  const filtros = useMemo(
    () => ({
      id_categoria: idCategoria === "" ? undefined : Number(idCategoria),
      precio_min: precioMin === "" ? undefined : Number(precioMin),
      precio_max: precioMax === "" ? undefined : Number(precioMax),
    }),
    [idCategoria, precioMin, precioMax]
  );

  const { data: categorias } = useQuery({ queryKey: ["categorias"], queryFn: listarCategorias });
  const {
    data: obras,
    isLoading,
    isError,
  } = useQuery({ queryKey: ["catalogo", filtros], queryFn: () => listarCatalogo(filtros) });

  const hayFiltrosActivos = idCategoria !== "" || precioMin !== "" || precioMax !== "";

  return (
    <div>
      {/* Hero inmersivo: fondo casi negro, tipografía serif a gran escala,
          un único acento dorado — sin imágenes de relleno que compitan con
          las obras reales de la grilla inferior. */}
      <section className="relative overflow-hidden border-b border-antracita-suave/50 bg-carbon">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(201,162,75,0.14), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-5xl px-6 py-28 text-center sm:px-10">
          <p className="text-xs uppercase tracking-[0.35em] text-ocre">Palacio Nacional · Galería Digital</p>
          <h1 className="mt-6 font-[var(--font-display)] text-5xl font-medium leading-[1.1] text-marfil sm:text-6xl">
            Obras originales,
            <br />
            <span className="italic text-ocre">auténticas por diseño</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-marfil-suave sm:text-base">
            Una colección curada, iluminada como en sala. Cada pieza incluye certificado de autenticidad digital y
            trazabilidad verificable de principio a fin.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14 sm:px-10">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6 border-b border-antracita-suave/50 pb-8">
          <div className="flex flex-wrap items-end gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-[0.14em] text-marfil-suave">Categoría</label>
              <select
                value={idCategoria}
                onChange={(e) => setIdCategoria(e.target.value === "" ? "" : Number(e.target.value))}
                className="rounded-full border border-antracita-suave bg-antracita px-4 py-2 text-sm text-marfil focus:outline-none focus:ring-1 focus:ring-ocre/60"
              >
                <option value="">Todas</option>
                {categorias?.map((c) => (
                  <option key={c.id_categoria} value={c.id_categoria}>
                    {c.nombre_categoria}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-[0.14em] text-marfil-suave">Precio mínimo</label>
              <input
                type="number"
                min={0}
                value={precioMin}
                onChange={(e) => setPrecioMin(e.target.value)}
                placeholder="$0"
                className="w-32 rounded-full border border-antracita-suave bg-antracita px-4 py-2 text-sm text-marfil placeholder:text-marfil-suave/50 focus:outline-none focus:ring-1 focus:ring-ocre/60"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-[0.14em] text-marfil-suave">Precio máximo</label>
              <input
                type="number"
                min={0}
                value={precioMax}
                onChange={(e) => setPrecioMax(e.target.value)}
                placeholder="Sin límite"
                className="w-32 rounded-full border border-antracita-suave bg-antracita px-4 py-2 text-sm text-marfil placeholder:text-marfil-suave/50 focus:outline-none focus:ring-1 focus:ring-ocre/60"
              />
            </div>
            {hayFiltrosActivos && (
              <button
                onClick={() => {
                  setIdCategoria("");
                  setPrecioMin("");
                  setPrecioMax("");
                }}
                className="self-center text-xs uppercase tracking-wider text-terracota hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
          {obras && obras.length > 0 && (
            <p className="text-xs uppercase tracking-[0.14em] text-marfil-suave">
              {obras.length} {obras.length === 1 ? "obra" : "obras"}
            </p>
          )}
        </div>

        {isLoading && <Spinner etiqueta="Cargando colección…" />}
        {isError && <p className="py-16 text-center text-terracota">No fue posible cargar el catálogo.</p>}
        {obras && obras.length === 0 && (
          <p className="py-24 text-center text-marfil-suave">No hay obras que coincidan con estos filtros.</p>
        )}
        {obras && obras.length > 0 && (
          <div className="galeria-masonry">
            {obras.map((obra) => (
              <ObraCard key={obra.id_obra} obra={obra} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
