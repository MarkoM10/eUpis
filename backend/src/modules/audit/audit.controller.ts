import { type NextFunction, type Request, type Response } from "express";
import { ok } from "../../shared/httpResponse";
import { listAuditLogsService } from "./audit.service";

export const listAuditLogsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const limitRaw = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
    const limit = typeof limitRaw === "string" ? Number(limitRaw) : undefined;

    const rows = await listAuditLogsService(Number.isFinite(limit) ? limit : undefined);
    res.json(ok("Audit log je uspesno ucitan.", { rows }));
  } catch (error) {
    next(error);
  }
};
