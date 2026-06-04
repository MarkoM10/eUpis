import { executeSql } from "../../db/oracle/execute";
import { ApiError } from "../../shared/apiError";
import type {
  PrijavaKey,
  PrijavaMutationInput,
  PrijavaRecord,
  PrijavaStatusUpdateInput,
} from "../../types/modules/prijave";
import type { PrijavaRow } from "../../types/modules/prijaveRepository";
import { mapPrijavaRow, parsePrijaveListQuery } from "../../utils/modules/prijave.utils";

const resolveBrojPrijave = async (): Promise<number> => {
  const result = await executeSql<{ NEXT_BROJ_PRIJAVE: number }>(
    "SELECT PRIJAVA_BROJ_PRIJAVE_SEQ.NEXTVAL AS next_broj_prijave FROM dual",
  );

  return result.rows?.[0]?.NEXT_BROJ_PRIJAVE ?? 1;
};

export const listPrijave = async (
  query: Record<string, unknown>,
): Promise<{
  rows: PrijavaRecord[];
  page: number;
  pageSize: number;
}> => {
  const {
    page,
    pageSize,
    offset,
    search,
    statusPrijave,
    skolskaGodina,
    konkursniRok,
    partition,
    sortBy,
    sortDirection,
  } = parsePrijaveListQuery(query);

  const result = await executeSql<PrijavaRow>(
    `
      SELECT
        p.broj_prijave,
        p.datum_prijave,
        p.skolska_godina,
        p.id_konkursa,
        p.id_korisnika,
        p.id_programa,
        p.status_prijave,
        p.konkursni_rok,
        p.jmbg,
        p.ime_prezime,
        p.sistemski_update
      FROM Prijava p
      WHERE (:search IS NULL OR LOWER(p.ime_prezime) LIKE LOWER(:search))
        AND (:statusPrijave IS NULL OR p.status_prijave = :statusPrijave)
        AND (:skolskaGodina IS NULL OR p.skolska_godina = :skolskaGodina)
        AND (:konkursniRok IS NULL OR p.konkursni_rok = :konkursniRok)
        AND (
          :partition IS NULL
          OR CASE
            WHEN p.skolska_godina < '2024' THEN 'prijava_do_2023'
            WHEN p.skolska_godina < '2025' THEN 'prijava_2024'
            WHEN p.skolska_godina < '2026' THEN 'prijava_2025'
            WHEN p.skolska_godina < '2027' THEN 'prijava_2026'
            WHEN p.skolska_godina < '2028' THEN 'prijava_2027'
            WHEN p.skolska_godina < '2029' THEN 'prijava_2028'
            ELSE 'ostalo'
          END = :partition
        )
      ORDER BY
        CASE WHEN :sortBy = 'broj_prijave' AND :sortDirection = 'asc' THEN p.broj_prijave END ASC,
        CASE WHEN :sortBy = 'broj_prijave' AND :sortDirection = 'desc' THEN p.broj_prijave END DESC,
        CASE WHEN :sortBy = 'datum_prijave' AND :sortDirection = 'asc' THEN p.datum_prijave END ASC,
        CASE WHEN :sortBy = 'datum_prijave' AND :sortDirection = 'desc' THEN p.datum_prijave END DESC,
        CASE WHEN :sortBy = 'skolska_godina' AND :sortDirection = 'asc' THEN p.skolska_godina END ASC,
        CASE WHEN :sortBy = 'skolska_godina' AND :sortDirection = 'desc' THEN p.skolska_godina END DESC,
        CASE WHEN :sortBy = 'status_prijave' AND :sortDirection = 'asc' THEN p.status_prijave END ASC,
        CASE WHEN :sortBy = 'status_prijave' AND :sortDirection = 'desc' THEN p.status_prijave END DESC,
        CASE WHEN :sortBy = 'ime_prezime' AND :sortDirection = 'asc' THEN p.ime_prezime END ASC,
        CASE WHEN :sortBy = 'ime_prezime' AND :sortDirection = 'desc' THEN p.ime_prezime END DESC,
        p.broj_prijave ASC
      OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY
    `,
    {
      search,
      statusPrijave,
      skolskaGodina,
      konkursniRok,
      partition,
      sortBy,
      sortDirection,
      offset,
      pageSize,
    },
  );

  return {
    rows: (result.rows ?? []).map(mapPrijavaRow),
    page,
    pageSize,
  };
};

