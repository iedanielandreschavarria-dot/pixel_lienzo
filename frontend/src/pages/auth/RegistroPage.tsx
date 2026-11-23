import { RegistroCompradorPage } from "./RegistroCompradorPage";

/**
 * El registro directo de cuenta es exclusivamente para usuarios/coleccionistas.
 * Los artistas se postulan a través de "Quiero formar parte" (/artistas/quiero-formar-parte).
 */
export function RegistroPage() {
  return <RegistroCompradorPage />;
}
