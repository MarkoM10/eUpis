import type { ApiSuccess } from "../types/api/common";
import type {
  DownloadedPrijavaDocument,
  PrijavaDocumentSummary,
  PrijavaDocumentType,
  PrijavaDocumentsRecord,
} from "../types/models/prijavaDocument";
import type { Prijava, PrijavaListResponse, PrijavaPayload } from "../types/models/prijava";
import { httpClient } from "./httpClient";

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

const buildPrijavaPath = (brojPrijave: number, skolskaGodina: string): string =>
  `/prijave/${brojPrijave}/${encodeURIComponent(skolskaGodina)}`;

const appendFormValue = (
  formData: FormData,
  key: string,
  value: string | number | null | undefined,
): void => {
  if (value === null || value === undefined || value === "") {
    return;
  }

  formData.append(key, String(value));
};

const getFileNameFromDisposition = (contentDisposition?: string): string | null => {
  if (!contentDisposition) {
    return null;
  }

  const utfMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    return decodeURIComponent(utfMatch[1]);
  }

  const plainMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1] ?? null;
};

export const listPrijaveRequest = async (
  token: string,
  params: {
    search?: string;
    sortBy?: string;
    sortDirection?: "asc" | "desc";
    status_prijave?: string;
    skolska_godina?: string;
    konkursni_rok?: string;
    page?: number;
    pageSize?: number;
  } = {},
): Promise<ApiSuccess<PrijavaListResponse>> => {
  const response = await httpClient.get<ApiSuccess<PrijavaListResponse>>("/prijave", {
    headers: authHeaders(token),
    params,
  });

  return response.data;
};

export const getPrijavaRequest = async (
  token: string,
  brojPrijave: number,
  skolskaGodina: string,
): Promise<ApiSuccess<Prijava>> => {
  const response = await httpClient.get<ApiSuccess<Prijava>>(
    buildPrijavaPath(brojPrijave, skolskaGodina),
    {
      headers: authHeaders(token),
    },
  );

  return response.data;
};

export const getPrijavaDocumentsRequest = async (
  token: string,
  brojPrijave: number,
  skolskaGodina: string,
): Promise<ApiSuccess<PrijavaDocumentsRecord>> => {
  const response = await httpClient.get<ApiSuccess<PrijavaDocumentsRecord>>(
    `${buildPrijavaPath(brojPrijave, skolskaGodina)}/documents`,
    {
      headers: authHeaders(token),
    },
  );

  return response.data;
};

export const createPrijavaRequest = async (
  token: string,
  payload: PrijavaPayload,
): Promise<ApiSuccess<{ created: true; brojPrijave: number; skolskaGodina: string }>> => {
  const response = await httpClient.post<
    ApiSuccess<{ created: true; brojPrijave: number; skolskaGodina: string }>
  >("/prijave", payload, {
    headers: authHeaders(token),
  });

  return response.data;
};

export const uploadPrijavaDocumentRequest = async (
  token: string,
  brojPrijave: number,
  skolskaGodina: string,
  documentType: PrijavaDocumentType,
  file: File,
  fields: Record<string, string | number | null | undefined>,
): Promise<ApiSuccess<PrijavaDocumentSummary>> => {
  const formData = new FormData();
  formData.append("file", file);

  Object.entries(fields).forEach(([key, value]) => {
    appendFormValue(formData, key, value);
  });

  const response = await httpClient.post<ApiSuccess<PrijavaDocumentSummary>>(
    `${buildPrijavaPath(brojPrijave, skolskaGodina)}/documents/${documentType}`,
    formData,
    {
      headers: {
        ...authHeaders(token),
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
};

export const downloadPrijavaDocumentRequest = async (
  token: string,
  brojPrijave: number,
  skolskaGodina: string,
  documentType: PrijavaDocumentType,
): Promise<DownloadedPrijavaDocument> => {
  const response = await httpClient.get<Blob>(
    `${buildPrijavaPath(brojPrijave, skolskaGodina)}/documents/${documentType}/download`,
    {
      headers: authHeaders(token),
      responseType: "blob",
    },
  );

  return {
    blob: response.data,
    mimeType: String(response.headers["content-type"] ?? "application/octet-stream"),
    fileName:
      getFileNameFromDisposition(String(response.headers["content-disposition"] ?? "")) ??
      `${documentType}.bin`,
  };
};

export const updatePrijavaRequest = async (
  token: string,
  brojPrijave: number,
  skolskaGodina: string,
  payload: PrijavaPayload,
): Promise<ApiSuccess<{ updated: true }>> => {
  const response = await httpClient.put<ApiSuccess<{ updated: true }>>(
    buildPrijavaPath(brojPrijave, skolskaGodina),
    payload,
    {
      headers: authHeaders(token),
    },
  );

  return response.data;
};

export const updatePrijavaStatusRequest = async (
  token: string,
  brojPrijave: number,
  skolskaGodina: string,
  statusPrijave: "Podneta" | "Odobrena" | "Odbijena",
): Promise<ApiSuccess<{ updated: true }>> => {
  const response = await httpClient.put<ApiSuccess<{ updated: true }>>(
    `${buildPrijavaPath(brojPrijave, skolskaGodina)}/status`,
    { statusPrijave },
    {
      headers: authHeaders(token),
    },
  );

  return response.data;
};

export const deletePrijavaRequest = async (
  token: string,
  brojPrijave: number,
  skolskaGodina: string,
): Promise<ApiSuccess<{ deleted: true }>> => {
  const response = await httpClient.delete<ApiSuccess<{ deleted: true }>>(
    buildPrijavaPath(brojPrijave, skolskaGodina),
    {
      headers: authHeaders(token),
    },
  );

  return response.data;
};
