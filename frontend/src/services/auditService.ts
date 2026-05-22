import type { ApiSuccess } from "../types/api/common";
import type { AuditLogRow } from "../types/models/audit";
import { httpClient } from "./httpClient";

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const listAuditLogsRequest = async (
  token: string,
  limit = 200,
): Promise<ApiSuccess<{ rows: AuditLogRow[] }>> => {
  const response = await httpClient.get<ApiSuccess<{ rows: AuditLogRow[] }>>("/audit", {
    headers: authHeaders(token),
    params: {
      limit,
    },
  });

  return response.data;
};
