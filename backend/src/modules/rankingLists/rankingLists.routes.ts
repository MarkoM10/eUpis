import { Router } from "express";
import { authMiddleware } from "../../middleware/authMiddleware";
import { requireRole } from "../../middleware/requireRole";
import {
  listRankingListsHandler,
  getRankingListHandler,
  listRankingItemsHandler,
  updateRankingListStudyProgramHandler,
} from "./rankingLists.controller";

const rankingListsRouter = Router();

rankingListsRouter.use(authMiddleware);
rankingListsRouter.use(requireRole("admin"));

rankingListsRouter.get("/", listRankingListsHandler);
rankingListsRouter.get("/:idRangListe", getRankingListHandler);
rankingListsRouter.get("/:idRangListe/items", listRankingItemsHandler);
rankingListsRouter.put("/:idRangListe/study-program", updateRankingListStudyProgramHandler);

export { rankingListsRouter };
