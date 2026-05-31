import { useEffect, useState, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { logoutSuccess } from "../../redux/slices/authSlice";
import { OracleMessageCard } from "../../components/feedback/OracleMessageCard";
import { toApiClientError } from "../../services/api";
import {
  clearPrijaveError,
  loadPrijaveRows,
  setPrijavaPage,
  setPrijavaPageSize,
  setPrijavaPartitionFilter,
  setPrijavaSearch,
  setPrijavaSortValue,
  setPrijavaStatusFilter,
} from "../../redux/slices/prijaveSlice";
import AdminPrijaveSection from "./AdminPrijaveSection";
import StudentPrijavaFlowSection from "./StudentPrijavaFlowSection";

export default function PrijavePage(): ReactElement {
  const dispatch = useAppDispatch();
  const { token, role } = useAppSelector((state) => state.auth);

  const isAdmin = role === "admin";
  const {
    rows,
    search,
    sortValue,
    statusFilter,
    partitionFilter,
    page,
    pageSize,
    isLoadingRows,
    errorMessage: globalErrorMessage,
    oracleDetails: globalOracleDetails,
  } = useAppSelector((state) => state.prijave);

  const hasNextPage = rows.length === pageSize;

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(null);
  const [localOracleDetails, setLocalOracleDetails] = useState<string | undefined>(undefined);

  const handleLogout = (): void => {
    dispatch(logoutSuccess());
  };

  const clearFeedback = (): void => {
    setSuccessMessage(null);
    setLocalErrorMessage(null);
    setLocalOracleDetails(undefined);
    dispatch(clearPrijaveError());
  };

  const setRequestError = (error: unknown): void => {
    const parsed = toApiClientError(error);
    setLocalErrorMessage(`${parsed.title}: ${parsed.message}`);
    setLocalOracleDetails(parsed.oracleDetails);
  };

  const loadRows = async (): Promise<void> => {
    dispatch(clearPrijaveError());
    await dispatch(loadPrijaveRows());
  };

  useEffect(() => {
    if (isAdmin) {
      void loadRows();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAdmin]);

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-300 bg-white p-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Prijave</h1>
            <p className="text-sm text-slate-600">
              {isAdmin
                ? "Administracija prijava: pretraga i pregled detalja prijave"
                : "Podnosenje prijave i otpremanje dokumentacije za master studije"}
            </p>
          </div>
          {isAdmin ? (
            <div className="flex gap-2">
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
          ) : (
            <div className="flex gap-2">
              <Link
                to="/upis"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100"
              >
                Status upisa
              </Link>
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100"
                onClick={handleLogout}
              >
                Odjavi se
              </button>
            </div>
          )}
        </header>

        {isAdmin ? (
          <>
            <AdminPrijaveSection
              rows={rows}
              search={search}
              sortValue={sortValue}
              statusFilter={statusFilter}
              partitionFilter={partitionFilter}
              isLoadingRows={isLoadingRows}
              onSearchChange={(value) => dispatch(setPrijavaSearch(value))}
              onSortChange={(value) => dispatch(setPrijavaSortValue(value))}
              onStatusFilterChange={(value) => dispatch(setPrijavaStatusFilter(value))}
              onPartitionFilterChange={(value) => dispatch(setPrijavaPartitionFilter(value))}
              onApply={() => {
                void loadRows();
              }}
              onRefresh={() => {
                void loadRows();
              }}
            />

            <section className="rounded-2xl border border-slate-300 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-slate-700">
                  Strana {page}
                  {rows.length === 0 ? " | Nema rezultata" : ` | Prikazano: ${rows.length}`}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-sm text-slate-700" htmlFor="prijave-page-size">
                    Po strani
                  </label>
                  <select
                    id="prijave-page-size"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={String(pageSize)}
                    onChange={(event) => {
                      dispatch(setPrijavaPageSize(Number(event.target.value)));
                      void loadRows();
                    }}
                    disabled={isLoadingRows}
                  >
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                  <button
                    type="button"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100 disabled:opacity-60"
                    onClick={() => {
                      dispatch(setPrijavaPage(Math.max(1, page - 1)));
                      void loadRows();
                    }}
                    disabled={isLoadingRows || page <= 1}
                  >
                    Prethodna
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100 disabled:opacity-60"
                    onClick={() => {
                      dispatch(setPrijavaPage(page + 1));
                      void loadRows();
                    }}
                    disabled={isLoadingRows || !hasNextPage}
                  >
                    Sledeca
                  </button>
                </div>
              </div>
            </section>
          </>
        ) : (
          <StudentPrijavaFlowSection
            onClearFeedback={clearFeedback}
            onSetRequestError={setRequestError}
            onSetSuccessMessage={setSuccessMessage}
            onSetValidationError={(message) => {
              setLocalErrorMessage(message);
              setLocalOracleDetails(undefined);
            }}
          />
        )}

        {successMessage ? (
          <OracleMessageCard title="Uspesno" message={successMessage} variant="success" />
        ) : null}

        {localErrorMessage ? (
          <OracleMessageCard
            title="Greska"
            message={localErrorMessage}
            oracleDetails={localOracleDetails}
            variant="error"
          />
        ) : null}

        {globalErrorMessage ? (
          <OracleMessageCard
            title="Greska"
            message={globalErrorMessage}
            oracleDetails={globalOracleDetails}
            variant="error"
          />
        ) : null}
      </div>
    </main>
  );
}
