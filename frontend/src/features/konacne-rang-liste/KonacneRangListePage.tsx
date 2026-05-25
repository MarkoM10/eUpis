import { useEffect, useMemo, useState, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { OracleMessageCard } from "../../components/feedback/OracleMessageCard";
import { DataTable } from "../../components/ui/DataTable";
import { toApiClientError } from "../../services/api";
import {
  listRankingItemsRequest,
  listRankingListsRequest,
  listStudyProgramsRequest,
  updateRankingListStudyProgramRequest,
} from "../../services/upisService";
import type { RankingItem, RankingListSummary, StudyProgramOption } from "../../types/models/upis";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { logoutSuccess } from "../../redux/slices/authSlice";
import { buildProgramLabel, getCurrentYearString } from "../../utils/utils";

export default function KonacneRangListePage(): ReactElement {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const role = useAppSelector((state) => state.auth.role);
  const isAdmin = role === "admin";

  const [programs, setPrograms] = useState<StudyProgramOption[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [skolskaGodina, setSkolskaGodina] = useState<string>(getCurrentYearString());
  const [rankingLists, setRankingLists] = useState<RankingListSummary[]>([]);
  const [selectedRankingId, setSelectedRankingId] = useState<string>("");
  const [rankingItems, setRankingItems] = useState<RankingItem[]>([]);

  const [listProgramDrafts, setListProgramDrafts] = useState<Record<number, string>>({});

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [oracleDetails, setOracleDetails] = useState<string | undefined>(undefined);

  const handleLogout = (): void => {
    dispatch(logoutSuccess());
  };

  const clearFeedback = (): void => {
    setSuccessMessage(null);
    setErrorMessage(null);
    setOracleDetails(undefined);
  };

  const setRequestError = (error: unknown): void => {
    const parsed = toApiClientError(error);
    setErrorMessage(`${parsed.title}: ${parsed.message}`);
    setOracleDetails(parsed.oracleDetails);
  };

  const selectedProgramOption = useMemo(
    () => programs.find((program) => String(program.idPrograma) === selectedProgramId) ?? null,
    [programs, selectedProgramId],
  );

  const selectedRankingList = useMemo(
    () => rankingLists.find((list) => String(list.idRangListe) === selectedRankingId) ?? null,
    [rankingLists, selectedRankingId],
  );

  const selectedRankingItems = useMemo(() => {
    if (!selectedRankingId) {
      return [];
    }

    return rankingItems;
  }, [rankingItems, selectedRankingId]);

  const loadPrograms = async (): Promise<void> => {
    if (!token) {
      return;
    }

    try {
      const response = await listStudyProgramsRequest(token);
      setPrograms(response.data.rows);
    } catch (error) {
      setRequestError(error);
    }
  };

  const loadRankingLists = async (): Promise<void> => {
    if (!token || !selectedProgramId) {
      return;
    }

    setIsLoading(true);
    clearFeedback();

    try {
      const response = await listRankingListsRequest(token, {
        idPrograma: Number(selectedProgramId),
        skolskaGodina,
      });
      const rows = response.data.rows;
      setRankingLists(rows);

      setListProgramDrafts(
        rows.reduce<Record<number, string>>((accumulator, row) => {
          accumulator[row.idRangListe] = row.studijskiProgram ?? "";
          return accumulator;
        }, {}),
      );

      if (rows.length > 0) {
        const hasCurrentSelection = rows.some(
          (row) => String(row.idRangListe) === selectedRankingId,
        );

        if (!hasCurrentSelection) {
          setSelectedRankingId(String(rows[0].idRangListe));
        }
      } else {
        setSelectedRankingId("");
        setRankingItems([]);
      }
    } catch (error) {
      setRequestError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRankingItems = async (idRangListe: number): Promise<void> => {
    if (!token) {
      return;
    }

    try {
      const response = await listRankingItemsRequest(token, idRangListe);
      setRankingItems(response.data.rows);
    } catch (error) {
      setRequestError(error);
    }
  };

  useEffect(() => {
    void loadPrograms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token || !selectedRankingId) {
      setRankingItems([]);
      return;
    }

    void loadRankingItems(Number(selectedRankingId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedRankingId]);

  const onSearch = async (): Promise<void> => {
    await loadRankingLists();
  };

  const onSaveListProgram = async (row: RankingListSummary): Promise<void> => {
    if (!token) {
      return;
    }

    const nextValue = listProgramDrafts[row.idRangListe] ?? row.studijskiProgram ?? "";

    setIsSubmitting(true);
    clearFeedback();

    try {
      await updateRankingListStudyProgramRequest(token, row.idRangListe, {
        studijskiProgram: nextValue,
      });
      setSuccessMessage(
        "Studijski program na glavnoj rang listi je azuriran. Stavke su sinhronizovane preko trigera.",
      );
      await loadRankingLists();
      await loadRankingItems(row.idRangListe);
    } catch (error) {
      setRequestError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return <main className="p-6">Niste autentifikovani.</main>;
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-300 bg-white p-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Konačne rang liste</h1>
            <p className="text-sm text-slate-600">
              Pregled glavnih rang lista i stavki, sa direktnom demonstracijom Oracle trigera.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/upis"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
            >
              Modul upis
            </Link>
            <Link
              to="/dashboard"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
            >
              Kontrolna tabla
            </Link>
            <Link
              to="/finalizacija-upisa"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
            >
              Finalizacija upisa
            </Link>
            {isAdmin ? (
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
                onClick={handleLogout}
              >
                Odjavi se
              </button>
            ) : null}
          </div>
        </header>

        <section className="rounded-2xl border border-slate-300 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900">Pretraga konačnih rang lista</h2>
          <p className="mt-1 text-sm text-slate-600">
            Prvo izaberite studijski program i školsku godinu, pa učitajte postojeće konačne rang
            liste.
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={skolskaGodina}
              onChange={(event) => setSkolskaGodina(event.target.value)}
              placeholder="Skolska godina"
            />
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={selectedProgramId}
              onChange={(event) => setSelectedProgramId(event.target.value)}
            >
              <option value="">Izaberite program i modul</option>
              {programs.map((program) => {
                const label = buildProgramLabel(program.nazivPrograma, program.modul);
                return (
                  <option key={program.idPrograma} value={String(program.idPrograma)}>
                    {label}
                  </option>
                );
              })}
            </select>
            <div className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {selectedProgramOption
                ? `Predviđen broj mesta: ${selectedProgramOption.brojDostupnihMesta ?? "-"}`
                : "Predviđen broj mesta: -"}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              onClick={() => void onSearch()}
              disabled={isLoading || !selectedProgramId}
            >
              Učitaj rang liste
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-300 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900">Konačne rang liste i stavke</h2>
          <p className="mt-1 text-sm text-slate-600">
            Studijski program se menja isključivo na konačnoj rang listi. Stavke su prikazane kao
            povezani detalj izabrane liste.
          </p>

          <div className="mt-4">
            <DataTable
              title="Konacne rang liste"
              rows={rankingLists}
              emptyMessage="Nema konačnih rang lista za izabrani program i školsku godinu."
              columns={[
                { key: "id", header: "ID", render: (row) => row.idRangListe },
                {
                  key: "program",
                  header: "Studijski program",
                  render: (row) => (
                    <input
                      className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                      value={listProgramDrafts[row.idRangListe] ?? row.studijskiProgram ?? ""}
                      onChange={(event) =>
                        setListProgramDrafts((prev) => ({
                          ...prev,
                          [row.idRangListe]: event.target.value,
                        }))
                      }
                    />
                  ),
                },
                {
                  key: "godina",
                  header: "Školska godina",
                  render: (row) => row.skolskaGodina ?? "-",
                },
                { key: "mesta", header: "Broj mesta", render: (row) => row.brojMesta ?? "-" },
                {
                  key: "kandidati",
                  header: "Kandidata",
                  render: (row) => row.ukupnoKandidata ?? "-",
                },
                {
                  key: "akcija",
                  header: "Akcija",
                  render: (row) => (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={`rounded border px-2 py-1 text-xs font-semibold ${
                          String(row.idRangListe) === selectedRankingId
                            ? "border-teal-700 bg-teal-50 text-teal-800"
                            : "border-slate-300"
                        }`}
                        onClick={() => setSelectedRankingId(String(row.idRangListe))}
                      >
                        Prikaži stavke
                      </button>
                      <button
                        type="button"
                        className="rounded bg-teal-700 px-2 py-1 text-xs font-semibold text-white disabled:opacity-60"
                        onClick={() => void onSaveListProgram(row)}
                        disabled={isSubmitting}
                      >
                        Sačuvaj program
                      </button>
                    </div>
                  ),
                },
              ]}
            />
          </div>

          <div className="mt-6 border-t border-slate-200 pt-4">
            <h3 className="text-base font-semibold text-slate-900">Stavke rang liste</h3>
            <p className="mt-1 text-sm text-slate-600">
              {selectedRankingList
                ? `Prikazane su stavke za rang listu ID ${selectedRankingList.idRangListe}.`
                : "Izaberite rang listu iz tabele iznad da biste videli njene stavke."}
            </p>

            {selectedRankingList ? (
              <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Stavka</th>
                      <th className="px-4 py-3 font-semibold">Broj prijave</th>
                      <th className="px-4 py-3 font-semibold">Kandidat</th>
                      <th className="px-4 py-3 font-semibold">Studijski program</th>
                      <th className="px-4 py-3 font-semibold">Poeni</th>
                      <th className="px-4 py-3 font-semibold">Rang</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-slate-800">
                    {selectedRankingItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-3 text-sm text-slate-600">
                          Nema stavki za izabranu rang listu.
                        </td>
                      </tr>
                    ) : (
                      selectedRankingItems.map((row) => (
                        <tr key={row.idStavke}>
                          <td className="px-4 py-3">{row.idStavke}</td>
                          <td className="px-4 py-3">{row.brojPrijave ?? "-"}</td>
                          <td className="px-4 py-3">{row.imePrezime ?? "-"}</td>
                          <td className="px-4 py-3">{row.studijskiProgram ?? "-"}</td>
                          <td className="px-4 py-3">{row.brojPoena ?? "-"}</td>
                          <td className="px-4 py-3">{row.rangMesto ?? "-"}</td>
                          <td className="px-4 py-3">{row.status ?? "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </section>

        {successMessage ? (
          <OracleMessageCard title="Uspešno" message={successMessage} variant="success" />
        ) : null}

        {errorMessage ? (
          <OracleMessageCard
            title="Greška"
            message={errorMessage}
            oracleDetails={oracleDetails}
            variant="error"
          />
        ) : null}
      </div>
    </main>
  );
}
