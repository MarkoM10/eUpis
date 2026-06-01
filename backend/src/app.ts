import cors from "cors";
import express from "express";
import { authRouter } from "./modules/auth/auth.routes";
import { authMiddleware } from "./middleware/authMiddleware";
import { requestLogger } from "./middleware/requestLogger";
import { errorMiddleware } from "./middleware/errorMiddleware";
import { ok } from "./shared/httpResponse";
import { checkDatabaseConnection, listFakulteti } from "./db/system.repository";
import { kandidatiRouter } from "./modules/kandidati/kandidati.routes";
import { prijaveRouter } from "./modules/prijave/prijave.routes";
import { upisRouter } from "./modules/upis/upis.routes";
import { konkursRouter } from "./modules/konkurs/konkurs.routes";
import { rankingListsRouter } from "./modules/rankingLists/rankingLists.routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.get("/api/health", (_req, res) => {
  res.json(ok("Backend radi.", { status: "ok" }));
});

app.get("/api/db/ping", authMiddleware, async (_req, res, next) => {
  try {
    const result = await checkDatabaseConnection();
    res.json(ok("Oracle konekcija uspesna.", result));
  } catch (error) {
    next(error);
  }
});

app.get("/api/meta/list-options", authMiddleware, (req, res) => {
  const query = req.query as Record<string, unknown>;

  const pageRaw = typeof query.page === "string" ? Number(query.page) : 1;
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const pageSizeRaw = typeof query.pageSize === "string" ? Number(query.pageSize) : 20;
  const pageSize =
    Number.isInteger(pageSizeRaw) && pageSizeRaw > 0 ? Math.min(pageSizeRaw, 100) : 20;

  const offset = (page - 1) * pageSize;

  const allowedSortColumns = ["ime_prezime", "naziv_programa", "jmbg"];
  const sortByInput = typeof query.sortBy === "string" ? query.sortBy.trim() : "";
  const sortBy = sortByInput && allowedSortColumns.includes(sortByInput) ? sortByInput : undefined;
  const sortDirectionInput =
    typeof query.sortDirection === "string" ? query.sortDirection.toLowerCase() : "asc";
  const sortDirection = sortDirectionInput === "desc" ? "desc" : "asc";

  const search =
    typeof query.search === "string" && query.search.trim() ? query.search.trim() : undefined;

  const filters: Record<string, string> = {};
  if (typeof query.tip_kandidata === "string" && query.tip_kandidata.trim()) {
    filters.tip_kandidata = query.tip_kandidata.trim();
  }
  if (typeof query.fakultet_id === "string" && query.fakultet_id.trim()) {
    filters.fakultet_id = query.fakultet_id.trim();
  }

  const parsed = {
    pagination: { page, pageSize, offset },
    sort: sortBy ? { sortBy, sortDirection } : undefined,
    search,
    filters,
  };

  res.json(ok("List query parametri su uspesno parsirani.", parsed));
});

app.get("/api/meta/fakulteti", authMiddleware, async (_req, res, next) => {
  try {
    const rows = await listFakulteti();
    res.json(ok("Fakulteti su uspesno ucitani.", { rows }));
  } catch (error) {
    next(error);
  }
});

app.use("/api/auth", authRouter);
app.use("/api/kandidati", kandidatiRouter);
app.use("/api/prijave", prijaveRouter);
app.use("/api/upis", upisRouter);
app.use("/api/konkursi", konkursRouter);
app.use("/api/ranking-lists", rankingListsRouter);

app.use(errorMiddleware);

export { app };
