import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { LogOut, Menu, ShoppingBag, User, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";

const enlaceClase = ({ isActive }: { isActive: boolean }) =>
  `relative text-sm font-medium uppercase tracking-[0.14em] transition-colors hover:text-ocre after:absolute after:-bottom-1.5 after:left-0 after:h-px after:bg-ocre after:transition-all ${
    isActive ? "text-ocre after:w-full" : "text-marfil-suave after:w-0 hover:after:w-full"
  }`;

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [conFondo, setConFondo] = useState(false);

  useEffect(() => {
    const alScrollear = () => setConFondo(window.scrollY > 8);
    alScrollear();
    window.addEventListener("scroll", alScrollear);
    return () => window.removeEventListener("scroll", alScrollear);
  }, []);

  const cerrarSesion = async () => {
    await logout();
    setMenuAbierto(false);
    navigate("/");
  };

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-all duration-300 ${
        conFondo ? "border-antracita-suave/60 bg-carbon/90 backdrop-blur-md" : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-10">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-[var(--font-display)] text-2xl font-semibold text-marfil">Pixel</span>
          <span className="font-[var(--font-display)] text-2xl italic text-ocre">&amp; Lienzo</span>
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          <NavLink to="/" className={enlaceClase} end>
            Catálogo
          </NavLink>
          {user?.rol === "Comprador" && (
            <NavLink to="/mis-compras" className={enlaceClase}>
              Mis compras
            </NavLink>
          )}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs text-marfil-suave">
                <User size={14} />
                {user.correo_electronico}
                <span className="rounded-full border border-ocre/30 px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wider text-ocre">
                  {user.rol}
                </span>
              </span>
              <Button variante="fantasma" onClick={cerrarSesion} className="!px-3">
                <LogOut size={15} /> Salir
              </Button>
            </div>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium uppercase tracking-[0.14em] text-marfil-suave hover:text-ocre">
                Iniciar sesión
              </Link>
              <Link to="/registro">
                <Button variante="contorno" className="!px-5">
                  Crear cuenta
                </Button>
              </Link>
            </>
          )}
        </div>

        <button className="text-marfil md:hidden" onClick={() => setMenuAbierto((v) => !v)} aria-label="Abrir menú">
          {menuAbierto ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {menuAbierto && (
        <div className="border-t border-antracita-suave bg-carbon px-6 py-6 md:hidden">
          <nav className="flex flex-col gap-5">
            <NavLink to="/" className={enlaceClase} end onClick={() => setMenuAbierto(false)}>
              Catálogo
            </NavLink>
            {user?.rol === "Comprador" && (
              <NavLink to="/mis-compras" className={enlaceClase} onClick={() => setMenuAbierto(false)}>
                <span className="flex items-center gap-1.5">
                  <ShoppingBag size={15} /> Mis compras
                </span>
              </NavLink>
            )}
            <hr className="border-antracita-suave" />
            {user ? (
              <>
                <span className="text-sm text-marfil-suave">{user.correo_electronico}</span>
                <Button variante="fantasma" onClick={cerrarSesion} className="!justify-start !px-0">
                  <LogOut size={15} /> Cerrar sesión
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuAbierto(false)} className="text-sm font-medium text-marfil">
                  Iniciar sesión
                </Link>
                <Link to="/registro" onClick={() => setMenuAbierto(false)}>
                  <Button className="w-full">Crear cuenta</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
