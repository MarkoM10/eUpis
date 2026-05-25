import { useEffect, useState, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { OracleMessageCard } from "../../components/feedback/OracleMessageCard";
import { DataTable } from "../../components/ui/DataTable";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { logoutSuccess } from "../../redux/slices/authSlice";
import { toApiClientError } from "../../services/api";
import {
  confirmEnrollmentFinalizationRequest,
  downloadEnrollmentContractByPrijavaRequest,
  listPendingEnrollmentFinalizationsRequest,
} from "../../services/upisService";
import type { PendingEnrollmentFinalizationRow } from "../../types/models/upis";
import { formatDateTime, getCurrentYearString, triggerFileDownload } from "../../utils/utils";

export default function FinalizacijaUpisaPage(): ReactElement {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);

  const [skolskaGodina, setSkolskaGodina] = useState<string>(getCurrentYearString());
  const [rows, setRows] = useState<PendingEnrollmentFinalizationRow[]>([]);
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

  const handleLogout = (): void => {
    dispatch(logoutSuccess());
  };

  const loadRows = async (): Promise<void> => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    clearFeedback();

    try {
      const response = await listPendingEnrollmentFinalizationsRequest(token, skolskaGodina);
      setRows(response.data.rows);
    } catch (error) {
      setRequestError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const onDownloadContract = async (row: PendingEnrollmentFinalizationRow): Promise<void> => {
    if (!token) {
      return;
    }

    try {
      const result = await downloadEnrollmentContractByPrijavaRequest(
        token,
        row.brojPrijave,
        row.skolskaGodina,
      );
      triggerFileDownload(result.blob, result.fileName);
    } catch (error) {
      setRequestError(error);
    }
  };

  const onConfirmEnrollment = async (row: PendingEnrollmentFinalizationRow): Promise<void> => {
    if (!token) {
      return;
    }

    setIsSubmitting(true);
    clearFeedback();

    try {
      const response = await confirmEnrollmentFinalizationRequest(
        token,
        row.brojPrijave,
        row.skolskaGodina,
      );
      setSuccessMessage(
        `Upis je finalizovan. Dodeljen broj indeksa: ${response.data.brojIndeksa ?? "-"}.`,
      );
      await loadRows();
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
            <h1 className="text-3xl font-bold text-slate-900">Finalizacija upisa</h1>
            <p className="text-sm text-slate-600">
              Kandidati sa otpremljenim ugovorima koji čekaju administrativnu potvrdu upisa.
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
              to="/konacne-rang-liste"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
            >
              Konačne rang liste
            </Link>
            <Link
              to="/dashboard"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
            >
              Kontrolna tabla
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

        <section className="rounded-2xl border border-slate-300 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900">Pretraga finalizacije</h2>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div className="min-w-[220px]">
              <label className="mb-1 block text-xs text-slate-600">Školska godina</label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={skolskaGodina}
                onChange={(event) => setSkolskaGodina(event.target.value)}
                placeholder="Skolska godina"
              />
            </div>
            <button
              type="button"
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              onClick={() => void loadRows()}
              disabled={isLoading}
            >
              {isLoading ? "Učitavanje..." : "Prikaži kandidate"}
            </button>
          </div>
        </section>

        <DataTable
          title="Kandidati sa otpremljenim ugovorom (čekaju potvrdu)"
          rows={rows}
          emptyMessage="Nema kandidata koji čekaju finalnu potvrdu upisa."
          columns={[
            { key: "broj", header: "Broj prijave", render: (row) => row.brojPrijave },
            { key: "godina", header: "Školska godina", render: (row) => row.skolskaGodina },
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
                    onClick={() => void onDownloadContract(row)}
                  >
                    Preuzmi ugovor
                  </button>
                  <button
                    type="button"
                    className="rounded bg-emerald-700 px-2 py-1 text-xs font-semibold text-white disabled:opacity-60"
                    onClick={() => void onConfirmEnrollment(row)}
                    disabled={isSubmitting}
                  >
                    Potvrdi upis
                  </button>
                </div>
              ),
            },
          ]}
        />

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
