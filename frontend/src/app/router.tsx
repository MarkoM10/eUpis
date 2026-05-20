import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "../features/auth/LoginPage.tsx";
import { ProtectedRoute } from "../features/auth/ProtectedRoute.tsx";
import DashboardPage from "../features/dashboard/DashboardPage.tsx";
import KandidatiPage from "../features/kandidati/KandidatiPage.tsx";
import PrijavePage from "../features/prijave/PrijavePage.tsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/prijave" replace />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/kandidati",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <KandidatiPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/prijave",
    element: (
      <ProtectedRoute allowedRoles={["admin", "student"]}>
        <PrijavePage />
      </ProtectedRoute>
    ),
  },
]);
