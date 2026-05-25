import { Router } from "express";
import { authMiddleware } from "../../middleware/authMiddleware";
import { requireRole } from "../../middleware/requireRole";
import {
  confirmEnrollmentFinalizationHandler,
  downloadEnrollmentContractByPrijavaHandler,
  downloadStudentSignedEnrollmentContractHandler,
  enrollmentContractUploadMiddleware,
  generateFinalRankingHandler,
  getEnrollmentFinalizationSummaryHandler,
  getStudentAdmissionStatusHandler,
  listPendingEnrollmentFinalizationsHandler,
  listEligiblePrijaveHandler,
  listRankingItemsHandler,
  listRankingListsHandler,
  listStudyProgramsHandler,
  saveExamScoreHandler,
  updateRankingItemStudyProgramHandler,
  updateRankingListStudyProgramHandler,
  uploadSignedEnrollmentContractHandler,
} from "./upis.controller";

const upisRouter = Router();

upisRouter.use(authMiddleware);

upisRouter.get("/programi", requireRole("admin", "student"), listStudyProgramsHandler);
upisRouter.get("/eligible-prijave", requireRole("admin"), listEligiblePrijaveHandler);
upisRouter.post("/rezultati", requireRole("admin"), saveExamScoreHandler);
upisRouter.post("/rang-liste/generate-final", requireRole("admin"), generateFinalRankingHandler);
upisRouter.get("/rang-liste", requireRole("admin", "student"), listRankingListsHandler);
upisRouter.put(
  "/rang-liste/:idRangListe/studijski-program",
  requireRole("admin"),
  updateRankingListStudyProgramHandler,
);
upisRouter.get(
  "/rang-liste/:idRangListe/stavke",
  requireRole("admin", "student"),
  listRankingItemsHandler,
);
upisRouter.put(
  "/rang-liste/stavke/:idStavke/studijski-program",
  requireRole("admin"),
  updateRankingItemStudyProgramHandler,
);
upisRouter.get("/student-status", requireRole("student"), getStudentAdmissionStatusHandler);
upisRouter.post(
  "/finalizacija/ugovor",
  requireRole("student"),
  enrollmentContractUploadMiddleware,
  uploadSignedEnrollmentContractHandler,
);
upisRouter.get(
  "/finalizacija/ugovor/download",
  requireRole("student"),
  downloadStudentSignedEnrollmentContractHandler,
);
upisRouter.get(
  "/finalizacija/pending",
  requireRole("admin"),
  listPendingEnrollmentFinalizationsHandler,
);
upisRouter.get(
  "/finalizacija/summary",
  requireRole("admin"),
  getEnrollmentFinalizationSummaryHandler,
);
upisRouter.get(
  "/finalizacija/:brojPrijave/:skolskaGodina/ugovor/download",
  requireRole("admin"),
  downloadEnrollmentContractByPrijavaHandler,
);
upisRouter.post(
  "/finalizacija/:brojPrijave/:skolskaGodina/potvrdi",
  requireRole("admin"),
  confirmEnrollmentFinalizationHandler,
);

export { upisRouter };
