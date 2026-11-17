import { Link } from "react-router-dom";
import { LogoMarca } from "../ui/LogoMarca";

/**
 * 4.2 Pie de página:
 * Fondo --vacio y borde superior de 1 px en --riel al 40 %. No aparece en el Nivel 3 ni en el Checkout.
 * Tres columnas en escritorio: marca con una frase; Explorar (Obras, Artistas, Estudio Motion);
 * Confianza (Verificar certificado, Términos, Privacidad, Contacto).
 * Línea final: "© 2026 Pixel & Lienzo". El enlace a Verificar certificado es permanente.
 */
export function Footer() {
  return (
    <footer className="border-t border-[color:var(--borde-reposo)] bg-[color:var(--vacio)]">
      <div className="contenedor-pyl py-[var(--espacio-48)]">
        <div className="grid grid-cols-1 gap-[var(--espacio-32)] min-[1024px]:grid-cols-3">
          <div className="flex flex-col gap-[var(--espacio-8)]">
            <Link to="/" className="self-start no-underline">
              <LogoMarca variante="riel" tamano="md" />
            </Link>
            <p className="voz-cursiva text-[color:var(--tinta-suave)]">
              Arte con certificado verificable
            </p>
          </div>

          <div className="flex flex-col gap-[var(--espacio-12)]">
            <p className="voz-etiqueta text-[color:var(--tinta-suave)]">Explorar</p>
            <ul className="flex flex-col gap-[var(--espacio-8)] list-none p-0">
              <li>
                <Link
                  to="/#coleccion"
                  className="voz-cuerpo-pequeno text-[color:var(--tinta)] no-underline hover:text-[color:var(--riel)]"
                >
                  Obras
                </Link>
              </li>
              <li>
                <Link
                  to="/#artistas"
                  className="voz-cuerpo-pequeno text-[color:var(--tinta)] no-underline hover:text-[color:var(--riel)]"
                >
                  Artistas
                </Link>
              </li>
              <li>
                <Link
                  to="/estudio"
                  className="voz-cuerpo-pequeno text-[color:var(--tinta)] no-underline hover:text-[color:var(--riel)]"
                >
                  Estudio Motion
                </Link>
              </li>
              <li>
                <Link
                  to="/legal/acerca"
                  className="voz-cuerpo-pequeno text-[color:var(--tinta)] no-underline hover:text-[color:var(--riel)]"
                >
                  Acerca de
                </Link>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-[var(--espacio-12)]">
            <p className="voz-etiqueta text-[color:var(--tinta-suave)]">Confianza</p>
            <ul className="flex flex-col gap-[var(--espacio-8)] list-none p-0">
              <li>
                <Link
                  to="/verificar/buscar"
                  className="voz-cuerpo-pequeno text-[color:var(--tinta)] no-underline hover:text-[color:var(--riel)]"
                >
                  Verificar certificado
                </Link>
              </li>
              <li>
                <Link
                  to="/legal/terminos"
                  className="voz-cuerpo-pequeno text-[color:var(--tinta)] no-underline hover:text-[color:var(--riel)]"
                >
                  Términos
                </Link>
              </li>
              <li>
                <Link
                  to="/legal/privacidad"
                  className="voz-cuerpo-pequeno text-[color:var(--tinta)] no-underline hover:text-[color:var(--riel)]"
                >
                  Privacidad
                </Link>
              </li>
              <li>
                <Link
                  to="/legal/contacto"
                  className="voz-cuerpo-pequeno text-[color:var(--tinta)] no-underline hover:text-[color:var(--riel)]"
                >
                  Contacto
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-[var(--espacio-32)] border-t border-[color:var(--divisor)] pt-[var(--espacio-24)]">
          <p className="voz-cuerpo-pequeno text-[color:var(--tinta-suave)]">
            © 2026 Pixel &amp; Lienzo
          </p>
        </div>
      </div>
    </footer>
  );
}

