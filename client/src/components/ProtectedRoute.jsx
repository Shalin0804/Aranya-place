import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { customer, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="page-loading" aria-busy="true" />;
  }

  if (!customer) {
    // Keep the query string: for /booking it carries the selected room,
    // dates, guests and room count, so sign-in returns to the same booking.
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }

  return children;
}
