import { executeSql } from "../../db/oracle/execute";
import type { RankingListSummary, RankingItem } from "../../types/modules/upis";
import type { RankingItemRow, RankingListRow } from "../../types/modules/rankingListsRepository";
import { mapRankingItemRow, mapRankingListRow } from "../../utils/modules/rankingLists.utils";

export const listRankingLists = async (
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
          CASE
            WHEN k.godina_konkursa IS NOT NULL
              THEN ' ' || TO_CHAR(k.godina_konkursa) || '/' || TO_CHAR(k.godina_konkursa + 1)
            ELSE ''
          END ||
          CASE WHEN f.naziv_fakulteta IS NOT NULL THEN ' - ' || f.naziv_fakulteta ELSE '' END
        ) AS naziv_konkursa,
        kr.id_programa,
        sp.naziv_programa,
        sp.modul,
        kr.studijski_program,
        kr.skolska_godina,
        kr.broj_mesta,
        kr.ukupno_kandidata,
        f.naziv_fakulteta
      FROM KonacnaRangLista kr
      LEFT JOIN KonkursZaMasterStudije k ON k.id_konkursa = kr.id_konkursa
      LEFT JOIN Fakultet f ON f.id_fakulteta = k.id_fakulteta
      LEFT JOIN StudijskiProgram_VIEW sp ON sp.id_programa = kr.id_programa
      WHERE (:skolskaGodina IS NULL OR kr.skolska_godina = :skolskaGodina)
        AND (
          :nazivKonkursa IS NULL
          OR LOWER(
            TRIM(
              COALESCE(k.konkursni_rok, '') ||
              CASE
                WHEN k.godina_konkursa IS NOT NULL
                  THEN ' ' || TO_CHAR(k.godina_konkursa) || '/' || TO_CHAR(k.godina_konkursa + 1)
                ELSE ''
              END ||
              CASE WHEN f.naziv_fakulteta IS NOT NULL THEN ' - ' || f.naziv_fakulteta ELSE '' END
            )
          ) LIKE '%' || LOWER(:nazivKonkursa) || '%'
        )
        AND (:nazivPrograma IS NULL OR LOWER(sp.naziv_programa) LIKE '%' || LOWER(:nazivPrograma) || '%')
      ORDER BY kr.id_rang_liste DESC
    `,
    {
      skolskaGodina: skolskaGodina ?? null,
      nazivKonkursa: nazivKonkursa ?? null,
      nazivPrograma: nazivPrograma ?? null,
    },
  );

  return (result.rows ?? []).map(mapRankingListRow);
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
          CASE
            WHEN k.godina_konkursa IS NOT NULL
              THEN ' ' || TO_CHAR(k.godina_konkursa) || '/' || TO_CHAR(k.godina_konkursa + 1)
            ELSE ''
          END ||
          CASE WHEN f.naziv_fakulteta IS NOT NULL THEN ' - ' || f.naziv_fakulteta ELSE '' END
        ) AS naziv_konkursa,
        kr.id_programa,
        sp.naziv_programa,
        sp.modul,
        kr.studijski_program,
        kr.skolska_godina,
        kr.broj_mesta,
        kr.ukupno_kandidata,
        f.naziv_fakulteta
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
  return row ? mapRankingListRow(row) : null;
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

  return (result.rows ?? []).map(mapRankingItemRow);
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
