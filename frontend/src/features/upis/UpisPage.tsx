import { useEffect, useMemo, useState, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { OracleMessageCard } from "../../components/feedback/OracleMessageCard";
import { DataTable } from "../../components/ui/DataTable";
import { toApiClientError } from "../../services/api";
import {
  downloadStudentEnrollmentContractRequest,
  generateFinalRankingRequest,
  getStudentAdmissionStatusRequest,
  listEligiblePrijaveRequest,
  listRankingItemsRequest,
  listRankingListsRequest,
  listStudyProgramsRequest,
  saveExamScoreRequest,
  uploadSignedEnrollmentContractRequest,
} from "../../services/upisService";
import type {
  EligiblePrijavaRow,
  RankingItem,
  StudentAdmissionStatus,
  StudyProgramOption,
} from "../../types/models/upis";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { logoutSuccess } from "../../redux/slices/authSlice";
import {
  buildProgramLabel,
  formatDateTime,
  getCurrentYearString,
  triggerFileDownload,
} from "../../utils/utils";

const stageDescription: Record<StudentAdmissionStatus["stage"], string> = {
  NemaPrijave: "Jos nemate podnetu prijavu.",
  CekaObraduPrijave: "Prijava je poslata. Sacekajte da administrator obradi status.",
  OdobrenaBezBodova: "Prijava je odobrena. Sacekajte evidentiranje rezultata ispita.",
  CekaKonacnuOdluku: "Rezultat ispita je evidentiran. Sacekajte finalnu odluku o upisu.",
  OdobrenUpis:
    "Cestitamo, uspesno ste se upisali na fakultet! Potrebno je jos da otpremite potpisani ugovor.",
  UpisZavrsen: "Upis je uspesno finalizovan. Dobrodosli!",
  UpisOdbijen: "Niste upali u konacan broj mesta za upis.",
};

export default function UpisPage(): ReactElement {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const role = useAppSelector((state) => state.auth.role);
  const isAdmin = role === "admin";
  const handleLogout = (): void => {
    dispatch(logoutSuccess());
  };

  const [programs, setPrograms] = useState<StudyProgramOption[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [skolskaGodina, setSkolskaGodina] = useState<string>(getCurrentYearString());
  const [hasPerformedAdminSearch, setHasPerformedAdminSearch] = useState(false);
  const [appliedProgramId, setAppliedProgramId] = useState<string>("");
  const [appliedSkolskaGodina, setAppliedSkolskaGodina] = useState<string>("");

  const [eligibleRows, setEligibleRows] = useState<EligiblePrijavaRow[]>([]);
  const [scoreByPrijava, setScoreByPrijava] = useState<Record<string, string>>({});

  const [selectedRankingId, setSelectedRankingId] = useState<string>("");
  const [rankingItems, setRankingItems] = useState<RankingItem[]>([]);
  const [signedContractFile, setSignedContractFile] = useState<File | null>(null);

  const [studentStatus, setStudentStatus] = useState<StudentAdmissionStatus | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [oracleDetails, setOracleDetails] = useState<string | undefined>(undefined);

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

  const appliedProgramOption = useMemo(
    () => programs.find((program) => String(program.idPrograma) === appliedProgramId) ?? null,
    [programs, appliedProgramId],
  );

  const selectedProgramSeats = selectedProgramOption?.brojDostupnihMesta ?? null;
  const appliedProgramSeats = appliedProgramOption?.brojDostupnihMesta ?? null;

  const filteredEligibleRows = useMemo(() => {
    if (!appliedProgramId) {
      return eligibleRows;
    }

    return eligibleRows.filter(
      (row) => row.idPrograma != null && String(row.idPrograma) === appliedProgramId,
    );
  }, [eligibleRows, appliedProgramId]);

  const hasVisibleFinalRanking = useMemo(
    () =>
      rankingItems.length > 0 &&
      rankingItems.every((item) => item.status === "Odobrena" || item.status === "Odbijena"),
    [rankingItems],
  );

  const finalRankingLockedMessage = useMemo(() => {
    const programLabel = appliedProgramOption
      ? buildProgramLabel(appliedProgramOption.nazivPrograma, appliedProgramOption.modul)
      : "izabrani studijski program";

    return `Konacna rang lista za ${programLabel} u skolskoj godini ${appliedSkolskaGodina || skolskaGodina} je vec generisana i ne moze se ponovo generisati.`;
  }, [appliedProgramOption, appliedSkolskaGodina, skolskaGodina]);

  const loadPrograms = async (): Promise<void> => {
    if (!token) {
      return;
    }

    try {
      const response = await listStudyProgramsRequest(token);
      const rows = response.data.rows;
      setPrograms(rows);

      if (rows.length > 0 && !selectedProgramId) {
        const defaultProgram = rows[0];
        setSelectedProgramId(String(defaultProgram.idPrograma));
      }
    } catch (error) {
      setRequestError(error);
    }
  };

  const loadEligibleRows = async (schoolYear: string): Promise<void> => {
    if (!token || !isAdmin) {
      return;
    }

    try {
      const response = await listEligiblePrijaveRequest(token, schoolYear);
      setEligibleRows(response.data.rows);
    } catch (error) {
      setRequestError(error);
    }
  };

  const loadRankingLists = async (programId: string, schoolYear: string): Promise<void> => {
    if (!token) {
      return;
    }

    try {
      const response = await listRankingListsRequest(token, {
        idPrograma: programId ? Number(programId) : undefined,
        skolskaGodina: schoolYear || undefined,
      });

      if (response.data.rows.length > 0) {
        setSelectedRankingId(String(response.data.rows[0].idRangListe));
      } else if (response.data.rows.length === 0) {
        setSelectedRankingId("");
      }
    } catch (error) {
      setRequestError(error);
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

  const loadStudentStatus = async (): Promise<void> => {
    if (!token || isAdmin) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await getStudentAdmissionStatusRequest(token);
      setStudentStatus(response.data);
    } catch (error) {
      setRequestError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPrograms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token || !isAdmin) {
      return;
    }

    setHasPerformedAdminSearch(false);
    setAppliedProgramId("");
    setAppliedSkolskaGodina("");
    setEligibleRows([]);
    setScoreByPrijava({});
    setSelectedRankingId("");
    setRankingItems([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAdmin, skolskaGodina, selectedProgramId]);

  useEffect(() => {
    if (!token || isAdmin) {
      return;
    }

    void loadStudentStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAdmin]);

  useEffect(() => {
    if (!token || !selectedRankingId) {
      setRankingItems([]);
      return;
    }

    const id = Number(selectedRankingId);
    if (!Number.isFinite(id) || id <= 0) {
      return;
    }

    void loadRankingItems(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedRankingId]);

  const onSearchPrijave = async (): Promise<void> => {
    if (!token || !isAdmin || !selectedProgramId) {
      return;
    }

    const programId = selectedProgramId;
    const schoolYear = skolskaGodina;

    setIsSubmitting(true);
    clearFeedback();
    setEligibleRows([]);
    setScoreByPrijava({});
    setSelectedRankingId("");
    setRankingItems([]);

    try {
      const [eligibleResponse, rankingListsResponse] = await Promise.all([
        listEligiblePrijaveRequest(token, schoolYear),
        listRankingListsRequest(token, {
          idPrograma: Number(programId),
          skolskaGodina: schoolYear,
        }),
      ]);

      setAppliedProgramId(programId);
      setAppliedSkolskaGodina(schoolYear);
      setEligibleRows(eligibleResponse.data.rows);
      setHasPerformedAdminSearch(true);

      if (rankingListsResponse.data.rows.length > 0) {
        setSelectedRankingId(String(rankingListsResponse.data.rows[0].idRangListe));
      }
    } catch (error) {
      setRequestError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSaveScore = async (row: EligiblePrijavaRow): Promise<void> => {
    if (!token) {
      return;
    }

    const key = `${row.brojPrijave}|${row.skolskaGodina}`;
    const scoreValue = scoreByPrijava[key] ?? "";
    const points = Number(scoreValue);

    setIsSubmitting(true);
    clearFeedback();

    try {
      await saveExamScoreRequest(token, {
        brojPrijave: row.brojPrijave,
        skolskaGodina: row.skolskaGodina,
        brojPoena: points,
      });

      setSuccessMessage("Rezultat ispita je sacuvan.");
      await loadEligibleRows(appliedSkolskaGodina || skolskaGodina);
    } catch (error) {
      setRequestError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onGenerateRanking = async (): Promise<void> => {
    if (!token || !selectedProgramId) {
      return;
    }

    setIsSubmitting(true);
    clearFeedback();

    try {
      const response = await generateFinalRankingRequest(token, {
        idPrograma: Number(selectedProgramId),
        skolskaGodina,
        brojMesta: selectedProgramSeats ?? 0,
      });

      setAppliedProgramId(selectedProgramId);
      setAppliedSkolskaGodina(skolskaGodina);
      setHasPerformedAdminSearch(true);

      setSuccessMessage(
        `Konacna rang lista je uspesno generisana. Odobreno: ${response.data.approvedCount}, odbijeno: ${response.data.rejectedCount}. Generisanje je sada zakljucano za ovaj studijski program i skolsku godinu.`,
      );
      await loadRankingLists(selectedProgramId, skolskaGodina);
      setSelectedRankingId(String(response.data.idRangListe));
      await loadRankingItems(response.data.idRangListe);
      await loadEligibleRows(skolskaGodina);
    } catch (error) {
      setRequestError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onUploadSignedContract = async (): Promise<void> => {
    if (!token || !signedContractFile) {
      setErrorMessage("Potrebno je da izaberete potpisani ugovor pre otpremanja.");
      return;
    }

    setIsSubmitting(true);
    clearFeedback();

    try {
      await uploadSignedEnrollmentContractRequest(token, signedContractFile);
      setSignedContractFile(null);
      setSuccessMessage(
        "Potpisani ugovor je uspesno otpremljen. Sacekajte potvrdu studentske sluzbe.",
      );
      await loadStudentStatus();
    } catch (error) {
      setRequestError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDownloadOwnContract = async (): Promise<void> => {
    if (!token) {
      return;
    }

    try {
      const result = await downloadStudentEnrollmentContractRequest(token);
      triggerFileDownload(result.blob, result.fileName);
    } catch (error) {
      setRequestError(error);
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
            <h1 className="text-3xl font-bold text-slate-900">Upisni proces</h1>
            <p className="text-sm text-slate-600">
              {isAdmin
                ? "Administracija prijemnog ispita, rang liste i odluke o upisu"
                : "Pracenje statusa prijemnog ispita i odluke o upisu"}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/prijave"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
            >
              Modul prijave
            </Link>
            <Link
              to="/konacne-rang-liste"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
            >
              Konačne rang liste
            </Link>
            {isAdmin ? (
              <>
                <Link
                  to="/finalizacija-upisa"
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
                >
                  Finalizacija upisa
                </Link>
                <Link
                  to="/dashboard"
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
                >
                  Kontrolna tabla
                </Link>
              </>
            ) : (
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
                onClick={handleLogout}
              >
                Odjavi se
              </button>
            )}
          </div>
        </header>

        {isAdmin ? (
          <>
            <section className="rounded-2xl border border-slate-300 bg-white p-4">
              <h2 className="text-lg font-semibold text-slate-900">Pretraga prijava</h2>
              <p className="mt-1 text-sm text-slate-600">
                Izaberite studijski program i školsku godinu, pa prvo prikažite prijave pre nego što
                nastavite ka unosu bodova.
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
                  {selectedProgramSeats != null
                    ? `Predviđen broj mesta: ${selectedProgramSeats}`
                    : "Predviđen broj mesta: -"}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  onClick={() => void onSearchPrijave()}
                  disabled={isSubmitting || !selectedProgramId}
                >
                  Prikaži prijave
                </button>
              </div>
            </section>

            {hasPerformedAdminSearch ? (
              <section className="rounded-2xl border border-slate-300 bg-white">
                <header className="border-b border-slate-200 p-4">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Odobrene prijave i unos rezultata
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Prikaz za{" "}
                    {appliedProgramOption
                      ? buildProgramLabel(
                          appliedProgramOption.nazivPrograma,
                          appliedProgramOption.modul,
                        )
                      : "izabrani studijski program"}
                    {appliedSkolskaGodina ? ` u školskoj godini ${appliedSkolskaGodina}` : ""}.
                  </p>
                </header>

                <DataTable
                  title="Prijave"
                  rows={filteredEligibleRows}
                  emptyMessage="Nema odobrenih prijava za izabrani studijski program i školsku godinu."
                  columns={[
                    { key: "broj", header: "Broj prijave", render: (row) => row.brojPrijave },
                    { key: "ime", header: "Kandidat", render: (row) => row.imePrezime ?? "-" },
                    {
                      key: "studijskiProgram",
                      header: "Studijski program",
                      render: (row) =>
                        row.studijskiProgram ??
                        (row.nazivPrograma && row.modul
                          ? `${row.nazivPrograma} | ${row.modul}`
                          : "-"),
                    },
                    { key: "jmbg", header: "JMBG", render: (row) => row.jmbg ?? "-" },
                    {
                      key: "status",
                      header: "Status upisa",
                      render: (row) => row.rankingStatus ?? "Nije ocenjeno",
                    },
                    {
                      key: "poeni",
                      header: "Poeni",
                      render: (row) =>
                        row.examPoints != null ? (
                          row.examPoints
                        ) : (
                          <input
                            className="w-24 rounded border border-slate-300 px-2 py-1 text-xs"
                            type="number"
                            value={scoreByPrijava[`${row.brojPrijave}|${row.skolskaGodina}`] ?? ""}
                            onChange={(event) => {
                              const key = `${row.brojPrijave}|${row.skolskaGodina}`;
                              setScoreByPrijava((prev) => ({ ...prev, [key]: event.target.value }));
                            }}
                          />
                        ),
                    },
                    {
                      key: "akcije",
                      header: "Akcija",
                      render: (row) => (
                        <button
                          type="button"
                          className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold disabled:opacity-60"
                          onClick={() => void onSaveScore(row)}
                          disabled={isSubmitting}
                        >
                          Sacuvaj poene
                        </button>
                      ),
                    },
                  ]}
                />

                <div className="border-t border-slate-200 p-4">
                  {filteredEligibleRows.length > 0 ? (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-slate-600">
                        Kada su svi bodovi uneti, generiše se konačna rang lista za isti studijski
                        program i školsku godinu.
                      </p>
                      <button
                        type="button"
                        className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                        onClick={() => void onGenerateRanking()}
                        disabled={isSubmitting}
                      >
                        Generiši konačnu rang listu
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600">
                      Nema prijava za prikaz, pa generisanje konačne rang liste nije dostupno.
                    </p>
                  )}
                </div>
              </section>
            ) : (
              <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
                Izaberite studijski program i školsku godinu, pa kliknite na{" "}
                <span className="font-semibold text-slate-900">Prikaži prijave</span>.
              </section>
            )}

            {hasVisibleFinalRanking ? (
              <section className="rounded-2xl border border-slate-300 bg-white">
                <header className="border-b border-slate-200 p-4">
                  <h2 className="text-lg font-semibold text-slate-900">Konačna rang lista</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {appliedProgramOption
                      ? buildProgramLabel(
                          appliedProgramOption.nazivPrograma,
                          appliedProgramOption.modul,
                        )
                      : "Izabrani studijski program"}
                    {appliedSkolskaGodina ? ` u školskoj godini ${appliedSkolskaGodina}` : ""}.
                  </p>
                </header>

                <DataTable
                  title="Rang stavki"
                  rows={rankingItems}
                  emptyMessage="Konačna rang lista još nije generisana za izabrani studijski program."
                  columns={[
                    { key: "rang", header: "Rang", render: (row) => row.rangMesto ?? "-" },
                    {
                      key: "prijava",
                      header: "Broj prijave",
                      render: (row) => row.brojPrijave ?? "-",
                    },
                    { key: "ime", header: "Kandidat", render: (row) => row.imePrezime ?? "-" },
                    {
                      key: "program",
                      header: "Studijski program",
                      render: (row) => row.studijskiProgram ?? "-",
                    },
                    { key: "poeni", header: "Poeni", render: (row) => row.brojPoena ?? "-" },
                    { key: "status", header: "Odluka", render: (row) => row.status ?? "-" },
                  ]}
                />

                <div className="border-t border-slate-200 p-4">
                  <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    {finalRankingLockedMessage}
                  </p>
                  {appliedProgramSeats != null ? (
                    <p className="mt-2 text-sm text-slate-600">
                      Predviđen broj mesta za ovu rang listu: {appliedProgramSeats}
                    </p>
                  ) : null}
                  <p className="mt-3 text-sm text-slate-600">
                    Potvrdu upisa i obradu otpremljenih ugovora nastavite kroz modul Finalizacija
                    upisa.
                  </p>
                  <Link
                    to="/finalizacija-upisa"
                    className="mt-2 inline-block rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold"
                  >
                    Otvori finalizaciju upisa
                  </Link>
                </div>
              </section>
            ) : null}
          </>
        ) : (
          <section
            className={`rounded-2xl p-6 ${
              studentStatus?.stage === "UpisOdbijen"
                ? "border border-red-300 bg-red-50"
                : studentStatus?.stage === "UpisZavrsen"
                  ? "border border-emerald-300 bg-emerald-50"
                  : "border border-slate-300 bg-white"
            }`}
          >
            {isLoading ? <p className="text-sm text-slate-600">Ucitavanje statusa...</p> : null}

            {studentStatus ? (
              <div className="space-y-4">
                <article
                  className={`rounded-xl p-4 ${
                    studentStatus.stage === "UpisOdbijen"
                      ? "border border-red-200 bg-red-100"
                      : studentStatus.stage === "UpisZavrsen"
                        ? "border border-emerald-200 bg-emerald-100"
                        : "border border-slate-200 bg-slate-50"
                  }`}
                >
                  <h2 className="text-lg font-semibold text-slate-900">Status upisnog procesa</h2>
                  <p className="mt-1 text-sm text-slate-700">
                    {stageDescription[studentStatus.stage]}
                  </p>
                </article>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <article className="rounded-xl border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">Broj prijave</p>
                    <p className="text-sm font-semibold">{studentStatus.brojPrijave ?? "-"}</p>
                  </article>
                  <article className="rounded-xl border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">Skolska godina</p>
                    <p className="text-sm font-semibold">{studentStatus.skolskaGodina ?? "-"}</p>
                  </article>
                  <article className="rounded-xl border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">Studijski program</p>
                    <p className="text-sm font-semibold">{studentStatus.studijskiProgram ?? "-"}</p>
                  </article>
                  <article className="rounded-xl border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">Poeni / rang</p>
                    <p className="text-sm font-semibold">
                      {studentStatus.brojPoena ?? "-"} / {studentStatus.rangMesto ?? "-"}
                    </p>
                  </article>
                </div>

                {studentStatus.stage === "OdobrenUpis" ? (
                  <article className="rounded-xl border border-emerald-300 bg-emerald-50 p-4">
                    <h3 className="text-base font-semibold text-emerald-900">
                      Finalni korak: potpisani ugovor o studiranju
                    </h3>
                    <p className="mt-1 text-sm text-emerald-900">
                      {studentStatus.enrollmentFinalizationStatus === "UgovorOtpremljen"
                        ? "Ugovor je otpremljen. Sacekajte da studentska sluzba potvrdi finalizaciju upisa."
                        : "Otpremite potpisani ugovor kako bi administracija mogla da finalizuje upis i dodeli broj indeksa."}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm"
                        onChange={(event) => setSignedContractFile(event.target.files?.[0] ?? null)}
                      />
                      <button
                        type="button"
                        className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                        onClick={() => void onUploadSignedContract()}
                        disabled={isSubmitting}
                      >
                        Otpremi potpisani ugovor
                      </button>
                      {studentStatus.hasSignedContract ? (
                        <button
                          type="button"
                          className="rounded-lg border border-emerald-400 px-3 py-2 text-sm font-semibold text-emerald-900"
                          onClick={() => void onDownloadOwnContract()}
                        >
                          Preuzmi otpremljeni ugovor
                        </button>
                      ) : null}
                    </div>

                    <p className="mt-2 text-xs text-emerald-900">
                      Ugovor otpremljen: {formatDateTime(studentStatus.signedContractUploadedAt)}
                    </p>
                  </article>
                ) : null}

                {studentStatus.stage === "UpisZavrsen" ? (
                  <article className="rounded-xl border border-emerald-300 bg-white p-4">
                    <h3 className="text-base font-semibold text-emerald-900">
                      Upis je finalizovan
                    </h3>
                    <p className="mt-1 text-sm text-slate-700">
                      Broj indeksa:{" "}
                      <span className="font-semibold">{studentStatus.brojIndeksa ?? "-"}</span>
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      Datum finalizacije: {formatDateTime(studentStatus.datumUpisa)}
                    </p>
                    {studentStatus.hasSignedContract ? (
                      <button
                        type="button"
                        className="mt-3 rounded-lg border border-emerald-400 px-3 py-2 text-sm font-semibold text-emerald-900"
                        onClick={() => void onDownloadOwnContract()}
                      >
                        Preuzmi potpisani ugovor
                      </button>
                    ) : null}
                  </article>
                ) : null}
              </div>
            ) : null}
          </section>
        )}

        {successMessage ? (
          <OracleMessageCard title="Uspesno" message={successMessage} variant="success" />
        ) : null}

        {errorMessage ? (
          <OracleMessageCard
            title="Greska"
            message={errorMessage}
            oracleDetails={oracleDetails}
            variant="error"
          />
        ) : null}
      </div>
    </main>
  );
}
