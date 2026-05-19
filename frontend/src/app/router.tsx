import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "../features/auth/LoginPage.tsx";
import { ProtectedRoute } from "../features/auth/ProtectedRoute.tsx";
import DashboardPage from "../features/dashboard/DashboardPage.tsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
]);
