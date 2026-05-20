import type { ApiSuccess } from "../types/api/common";
import type { FakultetListResponse } from "../types/models/fakultet";
import { httpClient } from "./httpClient";

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const listFakultetiRequest = async (
  token: string,
): Promise<ApiSuccess<FakultetListResponse>> => {
  const response = await httpClient.get<ApiSuccess<FakultetListResponse>>("/meta/fakulteti", {
    headers: authHeaders(token),
  });

  return response.data;
};
