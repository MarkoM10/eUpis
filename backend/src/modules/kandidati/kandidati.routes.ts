import { Router } from "express";
import { authMiddleware } from "../../middleware/authMiddleware";
import { requireRole } from "../../middleware/requireRole";
import {
  createKandidatHandler,
  deleteKandidatHandler,
  getKandidatHandler,
  listKandidatiHandler,
  updateKandidatHandler,
} from "./kandidati.controller";

const kandidatiRouter = Router();

kandidatiRouter.use(authMiddleware);
kandidatiRouter.use(requireRole("admin"));

kandidatiRouter.get("/", listKandidatiHandler);
kandidatiRouter.get("/:jmbg", getKandidatHandler);
kandidatiRouter.post("/", createKandidatHandler);
kandidatiRouter.put("/:jmbg", updateKandidatHandler);
kandidatiRouter.delete("/:jmbg", deleteKandidatHandler);

export { kandidatiRouter };
