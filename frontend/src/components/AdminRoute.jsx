import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function AdminRoute({ children }) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!user?.isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
}
