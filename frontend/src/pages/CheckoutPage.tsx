import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Award,
  Frame,
  Globe,
  Landmark,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import clsx from "clsx";
import { obtenerObra } from "../api/obras";
import {
  crearTransaccion,
  obtenerCheckoutStripe,
  obtenerCheckoutWompi,
} from "../api/transacciones";
import { useAuth } from "../context/AuthContext";
import { useCart, type ItemCarrito } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import {
  OBRAS_MUESTRA_PALACIO,
  esObraMuestraLocal,
  obtenerPinturaFamosaFallback,
  resolverNombreArtistaObra,
  resolverUrlImagenObra,
} from "../lib/obrasMuestraPalacio";
import { Ambiente } from "../components/escena/Ambiente";
import { Banner } from "../components/ui/Banner";
import { Button } from "../components/ui/Button";
import { PageProgressBar, Skeleton } from "../components/ui/Skeleton";
import { formatearMoneda } from "../lib/formato";
import type { Obra, PasarelaPago } from "../types";

export interface CheckoutPageProps {
  idObraProp?: number;
}

function resolverImagenItem(item: ItemCarrito): string {
  if (item.fotografia_hd_url?.startsWith("/obras/")) {
    return item.fotografia_hd_url;
  }
  const obraMuestra = OBRAS_MUESTRA_PALACIO.find((o) => o.id_obra === item.id_obra);
  if (obraMuestra) {
    return resolverUrlImagenObra(obraMuestra, esObraMuestraLocal(obraMuestra));
  }
  return obtenerPinturaFamosaFallback({
    id_obra: item.id_obra,
    uid: item.uid,
    titulo: item.titulo,
    tecnica: item.tecnica,
    dimensiones: item.dimensiones,
    peso: "2.5",
    anio_creacion: 2025,
    precio_venta: item.precio_venta,
    fotografia_hd_url: item.fotografia_hd_url ?? "",
    codigo_qr_obra: null,
    estado_obra: "Publicado",
    es_patrimonio_historico: false,
    id_artista: item.id_artista,
    id_categoria: 1,
  });
}

function resolverArtistaItem(item: ItemCarrito): string {
  const obraMuestra = OBRAS_MUESTRA_PALACIO.find((o) => o.id_obra === item.id_obra);
  if (obraMuestra) {
    return resolverNombreArtistaObra(obraMuestra);
  }
  return resolverNombreArtistaObra({
    id_obra: item.id_obra,
    uid: item.uid,
    titulo: item.titulo,
    tecnica: item.tecnica,
    dimensiones: item.dimensiones,
    peso: "2.5",
    anio_creacion: 2025,
    precio_venta: item.precio_venta,
    fotografia_hd_url: item.fotografia_hd_url ?? "",
    codigo_qr_obra: null,
    estado_obra: "Publicado",
    es_patrimonio_historico: false,
    id_artista: item.id_artista,
    id_categoria: 1,
  });
}

/**
 * Fase de compra («TU CARRITO») siguiendo la estructura visual de la imagen de referencia:
 * - Cabecera: "TU CARRITO" a la izquierda y enlace subrayado "Seguir comprando" a la derecha.
 * - Columna izquierda (Tabla de productos):
 *   Encabezados PRODUCTO | CANTIDAD | TOTAL con línea divisoria.
 *   Cada fila tiene la miniatura de la obra enmarcada en su ambiente de galería,
 *   nombre del artista en mayúsculas arriba, título de la obra en negrita debajo,
 *   controles `-  1  +`, icono de papelera para eliminar y el precio a la derecha.
 * - Columna derecha (Recuadro de Resumen y Pago):
 *   TOTAL + monto grande a la derecha, selector de pasarela (Wompi / Stripe),
 *   botón grande "Continuar" en tono terracota/carmesí, y "Pago seguro con" + insignias
 *   de Wompi, Stripe, PSE, Visa, Mastercard y American Express.
 * - Franja inferior de 4 garantías con iconos lineales:
 *   1. OBRA DE ARTE ÚNICA
 *   2. COMPRA SEGURA
 *   3. ENVÍO A TODA COLOMBIA
 *   4. CALIDAD GARANTIZADA
 */
