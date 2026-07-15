import { Navigate, useLocation, useParams } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { nama_desa } = useParams();

  // Unified generic token or specific pusat token
  const token = localStorage.getItem("token-desa-cantik");
  const tokenPusat = localStorage.getItem("token-pusat");

  // Also check if the username matches the specific village if they are not superadmin
  const username = localStorage.getItem("username") || "";
  const isSuperAdmin = username === "admin_pusat" || tokenPusat;

  if (!token && !tokenPusat) {
    return (
      <Navigate to="/login" state={{ from: location }} replace />
    );
  }

  // If a specific village is being accessed, check permissions
  if (nama_desa && !isSuperAdmin) {
    const expectedUsername = `admin_${nama_desa.toLowerCase()}`;
    if (username !== expectedUsername) {
      // Unauthorized, they belong to another village
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
