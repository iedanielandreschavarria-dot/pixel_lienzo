import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "../../context/AuthContext";
import { LogoMarca } from "../ui/LogoMarca";
import type { NombreRol } from "../../types";

export type VarianteCabecera = "completa" | "minima" | "checkout";

export interface HeaderProps {
  variante?: VarianteCabecera;
  hrefVolverObra?: string;
  fija?: boolean;
  className?: string;
}

const ENLACES_PRINCIPALES = [
  { to: "/#coleccion", etiqueta: "Obras", end: true },
  { to: "/#artistas", etiqueta: "Artistas" },
  { to: "/estudio", etiqueta: "Estudio Motion" },
  { to: "/verificar/buscar", etiqueta: "Verificar certificado" },
];

function rutaPanelPorRol(rol: NombreRol | undefined): { to: string; etiqueta: string } | null {
  switch (rol) {
    case "Artista":
      return { to: "/artista", etiqueta: "Panel del artista" };
    case "Curador":
      return { to: "/curaduria", etiqueta: "Panel de curaduría" };
    case "Administrador":
      return { to: "/institucional", etiqueta: "Panel institucional" };
    default:
      return null;
  }
}

function inicialesDeCorreo(correo: string): string {
  const base = correo.split("@")[0] ?? "U";
  const partes = base.split(/[._-]+/).filter(Boolean);
  if (partes.length >= 2) {
    return `${partes[0][0] ?? ""}${partes[1][0] ?? ""}`.toUpperCase();
  }
  return base.slice(0, 2).toUpperCase();
}

/**
 * 4.1 Navegación:
 * Cabecera (Nivel 1 y 2): 64 px de alto, fija arriba, fondo --fondo al 92 % y borde inferior de 1 px en --tinta al 12 %.
 * Izquierda: marca "PIXEL & LIENZO" en Anton, 1.15 rem, color --riel, enlace a Inicio.
 * Centro (escritorio): Obras, Artistas, Estudio Motion y Verificar certificado, en Cormorant 600 de 1.15 rem.
 * El enlace activo lleva subrayado de 2 px en --riel.
 * Derecha: "Ingresar" para el visitante, o el avatar con su menú cuando hay sesión.
 * Cabecera mínima (Nivel 3): solo la marca y "Ingresar", transparente sobre la escena.
 * Móvil: un icono de menú a la derecha abre una pantalla completa negra con los enlaces centrados en Playfair 900 de 2.2 rem. Se cierra con una X y con Esc.
 */
