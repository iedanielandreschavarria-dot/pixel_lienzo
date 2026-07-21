import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "./ui/Spinner";
import type { NombreRol } from "../types";

export function ProtectedRoute({ rolesPermitidos }: { rolesPermitidos?: NombreRol[] }) {
  const { user, cargando } = useAuth();
  const location = useLocation();

  if (cargando) return <Spinner etiqueta="Verificando sesión…" />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (rolesPermitidos && !rolesPermitidos.includes(user.rol)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
