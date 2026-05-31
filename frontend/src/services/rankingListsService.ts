import axios from "axios";
import type { ApiSuccess } from "../types/api/common";
import type { RankingListSummary, RankingItem } from "../types/models/upis";
import { buildApiUrl } from "./api";

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const listRankingListsRequest = async (
  token: string,
  params: {
    nazivKonkursa?: string;
    nazivPrograma?: string;
    skolskaGodina?: string;
  } = {},
): Promise<ApiSuccess<{ rows: RankingListSummary[] }>> => {
  const response = await axios.get<ApiSuccess<{ rows: RankingListSummary[] }>>(
    buildApiUrl("/ranking-lists"),
    {
      headers: authHeaders(token),
      params,
    },
  );

  return response.data;
};

export const getRankingListRequest = async (
  token: string,
  idRangListe: number,
): Promise<ApiSuccess<RankingListSummary>> => {
  const response = await axios.get<ApiSuccess<RankingListSummary>>(
    buildApiUrl(`/ranking-lists/${idRangListe}`),
    {
      headers: authHeaders(token),
    },
  );

  return response.data;
};

export const listRankingItemsRequest = async (
  token: string,
  idRangListe: number,
): Promise<ApiSuccess<{ rows: RankingItem[] }>> => {
  const response = await axios.get<ApiSuccess<{ rows: RankingItem[] }>>(
    buildApiUrl(`/ranking-lists/${idRangListe}/items`),
    {
      headers: authHeaders(token),
    },
  );

  return response.data;
};

export const updateRankingListStudyProgramRequest = async (
  token: string,
  idRangListe: number,
  studijskiProgram: string,
): Promise<ApiSuccess<{ updated: true }>> => {
  const response = await axios.put<ApiSuccess<{ updated: true }>>(
    buildApiUrl(`/ranking-lists/${idRangListe}/study-program`),
    { studijskiProgram },
    {
      headers: authHeaders(token),
    },
  );

  return response.data;
};
