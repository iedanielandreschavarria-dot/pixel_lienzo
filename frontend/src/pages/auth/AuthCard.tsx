import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import clsx from "clsx";
import { Ambiente } from "../../components/escena/Ambiente";
import { Columna } from "../../components/escena/Columna";
import { LogoMarca } from "../../components/ui/LogoMarca";
import { obtenerUltimaEscena, registrarEscenaActual } from "../../lib/transicionEscena";

/**
 * 6.2 Acceso: iniciar sesión, crear cuenta y recuperar.
 * Nivel: 3. La interfaz vive dentro de la columna roja con la cápsula negra
 * (versión "acceso" de la plantilla), con transición cohesiva desde Inicio y entre subrutas de Acceso.
 */
export function AuthCard({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
  ancho?: string;
}) {
  const { pathname } = useLocation();
  const [claseTransicion] = useState(() => {
    const previa = obtenerUltimaEscena();
    if (previa.escena === "inicio") return "escena-desde-inicio";
    if (previa.escena === "acceso") return "escena-entre-acceso";
    return "escena-desde-inicio";
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    registrarEscenaActual("acceso", pathname);
  }, [pathname]);

  return (
    <div
      className={clsx(
        "relative min-h-screen overflow-x-hidden",
        claseTransicion
      )}
    >
      <Ambiente nivel={3} />

      <Columna nivel={3}>
        <div key={pathname} className="contenido-capsula-animado">
          <header className="cabeza-acceso">
            <div className="mb-[var(--espacio-16)] flex justify-center">
              <LogoMarca variante="riel" tamano="lg" conTexto={false} />
            </div>
            <h1 className="cabeza-acceso__titulo">{titulo}</h1>
            {subtitulo && <p className="cabeza-acceso__subtitulo">{subtitulo}</p>}
          </header>

          <div className="formulario-acceso mt-[var(--espacio-24)]">{children}</div>
        </div>
      </Columna>
    </div>
  );
}
