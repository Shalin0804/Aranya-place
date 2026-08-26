import { Navigate, Outlet } from "react-router-dom";

export default function AdminProtectedRoute() {
  const hasToken = Boolean(localStorage.getItem("adminToken"));

  if (!hasToken) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}