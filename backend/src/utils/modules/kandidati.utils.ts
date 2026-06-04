import type { Request } from "express";
import { ApiError } from "../../shared/apiError";
import type { KandidatRecord } from "../../types/modules/kandidati";
import type { KandidatRow } from "../../types/modules/kandidatiRepository";

export type ParsedKandidatiListQuery = {
  page: number;
  pageSize: number;
  offset: number;
  search: string | null;
  tipKandidata: string | null;
  sortBy: string;
  sortDirection: "asc" | "desc";
};

export const parseKandidatiListQuery = (
  query: Record<string, unknown>,
): ParsedKandidatiListQuery => {
  const pageRaw = typeof query.page === "string" ? Number(query.page) : 1;
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const pageSizeRaw = typeof query.pageSize === "string" ? Number(query.pageSize) : 20;
  const pageSize =
    Number.isInteger(pageSizeRaw) && pageSizeRaw > 0 ? Math.min(pageSizeRaw, 100) : 20;
  const offset = (page - 1) * pageSize;

  const search =
    typeof query.search === "string" && query.search.trim() ? `%${query.search.trim()}%` : null;
  const tipKandidata =
    typeof query.tip_kandidata === "string" && query.tip_kandidata.trim()
      ? query.tip_kandidata.trim()
      : null;

  const sortByInput = typeof query.sortBy === "string" ? query.sortBy.trim() : "";
  const sortDirectionInput =
    typeof query.sortDirection === "string" ? query.sortDirection.trim().toLowerCase() : "asc";

  const allowedSortColumns = ["jmbg", "ime_prezime", "tip_kandidata"];
  if (sortByInput && !allowedSortColumns.includes(sortByInput)) {
    throw new ApiError(
      400,
      "Neispravan parametar",
      `sortBy nije dozvoljen. Dozvoljene vrednosti: ${allowedSortColumns.join(", ")}.`,
    );
  }

  const sortBy = sortByInput || "ime_prezime";
  const sortDirection = sortDirectionInput === "desc" ? "desc" : "asc";

  return {
    page,
    pageSize,
    offset,
    search,
    tipKandidata,
    sortBy,
    sortDirection,
  };
};

export const getJmbgParam = (req: Request): string => {
  const value = req.params.jmbg;
  return Array.isArray(value) ? value[0] : value;
};

export const mapKandidatRow = (row: KandidatRow): KandidatRecord => ({
  jmbg: row.JMBG,
  imePrezime: row.IME_PREZIME,
  tipKandidata: row.TIP_KANDIDATA,
  serijskiBroj: row.SERIJSKI_BROJ,
  emailVrednost: row.EMAIL_VREDNOST,
  adresaUlica: row.ADRESA_ULICA,
  adresaBroj: row.ADRESA_BROJ,
  adresaGrad: row.ADRESA_GRAD,
});
