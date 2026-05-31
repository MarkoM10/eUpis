import axios from "axios";
import type { ApiSuccess } from "../types/api/common";
import type { DownloadedEnrollmentContract, StudentAdmissionStatus } from "../types/models/upis";
import { buildApiUrl } from "./api";

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

const getFileNameFromDisposition = (contentDisposition?: string): string | null => {
  if (!contentDisposition) {
    return null;
  }

  const utfMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    try {
      return decodeURIComponent(utfMatch[1]);
    } catch {
      return utfMatch[1];
    }
  }

  const plainMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1] ?? null;
};

const extensionFromMimeType = (mimeType: string): string => {
  const normalized = mimeType.toLowerCase();

  if (normalized.includes("image/jpeg") || normalized.includes("image/jpg")) {
    return ".jpg";
  }
  if (normalized.includes("image/png")) {
    return ".png";
  }
  if (normalized.includes("image/webp")) {
    return ".webp";
  }
  if (normalized.includes("image/gif")) {
    return ".gif";
  }
  if (normalized.includes("image/bmp")) {
    return ".bmp";
  }
  if (normalized.includes("pdf")) {
    return ".pdf";
  }
  if (normalized.includes("wordprocessingml")) {
    return ".docx";
  }
  if (normalized.includes("msword")) {
    return ".doc";
  }
  if (normalized.includes("spreadsheetml")) {
    return ".xlsx";
  }
  if (normalized.includes("ms-excel")) {
    return ".xls";
  }
  if (normalized.includes("text/plain")) {
    return ".txt";
  }
  if (normalized.includes("zip")) {
    return ".zip";
  }

  return ".bin";
};

export const getStudentAdmissionStatusRequest = async (
  token: string,
): Promise<ApiSuccess<StudentAdmissionStatus>> => {
  const response = await axios.get<ApiSuccess<StudentAdmissionStatus>>(
    buildApiUrl("/upis/student-status"),
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
  ApiSuccess<{ statusUpisa: string; brojIndeksa: string | null; datumUpisa: string | null }>
> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post<
    ApiSuccess<{ statusUpisa: string; brojIndeksa: string | null; datumUpisa: string | null }>
  >(buildApiUrl("/upis/finalizacija/ugovor"), formData, {
    headers: {
      ...authHeaders(token),
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const downloadStudentSignedEnrollmentContractRequest = async (
  token: string,
): Promise<DownloadedEnrollmentContract> => {
  const response = await axios.get<Blob>(buildApiUrl("/upis/finalizacija/ugovor/download"), {
    headers: authHeaders(token),
    responseType: "blob",
  });

  return {
    blob: response.data,
    mimeType: String(response.headers["content-type"] ?? "application/octet-stream"),
    fileName: (() => {
      const mimeType = String(response.headers["content-type"] ?? "application/octet-stream");
      const parsedName = getFileNameFromDisposition(
        String(response.headers["content-disposition"] ?? ""),
      );

      if (parsedName && parsedName.trim().length > 0) {
        return parsedName;
      }

      return `potvrda-o-studiranju${extensionFromMimeType(mimeType)}`;
    })(),
  };
};
