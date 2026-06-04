import type { Request } from "express";
import { ApiError } from "../../shared/apiError";
import type { PrijavaKey, PrijavaRecord } from "../../types/modules/prijave";
import type { PrijavaRow } from "../../types/modules/prijaveRepository";

export type ParsedPrijaveListQuery = {
  page: number;
  pageSize: number;
  offset: number;
  search: string | null;
  statusPrijave: string | null;
  skolskaGodina: string | null;
  konkursniRok: string | null;
  partition: string | null;
  sortBy: string;
  sortDirection: "asc" | "desc";
};

export const parsePrijaveListQuery = (query: Record<string, unknown>): ParsedPrijaveListQuery => {
  const pageRaw = typeof query.page === "string" ? Number(query.page) : 1;
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const pageSizeRaw = typeof query.pageSize === "string" ? Number(query.pageSize) : 20;
  const pageSize =
    Number.isInteger(pageSizeRaw) && pageSizeRaw > 0 ? Math.min(pageSizeRaw, 100) : 20;
  const offset = (page - 1) * pageSize;

  const search =
    typeof query.search === "string" && query.search.trim() ? `%${query.search.trim()}%` : null;
  const statusPrijave =
    typeof query.status_prijave === "string" && query.status_prijave.trim()
      ? query.status_prijave.trim()
      : null;
  const skolskaGodina =
    typeof query.skolska_godina === "string" && query.skolska_godina.trim()
      ? query.skolska_godina.trim()
      : null;
  const konkursniRok =
    typeof query.konkursni_rok === "string" && query.konkursni_rok.trim()
      ? query.konkursni_rok.trim()
      : null;
  const partition =
    typeof query.partition === "string" && query.partition.trim() ? query.partition.trim() : null;

  const sortByInput = typeof query.sortBy === "string" ? query.sortBy.trim() : "";
  const sortDirectionInput =
    typeof query.sortDirection === "string" ? query.sortDirection.trim().toLowerCase() : "asc";
  const allowedSortColumns = [
    "broj_prijave",
    "datum_prijave",
    "skolska_godina",
    "status_prijave",
    "ime_prezime",
  ];

  if (sortByInput && !allowedSortColumns.includes(sortByInput)) {
    throw new ApiError(
      400,
      "Neispravan parametar",
      `sortBy nije dozvoljen. Dozvoljene vrednosti: ${allowedSortColumns.join(", ")}.`,
    );
  }

  const sortBy = sortByInput || "broj_prijave";
  const sortDirection = sortDirectionInput === "desc" ? "desc" : "asc";

  return {
    page,
    pageSize,
    offset,
    search,
    statusPrijave,
    skolskaGodina,
    konkursniRok,
    partition,
    sortBy,
    sortDirection,
  };
};

export const toDateOnlyString = (value: Date | null): string | null => {
  if (!value) {
    return null;
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const mapPrijavaRow = (row: PrijavaRow): PrijavaRecord => ({
  brojPrijave: row.BROJ_PRIJAVE,
  datumPrijave: toDateOnlyString(row.DATUM_PRIJAVE),
  skolskaGodina: row.SKOLSKA_GODINA,
  idKonkursa: row.ID_KONKURSA,
  idKorisnika: row.ID_KORISNIKA,
  idPrograma: row.ID_PROGRAMA,
  statusPrijave: row.STATUS_PRIJAVE,
  konkursniRok: row.KONKURSNI_ROK,
  jmbg: row.JMBG,
  imePrezime: row.IME_PREZIME,
  sistemskiUpdate: row.SISTEMSKI_UPDATE,
});

export const getPrijavaKeyFromRequest = (req: Request): PrijavaKey => {
  const brojPrijaveRaw = Array.isArray(req.params.brojPrijave)
    ? req.params.brojPrijave[0]
    : req.params.brojPrijave;
  const skolskaGodinaRaw = Array.isArray(req.params.skolskaGodina)
    ? req.params.skolskaGodina[0]
    : req.params.skolskaGodina;

  return {
    brojPrijave: Number(brojPrijaveRaw),
    skolskaGodina: skolskaGodinaRaw,
  };
};
