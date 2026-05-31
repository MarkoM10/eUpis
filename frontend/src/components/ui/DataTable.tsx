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
      <header className="border-b border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </header>

      {rows.length === 0 ? (
        <p className="p-6 text-sm text-slate-600">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-900"
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={index}
                  className={`border-b border-slate-200 hover:bg-slate-50 ${
                    index % 2 === 0 ? "bg-white" : "bg-slate-50"
                  }`}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 align-top text-slate-700">
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
