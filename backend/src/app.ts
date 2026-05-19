import cors from "cors";
import express from "express";
import { authRouter } from "./modules/auth/auth.routes";
import { authMiddleware } from "./middleware/authMiddleware";
import { requestLogger } from "./middleware/requestLogger";
import { errorMiddleware } from "./middleware/errorMiddleware";
import { ok } from "./shared/httpResponse";
import { executeSql } from "./db/oracle/execute";

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.get("/api/health", (_req, res) => {
  res.json(ok("Backend radi.", { status: "ok" }));
});

app.get("/api/db/ping", authMiddleware, async (_req, res, next) => {
  try {
    const result = await executeSql<{ VALUE: number }>("SELECT 1 AS VALUE FROM dual");
    res.json(ok("Oracle konekcija uspesna.", { rows: result.rows ?? [] }));
  } catch (error) {
    next(error);
  }
});

app.use("/api/auth", authRouter);

app.use(errorMiddleware);

export { app };
