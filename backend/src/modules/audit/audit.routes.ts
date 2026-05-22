import { Router } from "express";
import { authMiddleware } from "../../middleware/authMiddleware";
import { requireRole } from "../../middleware/requireRole";
import { listAuditLogsHandler } from "./audit.controller";

const auditRouter = Router();

auditRouter.use(authMiddleware);
auditRouter.use(requireRole("admin"));

auditRouter.get("/", listAuditLogsHandler);

export { auditRouter };