export function Header({
  variante = "completa",
  hrefVolverObra = "/",
  fija = false,
  className,
}: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const barraRef = useRef<HTMLDivElement>(null);
  const menuCuentaRef = useRef<HTMLDivElement>(null);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [menuCuentaAbierto, setMenuCuentaAbierto] = useState(false);

  useEffect(() => {
    const barra = barraRef.current;
    if (!barra) return;
    const publicarAlto = () => {
      document.documentElement.style.setProperty("--alto-header", `${barra.offsetHeight}px`);
    };
    publicarAlto();
    const observador = new ResizeObserver(publicarAlto);
    observador.observe(barra);
    return () => {
      observador.disconnect();
      document.documentElement.style.removeProperty("--alto-header");
    };
  }, []);

  useEffect(() => {
    if (!menuMovilAbierto && !menuCuentaAbierto) return;
    const alPresionarTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuMovilAbierto(false);
        setMenuCuentaAbierto(false);
      }
    };
    const alClicFuera = (e: MouseEvent) => {
      if (
        menuCuentaAbierto &&
        menuCuentaRef.current &&
        e.target instanceof Node &&
        !menuCuentaRef.current.contains(e.target)
      ) {
        setMenuCuentaAbierto(false);
      }
    };
    window.addEventListener("keydown", alPresionarTecla);
    window.addEventListener("mousedown", alClicFuera);
    return () => {
      window.removeEventListener("keydown", alPresionarTecla);
      window.removeEventListener("mousedown", alClicFuera);
    };
  }, [menuMovilAbierto, menuCuentaAbierto]);

  const cerrarSesion = async () => {
    await logout();
    setMenuMovilAbierto(false);
    setMenuCuentaAbierto(false);
    navigate("/");
  };

  const enlacePanel = rutaPanelPorRol(user?.rol);

  const renderBloqueCuenta = () => {
    if (!user) {
      return (
        <Link
          to="/login"
          className="inline-flex min-h-[var(--alto-control-compacto)] items-center rounded-[var(--radio-pildora)] border border-[color:var(--riel)] bg-transparent px-[var(--espacio-24)] py-[var(--espacio-8)] font-[var(--fuente-texto)] font-semibold text-[length:var(--text-dato)] text-[color:var(--tinta)] no-underline transition-[border-color] duration-[var(--duracion-hover)] hover:border-white"
        >
          Ingresar
        </Link>
      );
    }

    return (
      <div ref={menuCuentaRef} className="relative">
        <button
          type="button"
          onClick={() => setMenuCuentaAbierto((v) => !v)}
          aria-expanded={menuCuentaAbierto}
          aria-haspopup="menu"
          aria-label="Menú de cuenta"
          className="inline-grid h-[var(--alto-control-compacto)] w-[var(--alto-control-compacto)] place-items-center rounded-[var(--radio-circulo)] border border-[color:var(--riel)] bg-[color:var(--vacio)] font-[var(--fuente-poster)] text-[length:var(--text-minimo)] uppercase tracking-[0.08em] text-[color:var(--tinta)] hover:border-white cursor-pointer"
        >
          {inicialesDeCorreo(user.correo_electronico)}
        </button>

        {menuCuentaAbierto && (
          <div
            role="menu"
            aria-label="Menú de cuenta"
            className="absolute right-0 top-full z-50 mt-[var(--espacio-8)] min-w-[220px] rounded-[var(--radio-recto)] border border-[color:var(--riel)] bg-[color:var(--fondo)] py-[var(--espacio-8)] shadow-[var(--sombra-tarjeta)]"
          >
            <div className="border-b border-[color:var(--divisor)] px-[var(--espacio-16)] pb-[var(--espacio-8)]">
              <p className="voz-cuerpo-pequeno truncate text-[color:var(--tinta)]">{user.correo_electronico}</p>
              <p className="voz-etiqueta mt-[var(--espacio-4)] text-[color:var(--tinta-suave)]">{user.rol}</p>
            </div>

            <ul className="list-none p-0 py-[var(--espacio-4)]">
              <li>
                <Link
                  to="/mis-compras"
                  role="menuitem"
                  onClick={() => setMenuCuentaAbierto(false)}
                  className="block px-[var(--espacio-16)] py-[var(--espacio-8)] font-[var(--fuente-texto)] font-medium text-[length:var(--text-cuerpo-pequeno)] text-[color:var(--tinta)] no-underline hover:bg-[color:var(--fila-hover)]"
                >
                  Mis compras
                </Link>
              </li>
              <li>
                <Link
                  to="/cuenta"
                  role="menuitem"
                  onClick={() => setMenuCuentaAbierto(false)}
                  className="block px-[var(--espacio-16)] py-[var(--espacio-8)] font-[var(--fuente-texto)] font-medium text-[length:var(--text-cuerpo-pequeno)] text-[color:var(--tinta)] no-underline hover:bg-[color:var(--fila-hover)]"
                >
                  Cuenta
                </Link>
              </li>
              {enlacePanel && (
                <li>
                  <Link
                    to={enlacePanel.to}
                    role="menuitem"
                    onClick={() => setMenuCuentaAbierto(false)}
                    className="block px-[var(--espacio-16)] py-[var(--espacio-8)] font-[var(--fuente-texto)] font-medium text-[length:var(--text-cuerpo-pequeno)] text-[color:var(--tinta)] no-underline hover:bg-[color:var(--fila-hover)]"
                  >
                    {enlacePanel.etiqueta}
                  </Link>
                </li>
              )}
              <li className="mt-[var(--espacio-4)] border-t border-[color:var(--divisor)] pt-[var(--espacio-4)]">
                <button
                  type="button"
                  role="menuitem"
                  onClick={cerrarSesion}
                  className="block w-full bg-transparent border-0 px-[var(--espacio-16)] py-[var(--espacio-8)] text-left font-[var(--fuente-texto)] font-medium text-[length:var(--text-cuerpo-pequeno)] text-[color:var(--tinta)] hover:bg-[color:var(--fila-hover)] cursor-pointer"
                >
                  Cerrar sesión
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    );
  };

  if (variante === "checkout") {
    return (
      <header
        ref={barraRef}
        className={clsx(
          "sticky top-0 z-40 h-[var(--alto-cabecera)] border-b border-[color:var(--divisor)] bg-[color:var(--cabecera-fondo)]",
          className
        )}
      >
        <div className="contenedor-pyl flex h-full items-center justify-between">
          <Link to="/" className="no-underline">
            <LogoMarca variante="riel" tamano="md" />
          </Link>
          <Link
            to={hrefVolverObra}
            className="border-b border-[color:var(--borde-terciario)] pb-[var(--espacio-4)] font-[var(--fuente-texto)] font-semibold text-[length:var(--text-dato)] text-[color:var(--tinta)] no-underline hover:border-white"
          >
            Volver a la obra
          </Link>
        </div>
      </header>
    );
  }

  if (variante === "minima") {
    return (
      <header
        ref={barraRef}
        className={clsx(
          "fixed inset-x-0 top-0 z-40 h-[var(--alto-cabecera)] bg-transparent",
          className
        )}
      >
        <div className="contenedor-pyl flex h-full items-center justify-between">
          <Link to="/" className="no-underline">
            <LogoMarca variante="riel" tamano="md" />
          </Link>
          {renderBloqueCuenta()}
        </div>
      </header>
    );
  }

  return (
    <header
      ref={barraRef}
      className={clsx(
        fija ? "fixed inset-x-0 top-0" : "sticky top-0",
        "z-40 h-[var(--alto-cabecera)] border-b border-[color:var(--divisor)] bg-[color:var(--cabecera-fondo)] transition-[background-color,border-color,opacity] duration-[var(--duracion-pagina)] ease-[var(--curva-base)]",
        className
      )}
    >
      <div className="contenedor-pyl flex h-full items-center justify-between">
        <Link to="/" className="no-underline">
          <LogoMarca variante="riel" tamano="md" />
        </Link>

        <nav aria-label="Navegación principal" className="hidden items-center gap-[var(--espacio-32)] min-[1024px]:flex">
          {ENLACES_PRINCIPALES.map((enlace) => (
            <NavLink
              key={enlace.to}
              to={enlace.to}
              end={enlace.end}
              className={({ isActive }) =>
                clsx(
                  "py-[var(--espacio-8)] font-[var(--fuente-texto)] font-semibold text-[length:var(--text-dato)] no-underline transition-colors duration-[var(--duracion-hover)]",
                  isActive
                    ? "border-b-2 border-[color:var(--riel)] text-[color:var(--tinta)]"
                    : "border-b-2 border-transparent text-[color:var(--tinta-suave)] hover:text-[color:var(--tinta)]"
                )
              }
            >
              {enlace.etiqueta}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-[var(--espacio-16)] min-[1024px]:flex">
          {renderBloqueCuenta()}
        </div>

        <button
          type="button"
          onClick={() => setMenuMovilAbierto(true)}
          aria-label="Abrir menú"
          aria-expanded={menuMovilAbierto}
          className="inline-grid h-[var(--area-tactil-min)] w-[var(--area-tactil-min)] place-items-center bg-transparent border-0 text-[color:var(--tinta)] min-[1024px]:hidden cursor-pointer"
        >
          <Menu size={24} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>

      {/* 4.1 Móvil: pantalla completa negra con los enlaces centrados en Playfair 900 de 2.2 rem. Se cierra con una X y con Esc. */}
      {menuMovilAbierto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación"
          className="fixed inset-0 z-50 flex flex-col justify-between bg-[color:var(--vacio)] p-[var(--espacio-24)] min-[1024px]:hidden"
        >
          <div className="flex items-center justify-between">
            <Link
              to="/"
              onClick={() => setMenuMovilAbierto(false)}
              className="no-underline"
            >
              <LogoMarca variante="riel" tamano="md" />
            </Link>
            <button
              type="button"
              onClick={() => setMenuMovilAbierto(false)}
              aria-label="Cerrar menú"
              className="inline-grid h-[var(--area-tactil-min)] w-[var(--area-tactil-min)] place-items-center bg-transparent border-0 text-[color:var(--tinta)] cursor-pointer"
            >
              <X size={24} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>

          <nav aria-label="Menú móvil" className="flex flex-col items-center gap-[var(--espacio-24)] text-center">
            {ENLACES_PRINCIPALES.map((enlace) => (
              <NavLink
                key={enlace.to}
                to={enlace.to}
                end={enlace.end}
                onClick={() => setMenuMovilAbierto(false)}
                className={({ isActive }) =>
                  clsx(
                    "font-[var(--fuente-titulo)] font-black text-[length:var(--text-h1-movil)] no-underline",
                    isActive
                      ? "border-b-2 border-[color:var(--riel)] text-[color:var(--tinta)]"
                      : "text-[color:var(--tinta)] hover:text-[color:var(--riel)]"
                  )
                }
              >
                {enlace.etiqueta}
              </NavLink>
            ))}

            {user ? (
              <>
                <NavLink
                  to="/mis-compras"
                  onClick={() => setMenuMovilAbierto(false)}
                  className="font-[var(--fuente-titulo)] font-black text-[length:var(--text-h1-movil)] text-[color:var(--tinta)] no-underline"
                >
                  Mis compras
                </NavLink>
                <NavLink
                  to="/cuenta"
                  onClick={() => setMenuMovilAbierto(false)}
                  className="font-[var(--fuente-titulo)] font-black text-[length:var(--text-h1-movil)] text-[color:var(--tinta)] no-underline"
                >
                  Cuenta
                </NavLink>
                {enlacePanel && (
                  <NavLink
                    to={enlacePanel.to}
                    onClick={() => setMenuMovilAbierto(false)}
                    className="font-[var(--fuente-titulo)] font-black text-[length:var(--text-h1-movil)] text-[color:var(--tinta)] no-underline"
                  >
                    {enlacePanel.etiqueta}
                  </NavLink>
                )}
                <button
                  type="button"
                  onClick={cerrarSesion}
                  className="mt-[var(--espacio-16)] bg-transparent border-0 border-b border-[color:var(--borde-terciario)] pb-[var(--espacio-4)] font-[var(--fuente-texto)] font-semibold text-[length:var(--text-cuerpo)] text-[color:var(--tinta)] cursor-pointer"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMenuMovilAbierto(false)}
                className="font-[var(--fuente-titulo)] font-black text-[length:var(--text-h1-movil)] text-[color:var(--riel)] no-underline"
              >
                Ingresar
              </Link>
            )}
          </nav>

          <p className="voz-cuerpo-pequeno text-center text-[color:var(--tinta-suave)]">
            © 2026 Pixel &amp; Lienzo
          </p>
        </div>
      )}
    </header>
  );
}

