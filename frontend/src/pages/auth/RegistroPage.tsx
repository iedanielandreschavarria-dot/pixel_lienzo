import { Link } from "react-router-dom";
import { ShoppingBag, Palette } from "lucide-react";
import { AuthCard } from "./AuthCard";

export function RegistroPage() {
  return (
    <AuthCard titulo="Crear cuenta" subtitulo="¿Cómo quieres unirte a Pixel y Lienzo?" ancho="max-w-lg">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          to="/registro/comprador"
          className="flex flex-col items-center gap-3 rounded-lg border border-antracita-suave p-6 text-center transition-colors hover:border-ocre/50 hover:bg-antracita-suave/40"
        >
          <ShoppingBag size={28} className="text-ocre" />
          <span className="font-medium text-marfil">Soy Comprador</span>
          <span className="text-xs text-marfil-suave">Quiero descubrir y adquirir obras originales.</span>
        </Link>
        <Link
          to="/registro/artista"
          className="flex flex-col items-center gap-3 rounded-lg border border-antracita-suave p-6 text-center transition-colors hover:border-ocre/50 hover:bg-antracita-suave/40"
        >
          <Palette size={28} className="text-ocre" />
          <span className="font-medium text-marfil">Soy Artista</span>
          <span className="text-xs text-marfil-suave">Quiero exhibir y vender mi portafolio.</span>
        </Link>
      </div>
      <p className="mt-6 text-center text-sm text-marfil-suave">
        ¿Ya tienes cuenta?{" "}
        <Link to="/login" className="font-medium text-ocre hover:underline">
          Inicia sesión
        </Link>
      </p>
    </AuthCard>
  );
}
