import type { ApiSuccess } from "../types/api/common";
import type {
  DownloadedEnrollmentContract,
  EnrollmentFinalizationSummary,
  EligiblePrijavaRow,
  PendingEnrollmentFinalizationRow,
  RankingItem,
  RankingListSummary,
  StudentAdmissionStatus,
  StudyProgramOption,
} from "../types/models/upis";
import { httpClient } from "./httpClient";

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

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

export const uploadSignedEnrollmentContractRequest = async (
  token: string,
  file: File,
): Promise<
  ApiSuccess<{ idUpisa: number; statusUpisa: string; signedContractUploadedAt: string | null }>
> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await httpClient.post<
    ApiSuccess<{ idUpisa: number; statusUpisa: string; signedContractUploadedAt: string | null }>
  >("/upis/finalizacija/ugovor", formData, {
    headers: {
      ...authHeaders(token),
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const downloadStudentEnrollmentContractRequest = async (
  token: string,
): Promise<DownloadedEnrollmentContract> => {
  const response = await httpClient.get<Blob>("/upis/finalizacija/ugovor/download", {
    headers: authHeaders(token),
    responseType: "blob",
  });

  return {
    blob: response.data,
    mimeType: String(response.headers["content-type"] ?? "application/octet-stream"),
    fileName:
      getFileNameFromDisposition(String(response.headers["content-disposition"] ?? "")) ??
      "ugovor.bin",
  };
};

export const listPendingEnrollmentFinalizationsRequest = async (
  token: string,
  skolskaGodina?: string,
): Promise<ApiSuccess<{ rows: PendingEnrollmentFinalizationRow[] }>> => {
  const response = await httpClient.get<ApiSuccess<{ rows: PendingEnrollmentFinalizationRow[] }>>(
    "/upis/finalizacija/pending",
    {
      headers: authHeaders(token),
      params: {
        skolskaGodina: skolskaGodina || undefined,
      },
    },
  );

  return response.data;
};

export const getEnrollmentFinalizationSummaryRequest = async (
  token: string,
  skolskaGodina?: string,
): Promise<ApiSuccess<EnrollmentFinalizationSummary>> => {
  const response = await httpClient.get<ApiSuccess<EnrollmentFinalizationSummary>>(
    "/upis/finalizacija/summary",
    {
      headers: authHeaders(token),
      params: {
        skolskaGodina: skolskaGodina || undefined,
      },
    },
  );

  return response.data;
};

export const downloadEnrollmentContractByPrijavaRequest = async (
  token: string,
  brojPrijave: number,
  skolskaGodina: string,
): Promise<DownloadedEnrollmentContract> => {
  const response = await httpClient.get<Blob>(
    `/upis/finalizacija/${brojPrijave}/${encodeURIComponent(skolskaGodina)}/ugovor/download`,
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
      "ugovor.bin",
  };
};

export const confirmEnrollmentFinalizationRequest = async (
  token: string,
  brojPrijave: number,
  skolskaGodina: string,
): Promise<ApiSuccess<{ brojIndeksa: string | null; datumUpisa: string | null }>> => {
  const response = await httpClient.post<
    ApiSuccess<{ brojIndeksa: string | null; datumUpisa: string | null }>
  >(`/upis/finalizacija/${brojPrijave}/${encodeURIComponent(skolskaGodina)}/potvrdi`, undefined, {
    headers: authHeaders(token),
  });

  return response.data;
};
