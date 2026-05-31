import { useEffect, useState, type ReactElement } from "react";
import { useParams, Link } from "react-router-dom";
import { useAppSelector } from "../../redux/hooks";
import { OracleMessageCard } from "../../components/feedback/OracleMessageCard";
import { toApiClientError } from "../../services/api";
import {
  getRankingListRequest,
  listRankingItemsRequest,
  updateRankingListStudyProgramRequest,
} from "../../services/rankingListsService";
import type { RankingListSummary, RankingItem } from "../../types/models/upis";

interface LocalState {
  rankingList: RankingListSummary | null;
  items: RankingItem[];
  isLoadingList: boolean;
  isLoadingItems: boolean;
  errorMessage: string | null;
  oracleDetails: string | undefined;
  editingProgram: boolean;
  editingProgramValue: string;
  isSaving: boolean;
  successMessage: string | null;
}

export default function RankingListDetailsPage(): ReactElement {
  const { idRangListe } = useParams<{ idRangListe: string }>();
  const token = useAppSelector((state) => state.auth.token);

  const [state, setState] = useState<LocalState>({
    rankingList: null,
    items: [],
    isLoadingList: false,
    isLoadingItems: false,
    errorMessage: null,
    oracleDetails: undefined,
    editingProgram: false,
    editingProgramValue: "",
    isSaving: false,
    successMessage: null,
  });

  const idRangListeNum = idRangListe ? Number(idRangListe) : null;

  useEffect(() => {
    if (!token || !idRangListeNum) {
      return;
    }

    const loadData = async (): Promise<void> => {
      try {
        setState((prev) => ({
          ...prev,
          isLoadingList: true,
          errorMessage: null,
          oracleDetails: undefined,
        }));

        const listResponse = await getRankingListRequest(token, idRangListeNum);
        const itemsResponse = await listRankingItemsRequest(token, idRangListeNum);

        setState((prev) => ({
          ...prev,
          rankingList: listResponse.data,
          items: itemsResponse.data.rows,
          isLoadingList: false,
          editingProgramValue: listResponse.data.studijskiProgram || "",
        }));
      } catch (error) {
        const parsed = toApiClientError(error);
        setState((prev) => ({
          ...prev,
          isLoadingList: false,
          errorMessage: `${parsed.title}: ${parsed.message}`,
          oracleDetails: parsed.oracleDetails,
        }));
      }
    };

    void loadData();
  }, [token, idRangListeNum]);

  const handleSaveProgram = async (): Promise<void> => {
    if (!token || !idRangListeNum) {
      return;
    }

    try {
      setState((prev) => ({
        ...prev,
        isSaving: true,
        errorMessage: null,
        oracleDetails: undefined,
        successMessage: null,
      }));

      await updateRankingListStudyProgramRequest(token, idRangListeNum, state.editingProgramValue);

      setState((prev) => ({
        ...prev,
        isSaving: false,
        editingProgram: false,
        successMessage: "Studijski program je uspešno ažuriran.",
        rankingList: prev.rankingList
          ? {
              ...prev.rankingList,
              studijskiProgram: state.editingProgramValue,
            }
          : null,
      }));

      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          successMessage: null,
        }));
      }, 3000);
    } catch (error) {
      const parsed = toApiClientError(error);
      setState((prev) => ({
        ...prev,
        isSaving: false,
        errorMessage: `${parsed.title}: ${parsed.message}`,
        oracleDetails: parsed.oracleDetails,
      }));
    }
  };

  if (!state.rankingList) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-slate-300 bg-white p-6 text-center">
            {state.isLoadingList ? (
              <>
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600"></div>
                <p className="mt-2 text-sm text-slate-600">Učitavanje...</p>
              </>
            ) : state.errorMessage ? (
              <OracleMessageCard
                title="Greška"
                message={state.errorMessage}
                oracleDetails={state.oracleDetails}
                variant="error"
              />
            ) : (
              <p className="text-slate-500">Rang lista nije pronađena</p>
            )}
            <div className="mt-4">
              <Link
                to="/ranking-lists"
                className="inline-block rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
              >
                Nazad
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {state.successMessage && (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-800">{state.successMessage}</p>
            <button
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  successMessage: null,
                }))
              }
              className="text-green-600 hover:text-green-800"
            >
              ✕
            </button>
          </div>
        )}

        {state.errorMessage && (
          <OracleMessageCard
            title="Greška"
            message={state.errorMessage}
            oracleDetails={state.oracleDetails}
            variant="error"
          />
        )}

        <section className="rounded-2xl border border-slate-300 bg-white p-6">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Detalji Rang Liste {state.rankingList.idRangListe}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                {state.rankingList.nazivPrograma}
                {state.rankingList.modul && ` (${state.rankingList.modul})`}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                to="/ranking-lists"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100"
              >
                Rang liste
              </Link>
              <Link
                to="/konkurs"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100"
              >
                Modul konkurs
              </Link>
              <Link
                to="/dashboard"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100"
              >
                Nazad na kontrolnu tablu
              </Link>
            </div>
          </header>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-xs font-semibold uppercase text-slate-500">Školska Godina</h3>
              <p className="mt-2 text-lg font-bold text-slate-900">
                {state.rankingList.skolskaGodina || "-"}
              </p>
            </article>
            <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-xs font-semibold uppercase text-slate-500">Broj Mesta</h3>
              <p className="mt-2 text-lg font-bold text-slate-900">
                {state.rankingList.brojMesta || "-"}
              </p>
            </article>
            <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-xs font-semibold uppercase text-slate-500">Kandidata</h3>
              <p className="mt-2 text-lg font-bold text-slate-900">
                {state.rankingList.ukupnoKandidata || "-"}
              </p>
            </article>
          </div>

          <hr className="my-6" />

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">Studijski Program</h2>
            {!state.editingProgram ? (
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
                <span className="text-slate-900">{state.rankingList.studijskiProgram || "-"}</span>
                <button
                  className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold hover:bg-slate-100"
                  onClick={() =>
                    setState((prev) => ({
                      ...prev,
                      editingProgram: true,
                    }))
                  }
                >
                  Izmeni
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={state.editingProgramValue}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      editingProgramValue: e.target.value,
                    }))
                  }
                  disabled={state.isSaving}
                />
                <button
                  className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50"
                  onClick={handleSaveProgram}
                  disabled={state.isSaving}
                >
                  {state.isSaving ? "Čuva..." : "Sačuva"}
                </button>
                <button
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-100 disabled:opacity-50"
                  onClick={() =>
                    setState((prev) => ({
                      ...prev,
                      editingProgram: false,
                      editingProgramValue: state.rankingList?.studijskiProgram || "",
                    }))
                  }
                  disabled={state.isSaving}
                >
                  Otkaži
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-300 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900">Stavke Rang Liste</h2>
          {state.isLoadingItems ? (
            <div className="flex justify-center py-8">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600"></div>
                <p className="mt-2 text-sm text-slate-600">Učitavanje stavki...</p>
              </div>
            </div>
          ) : state.items.length === 0 ? (
            <p className="py-8 text-center text-slate-500">Nema stavki u rang listi</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">Rang</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">
                      Broj Prijave
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">
                      Ime i Prezime
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-900">Poeni</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-900">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">
                      Studijski Program
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {state.items.map((item, idx) => (
                    <tr
                      key={item.idStavke}
                      className={`border-b border-slate-200 hover:bg-slate-50 ${
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                      }`}
                    >
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {item.rangMesto || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{item.brojPrijave || "-"}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {item.imePrezime || "-"}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-700">
                        {item.brojPoena || "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                          {item.status || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{item.studijskiProgram || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="flex gap-2">
          <Link
            to="/ranking-lists"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-200"
          >
            ← Nazad na Rang Liste
          </Link>
        </div>
      </div>
    </main>
  );
}
