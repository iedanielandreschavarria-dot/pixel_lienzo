import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { CatalogoPage } from "./pages/CatalogoPage";
import { ObraDetallePage } from "./pages/ObraDetallePage";
import { MisComprasPage } from "./pages/MisComprasPage";
import { CheckoutResultadoPage } from "./pages/CheckoutResultadoPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { VerificarCertificadoPage } from "./pages/VerificarCertificadoPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { MfaPage } from "./pages/auth/MfaPage";
import { RegistroPage } from "./pages/auth/RegistroPage";
import { RegistroCompradorPage } from "./pages/auth/RegistroCompradorPage";
import { RegistroArtistaPage } from "./pages/auth/RegistroArtistaPage";
import { VerificarEmailPage } from "./pages/auth/VerificarEmailPage";
import { RecuperarPasswordPage } from "./pages/auth/RecuperarPasswordPage";
import { RestablecerPasswordPage } from "./pages/auth/RestablecerPasswordPage";
import { ArtistaPanelPage } from "./pages/artista/ArtistaPanelPage";
import { ArtistaPerfilPage } from "./pages/artista/ArtistaPerfilPage";
import { ObraFormPage } from "./pages/artista/ObraFormPage";
import { CuraduriaPage } from "./pages/curaduria/CuraduriaPage";
import { EstudioMotionPage } from "./pages/EstudioMotionPage";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<CatalogoPage />} />
        {/* Acepta la clave primaria o el UID de la obra: los QR físicos
            impresos junto a la pieza apuntan a `/obras/{uid}`. */}
        <Route path="obras/:idObra" element={<ObraDetallePage />} />
        <Route path="verificar/:sello" element={<VerificarCertificadoPage />} />
        <Route path="estudio" element={<EstudioMotionPage />} />

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

        <Route element={<ProtectedRoute rolesPermitidos={["Artista"]} />}>
          <Route path="artista" element={<ArtistaPanelPage />} />
          <Route path="artista/perfil" element={<ArtistaPerfilPage />} />
          <Route path="artista/obras/nueva" element={<ObraFormPage />} />
          <Route path="artista/obras/:idObra/editar" element={<ObraFormPage />} />
        </Route>

        <Route element={<ProtectedRoute rolesPermitidos={["Curador"]} />}>
          <Route path="curaduria" element={<CuraduriaPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
