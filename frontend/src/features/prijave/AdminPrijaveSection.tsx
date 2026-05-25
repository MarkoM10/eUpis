import type { ReactElement } from "react";
import { DataTable } from "../../components/ui/DataTable";
import { FilterBar } from "../../components/ui/FilterBar";
import type { PrijavaDocumentType } from "../../types/models/prijavaDocument";
import type { Prijava } from "../../types/models/prijava";
import { getDocumentActionKey, getPrijavaRowKey as getRowKey } from "../../utils/utils";

interface AdminPrijaveSectionProps {
  rows: Prijava[];
  search: string;
  sortValue: string;
  statusFilter: string;
  partitionFilter: string;
  isLoadingRows: boolean;
  adminDocumentsByKey: Record<
    string,
    { diplomaHasFile: boolean; uverenjeHasFile: boolean; isLoading: boolean }
  >;
  adminStatusByKey: Record<string, string>;
  savingStatusKey: string | null;
  downloadingDocumentKey: string | null;
  onSearchChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onPartitionFilterChange: (value: string) => void;
  onApply: () => void;
  onRefresh: () => void;
  onStatusValueChange: (rowKey: string, value: string) => void;
  onDownloadDocument: (row: Prijava, documentType: PrijavaDocumentType) => void;
  onSaveStatus: (row: Prijava) => void;
  onEdit: (row: Prijava) => void;
}

export default function AdminPrijaveSection({
  rows,
  search,
  sortValue,
  statusFilter,
  partitionFilter,
  isLoadingRows,
  adminDocumentsByKey,
  adminStatusByKey,
  savingStatusKey,
  downloadingDocumentKey,
  onSearchChange,
  onSortChange,
  onStatusFilterChange,
  onPartitionFilterChange,
  onApply,
  onRefresh,
  onStatusValueChange,
  onDownloadDocument,
  onSaveStatus,
  onEdit,
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
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
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
            key: "diploma",
            header: "Diploma",
            render: (row) => {
              const key = getRowKey(row.brojPrijave, row.skolskaGodina);
              const docState = adminDocumentsByKey[key];
              if (!docState || docState.isLoading) {
                return "Ucitavanje...";
              }
              return docState.diplomaHasFile ? "Otpremljena" : "Nedostaje";
            },
          },
          {
            key: "uverenje",
            header: "Uverenje",
            render: (row) => {
              const key = getRowKey(row.brojPrijave, row.skolskaGodina);
              const docState = adminDocumentsByKey[key];
              if (!docState || docState.isLoading) {
                return "Ucitavanje...";
              }
              return docState.uverenjeHasFile ? "Otpremljeno" : "Nedostaje";
            },
          },
          {
            key: "status",
            header: "Status",
            render: (row) => {
              const key = getRowKey(row.brojPrijave, row.skolskaGodina);
              const value = adminStatusByKey[key] ?? row.statusPrijave ?? "Podneta";

              return (
                <select
                  className="rounded border border-slate-300 px-2 py-1 text-xs"
                  value={value}
                  onChange={(event) => {
                    onStatusValueChange(key, event.target.value);
                  }}
                >
                  <option value="Podneta">Podneta</option>
                  <option value="Odobrena">Odobrena</option>
                  <option value="Odbijena">Odbijena</option>
                </select>
              );
            },
          },
          { key: "ime", header: "Kandidat", render: (row) => row.imePrezime ?? "-" },
          { key: "jmbg", header: "JMBG", render: (row) => row.jmbg ?? "-" },
          {
            key: "akcije",
            header: "Akcije",
            render: (row) => {
              const key = getRowKey(row.brojPrijave, row.skolskaGodina);
              const currentStatus = row.statusPrijave ?? "Podneta";
              const selectedStatus = adminStatusByKey[key] ?? currentStatus;
              const hasStatusChanged = selectedStatus !== currentStatus;

              return (
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold disabled:opacity-60"
                    onClick={() => onDownloadDocument(row, "diploma")}
                    disabled={(() => {
                      const docState = adminDocumentsByKey[key];
                      if (!docState || docState.isLoading || !docState.diplomaHasFile) {
                        return true;
                      }
                      return (
                        downloadingDocumentKey ===
                        getDocumentActionKey(row.brojPrijave, row.skolskaGodina, "diploma")
                      );
                    })()}
                  >
                    {downloadingDocumentKey ===
                    getDocumentActionKey(row.brojPrijave, row.skolskaGodina, "diploma")
                      ? "Preuzimanje..."
                      : "Preuzmi diploma"}
                  </button>
                  <button
                    type="button"
                    className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold disabled:opacity-60"
                    onClick={() => onDownloadDocument(row, "uverenje")}
                    disabled={(() => {
                      const docState = adminDocumentsByKey[key];
                      if (!docState || docState.isLoading || !docState.uverenjeHasFile) {
                        return true;
                      }
                      return (
                        downloadingDocumentKey ===
                        getDocumentActionKey(row.brojPrijave, row.skolskaGodina, "uverenje")
                      );
                    })()}
                  >
                    {downloadingDocumentKey ===
                    getDocumentActionKey(row.brojPrijave, row.skolskaGodina, "uverenje")
                      ? "Preuzimanje..."
                      : "Preuzmi uverenje"}
                  </button>
                  <button
                    type="button"
                    className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold disabled:opacity-60"
                    onClick={() => onSaveStatus(row)}
                    disabled={savingStatusKey === key || !hasStatusChanged}
                  >
                    {savingStatusKey === key ? "Cuvanje..." : "Sacuvaj status"}
                  </button>
                  <button
                    type="button"
                    className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold"
                    onClick={() => onEdit(row)}
                  >
                    Izmeni
                  </button>
                </div>
              );
            },
          },
        ]}
      />
    </>
  );
}
