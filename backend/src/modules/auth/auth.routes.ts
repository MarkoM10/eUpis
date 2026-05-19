import { Router } from "express";
import { loginHandler } from "./auth.controller";

const authRouter = Router();

authRouter.post("/login", loginHandler);

export { authRouter };
