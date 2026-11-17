import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header, type VarianteCabecera } from "./Header";
import { Footer } from "./Footer";
import { OfflineBanner } from "../ui/Banner";
import { registrarEscenaActual } from "../../lib/transicionEscena";

const PREFIJOS_NIVEL_3 = [
  "/login",
  "/ingresar",
  "/mfa",
  "/registro",
  "/verificar-email",
  "/recuperar-password",
  "/recuperar",
  "/restablecer-password",
];

const PATRONES_CONOCIDOS_NIVEL_1_2: RegExp[] = [
  /^\/$/,
  /^\/kit$/,
  /^\/obras\/[^/]+$/,
  /^\/verificar\/[^/]+$/,
  /^\/verificar-certificado$/,
  /^\/estudio$/,
  /^\/estudio-motion$/,
  /^\/artistas(\/[^/]+)?$/,
  /^\/compras\/[^/]+\/resultado$/,
  /^\/checkout\/[^/]+(\/resultado)?$/,
  /^\/mis-compras(\/[^/]+)?$/,
  /^\/cuenta$/,
  /^\/artista(\/.*)?$/,
  /^\/curaduria(\/.*)?$/,
  /^\/institucional(\/.*)?$/,
  /^\/terminos$/,
  /^\/privacidad$/,
  /^\/acerca$/,
  /^\/contacto$/,
  /^\/legal\/(terminos|privacidad|acerca|contacto)$/,
];

function esRutaNivel3(pathname: string): boolean {
  if (PREFIJOS_NIVEL_3.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  const esConocidaNivel1o2 = PATRONES_CONOCIDOS_NIVEL_1_2.some((re) => re.test(pathname));
  return !esConocidaNivel1o2;
}

function esRutaPanel(pathname: string): boolean {
  return (
    pathname.startsWith("/artista") ||
    pathname.startsWith("/curaduria") ||
    pathname.startsWith("/institucional")
  );
}

/**
 * 7.2 Accesibilidad:
 * Al cargar cada página, el primer elemento enfocable es "Saltar al contenido".
 * Regiones semánticas (header, nav, main, footer).
 * 4.2 Pie de página: No aparece en el Nivel 3 ni en el Checkout.
 */
export function Layout() {
  const { pathname, hash, search } = useLocation();
  const [actoInicio, setActoInicio] = useState(0);

  const enInicioEscena =
    pathname === "/" &&
    hash !== "#coleccion" &&
    hash !== "#artistas" &&
    search.length === 0;
  const nivel3 = enInicioEscena || esRutaNivel3(pathname);
  const enCheckout =
    (pathname.startsWith("/checkout/") && !pathname.endsWith("/resultado")) ||
    (pathname.startsWith("/obras/") && new URLSearchParams(search).get("checkout") === "1");
  const enPanel = esRutaPanel(pathname);

  useEffect(() => {
    if (!nivel3) {
      registrarEscenaActual("otra", pathname);
    }
  }, [nivel3, pathname]);

  useEffect(() => {
    if (!enInicioEscena) {
      setActoInicio(0);
      return;
    }
    const alCambiarActo = (e: Event) => {
      const detalle = (e as CustomEvent<{ acto: number }>).detail;
      if (typeof detalle?.acto === "number") {
        setActoInicio(detalle.acto);
      }
    };
    window.addEventListener("pyl:acto-inicio", alCambiarActo);
    return () => window.removeEventListener("pyl:acto-inicio", alCambiarActo);
  }, [enInicioEscena]);

  // 6.1 Inicio: Cabecera mínima durante el acto I; pasa a cabecera completa desde el acto II.
  const varianteHeader: VarianteCabecera = enCheckout
    ? "checkout"
    : enInicioEscena
      ? actoInicio === 0
        ? "minima"
        : "completa"
      : nivel3
        ? "minima"
        : "completa";

  const mostrarPie = !nivel3 && !enCheckout && !enPanel;

  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--fondo)] text-[color:var(--tinta)]">
      <a
        href="#contenido-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:left-[var(--espacio-16)] focus:top-[var(--espacio-16)] focus:z-50 focus:rounded-[var(--radio-pildora)] focus:border focus:border-white focus:bg-[color:var(--carmesi)] focus:px-[var(--espacio-24)] focus:py-[var(--espacio-12)] focus:font-[var(--fuente-texto)] focus:font-semibold focus:text-[color:var(--tinta)] focus:no-underline"
      >
        Saltar al contenido
      </a>

      {!enPanel && (
        <Header
          variante={varianteHeader}
          fija={nivel3}
          hrefVolverObra={enCheckout && pathname.startsWith("/obras/") ? pathname : undefined}
        />
      )}

      <main id="contenido-principal" className="flex-1">
        <Outlet />
      </main>

      {mostrarPie && <Footer />}
      <OfflineBanner />
    </div>
  );
}

