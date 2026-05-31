import { ApiError } from "../../shared/apiError";
import type { RankingListSummary, RankingItem } from "../../types/modules/upis";
import {
  listRankingLists,
  getRankingListById,
  listRankingItemsByListId,
  updateRankingListStudyProgram,
} from "./rankingLists.repository";

export const listRankingListsService = async (
  idKonkursa?: number,
  idPrograma?: number,
  skolskaGodina?: string,
  nazivKonkursa?: string,
  nazivPrograma?: string,
): Promise<RankingListSummary[]> => {
  return listRankingLists(idKonkursa, idPrograma, skolskaGodina, nazivKonkursa, nazivPrograma);
};

export const getRankingListService = async (idRangListe: number): Promise<RankingListSummary> => {
  if (!Number.isFinite(idRangListe) || idRangListe <= 0) {
    throw new ApiError(400, "Neispravan identifikator", "ID rang liste mora biti validan.");
  }

  const rankingList = await getRankingListById(idRangListe);
  if (!rankingList) {
    throw new ApiError(
      404,
      "Rang lista nije pronađena",
      `Rang lista sa ID ${idRangListe} nije pronađena.`,
    );
  }

  return rankingList;
};

export const listRankingItemsService = async (idRangListe: number): Promise<RankingItem[]> => {
  if (!Number.isFinite(idRangListe) || idRangListe <= 0) {
    throw new ApiError(400, "Neispravan identifikator", "ID rang liste mora biti validan.");
  }

  return listRankingItemsByListId(idRangListe);
};

export const updateRankingListStudyProgramService = async (input: {
  idRangListe: number;
  studijskiProgram: string;
}): Promise<void> => {
  if (!Number.isFinite(input.idRangListe) || input.idRangListe <= 0) {
    throw new ApiError(400, "Neispravan identifikator", "ID rang liste mora biti validan.");
  }

  if (!input.studijskiProgram || !input.studijskiProgram.trim()) {
    throw new ApiError(400, "Neispravan unos", "Naziv studijskog programa ne može biti prazan.");
  }

  await updateRankingListStudyProgram(input.idRangListe, input.studijskiProgram.trim());
};
