import axios from "axios";
import type { ApiSuccess } from "../types/api/common";
import type { FakultetListResponse } from "../types/models/fakultet";
import { buildApiUrl } from "./api";

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const listFakultetiRequest = async (
  token: string,
): Promise<ApiSuccess<FakultetListResponse>> => {
  const response = await axios.get<ApiSuccess<FakultetListResponse>>(
    buildApiUrl("/meta/fakulteti"),
    {
      headers: authHeaders(token),
    },
  );

  return response.data;
};
