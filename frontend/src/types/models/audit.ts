export interface AuditLogRow {
  idAudit: number;
  eventTime: string | null;
  tableName: string;
  operation: string;
  entityKey: string | null;
  details: string | null;
  dbUser: string | null;
}
