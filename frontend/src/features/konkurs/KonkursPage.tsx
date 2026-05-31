import { useState, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { OracleMessageCard } from "../../components/feedback/OracleMessageCard";
import { useAppSelector } from "../../redux/hooks";
import { toApiClientError } from "../../services/api";
import AdminKonkursSection from "./AdminKonkursSection";
import KonkursWorkflowSection from "./KonkursWorkflowSection";

export default function KonkursPage(): ReactElement {
  const token = useAppSelector((state) => state.auth.token);

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

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-300 bg-white p-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Konkurs</h1>
            <p className="text-sm text-slate-600">Administracija konkursa za master studije</p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/prijave"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100"
            >
              Modul prijave
            </Link>
            <Link
              to="/dashboard"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100"
            >
              Nazad na kontrolnu tablu
            </Link>
          </div>
        </header>

        {token ? (
          <>
            <AdminKonkursSection
              token={token}
              onClearFeedback={clearFeedback}
              onRequestError={setRequestError}
              onSuccess={setSuccessMessage}
            />
            <KonkursWorkflowSection
              token={token}
              onClearFeedback={clearFeedback}
              onRequestError={setRequestError}
              onSuccess={setSuccessMessage}
            />
          </>
        ) : null}

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
