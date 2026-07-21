import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { CatalogoPage } from "./pages/CatalogoPage";
import { ObraDetallePage } from "./pages/ObraDetallePage";
import { MisComprasPage } from "./pages/MisComprasPage";
import { CheckoutResultadoPage } from "./pages/CheckoutResultadoPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { MfaPage } from "./pages/auth/MfaPage";
import { RegistroPage } from "./pages/auth/RegistroPage";
import { RegistroCompradorPage } from "./pages/auth/RegistroCompradorPage";
import { RegistroArtistaPage } from "./pages/auth/RegistroArtistaPage";
import { VerificarEmailPage } from "./pages/auth/VerificarEmailPage";
import { RecuperarPasswordPage } from "./pages/auth/RecuperarPasswordPage";
import { RestablecerPasswordPage } from "./pages/auth/RestablecerPasswordPage";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<CatalogoPage />} />
        <Route path="obras/:idObra" element={<ObraDetallePage />} />

        <Route path="login" element={<LoginPage />} />
        <Route path="mfa" element={<MfaPage />} />
        <Route path="registro" element={<RegistroPage />} />
        <Route path="registro/comprador" element={<RegistroCompradorPage />} />
        <Route path="registro/artista" element={<RegistroArtistaPage />} />
        <Route path="verificar-email" element={<VerificarEmailPage />} />
        <Route path="recuperar-password" element={<RecuperarPasswordPage />} />
        <Route path="restablecer-password" element={<RestablecerPasswordPage />} />

        <Route path="compras/:idTransaccion/resultado" element={<CheckoutResultadoPage />} />

        <Route element={<ProtectedRoute rolesPermitidos={["Comprador"]} />}>
          <Route path="mis-compras" element={<MisComprasPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
