import { useEffect, useMemo, useState, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { OracleMessageCard } from "../../components/feedback/OracleMessageCard";
import { DataTable } from "../../components/ui/DataTable";
import { toApiClientError } from "../../services/api";
import {
  confirmEnrollmentFinalizationRequest,
  downloadEnrollmentContractByPrijavaRequest,
  downloadStudentEnrollmentContractRequest,
  generateFinalRankingRequest,
  getStudentAdmissionStatusRequest,
  listPendingEnrollmentFinalizationsRequest,
  listEligiblePrijaveRequest,
  listRankingItemsRequest,
  listRankingListsRequest,
  listStudyProgramsRequest,
  saveExamScoreRequest,
  uploadSignedEnrollmentContractRequest,
} from "../../services/upisService";
import type {
  EligiblePrijavaRow,
  PendingEnrollmentFinalizationRow,
  RankingItem,
  StudentAdmissionStatus,
  StudyProgramOption,
} from "../../types/models/upis";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { logoutSuccess } from "../../redux/slices/authSlice";

const getCurrentSchoolYear = (): string => {
  const year = new Date().getFullYear();
  return `${year}`;
};

const buildProgramLabel = (program: StudyProgramOption): string =>
  `${program.nazivPrograma} | ${program.modul}`.slice(0, 100);

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

const formatDateTime = (value: string | null): string => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("sr-RS");
};

