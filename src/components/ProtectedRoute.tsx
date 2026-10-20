
import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../app/Hooks";

import type { Role } from "../models/auth/User";

interface ProtectedRouteProps {
  allowedRole: Role;
}

export default function ProtectedRoute({
  allowedRole,
}: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAppSelector(
    (state) => state.auth
  );

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== allowedRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
