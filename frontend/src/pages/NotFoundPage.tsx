import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Ambiente } from "../components/escena/Ambiente";
import { Disco } from "../components/escena/Disco";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ArtistasPage } from "./ArtistasPage";
import { CuentaPage } from "./CuentaPage";
import { PanelInstitucionalPage } from "./institucional/Paginas";
import { LegalContactoPage, type VistaLegal } from "./LegalContactoPage";
import { VerificarCertificadoPage } from "./VerificarCertificadoPage";

function resolverRutaLegal(pathname: string): VistaLegal | null {
  if (pathname === "/terminos" || pathname === "/legal/terminos") return "terminos";
  if (pathname === "/privacidad" || pathname === "/legal/privacidad") return "privacidad";
  if (pathname === "/acerca" || pathname === "/legal/acerca") return "acerca";
  if (pathname === "/contacto" || pathname === "/legal/contacto") return "contacto";
  return null;
}

/**
 * 6.17 Errores: 404, 403 y 500
 * - 404 (Nivel 3): el vacío. Un disco centrado de min(60 vmin, 420 px) con "404" en Playfair 900
 *   y, debajo, la cursiva "Esta página no existe.". Botones "Volver al inicio" (primario)
 *   y "Ver obras" (secundario). Luz estática y cabecera mínima.
 */
export function NotFoundPage() {
  const { pathname } = useLocation();
  const esRutaCuenta = pathname === "/cuenta";
  const esRutaInstitucional =
    pathname === "/institucional" || pathname.startsWith("/institucional/");
  const esRutaArtistas = pathname === "/artistas";
  const esRutaVerificar = pathname === "/verificar-certificado";
  const vistaLegal = resolverRutaLegal(pathname);

  const esRutaDelegada =
    esRutaCuenta ||
    esRutaInstitucional ||
    esRutaArtistas ||
    esRutaVerificar ||
    vistaLegal !== null;

  useEffect(() => {
    if (!esRutaDelegada) {
      document.title = "404 · Pixel & Lienzo";
    }
  }, [esRutaDelegada]);

  if (esRutaCuenta) {
    return <CuentaPage />;
  }

  if (esRutaInstitucional) {
    return <PanelInstitucionalPage />;
  }

  if (esRutaArtistas) {
    return <ArtistasPage />;
  }

  if (esRutaVerificar) {
    return <VerificarCertificadoPage />;
  }

  if (vistaLegal) {
    return <LegalContactoPage vistaInicial={vistaLegal} />;
  }

  return (
    <div className="relative flex min-h-[calc(100vh-var(--alto-cabecera))] flex-col items-center justify-center bg-[color:var(--vacio)] px-[var(--espacio-16)] py-[var(--espacio-64)] text-center">
      <Ambiente nivel={3} luzEstatica />

      <div className="relative z-10 flex flex-col items-center gap-[var(--espacio-32)]">
        <Disco
          nivel={3}
          variante="error"
          titulo="404"
          subtitulo="Esta página no existe."
        />

        <div className="flex flex-wrap items-center justify-center gap-[var(--espacio-16)]">
          <Link to="/">
            <Button variante="primario">Volver al inicio</Button>
          </Link>
          <Link to="/#coleccion">
            <Button variante="secundario">Ver obras</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * 6.17 — 403 (Nivel 3):
 * El mismo patrón con "403" y "No tienes acceso a esta página.".
 * Sin sesión, el botón primario es "Ingresar"; con sesión, "Volver al inicio".
 */
export function ForbiddenPage() {
  const { user } = useAuth();

  useEffect(() => {
    document.title = "403 · Pixel & Lienzo";
  }, []);

  return (
    <div className="relative flex min-h-[calc(100vh-var(--alto-cabecera))] flex-col items-center justify-center bg-[color:var(--vacio)] px-[var(--espacio-16)] py-[var(--espacio-64)] text-center">
      <Ambiente nivel={3} luzEstatica />

      <div className="relative z-10 flex flex-col items-center gap-[var(--espacio-32)]">
        <Disco
          nivel={3}
          variante="error"
          titulo="403"
          subtitulo="No tienes acceso a esta página."
        />

        <div className="flex flex-wrap items-center justify-center gap-[var(--espacio-16)]">
          {user ? (
            <Link to="/">
              <Button variante="primario">Volver al inicio</Button>
            </Link>
          ) : (
            <Link to="/login">
              <Button variante="primario">Ingresar</Button>
            </Link>
          )}
          <Link to="/#coleccion">
            <Button variante="secundario">Ver obras</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * 6.17 — 500 (Nivel 1):
 * Vacío pequeño con el icono "!" en ámbar, H1 "Algo salió mal" y el texto
 * "Ocurrió un error de nuestro lado. Inténtalo de nuevo en unos minutos.",
 * con el botón "Reintentar" y el enlace "Volver al inicio".
 * Si existe un código de referencia, se muestra abajo.
 */
export function ServerErrorPage({
  codigoReferencia,
  onReintentar,
}: {
  codigoReferencia?: string;
  onReintentar?: () => void;
}) {
  useEffect(() => {
    document.title = "Error · Pixel & Lienzo";
  }, []);

  const reintentar = () => {
    if (onReintentar) {
      onReintentar();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-var(--alto-cabecera))] flex-col items-center justify-center px-[var(--espacio-16)] py-[var(--espacio-64)] text-center">
      <Ambiente nivel={1} />

      <div className="relative z-10 flex max-w-[var(--contenedor-verificar)] flex-col items-center">
        <EmptyState
          titulo=""
          icono={
            <span className="inline-grid h-[var(--espacio-32)] w-[var(--espacio-32)] place-items-center rounded-[var(--radio-circulo)] border border-[color:var(--aviso)] font-[var(--fuente-poster)] text-[length:var(--text-h3)] leading-none text-[color:var(--aviso)]">
              !
            </span>
          }
          className="!py-0"
        />

        <h1 className="voz-h1 mt-[var(--espacio-16)] text-[color:var(--tinta)]">
          Algo salió mal
        </h1>

        <p className="voz-cuerpo mt-[var(--espacio-12)] text-[color:var(--tinta-suave)]">
          Ocurrió un error de nuestro lado. Inténtalo de nuevo en unos minutos.
        </p>

        <div className="mt-[var(--espacio-24)] flex flex-wrap items-center justify-center gap-[var(--espacio-24)]">
          <Button variante="primario" onClick={reintentar}>
            Reintentar
          </Button>
          <Link to="/">
            <Button variante="terciario">Volver al inicio</Button>
          </Link>
        </div>

        {codigoReferencia && (
          <p className="codigo-certificado mt-[var(--espacio-24)] text-[length:var(--text-cuerpo-pequeno)] text-[color:var(--tinta-suave)]">
            {codigoReferencia}
          </p>
        )}
      </div>
    </div>
  );
}

