import { executeSql } from "../../db/oracle/execute";
import type { AuditLogRecord } from "../../types/modules/audit";

type AuditLogRow = {
  ID_AUDIT: number;
  EVENT_TIME: string | null;
  TABLE_NAME: string;
  OPERATION: string;
  ENTITY_KEY: string | null;
  DETAILS: string | null;
  DB_USER: string | null;
};

const mapAuditLogRow = (row: AuditLogRow): AuditLogRecord => ({
  idAudit: row.ID_AUDIT,
  eventTime: row.EVENT_TIME,
  tableName: row.TABLE_NAME,
  operation: row.OPERATION,
  entityKey: row.ENTITY_KEY,
  details: row.DETAILS,
  dbUser: row.DB_USER,
});

export const listAuditLogs = async (limit = 200): Promise<AuditLogRecord[]> => {
  const resolvedLimit = Number.isFinite(limit)
    ? Math.min(Math.max(Math.trunc(limit), 1), 500)
    : 200;

  const result = await executeSql<AuditLogRow>(`
    SELECT
      a.id_audit,
      TO_CHAR(a.event_time, 'YYYY-MM-DD"T"HH24:MI:SS') AS event_time,
      a.table_name,
      a.operation,
      a.entity_key,
      DBMS_LOB.SUBSTR(a.details, 4000, 1) AS details,
      a.db_user
    FROM Audit_Log a
    ORDER BY a.event_time DESC, a.id_audit DESC
    FETCH FIRST ${resolvedLimit} ROWS ONLY
  `);

  return (result.rows ?? []).map(mapAuditLogRow);
};
