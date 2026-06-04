import { executeSql } from "../../db/oracle/execute";
import type { AuthLatestPrijava, KorisnikRecord, UserRole } from "../../types/modules/auth";
import type { AuthPrijavaRow, KorisnikRow } from "../../types/modules/authRepository";
import { mapAuthPrijavaRow, mapKorisnikRow } from "../../utils/modules/authRepository.utils";

export const findKorisnikByUsername = async (username: string): Promise<KorisnikRecord | null> => {
  const result = await executeSql<KorisnikRow>(
    `
      SELECT
        k.id_korisnika,
        k.korisnicko_ime,
        k.lozinka,
        k.email,
        k.uloga
      FROM Korisnici k
      WHERE LOWER(k.korisnicko_ime) = LOWER(:username)
      FETCH FIRST 1 ROWS ONLY
    `,
    { username },
  );

  const row = result.rows?.[0];
  return row ? mapKorisnikRow(row) : null;
};

export const findKorisnikByEmail = async (email: string): Promise<KorisnikRecord | null> => {
  const result = await executeSql<KorisnikRow>(
    `
      SELECT
        k.id_korisnika,
        k.korisnicko_ime,
        k.lozinka,
        k.email,
        k.uloga
      FROM Korisnici k
      WHERE LOWER(k.email) = LOWER(:email)
      FETCH FIRST 1 ROWS ONLY
    `,
    { email },
  );

  const row = result.rows?.[0];
  return row ? mapKorisnikRow(row) : null;
};

const getNextKorisnikId = async (): Promise<number> => {
  const result = await executeSql<{ NEXT_ID: number }>(
    "SELECT NVL(MAX(k.id_korisnika), 0) + 1 AS next_id FROM Korisnici k",
  );

  return result.rows?.[0]?.NEXT_ID ?? 1;
};

export const insertKorisnik = async (input: {
  korisnickoIme: string;
  lozinka: string;
  email: string;
  role: UserRole;
}): Promise<KorisnikRecord> => {
  const idKorisnika = await getNextKorisnikId();
  const dbRole = input.role.toUpperCase();

  await executeSql(
    `
      INSERT INTO Korisnici (
        id_korisnika,
        korisnicko_ime,
        lozinka,
        email,
        uloga,
        datum_kreiranja,
        poslednja_prijava
      )
      VALUES (
        :idKorisnika,
        :korisnickoIme,
        :lozinka,
        :email,
        :uloga,
        SYSDATE,
        NULL
      )
    `,
    {
      idKorisnika,
      korisnickoIme: input.korisnickoIme,
      lozinka: input.lozinka,
      email: input.email,
      uloga: dbRole,
    },
  );

  return {
    idKorisnika,
    korisnickoIme: input.korisnickoIme,
    lozinka: input.lozinka,
    email: input.email,
    role: input.role,
  };
};

export const updateKorisnikLastLogin = async (idKorisnika: number): Promise<void> => {
  await executeSql(
    `
      UPDATE Korisnici
      SET poslednja_prijava = SYSDATE
      WHERE id_korisnika = :idKorisnika
    `,
    { idKorisnika },
  );
};

export const findLatestPrijavaForKorisnik = async (
  idKorisnika: number,
): Promise<AuthLatestPrijava | null> => {
  const result = await executeSql<AuthPrijavaRow>(
    `
      SELECT
        p.broj_prijave,
        p.datum_prijave,
        p.skolska_godina,
        p.status_prijave,
        p.konkursni_rok,
        p.jmbg,
        p.ime_prezime,
        p.sistemski_update
      FROM Prijava p
      WHERE p.id_korisnika = :idKorisnika
      ORDER BY p.datum_prijave DESC NULLS LAST, p.broj_prijave DESC
      FETCH FIRST 1 ROWS ONLY
    `,
    {
      idKorisnika,
    },
  );

  const row = result.rows?.[0];
  return row ? mapAuthPrijavaRow(row) : null;
};
