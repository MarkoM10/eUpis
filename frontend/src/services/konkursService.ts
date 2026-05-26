import axios from "axios";
import type { ApiSuccess } from "../types/api/common";
import type { ActiveKonkursOption, Konkurs, KonkursStatus } from "../types/models/konkurs";
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
