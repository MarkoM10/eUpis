import { Navigate } from "react-router-dom";
import type { PropsWithChildren, ReactElement } from "react";
import { useAuth } from "./authStore";

export const ProtectedRoute = ({ children }: PropsWithChildren): ReactElement => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
