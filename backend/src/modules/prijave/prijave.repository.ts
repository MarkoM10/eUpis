import { executeSql } from "../../db/oracle/execute";
import { ApiError } from "../../shared/apiError";
import type {
  PrijavaKey,
  PrijavaMutationInput,
  PrijavaRecord,
  PrijavaStatusUpdateInput,
} from "../../types/modules/prijave";

type PrijavaRow = {
  BROJ_PRIJAVE: number;
  DATUM_PRIJAVE: Date | null;
  SKOLSKA_GODINA: string;
  ID_KONKURSA: number | null;
  ID_KORISNIKA: number | null;
  ID_PROGRAMA: number | null;
  STATUS_PRIJAVE: string | null;
  KONKURSNI_ROK: string | null;
  JMBG: string | null;
  IME_PREZIME: string | null;
  SISTEMSKI_UPDATE: string | null;
};

const mapRow = (row: PrijavaRow): PrijavaRecord => ({
  brojPrijave: row.BROJ_PRIJAVE,
  datumPrijave: row.DATUM_PRIJAVE ? row.DATUM_PRIJAVE.toISOString() : null,
  skolskaGodina: row.SKOLSKA_GODINA,
  idKonkursa: row.ID_KONKURSA,
  idKorisnika: row.ID_KORISNIKA,
  idPrograma: row.ID_PROGRAMA,
  statusPrijave: row.STATUS_PRIJAVE,
  konkursniRok: row.KONKURSNI_ROK,
  jmbg: row.JMBG,
  imePrezime: row.IME_PREZIME,
  sistemskiUpdate: row.SISTEMSKI_UPDATE,
});

const resolveBrojPrijave = async (brojPrijave: number | null | undefined): Promise<number> => {
  if (typeof brojPrijave === "number" && Number.isFinite(brojPrijave) && brojPrijave > 0) {
    return brojPrijave;
  }

  const result = await executeSql<{ NEXT_BROJ_PRIJAVE: number }>(
    "SELECT NVL(MAX(p.broj_prijave), 0) + 1 AS next_broj_prijave FROM Prijava p",
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
  const pageRaw = typeof query.page === "string" ? Number(query.page) : 1;
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const pageSizeRaw = typeof query.pageSize === "string" ? Number(query.pageSize) : 20;
  const pageSize =
    Number.isInteger(pageSizeRaw) && pageSizeRaw > 0 ? Math.min(pageSizeRaw, 100) : 20;
  const offset = (page - 1) * pageSize;

  const search =
    typeof query.search === "string" && query.search.trim() ? `%${query.search.trim()}%` : null;
  const statusPrijave =
    typeof query.status_prijave === "string" && query.status_prijave.trim()
      ? query.status_prijave.trim()
      : null;
  const skolskaGodina =
    typeof query.skolska_godina === "string" && query.skolska_godina.trim()
      ? query.skolska_godina.trim()
      : null;
  const konkursniRok =
    typeof query.konkursni_rok === "string" && query.konkursni_rok.trim()
      ? query.konkursni_rok.trim()
      : null;
  const partition =
    typeof query.partition === "string" && query.partition.trim() ? query.partition.trim() : null;

  const sortByInput = typeof query.sortBy === "string" ? query.sortBy.trim() : "";
  const sortDirectionInput =
    typeof query.sortDirection === "string" ? query.sortDirection.trim().toLowerCase() : "asc";
  const allowedSortColumns = [
    "broj_prijave",
    "datum_prijave",
    "skolska_godina",
    "status_prijave",
    "ime_prezime",
  ];

  if (sortByInput && !allowedSortColumns.includes(sortByInput)) {
    throw new ApiError(
      400,
      "Neispravan parametar",
      `sortBy nije dozvoljen. Dozvoljene vrednosti: ${allowedSortColumns.join(", ")}.`,
    );
  }

  const sortBy = sortByInput || "broj_prijave";
  const sortDirection = sortDirectionInput === "desc" ? "desc" : "asc";

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
    rows: (result.rows ?? []).map(mapRow),
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

  return mapRow(row);
};

export const insertPrijava = async (input: PrijavaMutationInput): Promise<PrijavaKey> => {
  if (!input.skolskaGodina) {
    throw new ApiError(
      400,
      "Nedostaje skolska godina",
      "Za kreiranje prijave potrebno je uneti skolsku godinu.",
    );
  }

  if (!input.jmbg) {
    throw new ApiError(
      400,
      "Nedostaje JMBG kandidata",
      "Za kreiranje prijave potrebno je uneti JMBG kandidata.",
    );
  }

  const brojPrijave = await resolveBrojPrijave(input.brojPrijave);

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
        ime_prezime = :imePrezime,
        sistemski_update = NVL(:sistemskiUpdate, 'N')
      WHERE broj_prijave = :brojPrijave
        AND skolska_godina = :skolskaGodina
    `,
    {
      brojPrijave: key.brojPrijave,
      skolskaGodina: key.skolskaGodina,
      datumPrijave: input.datumPrijave,
      idKonkursa: input.idKonkursa,
      idPrograma: input.idPrograma,
      statusPrijave: input.statusPrijave,
      konkursniRok: input.konkursniRok,
      jmbg: input.jmbg,
      imePrezime: input.imePrezime?.trim() || null,
      sistemskiUpdate: input.sistemskiUpdate ?? null,
    },
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
