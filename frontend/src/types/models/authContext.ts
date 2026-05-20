import type { AuthLatestPrijava, UserRole } from "./auth";

export interface AuthContextValue {
  token: string | null;
  username: string | null;
  role: UserRole | null;
  hasApplied: boolean;
  isAuthenticated: boolean;
  login: (
    token: string,
    username: string,
    role: UserRole,
    hasApplied: boolean,
    latestPrijava?: AuthLatestPrijava | null,
  ) => void;
  updateSession: (username: string, role: UserRole, hasApplied: boolean) => void;
  logout: () => void;
}