export const getPrijavaByKey = async (key: PrijavaKey): Promise<PrijavaRecord> => {
  const result = await executeSql<PrijavaRow>(
    `
      SELECT
        p.broj_prijave,
        p.datum_prijave,
        p.skolska_godina,
        p.id_konkursa,
        p.id_korisnika,
        p.id_programa,
        p.status_prijave,
        p.konkursni_rok,
        p.jmbg,
        p.ime_prezime,
        p.sistemski_update
      FROM Prijava p
      WHERE p.broj_prijave = :brojPrijave
        AND p.skolska_godina = :skolskaGodina
    `,
    {
      brojPrijave: key.brojPrijave,
      skolskaGodina: key.skolskaGodina,
    },
  );

  const row = result.rows?.[0];
  if (!row) {
    throw new ApiError(404, "Prijava nije pronadjena", "Ne postoji trazena prijava.");
  }

  return mapPrijavaRow(row);
};

export const insertPrijava = async (input: PrijavaMutationInput): Promise<PrijavaKey> => {
  const brojPrijave = await resolveBrojPrijave();

  await executeSql(
    `
      INSERT INTO Prijava (
        broj_prijave,
        datum_prijave,
        skolska_godina,
        id_konkursa,
        id_korisnika,
        id_programa,
        status_prijave,
        konkursni_rok,
        jmbg,
        sistemski_update
      )
      VALUES (
        :brojPrijave,
        TO_DATE(:datumPrijave, 'YYYY-MM-DD'),
        :skolskaGodina,
        :idKonkursa,
        :idKorisnika,
        :idPrograma,
        :statusPrijave,
        :konkursniRok,
        :jmbg,
        NVL(:sistemskiUpdate, 'N')
      )
    `,
    {
      brojPrijave,
      datumPrijave: input.datumPrijave,
      skolskaGodina: input.skolskaGodina,
      idKonkursa: input.idKonkursa,
      idKorisnika: input.idKorisnika ?? null,
      idPrograma: input.idPrograma,
      statusPrijave: input.statusPrijave,
      konkursniRok: input.konkursniRok,
      jmbg: input.jmbg,
      sistemskiUpdate: input.sistemskiUpdate ?? null,
    },
  );

  return {
    brojPrijave,
    skolskaGodina: input.skolskaGodina,
  };
};

export const updatePrijava = async (
  key: PrijavaKey,
  input: PrijavaMutationInput,
): Promise<void> => {
  const hasImePrezimeInPayload = Object.prototype.hasOwnProperty.call(input, "imePrezime");

  if (hasImePrezimeInPayload) {
    const existing = await getPrijavaByKey(key);
    const incomingImePrezime = input.imePrezime?.trim() ?? null;
    const existingImePrezime = existing.imePrezime?.trim() ?? null;

    if (incomingImePrezime !== existingImePrezime) {
      await executeSql(
        `
          UPDATE Prijava
          SET ime_prezime = :imePrezime
          WHERE broj_prijave = :brojPrijave
            AND skolska_godina = :skolskaGodina
        `,
        {
          brojPrijave: key.brojPrijave,
          skolskaGodina: key.skolskaGodina,
          imePrezime: input.imePrezime ?? null,
        },
      );

      return;
    }
  }

  const bindParams: Record<string, string | number | null> = {
    brojPrijave: key.brojPrijave,
    skolskaGodina: key.skolskaGodina,
    datumPrijave: input.datumPrijave,
    idKonkursa: input.idKonkursa,
    idPrograma: input.idPrograma,
    statusPrijave: input.statusPrijave,
    konkursniRok: input.konkursniRok,
    jmbg: input.jmbg,
    sistemskiUpdate: input.sistemskiUpdate ?? null,
  };

  await executeSql(
    `
      UPDATE Prijava
      SET
        datum_prijave = TO_DATE(:datumPrijave, 'YYYY-MM-DD'),
        id_konkursa = :idKonkursa,
        id_programa = :idPrograma,
        status_prijave = :statusPrijave,
        konkursni_rok = :konkursniRok,
        jmbg = :jmbg,
        sistemski_update = NVL(:sistemskiUpdate, 'N')
      WHERE broj_prijave = :brojPrijave
        AND skolska_godina = :skolskaGodina
    `,
    bindParams,
  );
};

export const updatePrijavaStatus = async (
  key: PrijavaKey,
  input: PrijavaStatusUpdateInput,
): Promise<void> => {
  await executeSql(
    `
      UPDATE Prijava
      SET
        status_prijave = :statusPrijave,
        sistemski_update = NVL(:sistemskiUpdate, 'N')
      WHERE broj_prijave = :brojPrijave
        AND skolska_godina = :skolskaGodina
    `,
    {
      brojPrijave: key.brojPrijave,
      skolskaGodina: key.skolskaGodina,
      statusPrijave: input.statusPrijave,
      sistemskiUpdate: input.sistemskiUpdate ?? null,
    },
  );
};

export const deletePrijava = async (key: PrijavaKey): Promise<void> => {
  await executeSql(
    `
      DELETE FROM Prijava
      WHERE broj_prijave = :brojPrijave
        AND skolska_godina = :skolskaGodina
    `,
    {
      brojPrijave: key.brojPrijave,
      skolskaGodina: key.skolskaGodina,
    },
  );
};