export function CheckoutPage({ idObraProp }: CheckoutPageProps) {
  const { idObra: idParam } = useParams<{ idObra: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notificar } = useToast();
  const { items: itemsContexto, agregarObra, quitarObra } = useCart();

  const idObraDirecta = idObraProp ?? Number(idParam ?? searchParams.get("obra") ?? "0");
  const idTransaccionExistente = Number(searchParams.get("transaccion") ?? "0");

  const [pasarela, setPasarela] = useState<PasarelaPago>("wompi");
  const [procesando, setProcesando] = useState(false);
  const [errorPago, setErrorPago] = useState<string | null>(null);

  const obraMuestraDirecta = useMemo(
    () => (idObraDirecta > 0 ? OBRAS_MUESTRA_PALACIO.find((o) => o.id_obra === idObraDirecta) : undefined),
    [idObraDirecta]
  );

  const { data: obraApiDirecta, isLoading } = useQuery({
    queryKey: ["obra", idObraDirecta],
    queryFn: () => obtenerObra(idObraDirecta),
    enabled: idObraDirecta > 0 && !obraMuestraDirecta,
    retry: 1,
  });

  const obraDirecta: Obra | undefined = obraApiDirecta ?? obraMuestraDirecta;

  // Si entró con una obra específica (?checkout=1 en /obras/:id), nos aseguramos de que esté en el carrito
  useEffect(() => {
    if (obraDirecta && obraDirecta.estado_obra === "Publicado") {
      agregarObra(obraDirecta);
    }
  }, [obraDirecta, agregarObra]);

  useEffect(() => {
    document.title = "Tu carrito · Fase de compra · Pixel & Lienzo";
  }, []);

  // Lista final de obras a mostrar en la tabla "TU CARRITO"
  const listaProductos: ItemCarrito[] = useMemo(() => {
    if (itemsContexto.length > 0) {
      return itemsContexto;
    }
    if (obraDirecta) {
      return [
        {
          id_obra: obraDirecta.id_obra,
          uid: obraDirecta.uid,
          titulo: obraDirecta.titulo,
          id_artista: obraDirecta.id_artista,
          tecnica: obraDirecta.tecnica,
          dimensiones: obraDirecta.dimensiones,
          precio_venta: String(obraDirecta.precio_venta),
          fotografia_hd_url: obraDirecta.fotografia_hd_url,
        },
      ];
    }
    return [];
  }, [itemsContexto, obraDirecta]);

  const montoTotalNumero = useMemo(
    () => listaProductos.reduce((acc, item) => acc + (Number(item.precio_venta) || 0), 0),
    [listaProductos]
  );

  const montoTotalFormateado = formatearMoneda(String(montoTotalNumero));

  if (isLoading && idObraDirecta > 0 && !obraMuestraDirecta && itemsContexto.length === 0) {
    return (
      <div className="relative min-h-[calc(100vh-var(--alto-cabecera))] py-[var(--espacio-48)]">
        <PageProgressBar etiqueta="Cargando tu carrito…" />
        <Ambiente nivel={1} />
        <div className="contenedor-pyl relative z-10 grid grid-cols-1 gap-[var(--espacio-48)] min-[1024px]:grid-cols-[1.6fr_1fr]">
          <Skeleton className="h-[240px] w-full" />
          <Skeleton className="h-[260px] w-full" />
        </div>
      </div>
    );
  }

  const confirmarYContinuarPago = async () => {
    const primeraObra = listaProductos[0];
    if (!primeraObra || procesando) return;

    if (!user) {
      notificar("Inicia sesión con tu cuenta de Coleccionista para continuar al pago seguro.", "exito");
      navigate("/login", { state: { from: location } });
      return;
    }

    if (user.rol !== "Comprador") {
      setErrorPago("Solo una cuenta con rol de Coleccionista (Comprador) puede finalizar la compra.");
      return;
    }

    setProcesando(true);
    setErrorPago(null);

    try {
      if (idTransaccionExistente > 0) {
        const reintento =
          pasarela === "stripe"
            ? await obtenerCheckoutStripe(idTransaccionExistente)
            : await obtenerCheckoutWompi(idTransaccionExistente);
        window.location.href = reintento.checkout_url;
        return;
      }
      const transaccion = await crearTransaccion(primeraObra.id_obra, pasarela);
      window.location.href = transaccion.checkout_url;
    } catch {
      // Si la obra seleccionada es una de las 8 pinturas famosas de muestra local (ID >= 901) y el backend no la tiene en BD
      if (primeraObra.id_obra >= 901) {
        notificar(
          `Redirigiendo a pasarela ${pasarela === "stripe" ? "Stripe Internacional" : "Wompi Colombia"} (Modo Demostración)…`,
          "exito"
        );
        window.setTimeout(() => {
          setProcesando(false);
          notificar(
            `¡Orden validada con ${pasarela === "stripe" ? "Stripe" : "Wompi"} para «${primeraObra.titulo}»!`,
            "exito"
          );
        }, 900);
        return;
      }

      setErrorPago(
        pasarela === "wompi"
          ? "No pudimos conectar con Wompi. Verifica las llaves en backend/.env o cambia a Stripe Internacional."
          : "No pudimos iniciar la sesión con Stripe. Revisa tu conexión e inténtalo de nuevo."
      );
      setProcesando(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-var(--alto-cabecera))] py-[var(--espacio-48)] animate-[aparecer-pagina_400ms_ease_forwards]">
      <Ambiente nivel={1} />

      <div className="contenedor-pyl relative z-10">
        {/* 1. CABECERA SUPERIOR: "TU CARRITO" a la izquierda y "Seguir comprando" subrayado a la derecha */}
        <header className="mb-[var(--espacio-32)] flex flex-wrap items-baseline justify-between gap-4">
          <h1 className="font-[var(--fuente-titulo)] text-[2rem] sm:text-[2.35rem] font-black uppercase tracking-[0.04em] text-[color:var(--tinta)]">
            TU CARRITO
          </h1>

          <Link
            to="/arte"
            className="font-[var(--fuente-texto)] text-[1.12rem] font-semibold text-[color:var(--tinta)] underline decoration-[color:var(--riel)] decoration-1 underline-offset-4 transition-colors hover:text-[color:var(--riel)]"
          >
            Seguir comprando
          </Link>
        </header>

        {errorPago && (
          <div className="mb-[var(--espacio-24)]">
            <Banner variante="aviso">{errorPago}</Banner>
          </div>
        )}

        {listaProductos.length === 0 ? (
          <div className="my-[var(--espacio-32)] border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-48)] text-center">
            <h2 className="voz-h2 text-[color:var(--tinta)]">Tu carrito está vacío</h2>
            <p className="voz-cuerpo mx-auto mt-3 max-w-[46ch] text-[color:var(--tinta-suave)]">
              Explora las obras originales con certificado verificable del Palacio Nacional de Medellín y agrégalas a tu carrito.
            </p>
            <div className="mt-6">
              <Link to="/arte" className="no-underline">
                <Button variante="primario">Explorar obras del catálogo</Button>
              </Link>
            </div>
          </div>
        ) : (
          /* 2. ESTRUCTURA DE DOS COLUMNAS IGUAL A LA IMAGEN DE REFERENCIA */
          <div className="grid grid-cols-1 gap-[var(--espacio-32)] lg:grid-cols-[1.65fr_1fr] lg:items-start">
            {/* COLUMNA IZQUIERDA: Tabla PRODUCTO | CANTIDAD | TOTAL */}
            <div>
              {/* Encabezado de columnas con línea inferior */}
              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-[color:var(--tinta-suave)]/45 pb-3 font-[var(--fuente-texto)] text-[0.86rem] font-bold uppercase tracking-[0.14em] text-[color:var(--tinta-suave)] sm:grid-cols-[1.5fr_160px_130px]">
                <span>PRODUCTO</span>
                <span className="text-center">CANTIDAD</span>
                <span className="text-right">TOTAL</span>
              </div>

              {/* Filas de obras en el carrito */}
              <ul className="divide-y divide-[color:var(--divisor)] list-none m-0 p-0">
                {listaProductos.map((item) => {
                  const srcObra = resolverImagenItem(item);
                  const nombreArtista = resolverArtistaItem(item);
                  const precioFormateado = formatearMoneda(item.precio_venta);

                  return (
                    <li
                      key={item.id_obra}
                      className="grid grid-cols-1 items-center gap-6 py-7 sm:grid-cols-[1.5fr_160px_130px]"
                    >
                      {/* Columna 1: Miniatura enmarcada en ambiente de galería + Artista arriba + Título en negrita abajo */}
                      <div className="flex items-center gap-5">
                        <Link
                          to={`/obras/${item.id_obra}`}
                          className="group relative block h-[116px] w-[96px] shrink-0 overflow-hidden rounded-[10px] shadow-[0_8px_22px_rgba(0,0,0,0.35)]"
                          style={{
                            background:
                              "radial-gradient(ellipse 70% 60% at 50% 42%, #faf8f4 0%, #e9e4dc 68%, #d5cec3 100%)",
                          }}
                        >
                          {/* Techo con riel de focos y piso de madera dentro de la miniatura tal como en la referencia */}
                          <div
                            aria-hidden="true"
                            className="absolute inset-x-0 top-0 h-[13%] bg-gradient-to-b from-[#bcb5aa] to-[#e4dfd6]"
                          />
                          <div
                            aria-hidden="true"
                            className="absolute inset-x-[17%] top-[16%] bottom-[20%] bg-[#f4efe6] p-[3px] shadow-[0_6px_14px_rgba(20,16,12,0.28)]"
                          >
                            <img
                              src={srcObra}
                              alt={item.titulo}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                          <div
                            aria-hidden="true"
                            className="absolute inset-x-0 bottom-0 h-[16%] border-t border-[#dfd9cf] bg-[#be9260]"
                          />
                        </Link>

                        <div className="min-w-0">
                          <p className="font-[var(--fuente-texto)] text-[0.82rem] font-bold uppercase tracking-[0.12em] text-[color:var(--tinta-suave)]">
                            {nombreArtista}
                          </p>
                          <Link
                            to={`/obras/${item.id_obra}`}
                            className="mt-1 block font-[var(--fuente-titulo)] text-[1.28rem] font-black uppercase tracking-[0.02em] text-[color:var(--tinta)] no-underline hover:text-[color:var(--riel)]"
                          >
                            {item.titulo}
                          </Link>
                          <p className="mt-1 font-[var(--fuente-texto)] text-[0.94rem] text-[color:var(--tinta-suave)]">
                            {item.tecnica} {item.dimensiones ? `· ${item.dimensiones}` : ""}
                          </p>
                        </div>
                      </div>

                      {/* Columna 2: Controles de cantidad `-  1  +` + Icono de Papelera */}
                      <div className="flex items-center justify-between sm:justify-center gap-4">
                        <div className="inline-flex items-center gap-4 font-[var(--fuente-texto)] text-[1.08rem] text-[color:var(--tinta)]">
                          <button
                            type="button"
                            onClick={() =>
                              notificar(
                                "Cada obra de arte es una pieza única e irrepetible (1 unidad disponible).",
                                "exito"
                              )
                            }
                            aria-label="Disminuir cantidad"
                            className="inline-grid h-7 w-7 place-items-center bg-transparent border-0 text-[color:var(--tinta-suave)] hover:text-[color:var(--tinta)] cursor-pointer"
                          >
                            <Minus size={14} strokeWidth={1.8} />
                          </button>

                          <span className="min-w-[16px] text-center font-semibold">1</span>

                          <button
                            type="button"
                            onClick={() =>
                              notificar(
                                "Obra de arte única: solo existe 1 ejemplar original certificado.",
                                "exito"
                              )
                            }
                            aria-label="Aumentar cantidad"
                            className="inline-grid h-7 w-7 place-items-center bg-transparent border-0 text-[color:var(--tinta-suave)] hover:text-[color:var(--tinta)] cursor-pointer"
                          >
                            <Plus size={14} strokeWidth={1.8} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            quitarObra(item.id_obra);
                            notificar(`«${item.titulo}» se eliminó del carrito.`, "exito");
                            if (listaProductos.length <= 1 && idObraDirecta > 0) {
                              navigate("/carrito");
                            }
                          }}
                          title="Eliminar obra del carrito"
                          aria-label={`Eliminar ${item.titulo} del carrito`}
                          className="inline-grid h-8 w-8 place-items-center bg-transparent border-0 text-[color:var(--tinta-suave)] transition-colors hover:text-[color:var(--peligro)] cursor-pointer"
                        >
                          <Trash2 size={16} strokeWidth={1.7} />
                        </button>

                        {/* Precio visible en móvil en la misma barra */}
                        <span className="precio-obra font-[var(--fuente-texto)] text-[1.15rem] font-semibold text-[color:var(--tinta)] sm:hidden">
                          {precioFormateado}
                        </span>
                      </div>

                      {/* Columna 3: TOTAL por fila alineado a la derecha */}
                      <div className="hidden text-right sm:block">
                        <span className="precio-obra font-[var(--fuente-texto)] text-[1.22rem] font-semibold text-[color:var(--tinta)]">
                          {precioFormateado}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* COLUMNA DERECHA: Caja de TOTAL + Selector Wompi/Stripe + Botón "Continuar" + "Pago seguro con" */}
            <aside
              aria-label="Resumen y pago seguro"
              className="border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-6 sm:p-8 shadow-[var(--sombra-tarjeta)]"
            >
              {/* Fila TOTAL y Monto */}
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-[var(--fuente-titulo)] text-[1.35rem] font-black uppercase tracking-[0.04em] text-[color:var(--tinta)]">
                  TOTAL
                </span>
                <span className="precio-obra font-[var(--fuente-titulo)] text-[1.65rem] font-black text-[color:var(--tinta)]">
                  {montoTotalFormateado}
                </span>
              </div>

              {/* Selector compacto de pasarela: Wompi Colombia vs Stripe Internacional */}
              <div className="mt-5 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setPasarela("wompi");
                    setErrorPago(null);
                  }}
                  className={clsx(
                    "flex items-center justify-center gap-2 border px-3 py-2.5 font-[var(--fuente-texto)] text-[0.95rem] font-semibold transition-all cursor-pointer",
                    pasarela === "wompi"
                      ? "border-[color:var(--riel)] bg-[color:var(--carmesi)]/30 text-[color:var(--tinta)]"
                      : "border-[color:var(--divisor)] bg-[color:var(--fondo)] text-[color:var(--tinta-suave)] hover:border-[color:var(--borde-reposo)]"
                  )}
                >
                  <Landmark size={15} className="text-[color:var(--riel)]" />
                  <span>Wompi (COP)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPasarela("stripe");
                    setErrorPago(null);
                  }}
                  className={clsx(
                    "flex items-center justify-center gap-2 border px-3 py-2.5 font-[var(--fuente-texto)] text-[0.95rem] font-semibold transition-all cursor-pointer",
                    pasarela === "stripe"
                      ? "border-[color:var(--riel)] bg-[color:var(--carmesi)]/30 text-[color:var(--tinta)]"
                      : "border-[color:var(--divisor)] bg-[color:var(--fondo)] text-[color:var(--tinta-suave)] hover:border-[color:var(--borde-reposo)]"
                  )}
                >
                  <Globe size={15} className="text-[color:var(--riel)]" />
                  <span>Stripe (Global)</span>
                </button>
              </div>

              {/* Botón principal rectangular "Continuar" en tono terracota/carmesí como en la imagen */}
              <button
                type="button"
                disabled={procesando}
                onClick={() => void confirmarYContinuarPago()}
                className="mt-5 flex h-[50px] w-full items-center justify-center border border-[#d9795d] bg-[#c85a3a] px-6 font-[var(--fuente-texto)] text-[1.22rem] font-bold tracking-[0.03em] text-white shadow-[0_6px_20px_rgba(200,90,58,0.35)] transition-all hover:bg-[#d66645] disabled:opacity-60 cursor-pointer"
              >
                {procesando
                  ? `Conectando con ${pasarela === "stripe" ? "Stripe" : "Wompi"}…`
                  : "Continuar"}
              </button>

              {/* Leyenda "Pago seguro con" e insignias blancas de medios de pago */}
              <div className="mt-4 text-center">
                <p className="font-[var(--fuente-texto)] text-[0.95rem] font-bold text-[color:var(--tinta)]">
                  Pago seguro con
                </p>

                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  {/* Badge Wompi */}
                  <span className="inline-flex h-8 items-center rounded-xs bg-white px-2.5 font-sans text-[0.72rem] font-extrabold tracking-tight text-[#0f265c] shadow-xs">
                    wompi
                  </span>

                  {/* Badge Stripe */}
                  <span className="inline-flex h-8 items-center rounded-xs bg-white px-2.5 font-sans text-[0.75rem] font-extrabold tracking-tight text-[#635bff] shadow-xs">
                    stripe
                  </span>

                  {/* Badge PSE */}
                  <span className="inline-flex h-8 items-center rounded-xs bg-white px-2.5 font-sans text-[0.72rem] font-extrabold text-[#14467b] shadow-xs">
                    PSE
                  </span>

                  {/* Badge VISA */}
                  <span className="inline-flex h-8 items-center rounded-xs bg-white px-2.5 font-sans text-[0.76rem] font-black italic tracking-tight text-[#1a1f71] shadow-xs">
                    VISA
                  </span>

                  {/* Badge Mastercard */}
                  <span
                    className="inline-flex h-8 items-center gap-0.5 rounded-xs bg-white px-2.5 shadow-xs"
                    title="Mastercard"
                  >
                    <span className="h-3.5 w-3.5 rounded-full bg-[#eb001b]" />
                    <span className="-ml-1.5 h-3.5 w-3.5 rounded-full bg-[#f79e1b] opacity-90" />
                  </span>

                  {/* Badge AMEX */}
                  <span className="inline-flex h-8 items-center rounded-xs bg-[#2e77bb] px-2 font-sans text-[0.65rem] font-extrabold uppercase tracking-tighter text-white shadow-xs">
                    AMEX
                  </span>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* 3. FRANJA INFERIOR DE 4 GARANTÍAS (IDÉNTICA A LA IMAGEN DE REFERENCIA) */}
        <section
          aria-label="Garantías de compra en el Palacio Nacional"
          className="mt-[var(--espacio-64)] border-t border-[color:var(--tinta-suave)]/35 pt-[var(--espacio-32)]"
        >
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* 1. OBRA DE ARTE ÚNICA */}
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] text-[#c85a3a]">
                <Frame size={26} strokeWidth={1.6} />
              </div>
              <div>
                <h3 className="font-[var(--fuente-texto)] text-[0.96rem] font-bold uppercase tracking-[0.06em] text-[color:var(--tinta)]">
                  OBRA DE ARTÉ ÚNICA
                </h3>
                <p className="mt-1.5 font-[var(--fuente-texto)] text-[0.94rem] leading-snug text-[color:var(--tinta-suave)]">
                  Un solo artista, una sola obra, obras de arte únicas; cada pieza del Palacio Nacional es irrepetible.
                </p>
              </div>
            </div>

            {/* 2. COMPRA SEGURA */}
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] text-[#c85a3a]">
                <ShieldCheck size={26} strokeWidth={1.6} />
              </div>
              <div>
                <h3 className="font-[var(--fuente-texto)] text-[0.96rem] font-bold uppercase tracking-[0.06em] text-[color:var(--tinta)]">
                  COMPRA SEGURA
                </h3>
                <p className="mt-1.5 font-[var(--fuente-texto)] text-[0.94rem] leading-snug text-[color:var(--tinta-suave)]">
                  Compra 100% segura y garantizada con Wompi y Stripe. Tu adquisición protegida de principio a fin.
                </p>
              </div>
            </div>

            {/* 3. ENVÍO A TODA COLOMBIA */}
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] text-[#c85a3a]">
                <MapPin size={26} strokeWidth={1.6} />
              </div>
              <div>
                <h3 className="font-[var(--fuente-texto)] text-[0.96rem] font-bold uppercase tracking-[0.06em] text-[color:var(--tinta)]">
                  ENVÍO A TODA COLOMBIA
                </h3>
                <p className="mt-1.5 font-[var(--fuente-texto)] text-[0.94rem] leading-snug text-[color:var(--tinta-suave)]">
                  Envíos especializados de arte desde el Palacio Nacional de Medellín con la mayor protección y rapidez.
                </p>
              </div>
            </div>

            {/* 4. CALIDAD GARANTIZADA */}
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] text-[#c85a3a]">
                <Award size={26} strokeWidth={1.6} />
              </div>
              <div>
                <h3 className="font-[var(--fuente-texto)] text-[0.96rem] font-bold uppercase tracking-[0.06em] text-[color:var(--tinta)]">
                  CALIDAD GARANTIZADA
                </h3>
                <p className="mt-1.5 font-[var(--fuente-texto)] text-[0.94rem] leading-snug text-[color:var(--tinta-suave)]">
                  Todas nuestras piezas cuentan con certificado criptográfico SHA-256 de autenticidad original.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
