import { useEffect, useMemo, useState, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { OracleMessageCard } from "../../components/feedback/OracleMessageCard";
import { toApiClientError } from "../../services/api";
import {
  downloadStudentSignedEnrollmentContractRequest,
  getStudentAdmissionStatusRequest,
  uploadSignedEnrollmentContractRequest,
} from "../../services/studentUpisService";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { logoutSuccess } from "../../redux/slices/authSlice";
import type { StudentAdmissionStatus } from "../../types/models/upis";
import { triggerFileDownload } from "../../utils/utils";

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

export default function UpisPage(): ReactElement {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);

  const [status, setStatus] = useState<StudentAdmissionStatus | null>(null);
  const [selectedContractFile, setSelectedContractFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [oracleDetails, setOracleDetails] = useState<string | undefined>(undefined);

  const canUploadContract = useMemo(() => status?.stage === "OdobrenUpis", [status]);

  const loadStatus = async (): Promise<void> => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setOracleDetails(undefined);

    try {
      const response = await getStudentAdmissionStatusRequest(token);
      setStatus(response.data);
    } catch (error) {
      const parsed = toApiClientError(error);
      setErrorMessage(`${parsed.title}: ${parsed.message}`);
      setOracleDetails(parsed.oracleDetails);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const onUploadContract = async (): Promise<void> => {
    if (!token) {
      return;
    }

    if (!selectedContractFile) {
      setErrorMessage("Potrebno je da izaberete potpisani ugovor pre otpremanja.");
      return;
    }

    setIsUploading(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    setOracleDetails(undefined);

    try {
      await uploadSignedEnrollmentContractRequest(token, selectedContractFile);
      setSelectedContractFile(null);
      setSuccessMessage("Potpisani ugovor je uspesno otpremljen.");
      await loadStatus();
    } catch (error) {
      const parsed = toApiClientError(error);
      setErrorMessage(`${parsed.title}: ${parsed.message}`);
      setOracleDetails(parsed.oracleDetails);
    } finally {
      setIsUploading(false);
    }
  };

  const onDownloadContract = async (): Promise<void> => {
    if (!token) {
      return;
    }

    setIsDownloading(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    setOracleDetails(undefined);

    try {
      const result = await downloadStudentSignedEnrollmentContractRequest(token);
      triggerFileDownload(result.blob, result.fileName);
      setSuccessMessage("Potpisani ugovor je uspesno preuzet.");
    } catch (error) {
      const parsed = toApiClientError(error);
      setErrorMessage(`${parsed.title}: ${parsed.message}`);
      setOracleDetails(parsed.oracleDetails);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleLogout = (): void => {
    dispatch(logoutSuccess());
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-300 bg-white p-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Upisni proces</h1>
            <p className="text-sm text-slate-600">
              Pracenje statusa prijemnog ispita i odluke o upisu
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/prijave"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
            >
              Modul prijave
            </Link>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
              onClick={handleLogout}
            >
              Odjavi se
            </button>
          </div>
        </header>

        <section
          className={`rounded-2xl p-6 ${
            status?.stage === "UpisOdbijen"
              ? "border border-red-300 bg-red-50"
              : status?.stage === "UpisZavrsen"
                ? "border border-emerald-300 bg-emerald-50"
                : "border border-slate-300 bg-white"
          }`}
        >
          {isLoading ? <p className="text-sm text-slate-600">Ucitavanje statusa...</p> : null}

          {status ? (
            <div className="space-y-4">
              <article
                className={`rounded-xl p-4 ${
                  status.stage === "UpisOdbijen"
                    ? "border border-red-200 bg-red-100"
                    : status.stage === "UpisZavrsen"
                      ? "border border-emerald-200 bg-emerald-100"
                      : "border border-slate-200 bg-slate-50"
                }`}
              >
                <h2 className="text-lg font-semibold text-slate-900">Status upisnog procesa</h2>
                <p className="mt-1 text-sm text-slate-700">{stageDescription[status.stage]}</p>
              </article>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Broj prijave</p>
                  <p className="text-sm font-semibold">{status.brojPrijave ?? "-"}</p>
                </article>
                <article className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Skolska godina</p>
                  <p className="text-sm font-semibold">{status.skolskaGodina ?? "-"}</p>
                </article>
                <article className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Studijski program</p>
                  <p className="text-sm font-semibold">{status.studijskiProgram ?? "-"}</p>
                </article>
                <article className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Poeni / rang</p>
                  <p className="text-sm font-semibold">
                    {status.brojPoena ?? "-"} / {status.rangMesto ?? "-"}
                  </p>
                </article>
              </div>

              {canUploadContract ? (
                <article className="rounded-xl border border-emerald-300 bg-emerald-50 p-4">
                  <h3 className="text-base font-semibold text-emerald-900">
                    Finalni korak: potpisani ugovor o studiranju
                  </h3>
                  <p className="mt-1 text-sm text-emerald-900">
                    {status.enrollmentFinalizationStatus === "UgovorOtpremljen"
                      ? "Ugovor je otpremljen. Sacekajte da studentska sluzba potvrdi finalizaciju upisa."
                      : "Otpremite potpisani ugovor kako bi administracija mogla da finalizuje upis i dodeli broj indeksa."}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <input
                      type="file"
                      className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm"
                      onChange={(event) => setSelectedContractFile(event.target.files?.[0] ?? null)}
                    />
                    <button
                      type="button"
                      className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                      onClick={() => {
                        void onUploadContract();
                      }}
                      disabled={isUploading}
                    >
                      {isUploading ? "Otpremanje..." : "Otpremi potpisani ugovor"}
                    </button>
                    {status.hasSignedContract ? (
                      <button
                        type="button"
                        className="rounded-lg border border-emerald-400 px-3 py-2 text-sm font-semibold text-emerald-900"
                        onClick={() => {
                          void onDownloadContract();
                        }}
                        disabled={isDownloading}
                      >
                        {isDownloading ? "Preuzimanje..." : "Preuzmi otpremljeni ugovor"}
                      </button>
                    ) : null}
                  </div>

                  <p className="mt-2 text-xs text-emerald-900">
                    Ugovor otpremljen: {formatDateTime(status.signedContractUploadedAt)}
                  </p>
                </article>
              ) : null}

              {status.stage === "UpisZavrsen" ? (
                <article className="rounded-xl border border-emerald-300 bg-white p-4">
                  <h3 className="text-base font-semibold text-emerald-900">Upis je finalizovan</h3>
                  <p className="mt-1 text-sm text-slate-700">
                    Broj indeksa: <span className="font-semibold">{status.brojIndeksa ?? "-"}</span>
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    Datum finalizacije: {formatDateTime(status.datumUpisa)}
                  </p>
                  {status.hasSignedContract ? (
                    <button
                      type="button"
                      className="mt-3 rounded-lg border border-emerald-400 px-3 py-2 text-sm font-semibold text-emerald-900"
                      onClick={() => {
                        void onDownloadContract();
                      }}
                      disabled={isDownloading}
                    >
                      {isDownloading ? "Preuzimanje..." : "Preuzmi potpisani ugovor"}
                    </button>
                  ) : null}
                </article>
              ) : null}

              <div className="flex justify-end">
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
                  onClick={() => {
                    void loadStatus();
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? "Ucitavanje..." : "Osvezi status"}
                </button>
              </div>
            </div>
          ) : null}
        </section>

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
