import type { ReactElement } from "react";
import { useAuth } from "../auth/authStore";

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
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
            onClick={logout}
          >
            Odjavi se
          </button>
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
      </div>
    </main>
  );
}
