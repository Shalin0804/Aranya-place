import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { customer, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="page-loading" aria-busy="true" />;
  }

  if (!customer) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
