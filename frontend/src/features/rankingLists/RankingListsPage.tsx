import { useEffect, type FormEvent, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { OracleMessageCard } from "../../components/feedback/OracleMessageCard";
import {
  loadRankingLists,
  setSearchSchoolYear,
  setSearchCompetitionName,
  setSearchProgramName,
} from "../../redux/slices/rankingListsSlice";

export default function RankingListsPage(): ReactElement {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const {
    rows,
    searchSchoolYear,
    searchCompetitionName,
    searchProgramName,
    isLoading,
    errorMessage,
    oracleDetails,
  } = useAppSelector((state) => state.rankingLists);

  useEffect(() => {
    void dispatch(loadRankingLists());
  }, [dispatch, token]);

  const onSearchSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void dispatch(loadRankingLists());
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-300 bg-white p-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Konačne Rang Liste</h1>
            <p className="text-sm text-slate-600">
              Pregled svih finalizovanih rang listi po programima
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/konkurs"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
            >
              Modul konkurs
            </Link>
            <Link
              to="/prijave"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
            >
              Modul prijave
            </Link>
            <Link
              to="/dashboard"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
            >
              Nazad na kontrolnu tablu
            </Link>
          </div>
        </header>

        {errorMessage ? (
          <OracleMessageCard
            title="Greška"
            message={errorMessage}
            oracleDetails={oracleDetails}
            variant="error"
          />
        ) : null}

        <section className="rounded-2xl border border-slate-300 bg-white p-6 space-y-4">
          <form className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" onSubmit={onSearchSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Školska godina:
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="npr. 2023/24"
                value={searchSchoolYear}
                onChange={(e) => dispatch(setSearchSchoolYear(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Naziv konkursa:
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="npr. Junski rok"
                value={searchCompetitionName}
                onChange={(e) => dispatch(setSearchCompetitionName(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Naziv programa:
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="npr. Informaciono inženjerstvo"
                value={searchProgramName}
                onChange={(e) => dispatch(setSearchProgramName(e.target.value))}
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="flex-1 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                disabled={isLoading}
              >
                Pretraži
              </button>
              <button
                type="button"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
                onClick={() => {
                  dispatch(setSearchSchoolYear(""));
                  dispatch(setSearchCompetitionName(""));
                  dispatch(setSearchProgramName(""));
                  void dispatch(loadRankingLists());
                }}
                disabled={isLoading}
              >
                Obriši filtere
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-300 bg-white p-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600"></div>
                <p className="mt-2 text-sm text-slate-600">Učitavanje...</p>
              </div>
            </div>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-slate-500">Nema pronađenih rang listi</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">ID Liste</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">Konkurs</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">
                      Studijski Program
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">Godina</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-900">Mesta</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-900">
                      Kandidata
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-900">Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr
                      key={row.idRangListe}
                      className={`border-b border-slate-200 hover:bg-slate-50 ${
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">{row.idRangListe}</td>
                      <td className="px-4 py-3">
                        <div className="text-slate-900 font-medium">{row.nazivKonkursa || "-"}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{row.studijskiProgram || "-"}</td>
                      <td className="px-4 py-3 text-slate-700">{row.skolskaGodina || "-"}</td>
                      <td className="px-4 py-3 text-center text-slate-700">
                        {row.brojMesta || "-"}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-700">
                        {row.ukupnoKandidata || "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          to={`/ranking-lists/${row.idRangListe}`}
                          className="inline-block rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold hover:bg-slate-100"
                        >
                          Detalji
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
