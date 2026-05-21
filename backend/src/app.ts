import cors from "cors";
import express from "express";
import { authRouter } from "./modules/auth/auth.routes";
import { authMiddleware } from "./middleware/authMiddleware";
import { requestLogger } from "./middleware/requestLogger";
import { errorMiddleware } from "./middleware/errorMiddleware";
import { ok } from "./shared/httpResponse";
import { executeSql } from "./db/oracle/execute";
import { parseListQuery } from "./shared/query";
import { kandidatiRouter } from "./modules/kandidati/kandidati.routes";
import { prijaveRouter } from "./modules/prijave/prijave.routes";
import { upisRouter } from "./modules/upis/upis.routes";

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

app.get("/api/meta/list-options", authMiddleware, (req, res) => {
  const parsed = parseListQuery(req.query as Record<string, unknown>, {
    allowedSortColumns: ["ime_prezime", "naziv_programa", "jmbg"],
    allowedFilters: ["tip_kandidata", "fakultet_id"],
  });

  res.json(ok("List query parametri su uspesno parsirani.", parsed));
});

app.get("/api/meta/fakulteti", authMiddleware, async (_req, res, next) => {
  try {
    const result = await executeSql<{ ID_FAKULTETA: number; NAZIV_FAKULTETA: string }>(
      `
        SELECT f.id_fakulteta, f.naziv_fakulteta
        FROM Fakultet f
        ORDER BY f.naziv_fakulteta
      `,
    );

    const rows = (result.rows ?? []).map((row) => ({
      idFakulteta: row.ID_FAKULTETA,
      nazivFakulteta: row.NAZIV_FAKULTETA,
    }));

    res.json(ok("Fakulteti su uspesno ucitani.", { rows }));
  } catch (error) {
    next(error);
  }
});

app.use("/api/auth", authRouter);
app.use("/api/kandidati", kandidatiRouter);
app.use("/api/prijave", prijaveRouter);
app.use("/api/upis", upisRouter);

app.use(errorMiddleware);

export { app };
