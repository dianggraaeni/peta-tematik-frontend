import LoginGeneral from "./pages/LoginGeneral";
import AdminSidokepung from "./pages/adminSidokepung";
import AdminGrogol from "./pages/adminGrogol";
import AdminSimoanginangin from "./pages/adminSimoanginangin";
import AdminSimoketawang from "./pages/adminSimoketawang";

import PetaTematik from "./pages/PetaPekerjaanSidokepung";
import BerandaSidoarjo from "./pages/BerandaSidoarjo";
import LandingPage from "./pages/LandingPage";
import { Route, Routes, useNavigate, Navigate } from "react-router-dom";
import { NextUIProvider } from "@nextui-org/system";
import Logout from "./components/Logout";
import ProtectedRoute from "./hooks/ProtectedRoute";
import NotFoundPage from "./pages/notFoundPage";

function App() {
  const navigate = useNavigate();

  return (
    <NextUIProvider navigate={navigate}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        {/* Thematic Map Route */}
        <Route path="/peta-tematik" element={<BerandaSidoarjo />} />
        <Route path="/detail" element={<PetaTematik />} />
        
        {/* Login Routes */}
        <Route path="/login" element={<LoginGeneral />} /> {/* Default unified login */}
        <Route path="/login-pusat" element={<Navigate to="/login" replace />} />
        <Route path="/login-sidokepung" element={<Navigate to="/login" replace />} />
        <Route path="/login-grogol" element={<Navigate to="/login" replace />} />
        <Route path="/login-simoanginangin" element={<Navigate to="/login" replace />} />
        <Route path="/login-simoketawang" element={<Navigate to="/login" replace />} />
        
        <Route path="/logout" element={<Logout />} />
        
        {/* Admin Routes */}
        <Route
          path="/admin-pusat"
          element={
            <ProtectedRoute village="pusat">
              <AdminSidokepung />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-sidokepung"
          element={
            <ProtectedRoute village="sidokepung">
              <AdminSidokepung />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-grogol"
          element={
            <ProtectedRoute village="grogol">
              <AdminGrogol />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-simoanginangin"
          element={
            <ProtectedRoute village="simoanginangin">
              <AdminSimoanginangin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-simoketawang"
          element={
            <ProtectedRoute village="simoketawang">
              <AdminSimoketawang />
            </ProtectedRoute>
          }
        />
        
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </NextUIProvider>
  );
}

export default App;
