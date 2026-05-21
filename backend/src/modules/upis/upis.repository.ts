import { executeSql } from "../../db/oracle/execute";
import type {
  EligiblePrijavaRow,
  RankingItem,
  RankingListSummary,
  StudyProgramOption,
} from "../../types/modules/upis";

type ProgramRow = {
  ID_PROGRAMA: number;
  NAZIV_PROGRAMA: string;
  MODUL: string;
  BROJ_DOSTUPNIH_MESTA: number | null;
};

type EligiblePrijavaDbRow = {
  BROJ_PRIJAVE: number;
  SKOLSKA_GODINA: string;
  DATUM_PRIJAVE: Date | null;
  ID_PROGRAMA: number | null;
  NAZIV_PROGRAMA: string | null;
  MODUL: string | null;
  STATUS_PRIJAVE: string | null;
  JMBG: string | null;
  IME_PREZIME: string | null;
  BROJ_POENA: number | null;
  RANKING_STATUS: string | null;
  STUDIJSKI_PROGRAM: string | null;
};

type RankingListRow = {
  ID_RANG_LISTE: number;
  ID_PROGRAMA: number | null;
  NAZIV_PROGRAMA: string | null;
  MODUL: string | null;
  STUDIJSKI_PROGRAM: string | null;
  SKOLSKA_GODINA: string | null;
  BROJ_MESTA: number | null;
  UKUPNO_KANDIDATA: number | null;
};

type RankingItemRow = {
  ID_STAVKE: number;
  ID_RANG_LISTE: number | null;
  BROJ_PRIJAVE: number | null;
  ID_PROGRAMA: number | null;
  IME_PREZIME: string | null;
  BROJ_POENA: number | null;
  RANG_MESTO: number | null;
  STATUS: string | null;
  STUDIJSKI_PROGRAM: string | null;
};

const mapProgram = (row: ProgramRow): StudyProgramOption => ({
  idPrograma: row.ID_PROGRAMA,
  nazivPrograma: row.NAZIV_PROGRAMA,
  modul: row.MODUL,
  brojDostupnihMesta: row.BROJ_DOSTUPNIH_MESTA,
});

const mapEligiblePrijava = (row: EligiblePrijavaDbRow): EligiblePrijavaRow => ({
  brojPrijave: row.BROJ_PRIJAVE,
  skolskaGodina: row.SKOLSKA_GODINA,
  datumPrijave: row.DATUM_PRIJAVE ? row.DATUM_PRIJAVE.toISOString() : null,
  idPrograma: row.ID_PROGRAMA,
  nazivPrograma: row.NAZIV_PROGRAMA,
  modul: row.MODUL,
  jmbg: row.JMBG,
  imePrezime: row.IME_PREZIME,
  examPoints: row.BROJ_POENA,
  rankingStatus: row.RANKING_STATUS,
  studijskiProgram: row.STUDIJSKI_PROGRAM,
  statusPrijave: row.STATUS_PRIJAVE,
});

const mapRankingList = (row: RankingListRow): RankingListSummary => ({
  idRangListe: row.ID_RANG_LISTE,
  idPrograma: row.ID_PROGRAMA,
  nazivPrograma: row.NAZIV_PROGRAMA,
  modul: row.MODUL,
  studijskiProgram: row.STUDIJSKI_PROGRAM,
  skolskaGodina: row.SKOLSKA_GODINA,
  brojMesta: row.BROJ_MESTA,
  ukupnoKandidata: row.UKUPNO_KANDIDATA,
});

const mapRankingItem = (row: RankingItemRow): RankingItem => ({
  idStavke: row.ID_STAVKE,
  idRangListe: row.ID_RANG_LISTE,
  brojPrijave: row.BROJ_PRIJAVE,
  idPrograma: row.ID_PROGRAMA,
  imePrezime: row.IME_PREZIME,
  brojPoena: row.BROJ_POENA,
  rangMesto: row.RANG_MESTO,
  status: row.STATUS,
  studijskiProgram: row.STUDIJSKI_PROGRAM,
});

const getNextValue = async (
  tableName: "STAVKARANGLISTE" | "KONACNARANGLISTA",
  columnName: string,
): Promise<number> => {
  const result = await executeSql<{ NEXT_VAL: number }>(
    `SELECT NVL(MAX(t.${columnName}), 0) + 1 AS next_val FROM ${tableName} t`,
  );

  return result.rows?.[0]?.NEXT_VAL ?? 1;
};

export const listStudyPrograms = async (): Promise<StudyProgramOption[]> => {
  const result = await executeSql<ProgramRow>(
    `
      SELECT
        sp.id_programa,
        sp.naziv_programa,
        sp.modul,
        sp.broj_dostupnih_mesta
      FROM StudijskiProgram_VIEW sp
      ORDER BY sp.naziv_programa, sp.modul
    `,
  );

  return (result.rows ?? []).map(mapProgram);
};

