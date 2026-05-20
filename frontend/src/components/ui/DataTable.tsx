import type { ReactElement, ReactNode } from "react";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  title: string;
  rows: T[];
  columns: DataTableColumn<T>[];
  emptyMessage: string;
}

export function DataTable<T>({
  title,
  rows,
  columns,
  emptyMessage,
}: DataTableProps<T>): ReactElement {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-300 bg-white">
      <header className="border-b border-slate-200 p-4">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </header>

      {rows.length === 0 ? (
        <p className="p-4 text-sm text-slate-600">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className="px-4 py-3 font-semibold">
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-800">
              {rows.map((row, index) => (
                <tr key={index}>
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 align-top">
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
