import axios from "axios";
import type { ApiSuccess } from "../types/api/common";
import type { ActiveKonkursOption, Konkurs, KonkursStatus } from "../types/models/konkurs";
import type {
  EligiblePrijavaRow,
  PendingEnrollmentFinalizationRow,
  RankingItem,
  RankingListSummary,
} from "../types/models/upis";
import { buildApiUrl } from "./api";

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const listKonkursiRequest = async (
  token: string,
): Promise<ApiSuccess<{ rows: Konkurs[] }>> => {
  const response = await axios.get<ApiSuccess<{ rows: Konkurs[] }>>(buildApiUrl("/konkursi"), {
    headers: authHeaders(token),
  });

  return response.data;
};

export const listActiveKonkursiRequest = async (
  token: string,
): Promise<ApiSuccess<{ rows: ActiveKonkursOption[] }>> => {
  const response = await axios.get<ApiSuccess<{ rows: ActiveKonkursOption[] }>>(
    buildApiUrl("/konkursi/aktivni"),
    {
      headers: authHeaders(token),
    },
  );

  return response.data;
};

export const createKonkursRequest = async (
  token: string,
  payload: {
    idFakulteta: number;
    skolskaGodina: string;
    konkursniRok: string;
    datumOd: string;
    datumDo: string;
    status?: KonkursStatus;
    stavke: Array<{ idPrograma: number; brojDostupnihMesta: number }>;
  },
): Promise<ApiSuccess<{ created: true; idKonkursa: number }>> => {
  const response = await axios.post<ApiSuccess<{ created: true; idKonkursa: number }>>(
    buildApiUrl("/konkursi"),
    payload,
    {
      headers: authHeaders(token),
    },
  );

  return response.data;
};

export const updateKonkursStatusRequest = async (
  token: string,
  idKonkursa: number,
  status: KonkursStatus,
): Promise<ApiSuccess<{ updated: true }>> => {
  const response = await axios.put<ApiSuccess<{ updated: true }>>(
    buildApiUrl(`/konkursi/${idKonkursa}/status`),
    { status },
    {
      headers: authHeaders(token),
    },
  );

  return response.data;
};

export const listKonkursEligiblePrijaveRequest = async (
  token: string,
  idKonkursa: number,
  skolskaGodina?: string,
): Promise<ApiSuccess<{ rows: EligiblePrijavaRow[] }>> => {
  const response = await axios.get<ApiSuccess<{ rows: EligiblePrijavaRow[] }>>(
    buildApiUrl(`/konkursi/${idKonkursa}/prijave`),
    {
      headers: authHeaders(token),
      params: {
        skolskaGodina: skolskaGodina || undefined,
      },
    },
  );

  return response.data;
};

export const listKonkursRankingListsRequest = async (
  token: string,
  idKonkursa: number,
  params: { idPrograma?: number; skolskaGodina?: string } = {},
): Promise<ApiSuccess<{ rows: RankingListSummary[] }>> => {
  const response = await axios.get<ApiSuccess<{ rows: RankingListSummary[] }>>(
    buildApiUrl(`/konkursi/${idKonkursa}/rang-liste`),
    {
      headers: authHeaders(token),
      params,
    },
  );

  return response.data;
};

export const listKonkursRankingItemsRequest = async (
  token: string,
  idKonkursa: number,
  idPrograma: number,
): Promise<ApiSuccess<{ rows: RankingItem[] }>> => {
  const response = await axios.get<ApiSuccess<{ rows: RankingItem[] }>>(
    buildApiUrl(`/konkursi/${idKonkursa}/rang-liste/stavke`),
    {
      headers: authHeaders(token),
      params: {
        idPrograma,
      },
    },
  );

  return response.data;
};

export const generateKonkursFinalRankingRequest = async (
  token: string,
  idKonkursa: number,
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
  const response = await axios.post<
    ApiSuccess<{
      idRangListe: number;
      totalCandidates: number;
      approvedCount: number;
      rejectedCount: number;
    }>
  >(buildApiUrl(`/konkursi/${idKonkursa}/rang-liste/generate-final`), payload, {
    headers: authHeaders(token),
  });

  return response.data;
};

export const listKonkursPendingFinalizationsRequest = async (
  token: string,
  idKonkursa: number,
  skolskaGodina?: string,
): Promise<ApiSuccess<{ rows: PendingEnrollmentFinalizationRow[] }>> => {
  const response = await axios.get<ApiSuccess<{ rows: PendingEnrollmentFinalizationRow[] }>>(
    buildApiUrl(`/konkursi/${idKonkursa}/finalizacija/pending`),
    {
      headers: authHeaders(token),
      params: {
        skolskaGodina: skolskaGodina || undefined,
      },
    },
  );

  return response.data;
};

export const saveKonkursExamScoreRequest = async (
  token: string,
  idKonkursa: number,
  payload: {
    brojPrijave: number;
    skolskaGodina: string;
    brojPoena: number;
  },
): Promise<ApiSuccess<{ idStavke: number }>> => {
  const response = await axios.post<ApiSuccess<{ idStavke: number }>>(
    buildApiUrl(`/konkursi/${idKonkursa}/rezultati`),
    payload,
    {
      headers: authHeaders(token),
    },
  );

  return response.data;
};

export const confirmKonkursEnrollmentFinalizationRequest = async (
  token: string,
  idKonkursa: number,
  brojPrijave: number,
  skolskaGodina: string,
): Promise<ApiSuccess<{ brojIndeksa: string | null; datumUpisa: string | null }>> => {
  const response = await axios.post<
    ApiSuccess<{ brojIndeksa: string | null; datumUpisa: string | null }>
  >(
    buildApiUrl(
      `/konkursi/${idKonkursa}/finalizacija/${brojPrijave}/${encodeURIComponent(skolskaGodina)}/potvrdi`,
    ),
    undefined,
    {
      headers: authHeaders(token),
    },
  );

  return response.data;
};
