import { Router } from "express";
import { authMiddleware } from "../../middleware/authMiddleware";
import { requireRole } from "../../middleware/requireRole";
import {
  downloadPrijavaDocumentHandler,
  getPrijavaDocumentsHandler,
  prijavaDocumentUploadMiddleware,
  uploadPrijavaDocumentHandler,
} from "./prijavaDocuments.controller";
import {
  createPrijavaHandler,
  deletePrijavaHandler,
  getPrijavaHandler,
  listPrijaveHandler,
  updatePrijavaStatusHandler,
  updatePrijavaHandler,
  addStudentKandidatHandler,
} from "./prijave.controller";

const prijaveRouter = Router();

prijaveRouter.use(authMiddleware);

prijaveRouter.get("/", requireRole("admin"), listPrijaveHandler);
prijaveRouter.get(
  "/:brojPrijave/:skolskaGodina/documents",
  requireRole("admin", "student"),
  getPrijavaDocumentsHandler,
);
prijaveRouter.get(
  "/:brojPrijave/:skolskaGodina/documents/:documentType/download",
  requireRole("admin", "student"),
  downloadPrijavaDocumentHandler,
);
prijaveRouter.post(
  "/:brojPrijave/:skolskaGodina/documents/:documentType",
  requireRole("admin", "student"),
  prijavaDocumentUploadMiddleware,
  uploadPrijavaDocumentHandler,
);
prijaveRouter.get("/:brojPrijave/:skolskaGodina", requireRole("admin"), getPrijavaHandler);
prijaveRouter.post("/student/kandidat", requireRole("student"), addStudentKandidatHandler);
prijaveRouter.post("/", requireRole("admin", "student"), createPrijavaHandler);
prijaveRouter.put("/:brojPrijave/:skolskaGodina", requireRole("admin"), updatePrijavaHandler);
prijaveRouter.put(
  "/:brojPrijave/:skolskaGodina/status",
  requireRole("admin"),
  updatePrijavaStatusHandler,
);
prijaveRouter.delete("/:brojPrijave/:skolskaGodina", requireRole("admin"), deletePrijavaHandler);

export { prijaveRouter };
