import { Router } from "express";
import { authMiddleware } from "../../middleware/authMiddleware";
import { requireRole } from "../../middleware/requireRole";
import {
  finalizeRankingHandler,
  generateFinalRankingHandler,
  getStudentAdmissionStatusHandler,
  listEligiblePrijaveHandler,
  listRankingItemsHandler,
  listRankingListsHandler,
  listStudyProgramsHandler,
  saveExamScoreHandler,
} from "./upis.controller";

const upisRouter = Router();

upisRouter.use(authMiddleware);

upisRouter.get("/programi", requireRole("admin", "student"), listStudyProgramsHandler);
upisRouter.get("/eligible-prijave", requireRole("admin"), listEligiblePrijaveHandler);
upisRouter.post("/rezultati", requireRole("admin"), saveExamScoreHandler);
upisRouter.post("/rang-liste/generate-final", requireRole("admin"), generateFinalRankingHandler);
upisRouter.post("/rang-liste/finalize", requireRole("admin"), finalizeRankingHandler);
upisRouter.get("/rang-liste", requireRole("admin", "student"), listRankingListsHandler);
upisRouter.get(
  "/rang-liste/:idRangListe/stavke",
  requireRole("admin", "student"),
  listRankingItemsHandler,
);
upisRouter.get("/student-status", requireRole("student"), getStudentAdmissionStatusHandler);

export { upisRouter };
