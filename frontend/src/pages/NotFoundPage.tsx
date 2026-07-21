import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="font-[var(--font-display)] text-6xl text-ocre">404</p>
      <h1 className="font-[var(--font-display)] text-2xl font-medium text-marfil">Página no encontrada</h1>
      <Link to="/">
        <Button>Volver al catálogo</Button>
      </Link>
    </div>
  );
}