const triggerFileDownload = (blob: Blob, fileName: string): void => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
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
  const [skolskaGodina, setSkolskaGodina] = useState<string>(getCurrentSchoolYear());

  const [eligibleRows, setEligibleRows] = useState<EligiblePrijavaRow[]>([]);
  const [scoreByPrijava, setScoreByPrijava] = useState<Record<string, string>>({});

  const [selectedRankingId, setSelectedRankingId] = useState<string>("");
  const [rankingItems, setRankingItems] = useState<RankingItem[]>([]);
  const [pendingFinalizations, setPendingFinalizations] = useState<
    PendingEnrollmentFinalizationRow[]
  >([]);
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

  const selectedProgramSeats = selectedProgramOption?.brojDostupnihMesta ?? null;

  const filteredEligibleRows = useMemo(() => {
    if (!selectedProgramId) {
      return eligibleRows;
    }

    return eligibleRows.filter(
      (row) => row.idPrograma != null && String(row.idPrograma) === selectedProgramId,
    );
  }, [eligibleRows, selectedProgramId]);

  const canGenerateFinalRanking = useMemo(() => {
    if (!selectedProgramId || selectedProgramSeats == null || selectedProgramSeats <= 0) {
      return false;
    }

    if (filteredEligibleRows.length === 0) {
      return false;
    }

    return filteredEligibleRows.every((row) => row.examPoints != null);
  }, [filteredEligibleRows, selectedProgramId, selectedProgramSeats]);

  const hasVisibleFinalRanking = useMemo(
    () =>
      rankingItems.length > 0 &&
      rankingItems.every((item) => item.status === "Odobrena" || item.status === "Odbijena"),
    [rankingItems],
  );

  const isFinalRankingGenerationLocked = hasVisibleFinalRanking;

  const finalRankingLockedMessage = useMemo(() => {
    const programLabel = selectedProgramOption
      ? buildProgramLabel(selectedProgramOption)
      : "izabrani studijski program";

    return `Konacna rang lista za ${programLabel} u skolskoj godini ${skolskaGodina} je vec generisana i ne moze se ponovo generisati.`;
  }, [selectedProgramOption, skolskaGodina]);

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

  const loadEligibleRows = async (): Promise<void> => {
    if (!token || !isAdmin) {
      return;
    }

    try {
      const response = await listEligiblePrijaveRequest(token, skolskaGodina);
      setEligibleRows(response.data.rows);
    } catch (error) {
      setRequestError(error);
    }
  };

  const loadRankingLists = async (): Promise<void> => {
    if (!token) {
      return;
    }

    try {
      const response = await listRankingListsRequest(token, {
        idPrograma: selectedProgramId ? Number(selectedProgramId) : undefined,
        skolskaGodina: skolskaGodina || undefined,
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

  const loadPendingFinalizations = async (): Promise<void> => {
    if (!token || !isAdmin) {
      return;
    }

    try {
      const response = await listPendingEnrollmentFinalizationsRequest(token, skolskaGodina);
      setPendingFinalizations(response.data.rows);
    } catch (error) {
      setRequestError(error);
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

    void loadEligibleRows();
    void loadRankingLists();
    void loadPendingFinalizations();
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

  const onSaveScore = async (row: EligiblePrijavaRow): Promise<void> => {
    if (!token) {
      return;
    }

    const key = `${row.brojPrijave}|${row.skolskaGodina}`;
    const scoreValue = scoreByPrijava[key] ?? "";
    const points = Number(scoreValue);

    if (!Number.isFinite(points) || points < 0 || points > 100) {
      setErrorMessage("Unesite validan broj poena izmedju 0 i 100.");
      return;
    }

    setIsSubmitting(true);
    clearFeedback();

    try {
      await saveExamScoreRequest(token, {
        brojPrijave: row.brojPrijave,
        skolskaGodina: row.skolskaGodina,
        brojPoena: points,
      });

      setSuccessMessage("Rezultat ispita je sacuvan.");
      await loadEligibleRows();
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

    if (isFinalRankingGenerationLocked) {
      setErrorMessage(finalRankingLockedMessage);
      return;
    }

    if (!canGenerateFinalRanking) {
      setErrorMessage(
        "Pre generisanja konacne rang liste morate uneti bodove za sve odobrene prijave izabranog studijskog programa.",
      );
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

      setSuccessMessage(
        `Konacna rang lista je uspesno generisana. Odobreno: ${response.data.approvedCount}, odbijeno: ${response.data.rejectedCount}. Generisanje je sada zakljucano za ovaj studijski program i skolsku godinu.`,
      );
      await loadRankingLists();
      setSelectedRankingId(String(response.data.idRangListe));
      await loadRankingItems(response.data.idRangListe);
      await loadEligibleRows();
      await loadPendingFinalizations();
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

  const onDownloadPendingContract = async (
    brojPrijave: number,
    finalizacijaGodina: string,
  ): Promise<void> => {
    if (!token) {
      return;
    }

    try {
      const result = await downloadEnrollmentContractByPrijavaRequest(
        token,
        brojPrijave,
        finalizacijaGodina,
      );
      triggerFileDownload(result.blob, result.fileName);
    } catch (error) {
      setRequestError(error);
    }
  };

  const onConfirmEnrollment = async (
    brojPrijave: number,
    finalizacijaGodina: string,
  ): Promise<void> => {
    if (!token) {
      return;
    }

    setIsSubmitting(true);
    clearFeedback();

    try {
      const response = await confirmEnrollmentFinalizationRequest(
        token,
        brojPrijave,
        finalizacijaGodina,
      );
      setSuccessMessage(
        `Upis je finalizovan. Dodeljen broj indeksa: ${response.data.brojIndeksa ?? "-"}.`,
      );
      await loadPendingFinalizations();
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
            {isAdmin ? (
              <Link
                to="/dashboard"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
              >
                Kontrolna tabla
              </Link>
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
              <h2 className="text-lg font-semibold text-slate-900">Parametri upisnog ciklusa</h2>
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
                    const label = buildProgramLabel(program);
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
                  onClick={() => void onGenerateRanking()}
                  disabled={
                    isSubmitting || !canGenerateFinalRanking || isFinalRankingGenerationLocked
                  }
                >
                  Generisi konacnu rang listu
                </button>
              </div>
              {isFinalRankingGenerationLocked ? (
                <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  {finalRankingLockedMessage}
                </p>
              ) : (
                <p className="mt-3 text-sm text-slate-600">
                  Konacna rang lista se moze generisati tek kada su bodovi uneti za sve odobrene
                  prijave izabranog studijskog programa.
                </p>
              )}
            </section>

            <DataTable
              title="Odobrene prijave i unos rezultata"
              rows={filteredEligibleRows}
              emptyMessage="Nema odobrenih prijava za izabranu skolsku godinu."
              columns={[
                { key: "broj", header: "Broj prijave", render: (row) => row.brojPrijave },
                { key: "ime", header: "Kandidat", render: (row) => row.imePrezime ?? "-" },
                {
                  key: "studijskiProgram",
                  header: "Studijski program",
                  render: (row) =>
                    row.studijskiProgram ??
                    (row.nazivPrograma && row.modul ? `${row.nazivPrograma} | ${row.modul}` : "-"),
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
                        min={0}
                        max={100}
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
                      disabled={isSubmitting || row.examPoints != null}
                    >
                      {row.examPoints != null ? "Vec uneto" : "Sacuvaj poene"}
                    </button>
                  ),
                },
              ]}
            />

            {hasVisibleFinalRanking ? (
              <DataTable
                title={`Konacna rang lista za studijski program ${selectedProgramOption ? buildProgramLabel(selectedProgramOption) : ""} u skolskoj godini ${skolskaGodina}`}
                rows={rankingItems}
                emptyMessage="Konacna rang lista jos nije generisana za izabrani studijski program."
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
            ) : null}

            <DataTable
              title="Kandidati sa otpremljenim ugovorom (cekaju potvrdu)"
              rows={pendingFinalizations}
              emptyMessage="Nema kandidata koji cekaju finalnu potvrdu upisa."
              columns={[
                { key: "broj", header: "Broj prijave", render: (row) => row.brojPrijave },
                { key: "godina", header: "Skolska godina", render: (row) => row.skolskaGodina },
                { key: "ime", header: "Kandidat", render: (row) => row.imePrezime ?? "-" },
                {
                  key: "program",
                  header: "Studijski program",
                  render: (row) => row.studijskiProgram ?? "-",
                },
                {
                  key: "rezultat",
                  header: "Poeni / rang",
                  render: (row) => `${row.brojPoena ?? "-"} / ${row.rangMesto ?? "-"}`,
                },
                {
                  key: "ugovorAt",
                  header: "Ugovor otpremljen",
                  render: (row) => formatDateTime(row.signedContractUploadedAt),
                },
                {
                  key: "akcija",
                  header: "Akcija",
                  render: (row) => (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold"
                        onClick={() =>
                          void onDownloadPendingContract(row.brojPrijave, row.skolskaGodina)
                        }
                      >
                        Preuzmi ugovor
                      </button>
                      <button
                        type="button"
                        className="rounded bg-emerald-700 px-2 py-1 text-xs font-semibold text-white disabled:opacity-60"
                        onClick={() => void onConfirmEnrollment(row.brojPrijave, row.skolskaGodina)}
                        disabled={isSubmitting}
                      >
                        Potvrdi upis
                      </button>
                    </div>
                  ),
                },
              ]}
            />
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
