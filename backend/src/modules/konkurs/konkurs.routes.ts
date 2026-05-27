import { Router } from "express";
import { authMiddleware } from "../../middleware/authMiddleware";
import { requireRole } from "../../middleware/requireRole";
import {
  confirmKonkursEnrollmentFinalizationHandler,
  createKonkursHandler,
  generateKonkursFinalRankingHandler,
  listKonkursEligiblePrijaveHandler,
  listKonkursPendingFinalizationsHandler,
  listKonkursRankingItemsHandler,
  listKonkursRankingListsHandler,
  listActiveKonkursiHandler,
  listKonkursiHandler,
  saveKonkursExamScoreHandler,
  updateKonkursStatusHandler,
} from "./konkurs.controller";

const konkursRouter = Router();

konkursRouter.use(authMiddleware);

konkursRouter.get("/aktivni", requireRole("admin", "student"), listActiveKonkursiHandler);
konkursRouter.get("/", requireRole("admin"), listKonkursiHandler);
konkursRouter.get("/:idKonkursa/prijave", requireRole("admin"), listKonkursEligiblePrijaveHandler);
konkursRouter.get("/:idKonkursa/rang-liste", requireRole("admin"), listKonkursRankingListsHandler);
konkursRouter.get(
  "/:idKonkursa/rang-liste/stavke",
  requireRole("admin"),
  listKonkursRankingItemsHandler,
);
konkursRouter.post(
  "/:idKonkursa/rang-liste/generate-final",
  requireRole("admin"),
  generateKonkursFinalRankingHandler,
);
konkursRouter.get(
  "/:idKonkursa/finalizacija/pending",
  requireRole("admin"),
  listKonkursPendingFinalizationsHandler,
);
konkursRouter.post("/:idKonkursa/rezultati", requireRole("admin"), saveKonkursExamScoreHandler);
konkursRouter.post(
  "/:idKonkursa/finalizacija/:brojPrijave/:skolskaGodina/potvrdi",
  requireRole("admin"),
  confirmKonkursEnrollmentFinalizationHandler,
);
konkursRouter.post("/", requireRole("admin"), createKonkursHandler);
konkursRouter.put("/:idKonkursa/status", requireRole("admin"), updateKonkursStatusHandler);

export { konkursRouter };
