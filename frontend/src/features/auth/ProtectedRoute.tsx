import { Navigate } from "react-router-dom";
import type { PropsWithChildren, ReactElement } from "react";
import type { UserRole } from "../../types/models/auth";
import { useAppSelector } from "../../redux/hooks";

interface ProtectedRouteProps extends PropsWithChildren {
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps): ReactElement => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const role = useAppSelector((state) => state.auth.role);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return <Navigate to="/prijave" replace />;
  }

  return <>{children}</>;
};
