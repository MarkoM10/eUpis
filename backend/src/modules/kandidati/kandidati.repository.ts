import { executeSql } from "../../db/oracle/execute";
import { ApiError } from "../../shared/apiError";
import { buildListSql, parseListQuery } from "../../shared/query";
import type { KandidatMutationInput, KandidatRecord } from "../../types/modules/kandidati";

type KandidatRow = {
  JMBG: string;
  IME_PREZIME: string;
  TIP_KANDIDATA: string;
  SERIJSKI_BROJ: number;
  EMAIL_VREDNOST: string;
  ADRESA_ULICA: string;
  ADRESA_BROJ: number;
  ADRESA_GRAD: string;
};

const mapRow = (row: KandidatRow): KandidatRecord => {
  return {
    jmbg: row.JMBG,
    imePrezime: row.IME_PREZIME,
    tipKandidata: row.TIP_KANDIDATA,
    serijskiBroj: row.SERIJSKI_BROJ,
    emailVrednost: row.EMAIL_VREDNOST,
    adresaUlica: row.ADRESA_ULICA,
    adresaBroj: row.ADRESA_BROJ,
    adresaGrad: row.ADRESA_GRAD,
  };
};

const baseSelect = `
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
`;

export const listKandidati = async (
  query: Record<string, unknown>,
): Promise<{
  rows: KandidatRecord[];
  page: number;
  pageSize: number;
}> => {
  const parsed = parseListQuery(query, {
    allowedSortColumns: ["jmbg", "ime_prezime", "tip_kandidata", "serijski_broj"],
    allowedFilters: ["tip_kandidata"],
  });

  const sqlParts = buildListSql(parsed, {
    searchableColumn: "k.ime_prezime",
    filterColumnMap: {
      tip_kandidata: "k.tip_kandidata",
    },
    defaultSortBy: "ime_prezime",
  });

  const result = await executeSql<KandidatRow>(
    `${baseSelect} ${sqlParts.sqlSuffix}`,
    sqlParts.binds,
  );

  return {
    rows: (result.rows ?? []).map(mapRow),
    page: parsed.pagination.page,
    pageSize: parsed.pagination.pageSize,
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
  const result = await executeSql<KandidatRow>(`${baseSelect} WHERE k.jmbg = :jmbg`, { jmbg });

  const row = result.rows?.[0];
  return row ? mapRow(row) : null;
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
  await executeSql(
    `
      DELETE FROM Kandidat
      WHERE jmbg = :jmbg
    `,
    { jmbg },
  );
};
