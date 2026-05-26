import { Router } from "express";
import { authMiddleware } from "../../middleware/authMiddleware";
import { requireRole } from "../../middleware/requireRole";
import {
  createKonkursHandler,
  listActiveKonkursiHandler,
  listKonkursiHandler,
  updateKonkursStatusHandler,
} from "./konkurs.controller";

const konkursRouter = Router();

konkursRouter.use(authMiddleware);

konkursRouter.get("/aktivni", requireRole("admin", "student"), listActiveKonkursiHandler);
konkursRouter.get("/", requireRole("admin"), listKonkursiHandler);
konkursRouter.post("/", requireRole("admin"), createKonkursHandler);
konkursRouter.put("/:idKonkursa/status", requireRole("admin"), updateKonkursStatusHandler);

export { konkursRouter };
