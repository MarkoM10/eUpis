import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "../features/auth/LoginPage";
import { ProtectedRoute } from "../features/auth/ProtectedRoute";
import DashboardPage from "../features/dashboard/DashboardPage";
import FinalizacijaUpisaPage from "../features/finalizacija-upisa/FinalizacijaUpisaPage";
import KandidatiPage from "../features/kandidati/KandidatiPage";
import PrijavePage from "../features/prijave/PrijavePage";
import KonacneRangListePage from "../features/konacne-rang-liste/KonacneRangListePage";
import UpisPage from "../features/upis/UpisPage";
import KonkursPage from "../features/konkurs/KonkursPage";

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
      <ProtectedRoute allowedRoles={["admin", "student"]}>
        <UpisPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/konacne-rang-liste",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <KonacneRangListePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/finalizacija-upisa",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <FinalizacijaUpisaPage />
      </ProtectedRoute>
    ),
  },
]);
