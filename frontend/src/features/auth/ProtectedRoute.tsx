import { Navigate } from "react-router-dom";
import type { PropsWithChildren, ReactElement } from "react";
import { useAuth } from "./authStore";
import type { UserRole } from "../../types/models/auth";

interface ProtectedRouteProps extends PropsWithChildren {
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps): ReactElement => {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return <Navigate to="/prijave" replace />;
  }

  return <>{children}</>;
};
