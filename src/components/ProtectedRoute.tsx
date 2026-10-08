import { Navigate, Outlet } from "react-router-dom";
import AuthViewModel from "../viewmodels/auth/AuthViewModel";
import type { Role } from "../models/auth/User";

interface ProtectedRouteProps {
  allowedRole?: Role;
}

export default function ProtectedRoute({
  allowedRole,
}: ProtectedRouteProps) {
  const isAuthenticated = AuthViewModel.isAuthenticated();
  const user = AuthViewModel.getCurrentUser();

  // User is not logged in
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // User doesn't have permission
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}