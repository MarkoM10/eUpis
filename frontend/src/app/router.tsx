import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "../features/auth/LoginPage";
import { ProtectedRoute } from "../features/auth/ProtectedRoute";
import DashboardPage from "../features/dashboard/DashboardPage";
import KandidatiPage from "../features/kandidati/KandidatiPage";
import PrijavePage from "../features/prijave/PrijavePage";
import KonkursPage from "../features/konkurs/KonkursPage";
import UpisPage from "../features/upis/UpisPage";

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
  {
    path: "/konkurs",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <KonkursPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/upis",
    element: (
      <ProtectedRoute allowedRoles={["student"]}>
        <UpisPage />
      </ProtectedRoute>
    ),
  },
]);
