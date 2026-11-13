import { useState, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Building2,
  ClipboardCheck,
  FileSpreadsheet,
  FolderKanban,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Palette,
  PlusCircle,
  ShieldCheck,
  ShoppingBag,
  UserCheck,
  UserCog,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import clsx from "clsx";
import { useAuth } from "../../context/AuthContext";
import { Ambiente } from "../escena/Ambiente";
import { Breadcrumbs, type ItemMiga } from "../ui/Breadcrumbs";
import { LogoMarca } from "../ui/LogoMarca";
import type { NombreRol } from "../../types";

export interface EnlaceLateralPanel {
  to: string;
  etiqueta: string;
  icono: LucideIcon;
  end?: boolean;
}

export interface PanelShellProps {
  eyebrow?: string;
  migas?: ItemMiga[];
  titulo: string;
  descripcion?: string;
  acciones?: ReactNode;
  enlacesLaterales?: EnlaceLateralPanel[];
  children: ReactNode;
}

function enlacesPorDefecto(rol: NombreRol | undefined): EnlaceLateralPanel[] {
  switch (rol) {
    case "Artista":
      return [
        { to: "/artista", etiqueta: "Resumen", icono: LayoutDashboard, end: true },
        { to: "/artista?seccion=obras", etiqueta: "Mis obras", icono: Palette },
        { to: "/artista/obras/nueva", etiqueta: "Subir obra", icono: PlusCircle },
        { to: "/artista?seccion=ventas", etiqueta: "Ventas", icono: ShoppingBag },
        { to: "/artista/perfil", etiqueta: "Perfil público", icono: UserCog },
        { to: "/cuenta", etiqueta: "Cuenta", icono: UserCheck },
      ];
    case "Curador":
      return [
        { to: "/curaduria", etiqueta: "Cola de revisión", icono: ClipboardCheck, end: true },
        { to: "/curaduria?seccion=artistas", etiqueta: "Artistas", icono: Users },
        { to: "/curaduria?seccion=certificados", etiqueta: "Certificados", icono: ShieldCheck },
        { to: "/curaduria?seccion=historial", etiqueta: "Historial", icono: History },
      ];
    case "Administrador":
      return [
        { to: "/institucional", etiqueta: "Resumen", icono: LayoutDashboard, end: true },
        { to: "/institucional?seccion=colecciones", etiqueta: "Colecciones", icono: FolderKanban },
        { to: "/institucional?seccion=artistas", etiqueta: "Artistas asociados", icono: Palette },
        { to: "/institucional?seccion=reportes", etiqueta: "Reportes", icono: FileSpreadsheet },
        { to: "/institucional?seccion=perfil", etiqueta: "Perfil de la institución", icono: Building2 },
        { to: "/institucional?seccion=equipo", etiqueta: "Equipo", icono: BarChart3 },
      ];
    default:
      return [{ to: "/", etiqueta: "Catálogo", icono: Palette, end: true }];
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
 * 6.12 Estructura común de los paneles:
 * Barra lateral: 240 px fija en escritorio. Arriba la marca; en el centro la navegación vertical
 * con icono y texto, donde el elemento activo lleva un borde izquierdo de 2 px en --riel;
 * abajo el avatar con el rol y "Cerrar sesión".
 * Cabecera de página: migas, H1 y la acción primaria a la derecha.
 * Contenido: contenedor de 1200 px, con tarjetas métricas, tablas y formularios en formato caja.
 * Móvil: la barra lateral se convierte en un menú de pantalla completa.
 */
export function PanelShell({
  eyebrow,
  migas,
  titulo,
  descripcion,
  acciones,
  enlacesLaterales,
  children,
}: PanelShellProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  const enlaces = enlacesLaterales ?? enlacesPorDefecto(user?.rol);
  const migasFinales: ItemMiga[] =
    migas ?? (eyebrow ? [{ etiqueta: eyebrow }, { etiqueta: titulo }] : [{ etiqueta: titulo }]);

  const esEnlaceActivo = (item: EnlaceLateralPanel, isActiveRouter: boolean): boolean => {
    const tieneQuery = item.to.includes("?");
    if (tieneQuery) {
      return `${location.pathname}${location.search}` === item.to;
    }
    if (item.end) {
      return location.pathname === item.to && location.search === "";
    }
    return isActiveRouter;
  };

  const cerrarSesion = async () => {
    await logout();
    setMenuMovilAbierto(false);
    navigate("/");
  };

  return (
    <div className="relative min-h-screen bg-[color:var(--fondo)] text-[color:var(--tinta)]">
      <Ambiente nivel={1} />
      {/* Barra superior móvil (< 1024px) */}
      <header className="sticky top-0 z-40 flex h-[var(--alto-cabecera)] items-center justify-between border-b border-[color:var(--divisor)] bg-[color:var(--cabecera-fondo)] px-[var(--espacio-16)] min-[1024px]:hidden">
        <Link to="/" className="no-underline">
          <LogoMarca variante="riel" tamano="md" />
        </Link>
        <button
          type="button"
          onClick={() => setMenuMovilAbierto(true)}
          aria-label="Abrir navegación del panel"
          className="inline-grid h-[var(--area-tactil-min)] w-[var(--area-tactil-min)] place-items-center bg-transparent border-0 text-[color:var(--tinta)] cursor-pointer"
        >
          <Menu size={24} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </header>

      {/* Barra lateral fija en escritorio (240px) */}
      <aside
        aria-label="Navegación del panel"
        className="fixed inset-y-0 left-0 z-30 hidden w-[var(--sidebar-ancho)] flex-col justify-between border-r border-[color:var(--divisor)] bg-[color:var(--fondo)] p-[var(--espacio-24)] min-[1024px]:flex"
      >
        <div>
          <Link to="/" className="inline-block no-underline">
            <LogoMarca variante="riel" tamano="md" />
          </Link>

          <nav aria-label="Secciones del panel" className="mt-[var(--espacio-32)] flex flex-col gap-[var(--espacio-8)]">
            {enlaces.map((item) => {
              const Icono = item.icono;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    clsx(
                      "flex min-h-[var(--alto-control)] items-center gap-[var(--espacio-12)] border-l-2 px-[var(--espacio-16)] py-[var(--espacio-8)] font-[var(--fuente-texto)] font-semibold text-[length:var(--text-dato)] no-underline transition-colors duration-[var(--duracion-hover)]",
                      esEnlaceActivo(item, isActive)
                        ? "border-l-[color:var(--riel)] bg-[color:var(--superficie-elevada)] text-[color:var(--tinta)]"
                        : "border-l-transparent text-[color:var(--tinta-suave)] hover:text-[color:var(--tinta)]"
                    )
                  }
                >
                  <Icono size={20} strokeWidth={1.5} aria-hidden="true" />
                  <span>{item.etiqueta}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-[color:var(--divisor)] pt-[var(--espacio-16)]">
          {user && (
            <div className="mb-[var(--espacio-16)] flex items-center gap-[var(--espacio-12)]">
              <span
                aria-hidden="true"
                className="inline-grid h-[var(--alto-control-compacto)] w-[var(--alto-control-compacto)] shrink-0 place-items-center rounded-[var(--radio-circulo)] border border-[color:var(--riel)] bg-[color:var(--vacio)] font-[var(--fuente-poster)] text-[length:var(--text-minimo)] uppercase text-[color:var(--tinta)]"
              >
                {inicialesDeCorreo(user.correo_electronico)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="voz-cuerpo-pequeno truncate text-[color:var(--tinta)]">{user.correo_electronico}</p>
                <p className="voz-etiqueta mt-[var(--espacio-4)] text-[color:var(--tinta-suave)]">{user.rol}</p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={cerrarSesion}
            className="flex w-full items-center gap-[var(--espacio-8)] bg-transparent border-0 px-0 py-[var(--espacio-8)] font-[var(--fuente-texto)] font-semibold text-[length:var(--text-cuerpo-pequeno)] text-[color:var(--tinta-suave)] hover:text-[color:var(--tinta)] cursor-pointer"
          >
            <LogOut size={18} strokeWidth={1.5} aria-hidden="true" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Menú móvil a pantalla completa */}
      {menuMovilAbierto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menú del panel"
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

          <nav aria-label="Navegación móvil del panel" className="flex flex-col items-center gap-[var(--espacio-24)] text-center">
            {enlaces.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMenuMovilAbierto(false)}
                className={({ isActive }) =>
                  clsx(
                    "font-[var(--fuente-titulo)] font-black text-[length:var(--text-h1-movil)] no-underline",
                    esEnlaceActivo(item, isActive)
                      ? "border-b-2 border-[color:var(--riel)] text-[color:var(--tinta)]"
                      : "text-[color:var(--tinta)] hover:text-[color:var(--riel)]"
                  )
                }
              >
                {item.etiqueta}
              </NavLink>
            ))}
          </nav>

          <div className="flex flex-col items-center gap-[var(--espacio-12)] border-t border-[color:var(--divisor)] pt-[var(--espacio-16)]">
            {user && <p className="voz-etiqueta text-[color:var(--tinta-suave)]">{user.rol}</p>}
            <button
              type="button"
              onClick={cerrarSesion}
              className="bg-transparent border-0 border-b border-[color:var(--borde-terciario)] pb-[var(--espacio-4)] font-[var(--fuente-texto)] font-semibold text-[length:var(--text-cuerpo)] text-[color:var(--tinta)] cursor-pointer"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      )}

      {/* Contenido principal (contenedor de 1200px) */}
      <div className="relative z-10 min-[1024px]:pl-[var(--sidebar-ancho)]">
        <div className="mx-auto w-full max-w-[var(--contenedor-panel)] px-[var(--espacio-16)] py-[var(--espacio-32)] min-[600px]:px-[var(--espacio-24)] min-[1024px]:px-[var(--espacio-48)] min-[1024px]:py-[var(--espacio-48)]">
          <div className="flex flex-wrap items-end justify-between gap-[var(--espacio-24)] border-b border-[color:var(--divisor)] pb-[var(--espacio-24)]">
            <div className="flex flex-col gap-[var(--espacio-8)]">
              <Breadcrumbs items={migasFinales} />
              <h1 className="voz-h1 text-[color:var(--tinta)]">{titulo}</h1>
              {descripcion && (
                <p className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">{descripcion}</p>
              )}
            </div>
            {acciones && (
              <div className="flex flex-wrap items-center gap-[var(--espacio-12)]">{acciones}</div>
            )}
          </div>

          <div className="mt-[var(--espacio-32)]">{children}</div>
        </div>
      </div>
    </div>
  );
}

