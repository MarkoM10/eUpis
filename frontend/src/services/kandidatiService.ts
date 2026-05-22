import type { ApiSuccess } from "../types/api/common";
import type { Kandidat, KandidatListResponse, KandidatPayload } from "../types/models/kandidat";
import { httpClient } from "./httpClient";

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const listKandidatiRequest = async (
  token: string,
  params: {
    search?: string;
    sortBy?: string;
    sortDirection?: "asc" | "desc";
    tip_kandidata?: string;
    page?: number;
    pageSize?: number;
  } = {},
): Promise<ApiSuccess<KandidatListResponse>> => {
  const response = await httpClient.get<ApiSuccess<KandidatListResponse>>("/kandidati", {
    headers: authHeaders(token),
    params,
  });

  return response.data;
};

export const getKandidatRequest = async (
  token: string,
  jmbg: string,
): Promise<ApiSuccess<Kandidat>> => {
  const response = await httpClient.get<ApiSuccess<Kandidat>>(`/kandidati/${jmbg}`, {
    headers: authHeaders(token),
  });

  return response.data;
};

export const updateKandidatRequest = async (
  token: string,
  jmbg: string,
  payload: KandidatPayload,
): Promise<ApiSuccess<{ updated: true }>> => {
  const response = await httpClient.put<ApiSuccess<{ updated: true }>>(
    `/kandidati/${jmbg}`,
    payload,
    {
      headers: authHeaders(token),
    },
  );

  return response.data;
};

export const deleteKandidatRequest = async (
  token: string,
  jmbg: string,
): Promise<ApiSuccess<{ deleted: true }>> => {
  const response = await httpClient.delete<ApiSuccess<{ deleted: true }>>(`/kandidati/${jmbg}`, {
    headers: authHeaders(token),
  });

  return response.data;
};