export const listEligiblePrijave = async (
  skolskaGodina?: string,
): Promise<EligiblePrijavaRow[]> => {
  const result = await executeSql<EligiblePrijavaDbRow>(
    `
      SELECT
        p.broj_prijave,
        p.skolska_godina,
        p.datum_prijave,
        p.id_programa,
        sp.naziv_programa,
        sp.modul,
        p.status_prijave,
        p.jmbg,
        p.ime_prezime,
        s.broj_poena,
        s.status AS ranking_status,
        s.studijski_program
      FROM Prijava p
      LEFT JOIN StudijskiProgram_VIEW sp ON sp.id_programa = p.id_programa
      LEFT JOIN StavkaRangListe s
        ON s.id_stavke = (
          SELECT MAX(s2.id_stavke)
          FROM StavkaRangListe s2
          WHERE s2.broj_prijave = p.broj_prijave
        )
      WHERE p.status_prijave = 'Odobrena'
        AND p.id_programa IS NOT NULL
        AND (:skolskaGodina IS NULL OR p.skolska_godina = :skolskaGodina)
      ORDER BY p.datum_prijave DESC NULLS LAST, p.broj_prijave DESC
    `,
    {
      skolskaGodina: skolskaGodina ?? null,
    },
  );

  return (result.rows ?? []).map(mapEligiblePrijava);
};

export const findPrijavaForExam = async (
  brojPrijave: number,
  skolskaGodina: string,
): Promise<EligiblePrijavaRow | null> => {
  const result = await executeSql<EligiblePrijavaDbRow>(
    `
      SELECT
        p.broj_prijave,
        p.skolska_godina,
        p.datum_prijave,
        p.id_programa,
        sp.naziv_programa,
        sp.modul,
        p.status_prijave,
        p.jmbg,
        p.ime_prezime,
        s.broj_poena,
        s.status AS ranking_status,
        s.studijski_program
      FROM Prijava p
      LEFT JOIN StudijskiProgram_VIEW sp ON sp.id_programa = p.id_programa
      LEFT JOIN StavkaRangListe s ON s.broj_prijave = p.broj_prijave
      WHERE p.broj_prijave = :brojPrijave
        AND p.skolska_godina = :skolskaGodina
      FETCH FIRST 1 ROWS ONLY
    `,
    { brojPrijave, skolskaGodina },
  );

  const row = result.rows?.[0];
  return row ? mapEligiblePrijava(row) : null;
};

export const findRankingListByProgramAndYear = async (
  idPrograma: number,
  skolskaGodina: string,
): Promise<RankingListSummary | null> => {
  const result = await executeSql<RankingListRow>(
    `
      SELECT
        kr.id_rang_liste,
        kr.id_programa,
        sp.naziv_programa,
        sp.modul,
        kr.studijski_program,
        kr.skolska_godina,
        kr.broj_mesta,
        kr.ukupno_kandidata
      FROM KonacnaRangLista kr
      LEFT JOIN StudijskiProgram_VIEW sp ON sp.id_programa = kr.id_programa
      WHERE kr.id_programa = :idPrograma
        AND kr.skolska_godina = :skolskaGodina
      ORDER BY kr.id_rang_liste DESC
      FETCH FIRST 1 ROWS ONLY
    `,
    { idPrograma, skolskaGodina },
  );

  const row = result.rows?.[0];
  return row ? mapRankingList(row) : null;
};

export const createRankingList = async (
  idPrograma: number,
  studijskiProgram: string,
  skolskaGodina: string,
  brojMesta: number,
): Promise<number> => {
  const idRangListe = await getNextValue("KONACNARANGLISTA", "id_rang_liste");

  await executeSql(
    `
      INSERT INTO KonacnaRangLista (
        id_rang_liste,
        id_programa,
        studijski_program,
        broj_mesta,
        skolska_godina,
        ukupno_kandidata
      )
      VALUES (
        :idRangListe,
        :idPrograma,
        :studijskiProgram,
        :brojMesta,
        :skolskaGodina,
        0
      )
    `,
    {
      idRangListe,
      idPrograma,
      studijskiProgram,
      brojMesta,
      skolskaGodina,
    },
  );

  return idRangListe;
};

export const listRankingLists = async (
  idPrograma?: number,
  skolskaGodina?: string,
): Promise<RankingListSummary[]> => {
  const result = await executeSql<RankingListRow>(
    `
      SELECT
        kr.id_rang_liste,
        kr.id_programa,
        sp.naziv_programa,
        sp.modul,
        kr.studijski_program,
        kr.skolska_godina,
        kr.broj_mesta,
        kr.ukupno_kandidata
      FROM KonacnaRangLista kr
      LEFT JOIN StudijskiProgram_VIEW sp ON sp.id_programa = kr.id_programa
      WHERE (:idPrograma IS NULL OR kr.id_programa = :idPrograma)
        AND (:skolskaGodina IS NULL OR kr.skolska_godina = :skolskaGodina)
      ORDER BY kr.id_rang_liste DESC
    `,
    {
      idPrograma: idPrograma ?? null,
      skolskaGodina: skolskaGodina ?? null,
    },
  );

  return (result.rows ?? []).map(mapRankingList);
};

