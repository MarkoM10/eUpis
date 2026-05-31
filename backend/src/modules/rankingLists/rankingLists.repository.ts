import { executeSql } from "../../db/oracle/execute";
import type { RankingListSummary, RankingItem } from "../../types/modules/upis";

type RankingListRow = {
  ID_RANG_LISTE: number;
  ID_KONKURSA: number | null;
  NAZIV_KONKURSA: string | null;
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

const mapRankingList = (row: RankingListRow): RankingListSummary => ({
  idRangListe: row.ID_RANG_LISTE,
  idKonkursa: row.ID_KONKURSA,
  nazivKonkursa: row.NAZIV_KONKURSA,
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

export const listRankingLists = async (
  idKonkursa?: number,
  idPrograma?: number,
  skolskaGodina?: string,
  nazivKonkursa?: string,
  nazivPrograma?: string,
): Promise<RankingListSummary[]> => {
  const result = await executeSql<RankingListRow>(
    `
      SELECT
        kr.id_rang_liste,
        kr.id_konkursa,
        TRIM(
          COALESCE(k.konkursni_rok, '') ||
          CASE WHEN k.skolska_godina IS NOT NULL THEN ' ' || k.skolska_godina ELSE '' END ||
          CASE WHEN f.naziv_fakulteta IS NOT NULL THEN ' - ' || f.naziv_fakulteta ELSE '' END
        ) AS naziv_konkursa,
        kr.id_programa,
        sp.naziv_programa,
        sp.modul,
        kr.studijski_program,
        kr.skolska_godina,
        kr.broj_mesta,
        kr.ukupno_kandidata
      FROM KonacnaRangLista kr
      LEFT JOIN KonkursZaMasterStudije k ON k.id_konkursa = kr.id_konkursa
      LEFT JOIN Fakultet f ON f.id_fakulteta = k.id_fakulteta
      LEFT JOIN StudijskiProgram_VIEW sp ON sp.id_programa = kr.id_programa
      WHERE (:idKonkursa IS NULL OR kr.id_konkursa = :idKonkursa)
        AND (:idPrograma IS NULL OR kr.id_programa = :idPrograma)
        AND (:skolskaGodina IS NULL OR kr.skolska_godina = :skolskaGodina)
        AND (
          :nazivKonkursa IS NULL
          OR LOWER(
            TRIM(
              COALESCE(k.konkursni_rok, '') ||
              CASE WHEN k.skolska_godina IS NOT NULL THEN ' ' || k.skolska_godina ELSE '' END ||
              CASE WHEN f.naziv_fakulteta IS NOT NULL THEN ' - ' || f.naziv_fakulteta ELSE '' END
            )
          ) LIKE '%' || LOWER(:nazivKonkursa) || '%'
        )
        AND (:nazivPrograma IS NULL OR LOWER(sp.naziv_programa) LIKE '%' || LOWER(:nazivPrograma) || '%')
      ORDER BY kr.id_rang_liste DESC
    `,
    {
      idKonkursa: idKonkursa ?? null,
      idPrograma: idPrograma ?? null,
      skolskaGodina: skolskaGodina ?? null,
      nazivKonkursa: nazivKonkursa ?? null,
      nazivPrograma: nazivPrograma ?? null,
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
        kr.id_konkursa,
        TRIM(
          COALESCE(k.konkursni_rok, '') ||
          CASE WHEN k.skolska_godina IS NOT NULL THEN ' ' || k.skolska_godina ELSE '' END ||
          CASE WHEN f.naziv_fakulteta IS NOT NULL THEN ' - ' || f.naziv_fakulteta ELSE '' END
        ) AS naziv_konkursa,
        kr.id_programa,
        sp.naziv_programa,
        sp.modul,
        kr.studijski_program,
        kr.skolska_godina,
        kr.broj_mesta,
        kr.ukupno_kandidata
      FROM KonacnaRangLista kr
      LEFT JOIN KonkursZaMasterStudije k ON k.id_konkursa = kr.id_konkursa
      LEFT JOIN Fakultet f ON f.id_fakulteta = k.id_fakulteta
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

export const updateRankingListStudyProgram = async (
  idRangListe: number,
  studijskiProgram: string,
): Promise<void> => {
  await executeSql(
    `
      UPDATE KonacnaRangLista
      SET studijski_program = :studijskiProgram
      WHERE id_rang_liste = :idRangListe
    `,
    {
      idRangListe,
      studijskiProgram,
    },
  );
};
