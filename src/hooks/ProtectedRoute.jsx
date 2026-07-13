import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children, village }) => {
  const location = useLocation();

  const token = localStorage.getItem(`token-${village}`);
  const tokenPusat = localStorage.getItem(`token-pusat`);

  if (!token && !tokenPusat) {
    return (
      <Navigate to={`/login-${village}`} state={{ from: location }} replace />
    );
  }

  return children;
};

export default ProtectedRoute;