export const getRankingListById = async (
  idRangListe: number,
): Promise<RankingListSummary | null> => {
  const result = await executeSql<RankingListRow>(
    `
      SELECT
        kr.id_rang_liste,
        kr.id_programa,
        sp.naziv_programa,
        sp.modul,
        kr.studijski_program,
        kr.skolska_godina,
        kr.broj_mesta,
        kr.ukupno_kandidata
      FROM KonacnaRangLista kr
      LEFT JOIN StudijskiProgram_VIEW sp ON sp.id_programa = kr.id_programa
      WHERE kr.id_rang_liste = :idRangListe
      FETCH FIRST 1 ROWS ONLY
    `,
    { idRangListe },
  );

  const row = result.rows?.[0];
  return row ? mapRankingList(row) : null;
};

export const listRankingItemsByListId = async (idRangListe: number): Promise<RankingItem[]> => {
  const result = await executeSql<RankingItemRow>(
    `
      SELECT
        s.id_stavke,
        s.id_rang_liste,
        s.broj_prijave,
        s.id_programa,
        s.ime_prezime,
        s.broj_poena,
        s.rang_mesto,
        s.status,
        s.studijski_program
      FROM StavkaRangListe s
      WHERE s.id_rang_liste = :idRangListe
      ORDER BY s.broj_poena DESC NULLS LAST, s.ime_prezime ASC NULLS LAST, s.id_stavke ASC
    `,
    { idRangListe },
  );

  return (result.rows ?? []).map(mapRankingItem);
};

export const findRankingItemByPrijava = async (
  brojPrijave: number,
): Promise<RankingItem | null> => {
  const result = await executeSql<RankingItemRow>(
    `
      SELECT
        s.id_stavke,
        s.id_rang_liste,
        s.broj_prijave,
        s.id_programa,
        s.ime_prezime,
        s.broj_poena,
        s.rang_mesto,
        s.status,
        s.studijski_program
      FROM StavkaRangListe s
      WHERE s.broj_prijave = :brojPrijave
      ORDER BY s.id_stavke DESC
      FETCH FIRST 1 ROWS ONLY
    `,
    { brojPrijave },
  );

  const row = result.rows?.[0];
  return row ? mapRankingItem(row) : null;
};

export const insertExamScore = async (input: {
  idRangListe: number;
  brojPrijave: number;
  idPrograma: number;
  imePrezime: string | null;
  brojPoena: number;
  studijskiProgram: string;
}): Promise<number> => {
  const idStavke = await getNextValue("STAVKARANGLISTE", "id_stavke");

  await executeSql(
    `
      INSERT INTO StavkaRangListe (
        id_stavke,
        id_rang_liste,
        broj_poena,
        ime_prezime,
        broj_prijave,
        id_programa,
        rang_mesto,
        status,
        studijski_program,
        sistemski_update
      )
      VALUES (
        :idStavke,
        :idRangListe,
        :brojPoena,
        :imePrezime,
        :brojPrijave,
        :idPrograma,
        NULL,
        'Scored',
        :studijskiProgram,
        'N'
      )
    `,
    {
      idStavke,
      idRangListe: input.idRangListe,
      brojPoena: input.brojPoena,
      imePrezime: input.imePrezime,
      brojPrijave: input.brojPrijave,
      idPrograma: input.idPrograma,
      studijskiProgram: input.studijskiProgram,
    },
  );

  return idStavke;
};

export const updateRankingItemRank = async (idStavke: number, rangMesto: number): Promise<void> => {
  await executeSql(
    `
      UPDATE StavkaRangListe
      SET rang_mesto = :rangMesto
      WHERE id_stavke = :idStavke
    `,
    {
      idStavke,
      rangMesto,
    },
  );
};

export const updateRankingItemStatus = async (idStavke: number, status: string): Promise<void> => {
  await executeSql(
    `
      UPDATE StavkaRangListe
      SET status = :status
      WHERE id_stavke = :idStavke
    `,
    {
      idStavke,
      status,
    },
  );
};

export const updateRankingListCandidateCount = async (
  idRangListe: number,
  ukupnoKandidata: number,
): Promise<void> => {
  await executeSql(
    `
      UPDATE KonacnaRangLista
      SET ukupno_kandidata = :ukupnoKandidata
      WHERE id_rang_liste = :idRangListe
    `,
    {
      idRangListe,
      ukupnoKandidata,
    },
  );
};

export const updateRankingListSeats = async (
  idRangListe: number,
  brojMesta: number,
): Promise<void> => {
  await executeSql(
    `
      UPDATE KonacnaRangLista
      SET broj_mesta = :brojMesta
      WHERE id_rang_liste = :idRangListe
    `,
    {
      idRangListe,
      brojMesta,
    },
  );
};
