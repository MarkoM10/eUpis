import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "../features/auth/LoginPage";
import { ProtectedRoute } from "../features/auth/ProtectedRoute";
import DashboardPage from "../features/dashboard/DashboardPage";
import KandidatiPage from "../features/kandidati/KandidatiPage";
import AdminKandidatDetailsPage from "../features/kandidati/AdminKandidatDetailsPage";
import PrijavePage from "../features/prijave/PrijavePage";
import AdminPrijavaDetailsPage from "../features/prijave/AdminPrijavaDetailsPage";
import KonkursPage from "../features/konkurs/KonkursPage";
import UpisPage from "../features/upis/UpisPage";
import RankingListsPage from "../features/rankingLists/RankingListsPage";
import RankingListDetailsPage from "../features/rankingLists/RankingListDetailsPage";

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
    path: "/kandidati/:jmbg",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminKandidatDetailsPage />
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
    path: "/prijave/:brojPrijave/:skolskaGodina",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminPrijavaDetailsPage />
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
  {
    path: "/ranking-lists",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <RankingListsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/ranking-lists/:idRangListe",
    element: (
      <ProtectedRoute allowedRoles={["admin"]}>
        <RankingListDetailsPage />
      </ProtectedRoute>
    ),
  },
]);
