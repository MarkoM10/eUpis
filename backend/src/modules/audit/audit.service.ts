import type { AuditLogRecord } from "../../types/modules/audit";
import { listAuditLogs } from "./audit.repository";

export const listAuditLogsService = async (limit?: number): Promise<AuditLogRecord[]> => {
  return listAuditLogs(limit ?? 200);
};
