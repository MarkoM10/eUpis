import { RouterProvider } from "react-router-dom";
import type { ReactElement } from "react";
import { router } from "./router";
import { AuthProvider } from "../features/auth/authStore.tsx";

export default function App(): ReactElement {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
