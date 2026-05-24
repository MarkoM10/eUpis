import axios, { AxiosError } from "axios";
import type { ApiErrorPayload } from "../types/api/common";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

export const buildApiUrl = (path: string): string => {
  if (path.startsWith("/")) {
    return `${API_BASE_URL}${path}`;
  }

  return `${API_BASE_URL}/${path}`;
};

export class ApiClientError extends Error {
  title: string;
  oracleDetails?: string;

  constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.title = payload.title;
    this.oracleDetails = payload.oracleDetails;
  }
}

export const toApiClientError = (error: unknown): ApiClientError => {
  if (error instanceof ApiClientError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorPayload>;
    const payload = axiosError.response?.data;

    if (payload && payload.success === false) {
      return new ApiClientError(payload);
    }
  }

  return new ApiClientError({
    success: false,
    title: "Mrezna greska",
    message: "Neuspesan zahtev prema serveru.",
  });
};
