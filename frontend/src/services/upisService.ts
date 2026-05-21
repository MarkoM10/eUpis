import type { ApiSuccess } from "../types/api/common";
import type {
  EligiblePrijavaRow,
  RankingItem,
  RankingListSummary,
  StudentAdmissionStatus,
  StudyProgramOption,
} from "../types/models/upis";
import { httpClient } from "./httpClient";

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const listStudyProgramsRequest = async (
  token: string,
): Promise<ApiSuccess<{ rows: StudyProgramOption[] }>> => {
  const response = await httpClient.get<ApiSuccess<{ rows: StudyProgramOption[] }>>(
    "/upis/programi",
    {
      headers: authHeaders(token),
    },
  );

  return response.data;
};

export const listEligiblePrijaveRequest = async (
  token: string,
  skolskaGodina?: string,
): Promise<ApiSuccess<{ rows: EligiblePrijavaRow[] }>> => {
  const response = await httpClient.get<ApiSuccess<{ rows: EligiblePrijavaRow[] }>>(
    "/upis/eligible-prijave",
    {
      headers: authHeaders(token),
      params: {
        skolskaGodina: skolskaGodina || undefined,
      },
    },
  );

  return response.data;
};

export const saveExamScoreRequest = async (
  token: string,
  payload: {
    brojPrijave: number;
    skolskaGodina: string;
    brojPoena: number;
  },
): Promise<ApiSuccess<{ idStavke: number }>> => {
  const response = await httpClient.post<ApiSuccess<{ idStavke: number }>>(
    "/upis/rezultati",
    payload,
    {
      headers: authHeaders(token),
    },
  );

  return response.data;
};

export const generateFinalRankingRequest = async (
  token: string,
  payload: {
    idPrograma: number;
    skolskaGodina: string;
    brojMesta: number;
  },
): Promise<
  ApiSuccess<{
    idRangListe: number;
    totalCandidates: number;
    approvedCount: number;
    rejectedCount: number;
  }>
> => {
  const response = await httpClient.post<
    ApiSuccess<{
      idRangListe: number;
      totalCandidates: number;
      approvedCount: number;
      rejectedCount: number;
    }>
  >("/upis/rang-liste/generate-final", payload, {
    headers: authHeaders(token),
  });

  return response.data;
};

export const finalizeRankingRequest = async (
  token: string,
  idRangListe: number,
): Promise<ApiSuccess<{ approvedCount: number; rejectedCount: number }>> => {
  const response = await httpClient.post<
    ApiSuccess<{ approvedCount: number; rejectedCount: number }>
  >(
    "/upis/rang-liste/finalize",
    { idRangListe },
    {
      headers: authHeaders(token),
    },
  );

  return response.data;
};

export const listRankingListsRequest = async (
  token: string,
  params: { idPrograma?: number; skolskaGodina?: string } = {},
): Promise<ApiSuccess<{ rows: RankingListSummary[] }>> => {
  const response = await httpClient.get<ApiSuccess<{ rows: RankingListSummary[] }>>(
    "/upis/rang-liste",
    {
      headers: authHeaders(token),
      params,
    },
  );

  return response.data;
};

export const listRankingItemsRequest = async (
  token: string,
  idRangListe: number,
): Promise<ApiSuccess<{ rows: RankingItem[] }>> => {
  const response = await httpClient.get<ApiSuccess<{ rows: RankingItem[] }>>(
    `/upis/rang-liste/${idRangListe}/stavke`,
    {
      headers: authHeaders(token),
    },
  );

  return response.data;
};

export const getStudentAdmissionStatusRequest = async (
  token: string,
): Promise<ApiSuccess<StudentAdmissionStatus>> => {
  const response = await httpClient.get<ApiSuccess<StudentAdmissionStatus>>(
    "/upis/student-status",
    {
      headers: authHeaders(token),
    },
  );

  return response.data;
};
