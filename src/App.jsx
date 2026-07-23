import LoginGeneral from "./pages/LoginGeneral";
import AdminSidokepung from "./pages/adminSidokepung";
import AdminGrogol from "./pages/adminGrogol";
import AdminSimoanginangin from "./pages/adminSimoanginangin";
import AdminSimoketawang from "./pages/adminSimoketawang";
import AdminPusat from "./pages/AdminPusat";
import VillageAdmin from "./pages/VillageAdmin";
import PotensiAdmin from "./pages/potensiAdmin";

import PetaTematik from "./pages/PetaPekerjaanSidokepung";
import PetaUmkmSimoanginangin from "./pages/PetaUmkmSimoanginangin";
import PetaKelengkengSimoketawang from "./pages/petaKelengkengSimoketawang";
import DetailWaung from "./pages/DetailWaung";
import BerandaSidoarjo from "./pages/BerandaSidoarjo";
import LandingPage from "./pages/LandingPage";
import StatAdmin from "./pages/statAdmin";
import { Route, Routes, useNavigate, Navigate } from "react-router-dom";
import { NextUIProvider } from "@nextui-org/system";
import Logout from "./components/Logout";
import ProtectedRoute from "./hooks/ProtectedRoute";
import NotFoundPage from "./pages/notFoundPage";
import HelpDesk from "./pages/HelpDesk";

function App() {
  const navigate = useNavigate();

  return (
    <NextUIProvider navigate={navigate}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/bantuan" element={<HelpDesk />} />
        
        {/* Thematic Map Route */}
        <Route path="/peta-tematik" element={<BerandaSidoarjo />} />
        <Route path="/detail" element={<PetaTematik />} />
        <Route path="/detail-simoanginangin" element={<PetaUmkmSimoanginangin />} />
        <Route path="/detail-simoketawang" element={<PetaKelengkengSimoketawang />} />
        <Route path="/detail-waung" element={<DetailWaung />} />
        
        {/* Login Routes */}
        <Route path="/login" element={<LoginGeneral />} /> {/* Default unified login */}
        <Route path="/login-pusat" element={<Navigate to="/login" replace />} />
        <Route path="/login-sidokepung" element={<Navigate to="/login" replace />} />
        <Route path="/login-grogol" element={<Navigate to="/login" replace />} />
        <Route path="/login-simoanginangin" element={<Navigate to="/login" replace />} />
        <Route path="/login-simoketawang" element={<Navigate to="/login" replace />} />
        
        <Route path="/logout" element={<Logout />} />
        
        {/* Detail Desa Potensi Admin Route */}
        <Route
          path="/admin/potensi"
          element={<PotensiAdmin />}
        />

        {/* Statistik Admin Route */}
        <Route
          path="/admin/stat"
          element={
            <ProtectedRoute village="pusat">
              <StatAdmin />
            </ProtectedRoute>
          }
        />
        
        {/* Admin Routes */}
        <Route
          path="/admin/pusat"
          element={
            <ProtectedRoute village="pusat">
              <AdminPusat />
            </ProtectedRoute>
          }
        />

        {/* Dynamic Village Admin Route */}
        <Route
          path="/admin/desa/:nama_desa"
          element={
            <ProtectedRoute>
              <VillageAdmin />
            </ProtectedRoute>
          }
        />

        {/* Legacy routes for fallback, to be removed later */}
        <Route
          path="/admin-pusat"
          element={<Navigate to="/admin/pusat" replace />}
        />
        {/* Legacy routes redirected to dynamic VillageAdmin */}
        <Route
          path="/admin-sidokepung"
          element={<Navigate to="/admin/desa/sidokepung" replace />}
        />
        <Route
          path="/admin-grogol"
          element={<Navigate to="/admin/desa/grogol" replace />}
        />
        <Route
          path="/admin-simoanginangin"
          element={<Navigate to="/admin/desa/simoanginangin" replace />}
        />
        <Route
          path="/admin-simoketawang"
          element={<Navigate to="/admin/desa/simoketawang" replace />}
        />
        
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </NextUIProvider>
  );
}

export default App;
