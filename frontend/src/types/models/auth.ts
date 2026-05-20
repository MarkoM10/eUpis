export type UserRole = "admin" | "student";

export interface AuthLatestPrijava {
  brojPrijave: number;
  datumPrijave: string | null;
  skolskaGodina: string;
  statusPrijave: string | null;
  konkursniRok: string | null;
  jmbg: string | null;
  imePrezime: string | null;
  sistemskiUpdate: string | null;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  role: UserRole;
  hasApplied: boolean;
  latestPrijava: AuthLatestPrijava | null;
}

export interface AuthSession {
  token: string | null;
  username: string | null;
  role: UserRole | null;
  hasApplied: boolean;
}

export interface AuthSessionResponse {
  username: string;
  role: UserRole;
  hasApplied: boolean;
  latestPrijava: AuthLatestPrijava | null;
}
