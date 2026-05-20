export type UserRole = "admin" | "student";

export interface LoginInput {
  username: string;
  password: string;
}

export interface RegisterInput {
  username: string;
  password: string;
  email: string;
}

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

export interface LoginResult {
  token: string;
  username: string;
  role: UserRole;
  hasApplied: boolean;
  latestPrijava: AuthLatestPrijava | null;
}

export interface JwtPayload {
  userId: number;
  username: string;
  role: UserRole;
}

export interface KorisnikRecord {
  idKorisnika: number;
  korisnickoIme: string;
  lozinka: string;
  email: string | null;
  role: UserRole;
}
