import { useEffect } from "react";
import { Link } from "react-router-dom";
import { AuthCard } from "./AuthCard";

export function RegistroPage() {
  useEffect(() => {
    document.title = "Crear cuenta · Pixel & Lienzo";
  }, []);

  return (
    <AuthCard titulo="Crear cuenta" subtitulo="Tu lugar en la sala">
      <div className="roles-acceso" role="group" aria-label="Tipo de cuenta">
        <Link to="/registro/comprador" className="rol-acceso">
          <span className="rol-acceso__titulo">Coleccionista</span>
          <span className="rol-acceso__detalle">Compra y colecciona obras</span>
        </Link>
        <Link to="/registro/artista" className="rol-acceso">
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

