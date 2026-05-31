import type { ReactElement } from "react";

export interface FilterBarOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  sortValue: string;
  onSortChange: (value: string) => void;
  sortOptions: FilterBarOption[];
  statusValue?: string;
  onStatusChange?: (value: string) => void;
  statusOptions?: FilterBarOption[];
  extraFilterLabel?: string;
  extraFilterValue?: string;
  onExtraFilterChange?: (value: string) => void;
  extraFilterOptions?: FilterBarOption[];
  onApply?: () => void;
}

export function FilterBar({
  searchValue,
  onSearchChange,
  sortValue,
  onSortChange,
  sortOptions,
  statusValue,
  onStatusChange,
  statusOptions,
  extraFilterLabel,
  extraFilterValue,
  onExtraFilterChange,
  extraFilterOptions,
  onApply,
}: FilterBarProps): ReactElement {
  return (
    <section className="grid gap-4 rounded-2xl border border-slate-300 bg-white p-6 md:grid-cols-2 xl:grid-cols-4">
      <label className="text-sm font-medium text-slate-700">
        Pretraga
        <input
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Unesite pojam za pretragu"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onApply?.();
            }
          }}
        />
      </label>

      <label className="text-sm font-medium text-slate-700">
        Sortiranje
        <select
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={sortValue}
          onChange={(event) => onSortChange(event.target.value)}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {statusOptions && onStatusChange ? (
        <label className="text-sm font-medium text-slate-700">
          Status
          <select
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={statusValue}
            onChange={(event) => onStatusChange(event.target.value)}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {extraFilterOptions && onExtraFilterChange ? (
        <label className="text-sm font-medium text-slate-700">
          {extraFilterLabel || "Dodatni filter"}
          <select
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={extraFilterValue}
            onChange={(event) => onExtraFilterChange(event.target.value)}
          >
            {extraFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div className="flex items-end">
        <button
          type="button"
          className="w-full rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
          onClick={onApply}
          disabled={!onApply}
        >
          Primeni filtere
        </button>
      </div>
    </section>
  );
}
