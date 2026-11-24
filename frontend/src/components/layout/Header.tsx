import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown, LayoutDashboard, Menu, Search, ShoppingBag, Trash2, User, X } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { urlPreviewObra } from "../../api/obras";
import { formatearMoneda } from "../../lib/formato";
import { LogoMarca } from "../ui/LogoMarca";
import { Button } from "../ui/Button";
import type { NombreRol } from "../../types";

export type VarianteCabecera = "completa" | "minima" | "checkout";

export interface HeaderProps {
  variante?: VarianteCabecera;
  hrefVolverObra?: string;
  fija?: boolean;
  className?: string;
}

export interface SubopcionMenu {
  to: string;
  etiqueta: string;
  detalle?: string;
}

export interface EnlacePrincipalMenu {
  to: string;
  etiqueta: string;
  subopciones: SubopcionMenu[];
}

export const ENLACES_PRINCIPALES: EnlacePrincipalMenu[] = [
  {
    to: "/sala-palacio-nacional",
    etiqueta: "Sala Palacio Nacional",
    subopciones: [
      {
        to: "/sala-palacio-nacional/quienes-somos",
        etiqueta: "Quiénes somos",
      },
      {
        to: "/sala-palacio-nacional/visitanos",
        etiqueta: "Visítanos",
      },
      {
        to: "/sala-palacio-nacional/uso-del-espacio",
        etiqueta: "Conoce el uso del espacio",
      },
    ],
  },
  {
    to: "/artistas",
    etiqueta: "Artistas",
    subopciones: [
      {
        to: "/artistas",
        etiqueta: "Directorio de artistas",
      },
      {
        to: "/artistas/quiero-formar-parte",
        etiqueta: "Quiero formar parte",
      },
    ],
  },
  {
    to: "/exposiciones",
    etiqueta: "Exposiciones",
    subopciones: [
      {
        to: "/exposiciones?estado=En+curso",
        etiqueta: "Exposiciones en curso",
        detalle: "Muestras activas en Sala Palacio Nacional",
      },
      {
        to: "/exposiciones?estado=Pr%C3%B3xima",
        etiqueta: "Próximas exposiciones",
        detalle: "Calendario curatorial y aperturas",
      },
    ],
  },
  {
    to: "/arte",
    etiqueta: "Arte",
    subopciones: [
      {
        to: "/arte",
        etiqueta: "Todo el catálogo",
        detalle: "Explora todas las piezas certificadas",
      },
      {
        to: "/arte?disponibilidad=disponibles",
        etiqueta: "Obras disponibles",
        detalle: "Piezas listas para adquisición inmediata",
      },
      {
        to: "/arte?orden=recientes",
        etiqueta: "Adquisiciones recientes",
        detalle: "Últimas incorporaciones en sala",
      },
    ],
  },
  {
    to: "/colecciones",
    etiqueta: "Colecciones",
    subopciones: [
      {
        to: "/colecciones",
        etiqueta: "Fondos y categorías",
        detalle: "Explorar por línea curatorial y técnica",
      },
    ],
  },
  {
    to: "/mas",
    etiqueta: "Más",
    subopciones: [
      {
        to: "/verificar/buscar",
        etiqueta: "Verificar certificado",
        detalle: "Valida cualquier sello criptográfico SHA-256",
      },
      {
        to: "/legal/acerca",
        etiqueta: "Acerca de Pixel & Lienzo",
        detalle: "Arquitectura de confianza y trazabilidad",
      },
      {
        to: "/legal/contacto",
        etiqueta: "Contacto y soporte",
        detalle: "Atención a coleccionistas, artistas e instituciones",
      },
      {
        to: "/legal/terminos",
        etiqueta: "Términos y privacidad",
        detalle: "Marco legal y protección de datos",
      },
    ],
  },
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
 * Cabecera reorganizada en dos niveles:
 * - Fila superior: Izquierda nuestro LogoMarca, en el medio la barra de búsqueda,
 *   a la derecha el Carrito de compra + Ingresar (Login y Registro) o menú de usuario.
 * - Fila inferior: Opciones de navegación con rutas propias:
 *   Sala Palacio Nacional, Artistas, Exposiciones, Arte, Colecciones, Más.
 */
export function Header({
  variante = "completa",
  hrefVolverObra = "/",
  fija = false,
  className,
}: HeaderProps) {
  const { user, logout } = useAuth();
  const {
    items: itemsCarrito,
    cantidad: cantidadCarrito,
    total: totalCarrito,
    abierto: carritoAbierto,
    cerrarCarrito,
    quitarObra,
    vaciarCarrito,
  } = useCart();

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const barraRef = useRef<HTMLDivElement>(null);
  const menuCuentaRef = useRef<HTMLDivElement>(null);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [menuCuentaAbierto, setMenuCuentaAbierto] = useState(false);
  const [menuDesplegableActivo, setMenuDesplegableActivo] = useState<string | null>(null);
  const [terminoBusqueda, setTerminoBusqueda] = useState(() => searchParams.get("q") ?? "");

  // Sincronizar el input de búsqueda con ?q= cuando cambia la URL
  useEffect(() => {
    setTerminoBusqueda(searchParams.get("q") ?? "");
  }, [searchParams]);

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
    if (!menuMovilAbierto && !menuCuentaAbierto && !carritoAbierto) return;
    const alPresionarTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuMovilAbierto(false);
        setMenuCuentaAbierto(false);
        cerrarCarrito();
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
  }, [menuMovilAbierto, menuCuentaAbierto, carritoAbierto, cerrarCarrito]);

  const manejarBusqueda = (e: FormEvent) => {
    e.preventDefault();
    const q = terminoBusqueda.trim();
    setMenuMovilAbierto(false);
    window.scrollTo({ top: 0, behavior: "auto" });
    if (q) {
      navigate(`/arte?q=${encodeURIComponent(q)}`);
    } else {
      navigate("/arte");
    }
  };

  const cerrarSesion = async () => {
    await logout();
    setMenuMovilAbierto(false);
    setMenuCuentaAbierto(false);
    navigate("/");
  };

  const enlacePanel = rutaPanelPorRol(user?.rol);
  const puedePostularComoArtista =
    !user || user.rol === "Comprador";

  // Ocultar la opción "Quiero formar parte" del menú desplegable cuando la sesión activa ya es Artista, Curador o Administrador
  const enlacesMenuVisibles = useMemo(() => {
    return ENLACES_PRINCIPALES.map((enlace) => {
      if (enlace.to !== "/artistas") return enlace;
      return {
        ...enlace,
        subopciones: enlace.subopciones.filter((sub) =>
          sub.to === "/artistas/quiero-formar-parte" ? puedePostularComoArtista : true
        ),
      };
    });
  }, [puedePostularComoArtista]);

  const esEnlacePrincipalActivo = (to: string, isActive: boolean): boolean => {
    if (to === "/arte") {
      return (
        isActive ||
        location.pathname === "/arte" ||
        (location.pathname === "/" && location.hash === "#coleccion")
      );
    }
    if (to === "/artistas") {
      return (
        isActive ||
        location.pathname.startsWith("/artistas") ||
        (location.pathname === "/" &&
          (location.hash === "#artistas" || searchParams.has("perfil_artista")))
      );
    }
    return isActive;
  };

  const renderBotonCarrito = () => (
    <Link
      to="/carrito"
      aria-label={`Carrito de compra (${cantidadCarrito} ${cantidadCarrito === 1 ? "obra" : "obras"})`}
      className="relative inline-flex min-h-[var(--alto-control-compacto)] items-center gap-[var(--espacio-8)] rounded-[var(--radio-pildora)] border border-[color:var(--borde-reposo)] bg-[color:var(--fondo)] px-[var(--espacio-16)] py-[var(--espacio-8)] font-[var(--fuente-texto)] font-semibold text-[length:var(--text-cuerpo-pequeno)] text-[color:var(--tinta)] no-underline transition-colors duration-[var(--duracion-hover)] hover:border-[color:var(--carmesi)] cursor-pointer"
    >
      <ShoppingBag size={18} strokeWidth={1.6} aria-hidden="true" className="text-[color:var(--carmesi)]" />
      <span className="hidden sm:inline">Carrito</span>
      <span
        className={clsx(
          "inline-grid h-5 min-w-5 place-items-center rounded-[var(--radio-pildora)] px-1.5 font-[var(--fuente-poster)] text-[0.75rem] leading-none tracking-[0.06em]",
          cantidadCarrito > 0
            ? "bg-[color:var(--carmesi)] text-[color:var(--tinta-inversa)] border border-[color:var(--carmesi)]"
            : "bg-[color:var(--vacio)] text-[color:var(--tinta-suave)]"
        )}
      >
        {cantidadCarrito}
      </span>
    </Link>
  );

  const renderBotonWhatsApp = () => (
    <a
      href="https://wa.me/573106332874"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp al Palacio Nacional (310 633 2874)"
      title="WhatsApp Palacio Nacional · 310 633 2874"
      className="inline-grid h-[var(--alto-control-compacto)] w-[var(--alto-control-compacto)] place-items-center rounded-[var(--radio-circulo)] border border-[color:var(--borde-reposo)] bg-[color:var(--fondo)] text-[color:var(--riel)] transition-colors duration-[var(--duracion-hover)] hover:border-[color:var(--riel)] hover:bg-[color:var(--superficie-elevada)] hover:text-[color:var(--tinta)]"
    >
      <svg
        viewBox="0 0 24 24"
        width="19"
        height="19"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
        <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
      </svg>
    </a>
  );

  const renderBloqueCuenta = () => {
    if (!user) {
      return (
        <div className="flex items-center gap-[var(--espacio-8)]">
          <Link
            to="/login"
            aria-label="Iniciar sesión o registrarse"
            title="Iniciar sesión / Registrarse"
            className="inline-grid h-[var(--alto-control-compacto)] w-[var(--alto-control-compacto)] place-items-center rounded-[var(--radio-circulo)] border border-[color:var(--carmesi)] bg-[color:var(--carmesi)] text-[color:var(--tinta-inversa)] no-underline transition-[background-color,border-color,box-shadow] duration-[var(--duracion-hover)] hover:bg-[color:var(--incandescente)] hover:border-[color:var(--riel)] hover:shadow-[var(--resplandor-primario)]"
          >
            <User size={19} strokeWidth={1.7} aria-hidden="true" />
          </Link>
          {renderBotonWhatsApp()}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-[var(--espacio-8)]">
        {enlacePanel && (
          <Link
            to={enlacePanel.to}
            className="inline-flex min-h-[var(--alto-control-compacto)] items-center gap-2 rounded-[var(--radio-pildora)] border border-[color:var(--riel)] bg-[color:var(--carmesi)] px-3.5 py-1.5 font-[var(--fuente-texto)] text-[0.98rem] font-semibold text-[color:var(--tinta-inversa)] no-underline shadow-[var(--resplandor-primario)] transition-colors hover:border-white hover:bg-[color:var(--incandescente)]"
          >
            <LayoutDashboard size={16} strokeWidth={1.7} aria-hidden="true" />
            <span className="hidden lg:inline">{enlacePanel.etiqueta}</span>
            <span className="lg:hidden">Mi panel</span>
          </Link>
        )}
        <div ref={menuCuentaRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuCuentaAbierto((v) => !v)}
            aria-expanded={menuCuentaAbierto}
            aria-haspopup="menu"
            aria-label="Menú de cuenta"
            className="inline-grid h-[var(--alto-control-compacto)] w-[var(--alto-control-compacto)] place-items-center rounded-[var(--radio-circulo)] border border-[color:var(--carmesi)] bg-[color:var(--carmesi)] font-[var(--fuente-poster)] text-[length:var(--text-minimo)] uppercase tracking-[0.08em] text-[color:var(--tinta-inversa)] hover:bg-[color:var(--incandescente)] cursor-pointer"
          >
            {inicialesDeCorreo(user.correo_electronico)}
          </button>

          {menuCuentaAbierto && (
            <div
              role="menu"
              aria-label="Menú de cuenta"
              className="absolute right-0 top-full z-50 mt-[var(--espacio-8)] min-w-[230px] rounded-[var(--radio-recto)] border border-[color:var(--riel)] bg-[color:var(--fondo)] py-[var(--espacio-8)] shadow-[var(--sombra-tarjeta)]"
            >
              <div className="border-b border-[color:var(--divisor)] px-[var(--espacio-16)] pb-[var(--espacio-8)]">
                <p className="voz-cuerpo-pequeno truncate text-[color:var(--tinta)]">
                  {user.correo_electronico}
                </p>
                <p className="voz-etiqueta mt-[var(--espacio-4)] text-[color:var(--riel)]">
                  {user.rol}
                </p>
              </div>

              <ul className="list-none p-0 py-[var(--espacio-4)]">
                {enlacePanel && (
                  <li>
                    <Link
                      to={enlacePanel.to}
                      role="menuitem"
                      onClick={() => setMenuCuentaAbierto(false)}
                      className="flex items-center gap-2 px-[var(--espacio-16)] py-[var(--espacio-8)] font-[var(--fuente-texto)] font-semibold text-[length:var(--text-cuerpo-pequeno)] text-[color:var(--riel)] no-underline hover:bg-[color:var(--fila-hover)]"
                    >
                      <LayoutDashboard size={16} strokeWidth={1.6} aria-hidden="true" />
                      <span>Ir a {enlacePanel.etiqueta}</span>
                    </Link>
                  </li>
                )}
                {user.rol === "Comprador" && (
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
                )}
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
                <li className="mt-[var(--espacio-4)] border-t border-[color:var(--divisor)] pt-[var(--espacio-4)]">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => void cerrarSesion()}
                    className="block w-full bg-transparent border-0 px-[var(--espacio-16)] py-[var(--espacio-8)] text-left font-[var(--fuente-texto)] font-medium text-[length:var(--text-cuerpo-pequeno)] text-[color:var(--tinta)] hover:bg-[color:var(--fila-hover)] cursor-pointer"
                  >
                    Cerrar sesión
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
        {renderBotonWhatsApp()}
      </div>
    );
  };

  const renderDrawerCarrito = () => {
    if (!carritoAbierto) return null;
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compra"
        onClick={(e) => {
          if (e.target === e.currentTarget) cerrarCarrito();
        }}
        className="fixed inset-0 z-50 flex justify-end bg-[color:var(--modal-velo)]"
      >
        <div className="flex h-full w-full max-w-[440px] flex-col justify-between border-l border-[color:var(--borde-reposo)] bg-[color:var(--fondo)] p-[var(--espacio-24)] shadow-[var(--sombra-tarjeta)]">
          {/* Cabecera del carrito */}
          <div className="flex items-center justify-between border-b border-[color:var(--divisor)] pb-[var(--espacio-16)]">
            <div className="flex items-center gap-[var(--espacio-12)]">
              <ShoppingBag size={20} strokeWidth={1.6} className="text-[color:var(--riel)]" />
              <h2 className="voz-h3 text-[color:var(--tinta)]">Carrito de compra</h2>
            </div>
            <button
              type="button"
              onClick={cerrarCarrito}
              aria-label="Cerrar carrito"
              className="inline-grid h-[var(--area-tactil-min)] w-[var(--area-tactil-min)] place-items-center bg-transparent border-0 text-[color:var(--tinta-suave)] hover:text-[color:var(--tinta)] cursor-pointer"
            >
              <X size={22} strokeWidth={1.5} />
            </button>
          </div>

          {/* Lista de obras en el carrito */}
          <div className="flex-1 overflow-y-auto py-[var(--espacio-24)]">
            {itemsCarrito.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-[var(--espacio-16)] text-center">
                <div className="grid h-16 w-16 place-items-center rounded-[var(--radio-circulo)] border border-[color:var(--borde-reposo)] bg-[color:var(--vacio)] text-[color:var(--riel)]">
                  <ShoppingBag size={26} strokeWidth={1.4} />
                </div>
                <p className="voz-h4 text-[color:var(--tinta)]">Tu carrito está vacío</p>
                <p className="voz-cuerpo-pequeno max-w-[30ch] text-[color:var(--tinta-suave)]">
                  Explora las obras certificadas de la colección y agrégalas para adquirirlas.
                </p>
                <Button
                  type="button"
                  variante="primario"
                  onClick={() => {
                    cerrarCarrito();
                    navigate("/arte");
                  }}
                >
                  Explorar catálogo de Arte
                </Button>
              </div>
            ) : (
              <ul className="flex flex-col gap-[var(--espacio-16)] list-none p-0 m-0">
                {itemsCarrito.map((item) => (
                  <li
                    key={item.id_obra}
                    className="flex items-center justify-between gap-[var(--espacio-12)] border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] p-[var(--espacio-12)]"
                  >
                    <Link
                      to={`/obras/${item.id_obra}`}
                      onClick={cerrarCarrito}
                      className="flex min-w-0 flex-1 items-center gap-[var(--espacio-12)] no-underline"
                    >
                      <div className="h-16 w-16 shrink-0 overflow-hidden border border-[color:var(--divisor)] bg-[color:var(--vacio)]">
                        <img
                          src={urlPreviewObra(item.id_obra)}
                          alt={item.titulo}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-[var(--fuente-titulo)] text-[1.05rem] font-black text-[color:var(--tinta)]">
                          {item.titulo}
                        </p>
                        <p className="truncate font-[var(--fuente-texto)] text-[0.95rem] text-[color:var(--tinta-suave)]">
                          {item.tecnica}
                        </p>
                        <p className="voz-dato mt-1 text-[1rem] text-[color:var(--riel)]">
                          {formatearMoneda(item.precio_venta)}
                        </p>
                      </div>
                    </Link>

                    <div className="flex flex-col items-end gap-2">
                      <button
                        type="button"
                        onClick={() => quitarObra(item.id_obra)}
                        aria-label={`Quitar ${item.titulo} del carrito`}
                        className="inline-grid h-9 w-9 place-items-center bg-transparent border border-transparent text-[color:var(--tinta-suave)] hover:border-[color:var(--riel)] hover:text-[color:var(--tinta)] cursor-pointer"
                      >
                        <Trash2 size={16} strokeWidth={1.5} />
                      </button>
                      <Link
                        to={`/obras/${item.id_obra}?checkout=1`}
                        onClick={cerrarCarrito}
                        className="font-[var(--fuente-texto)] text-[0.88rem] font-semibold text-[color:var(--tinta)] underline decoration-[color:var(--riel)] underline-offset-4 hover:text-[color:var(--riel)]"
                      >
                        Adquirir
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Pie del carrito */}
          <div className="border-t border-[color:var(--divisor)] pt-[var(--espacio-16)]">
            {itemsCarrito.length > 0 && (
              <>
                <div className="mb-[var(--espacio-16)] flex items-baseline justify-between">
                  <span className="voz-etiqueta text-[color:var(--tinta-suave)]">Total estimado</span>
                  <span className="voz-h3 text-[color:var(--tinta)]">
                    {formatearMoneda(totalCarrito)}
                  </span>
                </div>
                <div className="flex flex-col gap-[var(--espacio-12)]">
                  <Button
                    type="button"
                    variante="primario"
                    onClick={() => {
                      const primera = itemsCarrito[0];
                      cerrarCarrito();
                      if (primera) {
                        navigate(`/obras/${primera.id_obra}?checkout=1`);
                      }
                    }}
                    className="w-full"
                  >
                    Proceder al pago ({itemsCarrito.length})
                  </Button>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={vaciarCarrito}
                      className="bg-transparent border-0 p-0 font-[var(--fuente-texto)] text-[0.95rem] text-[color:var(--tinta-suave)] underline underline-offset-4 hover:text-[color:var(--tinta)] cursor-pointer"
                    >
                      Vaciar carrito
                    </button>
                    {user && (
                      <Link
                        to="/mis-compras"
                        onClick={cerrarCarrito}
                        className="font-[var(--fuente-texto)] text-[0.95rem] text-[color:var(--tinta-suave)] underline underline-offset-4 hover:text-[color:var(--tinta)]"
                      >
                        Ver mis compras →
                      </Link>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
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
      <>
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
            <div className="flex items-center gap-[var(--espacio-12)]">
              {renderBotonCarrito()}
              {renderBloqueCuenta()}
            </div>
          </div>
        </header>
        {renderDrawerCarrito()}
      </>
    );
  }

  return (
    <>
      <header
        ref={barraRef}
        className={clsx(
          fija ? "fixed inset-x-0 top-0" : "sticky top-0",
          "z-40 border-b-2 border-[color:var(--riel)] bg-[#131210]/96 shadow-[0_14px_38px_rgba(8,7,6,0.55)] backdrop-blur-md transition-[background-color,border-color,opacity] duration-[var(--duracion-pagina)] ease-[var(--curva-base)]",
          className
        )}
      >
        {/* NIVEL SUPERIOR: Izquierda Logo · Centro Barra de Búsqueda · Derecha Carrito + Ingresar (Login/Registro) */}
        <div className="contenedor-pyl flex min-h-[68px] items-center justify-between gap-[var(--espacio-16)] py-[var(--espacio-12)]">
          {/* Izquierda: Nuestro Logo */}
          <Link to="/" className="shrink-0 no-underline">
            <LogoMarca variante="tinta" tamano="md" />
          </Link>

          {/* Medio: Barra de búsqueda */}
          <form
            onSubmit={manejarBusqueda}
            role="search"
            aria-label="Buscar obras, artistas o técnicas"
            className="hidden max-w-[480px] flex-1 md:flex"
          >
            <div className="relative flex w-full items-center">
              <Search
                size={18}
                strokeWidth={1.6}
                aria-hidden="true"
                className="pointer-events-none absolute left-[var(--espacio-16)] text-[color:var(--tinta-suave)]"
              />
              <input
                type="search"
                value={terminoBusqueda}
                onChange={(e) => setTerminoBusqueda(e.target.value)}
                placeholder="Buscar obras, artistas, técnicas o colecciones…"
                aria-label="Buscar en Pixel & Lienzo"
                className="h-[40px] w-full rounded-[var(--radio-pildora)] border border-[color:var(--borde-reposo)] bg-[color:var(--superficie-elevada)] pl-[42px] pr-[92px] font-[var(--fuente-texto)] text-[1rem] text-[color:var(--tinta)] placeholder:text-[color:var(--tinta-suave)] transition-colors duration-[var(--duracion-hover)] focus:border-[color:var(--riel)] focus:bg-[#2a2722] focus:outline-none"
              />
              <button
                type="submit"
                className="absolute right-1.5 inline-flex h-[30px] items-center rounded-[var(--radio-pildora)] bg-[color:var(--carmesi)] px-3 font-[var(--fuente-poster)] text-[0.75rem] uppercase tracking-[0.1em] text-[color:var(--tinta-inversa)] transition-colors hover:bg-[color:var(--incandescente)] cursor-pointer border border-[color:var(--riel)]/50"
              >
                Buscar
              </button>
            </div>
          </form>

          {/* Derecha: Carrito de compra + Ingresar / Registro (o Botón de Panel + Avatar de cuenta) */}
          <div className="flex items-center gap-[var(--espacio-12)]">
            {(!user || user.rol === "Comprador") && renderBotonCarrito()}
            <div className="flex items-center">{renderBloqueCuenta()}</div>

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
        </div>

        {/* NIVEL INFERIOR: Opciones de navegación con listas desplegables sobre barra Piedra Basalto (#23201C) */}
        <div className="hidden border-t border-[rgba(216,184,136,0.18)] bg-[#23201c] min-[1024px]:block">
          <div className="contenedor-pyl flex h-[46px] items-center justify-center">
            <nav
              aria-label="Navegación principal"
              className="flex items-center gap-[var(--espacio-24)] xl:gap-[var(--espacio-32)]"
            >
              {enlacesMenuVisibles.map((enlace) => {
                const abierto = menuDesplegableActivo === enlace.to;
                return (
                  <div
                    key={enlace.to}
                    className="relative"
                    onMouseEnter={() => setMenuDesplegableActivo(enlace.to)}
                    onMouseLeave={() => setMenuDesplegableActivo(null)}
                  >
                    <NavLink
                      to={enlace.to}
                      onClick={() => setMenuDesplegableActivo(null)}
                      className={({ isActive }) =>
                        clsx(
                          "relative flex h-[46px] items-center gap-1.5 font-[var(--fuente-texto)] font-semibold text-[1.08rem] tracking-[0.02em] no-underline transition-colors duration-[var(--duracion-hover)]",
                          esEnlacePrincipalActivo(enlace.to, isActive)
                            ? "border-b-2 border-[color:var(--riel)] text-[color:var(--riel)]"
                            : "border-b-2 border-transparent text-[color:var(--tinta-suave)] hover:text-[color:var(--tinta)]"
                        )
                      }
                    >
                      <span>{enlace.etiqueta}</span>
                      <ChevronDown
                        size={14}
                        strokeWidth={1.75}
                        aria-hidden="true"
                        className={clsx(
                          "transition-transform duration-200",
                          abierto ? "rotate-180 text-[color:var(--riel)]" : "opacity-75"
                        )}
                      />
                    </NavLink>

                    {/* Lista desplegable del menú (solo títulos de las secciones) */}
                    {abierto && (
                      <div
                        role="menu"
                        aria-label={`Submenú de ${enlace.etiqueta}`}
                        className="absolute left-1/2 top-full z-50 w-[240px] -translate-x-1/2 pt-1"
                      >
                        <div className="border border-[color:var(--borde-reposo)] bg-[#181614] py-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.65)]">
                          <ul className="list-none m-0 p-0">
                            {enlace.subopciones.map((sub) => (
                              <li key={sub.to}>
                                <Link
                                  to={sub.to}
                                  role="menuitem"
                                  onClick={() => setMenuDesplegableActivo(null)}
                                  className="block px-4 py-2.5 font-[var(--fuente-texto)] text-[1.05rem] font-semibold leading-snug text-[color:var(--tinta)] no-underline transition-colors hover:bg-[color:var(--fila-hover)] hover:text-[color:var(--riel)]"
                                >
                                  {sub.etiqueta}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Menú Móvil a pantalla completa */}
        {menuMovilAbierto && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
            className="fixed inset-0 z-50 flex flex-col justify-between overflow-y-auto bg-[color:var(--vacio)] p-[var(--espacio-24)] min-[1024px]:hidden"
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

            {/* Búsqueda dentro del menú móvil */}
            <form onSubmit={manejarBusqueda} className="my-[var(--espacio-24)]">
              <div className="relative flex w-full items-center">
                <Search
                  size={18}
                  strokeWidth={1.6}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-[var(--espacio-16)] text-[color:var(--tinta-suave)]"
                />
                <input
                  type="search"
                  value={terminoBusqueda}
                  onChange={(e) => setTerminoBusqueda(e.target.value)}
                  placeholder="Buscar obras, artistas, técnicas…"
                  className="h-[44px] w-full rounded-[var(--radio-pildora)] border border-[color:var(--riel)] bg-[rgba(242,236,227,0.05)] pl-[44px] pr-[var(--espacio-16)] font-[var(--fuente-texto)] text-[1.05rem] text-[color:var(--tinta)] placeholder:text-[color:var(--tinta-suave)]"
                />
              </div>
            </form>

            <nav
              aria-label="Menú móvil"
              className="flex flex-col items-center gap-[var(--espacio-16)] text-center"
            >
              {enlacesMenuVisibles.map((enlace) => (
                <NavLink
                  key={enlace.to}
                  to={enlace.to}
                  onClick={() => setMenuMovilAbierto(false)}
                  className={({ isActive }) =>
                    clsx(
                      "font-[var(--fuente-titulo)] font-black text-[1.75rem] no-underline",
                      esEnlacePrincipalActivo(enlace.to, isActive)
                        ? "border-b-2 border-[color:var(--riel)] text-[color:var(--tinta)]"
                        : "text-[color:var(--tinta)] hover:text-[color:var(--riel)]"
                    )
                  }
                >
                  {enlace.etiqueta}
                </NavLink>
              ))}

              <div className="my-2 h-[1px] w-24 bg-[color:var(--divisor)]" />

              {user ? (
                <>
                  {enlacePanel && (
                    <NavLink
                      to={enlacePanel.to}
                      onClick={() => setMenuMovilAbierto(false)}
                      className="rounded-[var(--radio-pildora)] border border-[color:var(--riel)] bg-[color:var(--carmesi)] px-6 py-2 font-[var(--fuente-titulo)] font-black text-[1.45rem] text-[color:var(--tinta-inversa)] no-underline"
                    >
                      {enlacePanel.etiqueta}
                    </NavLink>
                  )}
                  {user.rol === "Comprador" && (
                    <NavLink
                      to="/mis-compras"
                      onClick={() => setMenuMovilAbierto(false)}
                      className="font-[var(--fuente-titulo)] font-black text-[1.5rem] text-[color:var(--tinta)] no-underline"
                    >
                      Mis compras
                    </NavLink>
                  )}
                  <NavLink
                    to="/cuenta"
                    onClick={() => setMenuMovilAbierto(false)}
                    className="font-[var(--fuente-titulo)] font-black text-[1.5rem] text-[color:var(--tinta)] no-underline"
                  >
                    Cuenta
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => void cerrarSesion()}
                    className="mt-[var(--espacio-12)] bg-transparent border-0 border-b border-[color:var(--borde-terciario)] pb-[var(--espacio-4)] font-[var(--fuente-texto)] font-semibold text-[length:var(--text-cuerpo)] text-[color:var(--tinta)] cursor-pointer"
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-[var(--espacio-16)]">
                  <Link
                    to="/login"
                    onClick={() => setMenuMovilAbierto(false)}
                    className="rounded-[var(--radio-pildora)] border border-[color:var(--riel)] bg-[color:var(--carmesi)] px-6 py-2 font-[var(--fuente-titulo)] font-black text-[1.35rem] text-[color:var(--tinta)] no-underline"
                  >
                    Ingresar
                  </Link>
                  <Link
                    to="/registro"
                    onClick={() => setMenuMovilAbierto(false)}
                    className="rounded-[var(--radio-pildora)] border border-[color:var(--borde-reposo)] px-6 py-2 font-[var(--fuente-titulo)] font-black text-[1.35rem] text-[color:var(--tinta)] no-underline"
                  >
                    Registro
                  </Link>
                </div>
              )}
            </nav>

            <p className="voz-cuerpo-pequeno mt-6 text-center text-[color:var(--tinta-suave)]">
              © 2026 Pixel &amp; Lienzo
            </p>
          </div>
        )}
      </header>

      {renderDrawerCarrito()}
    </>
  );
}
