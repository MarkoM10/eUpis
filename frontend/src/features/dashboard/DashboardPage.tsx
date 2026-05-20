import type { ReactElement } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/authStore";
import { FilterBar } from "../../components/ui/FilterBar";
import { DataTable } from "../../components/ui/DataTable";
import { OracleMessageCard } from "../../components/feedback/OracleMessageCard";
import type { ActivityRow } from "../../types/models/dashboard";

const activityRows: ActivityRow[] = [
  {
    time: "09:15",
    module: "Prijava",
    description: "Prijava P-221 azurirana na status Eligible",
    user: "admin",
  },
  {
    time: "09:04",
    module: "Kandidat",
    description: "Dodat novi kandidat sa EmailType i AdresaType",
    user: "admin",
  },
  {
    time: "08:52",
    module: "Rang lista",
    description: "Azurirane stavke rang liste za program ISIT",
    user: "admin",
  },
];

export default function DashboardPage(): ReactElement {
  const { logout } = useAuth();

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-300 bg-white p-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Kontrolna tabla</h1>
            <p className="text-sm text-slate-600">Upisni ciklus 2026/27</p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/kandidati"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
            >
              Modul kandidati
            </Link>
            <Link
              to="/prijave"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
            >
              Modul prijave
            </Link>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
              onClick={logout}
            >
              Odjavi se
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-slate-300 bg-white p-4">
            <h2 className="text-sm text-slate-600">Ukupno prijava</h2>
            <p className="mt-2 text-3xl font-bold">438</p>
          </article>
          <article className="rounded-2xl border border-slate-300 bg-white p-4">
            <h2 className="text-sm text-slate-600">Prihvacene</h2>
            <p className="mt-2 text-3xl font-bold">312</p>
          </article>
          <article className="rounded-2xl border border-slate-300 bg-white p-4">
            <h2 className="text-sm text-slate-600">Na proveri</h2>
            <p className="mt-2 text-3xl font-bold">74</p>
          </article>
          <article className="rounded-2xl border border-slate-300 bg-white p-4">
            <h2 className="text-sm text-slate-600">Upisani studenti</h2>
            <p className="mt-2 text-3xl font-bold">189</p>
          </article>
        </section>

        <FilterBar
          searchValue=""
          onSearchChange={() => undefined}
          sortValue="datum_desc"
          onSortChange={() => undefined}
          sortOptions={[
            { value: "datum_desc", label: "Datum (opadajuce)" },
            { value: "datum_asc", label: "Datum (rastuce)" },
          ]}
          statusValue="svi"
          onStatusChange={() => undefined}
          statusOptions={[
            { value: "svi", label: "Svi statusi" },
            { value: "eligible", label: "Eligible" },
            { value: "under_review", label: "UnderReview" },
          ]}
        />

        <DataTable
          title="Poslednje aktivnosti"
          rows={activityRows}
          emptyMessage="Nema aktivnosti za prikaz."
          columns={[
            { key: "time", header: "Vreme", render: (row) => row.time },
            { key: "module", header: "Modul", render: (row) => row.module },
            {
              key: "description",
              header: "Opis",
              render: (row) => row.description,
            },
            { key: "user", header: "Korisnik", render: (row) => row.user },
          ]}
        />

        <OracleMessageCard
          title="Primer Oracle poruke"
          message="Neuspesno cuvanje prijave. Proverite unete vrednosti."
          oracleDetails="ORA-02291 integrity constraint violated"
        />
      </div>
    </main>
  );
}
