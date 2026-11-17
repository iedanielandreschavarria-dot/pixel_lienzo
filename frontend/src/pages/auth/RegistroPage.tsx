import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import type { DatosCuentaGoogle } from "../../components/auth/BotonGoogle";
import { Banner } from "../../components/ui/Banner";
import { AuthCard } from "./AuthCard";

export function RegistroPage() {
  const location = useLocation();
  const googleAuth = (location.state as { googleAuth?: DatosCuentaGoogle } | null)?.googleAuth;

  useEffect(() => {
    document.title = "Crear cuenta · Pixel & Lienzo";
  }, []);

  return (
    <AuthCard titulo="Crear cuenta" subtitulo="Tu lugar en la sala">
      {googleAuth && (
        <div className="mb-[var(--espacio-20)]">
          <Banner variante="informativo">
            Cuenta de Google conectada{googleAuth.email ? ` (${googleAuth.email})` : ""}. Elige tu tipo de perfil para continuar.
          </Banner>
        </div>
      )}
      <div className="roles-acceso" role="group" aria-label="Tipo de cuenta">
        <Link to="/registro/comprador" state={googleAuth ? { googleAuth } : undefined} className="rol-acceso">
          <span className="rol-acceso__titulo">Coleccionista</span>
          <span className="rol-acceso__detalle">Compra y colecciona obras</span>
        </Link>
        <Link to="/registro/artista" state={googleAuth ? { googleAuth } : undefined} className="rol-acceso">
          <span className="rol-acceso__titulo">Artista</span>
          <span className="rol-acceso__detalle">Publica y vende tu trabajo</span>
        </Link>
      </div>

      <div className="divisor-riel">
        <span>¿Ya tienes cuenta?</span>
      </div>

      <p className="mt-[var(--espacio-16)] text-center text-[length:var(--text-cuerpo)] text-[color:var(--tinta-suave)]">
        <Link to="/login" className="enlace-acceso">
          ← Volver a iniciar sesión
        </Link>
      </p>
    </AuthCard>
  );
}

