import { executeSql } from "../../db/oracle/execute";
import { ApiError } from "../../shared/apiError";
import { buildListSql, parseListQuery } from "../../shared/query";
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
  ID_KORISNIKA: number | null;
  ID_PROGRAMA: number | null;
  STATUS_PRIJAVE: string | null;
  KONKURSNI_ROK: string | null;
  JMBG: string | null;
  IME_PREZIME: string | null;
  SISTEMSKI_UPDATE: string | null;
};

const baseSelect = `
  SELECT
    p.broj_prijave,
    p.datum_prijave,
    p.skolska_godina,
    p.id_korisnika,
    p.id_programa,
    p.status_prijave,
    p.konkursni_rok,
    p.jmbg,
    p.ime_prezime,
    p.sistemski_update
  FROM Prijava p
`;

const mapRow = (row: PrijavaRow): PrijavaRecord => ({
  brojPrijave: row.BROJ_PRIJAVE,
  datumPrijave: row.DATUM_PRIJAVE ? row.DATUM_PRIJAVE.toISOString() : null,
  skolskaGodina: row.SKOLSKA_GODINA,
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
  const parsed = parseListQuery(query, {
    allowedSortColumns: [
      "broj_prijave",
      "datum_prijave",
      "skolska_godina",
      "status_prijave",
      "ime_prezime",
    ],
    allowedFilters: ["status_prijave", "skolska_godina", "konkursni_rok"],
  });

  const listSql = buildListSql(parsed, {
    searchableColumn: "p.ime_prezime",
    filterColumnMap: {
      status_prijave: "p.status_prijave",
      skolska_godina: "p.skolska_godina",
      konkursni_rok: "p.konkursni_rok",
    },
    defaultSortBy: "broj_prijave",
  });

  const result = await executeSql<PrijavaRow>(`${baseSelect} ${listSql.sqlSuffix}`, listSql.binds);

  return {
    rows: (result.rows ?? []).map(mapRow),
    page: parsed.pagination.page,
    pageSize: parsed.pagination.pageSize,
  };
};

export const getPrijavaByKey = async (key: PrijavaKey): Promise<PrijavaRecord> => {
  const result = await executeSql<PrijavaRow>(
    `${baseSelect} WHERE p.broj_prijave = :brojPrijave AND p.skolska_godina = :skolskaGodina`,
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
        id_korisnika,
        id_programa,
        status_prijave,
        konkursni_rok,
        jmbg,
        ime_prezime,
        sistemski_update
      )
      VALUES (
        :brojPrijave,
        TO_DATE(:datumPrijave, 'YYYY-MM-DD'),
        :skolskaGodina,
        :idKorisnika,
        :idPrograma,
        :statusPrijave,
        :konkursniRok,
        :jmbg,
        :imePrezime,
        NVL(:sistemskiUpdate, 'N')
      )
    `,
    {
      brojPrijave,
      datumPrijave: input.datumPrijave,
      skolskaGodina: input.skolskaGodina,
      idKorisnika: input.idKorisnika ?? null,
      idPrograma: input.idPrograma,
      statusPrijave: input.statusPrijave,
      konkursniRok: input.konkursniRok,
      jmbg: input.jmbg,
      imePrezime: input.imePrezime,
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
      idPrograma: input.idPrograma,
      statusPrijave: input.statusPrijave,
      konkursniRok: input.konkursniRok,
      jmbg: input.jmbg,
      imePrezime: input.imePrezime,
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
