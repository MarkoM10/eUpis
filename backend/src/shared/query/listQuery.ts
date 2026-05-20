import { ApiError } from "../apiError";

export interface PaginationParams {
  page: number;
  pageSize: number;
  offset: number;
}

export type SortDirection = "asc" | "desc";

export interface SortParams {
  sortBy: string;
  sortDirection: SortDirection;
}

export interface ParsedListQuery {
  pagination: PaginationParams;
  sort?: SortParams;
  search?: string;
  filters: Record<string, string>;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const parsePositiveInt = (value: unknown, fallback: number): number => {
  if (typeof value !== "string") {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

export const parsePagination = (query: Record<string, unknown>): PaginationParams => {
  const page = parsePositiveInt(query.page, DEFAULT_PAGE);
  const pageSizeRaw = parsePositiveInt(query.pageSize, DEFAULT_PAGE_SIZE);
  const pageSize = Math.min(pageSizeRaw, MAX_PAGE_SIZE);
  const offset = (page - 1) * pageSize;

  return { page, pageSize, offset };
};

export const parseSort = (
  query: Record<string, unknown>,
  allowedColumns: readonly string[],
): SortParams | undefined => {
  if (allowedColumns.length === 0) {
    return undefined;
  }

  const rawSortBy = typeof query.sortBy === "string" ? query.sortBy.trim() : "";
  if (!rawSortBy) {
    return undefined;
  }

  if (!allowedColumns.includes(rawSortBy)) {
    throw new ApiError(
      400,
      "Neispravan parametar",
      `sortBy nije dozvoljen. Dozvoljene vrednosti: ${allowedColumns.join(", ")}.`,
    );
  }

  const rawDirection =
    typeof query.sortDirection === "string" ? query.sortDirection.toLowerCase() : "asc";
  const sortDirection: SortDirection = rawDirection === "desc" ? "desc" : "asc";

  return {
    sortBy: rawSortBy,
    sortDirection,
  };
};

export const parseSearch = (query: Record<string, unknown>): string | undefined => {
  const value = typeof query.search === "string" ? query.search.trim() : "";
  return value || undefined;
};

export const parseFilters = (
  query: Record<string, unknown>,
  allowedFilters: readonly string[],
): Record<string, string> => {
  const filters: Record<string, string> = {};

  for (const filterKey of allowedFilters) {
    const value = query[filterKey];
    if (typeof value === "string" && value.trim()) {
      filters[filterKey] = value.trim();
    }
  }

  return filters;
};

export const parseListQuery = (
  query: Record<string, unknown>,
  options: {
    allowedSortColumns: readonly string[];
    allowedFilters?: readonly string[];
  },
): ParsedListQuery => {
  return {
    pagination: parsePagination(query),
    sort: parseSort(query, options.allowedSortColumns),
    search: parseSearch(query),
    filters: parseFilters(query, options.allowedFilters ?? []),
  };
};
