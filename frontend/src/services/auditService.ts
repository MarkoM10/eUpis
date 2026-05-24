import axios from "axios";
import type { ApiSuccess } from "../types/api/common";
import type { AuditLogRow } from "../types/models/audit";
import { buildApiUrl } from "./api";

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const listAuditLogsRequest = async (
  token: string,
  limit = 200,
): Promise<ApiSuccess<{ rows: AuditLogRow[] }>> => {
  const response = await axios.get<ApiSuccess<{ rows: AuditLogRow[] }>>(buildApiUrl("/audit"), {
    headers: authHeaders(token),
    params: {
      limit,
    },
  });

  return response.data;
};
