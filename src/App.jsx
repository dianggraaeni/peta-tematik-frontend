import Login from "./pages/loginSidokepung";
import Admin from "./pages/adminSidokepung";
import PetaTematik from "./pages/PetaPekerjaanSidokepung";
import BerandaSidoarjo from "./pages/BerandaSidoarjo";
import { Route, Routes, useNavigate } from "react-router-dom";
import { NextUIProvider } from "@nextui-org/system";
import Logout from "./components/Logout";
import ProtectedRoute from "./hooks/ProtectedRouteSidokepung";
import NotFoundPage from "./pages/notFoundPage";

function App() {
  const navigate = useNavigate();

  return (
    <NextUIProvider navigate={navigate}>
      <Routes>
        <Route path="/" element={<BerandaSidoarjo />} />
        <Route path="/detail" element={<PetaTematik />} />
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </NextUIProvider>
  );
}

export default App;
