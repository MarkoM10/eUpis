import type { ReactElement } from "react";
import { Link } from "react-router-dom";
import { DataTable } from "../../components/ui/DataTable";
import { FilterBar } from "../../components/ui/FilterBar";
import type { Prijava } from "../../types/models/prijava";

interface AdminPrijaveSectionProps {
  rows: Prijava[];
  search: string;
  sortValue: string;
  statusFilter: string;
  partitionFilter: string;
  isLoadingRows: boolean;
  onSearchChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onPartitionFilterChange: (value: string) => void;
  onApply: () => void;
  onRefresh: () => void;
}

export default function AdminPrijaveSection({
  rows,
  search,
  sortValue,
  statusFilter,
  partitionFilter,
  isLoadingRows,
  onSearchChange,
  onSortChange,
  onStatusFilterChange,
  onPartitionFilterChange,
  onApply,
  onRefresh,
}: AdminPrijaveSectionProps): ReactElement {
  return (
    <>
      <FilterBar
        searchValue={search}
        onSearchChange={onSearchChange}
        sortValue={sortValue}
        onSortChange={onSortChange}
        sortOptions={[
          { value: "broj_prijave:asc", label: "Broj prijave (rastuce)" },
          { value: "broj_prijave:desc", label: "Broj prijave (opadajuce)" },
          { value: "datum_prijave:desc", label: "Datum prijave (novije)" },
          { value: "datum_prijave:asc", label: "Datum prijave (starije)" },
        ]}
        statusValue={statusFilter}
        onStatusChange={onStatusFilterChange}
        statusOptions={[
          { value: "svi", label: "Status: svi" },
          { value: "Podneta", label: "Podneta" },
          { value: "Odobrena", label: "Odobrena" },
          { value: "Odbijena", label: "Odbijena" },
        ]}
        extraFilterLabel="Prijave po godini/roku"
        extraFilterValue={partitionFilter}
        onExtraFilterChange={onPartitionFilterChange}
        extraFilterOptions={[
          { value: "sve", label: "Sve prijave" },
          { value: "prijava_do_2023", label: "Prijave do 2023" },
          { value: "prijava_2024", label: "Prijave 2024" },
          { value: "prijava_2025", label: "Prijave 2025" },
          { value: "prijava_2026", label: "Prijave 2026" },
          { value: "prijava_2027", label: "Prijave 2027" },
          { value: "prijava_2028", label: "Prijave 2028" },
        ]}
        onApply={onApply}
      />

      <div className="flex justify-end">
        <button
          type="button"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100 disabled:opacity-60"
          onClick={onRefresh}
          disabled={isLoadingRows}
        >
          {isLoadingRows ? "Ucitavanje..." : "Osvezi listu"}
        </button>
      </div>

      <DataTable
        title="Lista prijava"
        rows={rows}
        emptyMessage="Nema prijava za prikaz."
        columns={[
          { key: "broj", header: "Broj", render: (row) => row.brojPrijave },
          {
            key: "godina",
            header: "Skolska godina",
            render: (row) => row.skolskaGodina,
          },
          {
            key: "datum",
            header: "Datum",
            render: (row) => (row.datumPrijave ? row.datumPrijave.slice(0, 10) : "-"),
          },
          {
            key: "status",
            header: "Status",
            render: (row) => row.statusPrijave ?? "Podneta",
          },
          { key: "ime", header: "Kandidat", render: (row) => row.imePrezime ?? "-" },
          { key: "jmbg", header: "JMBG", render: (row) => row.jmbg ?? "-" },
          {
            key: "akcije",
            header: "Akcije",
            render: (row) => (
              <Link
                to={`/prijave/${row.brojPrijave}/${encodeURIComponent(row.skolskaGodina)}`}
                className="inline-block rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold hover:bg-slate-100"
              >
                Detalji
              </Link>
            ),
          },
        ]}
      />
    </>
  );
}
