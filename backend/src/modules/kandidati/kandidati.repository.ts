import { executeSql } from "../../db/oracle/execute";
import { getOracleConnection } from "../../db/oracle/pool";
import { ApiError } from "../../shared/apiError";
import type { KandidatMutationInput, KandidatRecord } from "../../types/modules/kandidati";
import type { KandidatRow } from "../../types/modules/kandidatiRepository";
import { mapKandidatRow, parseKandidatiListQuery } from "../../utils/modules/kandidati.utils";
import oracledb from "oracledb";

export const listKandidati = async (
  query: Record<string, unknown>,
): Promise<{
  rows: KandidatRecord[];
  page: number;
  pageSize: number;
}> => {
  const { page, pageSize, offset, search, tipKandidata, sortBy, sortDirection } =
    parseKandidatiListQuery(query);

  const result = await executeSql<KandidatRow>(
    `
      SELECT
        k.jmbg,
        k.ime_prezime,
        k.tip_kandidata,
        k.serijski_broj,
        k.email.get_vrednost() AS email_vrednost,
        k.adresa_obj.get_ulica() AS adresa_ulica,
        k.adresa_obj.get_broj() AS adresa_broj,
        k.adresa_obj.get_grad() AS adresa_grad
      FROM Kandidat k
      WHERE (:search IS NULL OR LOWER(k.ime_prezime) LIKE LOWER(:search))
        AND (:tipKandidata IS NULL OR k.tip_kandidata = :tipKandidata)
      ORDER BY
        CASE WHEN :sortBy = 'jmbg' AND :sortDirection = 'asc' THEN k.jmbg END ASC,
        CASE WHEN :sortBy = 'jmbg' AND :sortDirection = 'desc' THEN k.jmbg END DESC,
        CASE WHEN :sortBy = 'ime_prezime' AND :sortDirection = 'asc' THEN k.ime_prezime END ASC,
        CASE WHEN :sortBy = 'ime_prezime' AND :sortDirection = 'desc' THEN k.ime_prezime END DESC,
        CASE WHEN :sortBy = 'tip_kandidata' AND :sortDirection = 'asc' THEN k.tip_kandidata END ASC,
        CASE WHEN :sortBy = 'tip_kandidata' AND :sortDirection = 'desc' THEN k.tip_kandidata END DESC,
        CASE WHEN :sortBy = 'serijski_broj' AND :sortDirection = 'asc' THEN k.serijski_broj END ASC,
        CASE WHEN :sortBy = 'serijski_broj' AND :sortDirection = 'desc' THEN k.serijski_broj END DESC,
        k.ime_prezime ASC
      OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY
    `,
    {
      search,
      tipKandidata,
      sortBy,
      sortDirection,
      offset,
      pageSize,
    },
  );

  return {
    rows: (result.rows ?? []).map(mapKandidatRow),
    page,
    pageSize,
  };
};

export const getKandidatByJmbg = async (jmbg: string): Promise<KandidatRecord> => {
  const record = await findKandidatByJmbg(jmbg);

  if (!record) {
    throw new ApiError(404, "Kandidat nije pronadjen", "Ne postoji kandidat za prosledjeni JMBG.");
  }

  return record;
};

export const findKandidatByJmbg = async (jmbg: string): Promise<KandidatRecord | null> => {
  const result = await executeSql<KandidatRow>(
    `
      SELECT
        k.jmbg,
        k.ime_prezime,
        k.tip_kandidata,
        k.serijski_broj,
        k.email.get_vrednost() AS email_vrednost,
        k.adresa_obj.get_ulica() AS adresa_ulica,
        k.adresa_obj.get_broj() AS adresa_broj,
        k.adresa_obj.get_grad() AS adresa_grad
      FROM Kandidat k
      WHERE k.jmbg = :jmbg
    `,
    { jmbg },
  );

  const row = result.rows?.[0];
  return row ? mapKandidatRow(row) : null;
};

export const getNextKandidatSerijskiBroj = async (): Promise<number> => {
  const result = await executeSql<{ NEXT_SERIJSKI_BROJ: number }>(
    "SELECT NVL(MAX(k.serijski_broj), 0) + 1 AS next_serijski_broj FROM Kandidat k",
  );

  return result.rows?.[0]?.NEXT_SERIJSKI_BROJ ?? 1;
};

export const insertKandidat = async (input: KandidatMutationInput): Promise<void> => {
  await executeSql(
    `
      INSERT INTO Kandidat (
        jmbg,
        ime_prezime,
        email,
        adresa_obj,
        tip_kandidata,
        serijski_broj
      )
      VALUES (
        :jmbg,
        :imePrezime,
        EmailType(:emailVrednost),
        AdresaType(:adresaUlica, :adresaBroj, :adresaGrad),
        :tipKandidata,
        :serijskiBroj
      )
    `,
    {
      jmbg: input.jmbg,
      imePrezime: input.imePrezime,
      emailVrednost: input.emailVrednost,
      adresaUlica: input.adresaUlica,
      adresaBroj: input.adresaBroj,
      adresaGrad: input.adresaGrad,
      tipKandidata: input.tipKandidata,
      serijskiBroj: input.serijskiBroj,
    },
  );
};

export const updateKandidat = async (jmbg: string, input: KandidatMutationInput): Promise<void> => {
  await executeSql(
    `
      UPDATE Kandidat
      SET
        ime_prezime = :imePrezime,
        email = EmailType(:emailVrednost),
        adresa_obj = AdresaType(:adresaUlica, :adresaBroj, :adresaGrad),
        tip_kandidata = :tipKandidata,
        serijski_broj = :serijskiBroj
      WHERE jmbg = :jmbg
    `,
    {
      ...input,
      jmbg,
    },
  );
};

export const deleteKandidat = async (jmbg: string): Promise<void> => {
  const connection = await getOracleConnection();

  try {
    await connection.execute(
      `
        DELETE FROM Diploma d
        WHERE (d.broj_prijave, d.skolska_godina) IN (
          SELECT p.broj_prijave, p.skolska_godina
          FROM Prijava p
          WHERE p.jmbg = :jmbg
        )
      `,
      { jmbg },
      { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: false },
    );

    await connection.execute(
      `
        DELETE FROM UverenjeOPolozenimPredmetima u
        WHERE (u.broj_prijave, u.skolska_godina) IN (
          SELECT p.broj_prijave, p.skolska_godina
          FROM Prijava p
          WHERE p.jmbg = :jmbg
        )
      `,
      { jmbg },
      { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: false },
    );

    await connection.execute(
      `
        DELETE FROM Upis_Finalizacija uf
        WHERE (uf.broj_prijave, uf.skolska_godina) IN (
          SELECT p.broj_prijave, p.skolska_godina
          FROM Prijava p
          WHERE p.jmbg = :jmbg
        )
      `,
      { jmbg },
      { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: false },
    );

    await connection.execute(
      `
        DELETE FROM StavkaRangListe s
        WHERE s.broj_prijave IN (
          SELECT p.broj_prijave
          FROM Prijava p
          WHERE p.jmbg = :jmbg
        )
      `,
      { jmbg },
      { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: false },
    );

    await connection.execute(
      `
        DELETE FROM Prijava
        WHERE jmbg = :jmbg
      `,
      { jmbg },
      { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: false },
    );

    await connection.execute(
      `
        DELETE FROM Kandidat
        WHERE jmbg = :jmbg
      `,
      { jmbg },
      { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: false },
    );

    await connection.commit();
  } catch (error) {
    try {
      await connection.rollback();
    } catch {}

    throw error;
  } finally {
    await connection.close();
  }
};
