import type { ReactElement } from "react";
import type { Prijava } from "../../types/models/prijava";
import type { PrijavaDocumentsRecord } from "../../types/models/prijavaDocument";

interface StudentPrijavaSummaryCardProps {
  prijava: Prijava;
  documents: PrijavaDocumentsRecord;
  isDocumentsLoading: boolean;
  onRefresh: () => void;
}

const formatDate = (value: string | null): string => {
  if (!value) {
    return "-";
  }

  return value.slice(0, 10);
};

const statusClassName = (status: string | null): string => {
  const normalized = (status ?? "").toLowerCase();

  if (normalized === "eligible") {
    return "bg-emerald-100 text-emerald-800";
  }

  if (normalized === "rejected") {
    return "bg-red-100 text-red-800";
  }

  return "bg-amber-100 text-amber-800";
};

export default function StudentPrijavaSummaryCard({
  prijava,
  documents,
  isDocumentsLoading,
  onRefresh,
}: StudentPrijavaSummaryCardProps): ReactElement {
  return (
    <section className="rounded-2xl border border-emerald-300 bg-emerald-50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Prijava poslata
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">Vasa prijava je evidentirana</h2>
          <p className="mt-1 text-sm text-slate-700">
            Sistem je pronasao aktivnu prijavu za upis. U nastavku je kratak pregled statusa.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClassName(
            prijava.statusPrijave,
          )}`}
        >
          Status: {prijava.statusPrijave ?? "Submitted"}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-xl border border-emerald-200 bg-white px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Broj prijave</p>
          <p className="text-lg font-semibold text-slate-900">{prijava.brojPrijave}</p>
        </article>
        <article className="rounded-xl border border-emerald-200 bg-white px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Skolska godina</p>
          <p className="text-lg font-semibold text-slate-900">{prijava.skolskaGodina}</p>
        </article>
        <article className="rounded-xl border border-emerald-200 bg-white px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Datum prijave</p>
          <p className="text-lg font-semibold text-slate-900">{formatDate(prijava.datumPrijave)}</p>
        </article>
        <article className="rounded-xl border border-emerald-200 bg-white px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Konkursni rok</p>
          <p className="text-lg font-semibold text-slate-900">{prijava.konkursniRok ?? "-"}</p>
        </article>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-900">Status dokumentacije</h3>
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            Osvezi status
          </button>
        </div>

        {isDocumentsLoading ? (
          <p className="mt-2 text-sm text-slate-500">Ucitavanje dokumenata...</p>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
              Diploma: {documents.diploma.hasFile ? "Otpremljena" : "Nije otpremljena"}
            </div>
            <div className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
              Uverenje: {documents.uverenje.hasFile ? "Otpremljeno" : "Nije otpremljeno"}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
