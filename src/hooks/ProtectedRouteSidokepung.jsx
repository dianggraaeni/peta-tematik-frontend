import { Navigate, useLocation } from "react-router-dom";

const ProtectedRouteSidokepung = ({ children }) => {
  const location = useLocation();

  const token = localStorage.getItem("token-sidokepung");
  const username = localStorage.getItem("username");

  if (!token) {
    return (
      <Navigate to="/login-sidokepung" state={{ from: location }} replace />
    );
  }

  return children;
};

export default ProtectedRouteSidokepung;
