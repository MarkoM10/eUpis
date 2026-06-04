import { ApiError } from "../../shared/apiError";
import type { AuthLatestPrijava, KorisnikRecord, UserRole } from "../../types/modules/auth";
import type { AuthPrijavaRow, KorisnikRow } from "../../types/modules/authRepository";

export const resolveRole = (value: string | null): UserRole => {
  const normalized = (value ?? "student").trim().toLowerCase();

  if (normalized === "admin") {
    return "admin";
  }

  if (normalized === "student") {
    return "student";
  }

  throw new ApiError(403, "Uloga korisnika nije podrzana", `Nepoznata uloga: ${value ?? "NULL"}.`);
};

export const mapKorisnikRow = (row: KorisnikRow): KorisnikRecord => ({
  idKorisnika: row.ID_KORISNIKA,
  korisnickoIme: row.KORISNICKO_IME,
  lozinka: row.LOZINKA,
  email: row.EMAIL,
  role: resolveRole(row.ULOGA),
});

export const mapAuthPrijavaRow = (row: AuthPrijavaRow): AuthLatestPrijava => ({
  brojPrijave: row.BROJ_PRIJAVE,
  datumPrijave: row.DATUM_PRIJAVE ? row.DATUM_PRIJAVE.toISOString() : null,
  skolskaGodina: row.SKOLSKA_GODINA,
  statusPrijave: row.STATUS_PRIJAVE,
  konkursniRok: row.KONKURSNI_ROK,
  jmbg: row.JMBG,
  imePrezime: row.IME_PREZIME,
  sistemskiUpdate: row.SISTEMSKI_UPDATE,
});
