import type { ParsedListQuery } from "./listQuery";

export interface BuildListSqlResult {
  sqlSuffix: string;
  binds: Record<string, string | number>;
}

export const buildListSql = (
  parsedQuery: ParsedListQuery,
  options: {
    searchableColumn?: string;
    filterColumnMap?: Record<string, string>;
    defaultSortBy?: string;
  } = {},
): BuildListSqlResult => {
  const whereClauses: string[] = [];
  const binds: Record<string, string | number> = {
    offset: parsedQuery.pagination.offset,
    pageSize: parsedQuery.pagination.pageSize,
  };

  if (parsedQuery.search && options.searchableColumn) {
    whereClauses.push(`LOWER(${options.searchableColumn}) LIKE LOWER(:search)`);
    binds.search = `%${parsedQuery.search}%`;
  }

  const filterMap = options.filterColumnMap ?? {};

  for (const [filterKey, filterValue] of Object.entries(parsedQuery.filters)) {
    const column = filterMap[filterKey];
    if (!column) {
      continue;
    }

    const bindKey = `filter_${filterKey}`;
    whereClauses.push(`${column} = :${bindKey}`);
    binds[bindKey] = filterValue;
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const sortBy = parsedQuery.sort?.sortBy ?? options.defaultSortBy;
  const sortDirection = parsedQuery.sort?.sortDirection ?? "asc";
  const orderSql = sortBy ? `ORDER BY ${sortBy} ${sortDirection.toUpperCase()}` : "";

  return {
    sqlSuffix: `${whereSql} ${orderSql} OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`.trim(),
    binds,
  };
};
