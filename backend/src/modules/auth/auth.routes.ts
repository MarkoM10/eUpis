import { Router } from "express";
import { authMiddleware } from "../../middleware/authMiddleware";
import { loginHandler, registerHandler, sessionHandler } from "./auth.controller";

const authRouter = Router();

authRouter.post("/login", loginHandler);
authRouter.post("/register", registerHandler);
authRouter.get("/me", authMiddleware, sessionHandler);

export { authRouter };
