import axios, { AxiosError } from "axios";

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorPayload {
  success: false;
  title: string;
  message: string;
  oracleDetails?: string;
}

export class ApiClientError extends Error {
  title: string;
  oracleDetails?: string;

  constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.title = payload.title;
    this.oracleDetails = payload.oracleDetails;
  }
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

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
