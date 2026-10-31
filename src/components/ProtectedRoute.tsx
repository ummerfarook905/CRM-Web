
import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../app/Hooks";

import type { Role } from "../models/auth/User";

interface ProtectedRouteProps {
  allowedRole: Role | Role[];
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

  const allowedRoles = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
