import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { CatalogoPage } from "./pages/CatalogoPage";
import { ArtistaPublicoPage, ArtistasPage } from "./pages/ArtistasPage";
import {
  ColeccionesPage,
  ExposicionesPage,
  MasPage,
  QuienesSomosPalacioPage,
  SalaPalacioNacionalPage,
  UsoDelEspacioPalacioPage,
  VisitanosPalacioPage,
} from "./pages/SeccionesHeaderPages";
import { ObraDetallePage } from "./pages/ObraDetallePage";
import { MisComprasPage } from "./pages/MisComprasPage";
import { CuentaPage } from "./pages/CuentaPage";
import { LegalContactoPage } from "./pages/LegalContactoPage";
import { CheckoutResultadoPage } from "./pages/CheckoutResultadoPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { VerificarCertificadoPage } from "./pages/VerificarCertificadoPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { MfaPage } from "./pages/auth/MfaPage";
import { RegistroPage } from "./pages/auth/RegistroPage";
import { RegistroCompradorPage } from "./pages/auth/RegistroCompradorPage";
import { QuieroFormarPartePage } from "./pages/artista/QuieroFormarPartePage";
import { VerificarEmailPage } from "./pages/auth/VerificarEmailPage";
import { RecuperarPasswordPage } from "./pages/auth/RecuperarPasswordPage";
import { RestablecerPasswordPage } from "./pages/auth/RestablecerPasswordPage";
import { ArtistaPanelPage } from "./pages/artista/ArtistaPanelPage";
import { ArtistaPerfilPage } from "./pages/artista/ArtistaPerfilPage";
import { ObraFormPage } from "./pages/artista/ObraFormPage";
import { CuraduriaPage } from "./pages/curaduria/CuraduriaPage";
import { EstudioMotionPage } from "./pages/EstudioMotionPage";
import { KitPage } from "./pages/KitPage";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<CatalogoPage />} />
        {import.meta.env.DEV && <Route path="kit" element={<KitPage />} />}

        {/* Rutas principales del Header */}
        <Route path="sala-palacio-nacional" element={<SalaPalacioNacionalPage />} />
        <Route path="sala-palacio-nacional/quienes-somos" element={<QuienesSomosPalacioPage />} />
        <Route path="sala-palacio-nacional/visitanos" element={<VisitanosPalacioPage />} />
        <Route path="sala-palacio-nacional/uso-del-espacio" element={<UsoDelEspacioPalacioPage />} />
        <Route path="artistas" element={<ArtistasPage />} />
        <Route path="artistas/quiero-formar-parte" element={<QuieroFormarPartePage />} />
        <Route path="artistas/:id" element={<ArtistaPublicoPage />} />
        <Route path="exposiciones" element={<ExposicionesPage />} />
        <Route path="arte" element={<CatalogoPage />} />
        <Route path="colecciones" element={<ColeccionesPage />} />
        <Route path="mas" element={<MasPage />} />

        {/* Acepta la clave primaria o el UID de la obra: los QR físicos
            impresos junto a la pieza apuntan a `/obras/{uid}`. */}
        <Route path="obras/:idObra" element={<ObraDetallePage />} />
        <Route path="verificar/:sello" element={<VerificarCertificadoPage />} />
        <Route path="estudio" element={<EstudioMotionPage />} />

        {/* Páginas legales, contacto y cuenta */}
        <Route path="cuenta" element={<CuentaPage />} />
        <Route path="legal/:vista" element={<LegalContactoPage />} />
        <Route path="terminos" element={<LegalContactoPage vistaInicial="terminos" />} />
        <Route path="privacidad" element={<LegalContactoPage vistaInicial="privacidad" />} />
        <Route path="acerca" element={<LegalContactoPage vistaInicial="acerca" />} />
        <Route path="contacto" element={<LegalContactoPage vistaInicial="contacto" />} />

        <Route path="login" element={<LoginPage />} />
        <Route path="mfa" element={<MfaPage />} />
        <Route path="registro" element={<RegistroPage />} />
        <Route path="registro/comprador" element={<RegistroCompradorPage />} />
        <Route path="registro/artista" element={<QuieroFormarPartePage />} />
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
