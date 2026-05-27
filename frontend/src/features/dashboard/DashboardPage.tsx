import { useEffect, useState, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { logoutSuccess } from "../../redux/slices/authSlice";
import { DataTable } from "../../components/ui/DataTable";
import { OracleMessageCard } from "../../components/feedback/OracleMessageCard";
import { toApiClientError } from "../../services/api";
import { listAuditLogsRequest } from "../../services/auditService";
import { listPrijaveRequest } from "../../services/prijaveService";
import type { ActivityRow } from "../../types/models/dashboard";
import { formatTimeLabel, getCurrentYearString, toTimestamp } from "../../utils/utils";

type DashboardActivityRow = ActivityRow & {
  timestamp: number;
};

const moduleLabels: Record<string, string> = {
  PRIJAVA: "Prijava",
  KANDIDAT: "Kandidat",
  KONACNARANGLISTA: "Rang lista",
  STAVKARANGLISTE: "Stavka rang liste",
  UPIS_FINALIZACIJA: "Finalizacija upisa",
};

const operationLabels: Record<string, string> = {
  INSERT: "Kreirano",
  UPDATE: "Izmenjeno",
  DELETE: "Obrisano",
};

interface DashboardMetrics {
  totalPrijave: number;
  approvedPrijave: number;
  rejectedPrijave: number;
}

const emptyMetrics: DashboardMetrics = {
  totalPrijave: 0,
  approvedPrijave: 0,
  rejectedPrijave: 0,
};

export default function DashboardPage(): ReactElement {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const [metrics, setMetrics] = useState<DashboardMetrics>(emptyMetrics);
  const [activityRows, setActivityRows] = useState<DashboardActivityRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [oracleDetails, setOracleDetails] = useState<string | undefined>(undefined);

  const handleLogout = (): void => {
    dispatch(logoutSuccess());
  };

  const loadDashboardData = async (): Promise<void> => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setOracleDetails(undefined);

    try {
      const [prijaveResponse, auditResponse] = await Promise.all([
        listPrijaveRequest(token, {
          page: 1,
          pageSize: 5000,
          sortBy: "datum_prijave",
          sortDirection: "desc",
        }),
        listAuditLogsRequest(token, 200),
      ]);

      const prijaveRows = prijaveResponse.data.rows ?? [];

      const approvedPrijave = prijaveRows.filter((row) => row.statusPrijave === "Odobrena").length;
      const rejectedPrijave = prijaveRows.filter((row) => row.statusPrijave === "Odbijena").length;

      setMetrics({
        totalPrijave: prijaveRows.length,
        approvedPrijave,
        rejectedPrijave,
      });

      const mappedActivities: DashboardActivityRow[] = (auditResponse.data.rows ?? [])
        .map((row) => {
          const moduleName = moduleLabels[row.tableName] ?? row.tableName;
          const operation = operationLabels[row.operation] ?? row.operation;
          const entityKey = row.entityKey ? ` (${row.entityKey})` : "";
          const details = row.details ? ` - ${row.details}` : "";

          return {
            time: formatTimeLabel(row.eventTime),
            module: moduleName,
            description: `${operation}${entityKey}${details}`,
            user: row.dbUser ?? "-",
            timestamp: toTimestamp(row.eventTime),
          };
        })
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 200);

      setActivityRows(mappedActivities);
    } catch (error) {
      const parsed = toApiClientError(error);
      setErrorMessage(`${parsed.title}: ${parsed.message}`);
      setOracleDetails(parsed.oracleDetails);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboardData();
  }, [token]);

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-300 bg-white p-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Kontrolna tabla</h1>
            <p className="text-sm text-slate-600">Upisni ciklus {getCurrentYearString()}</p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/kandidati"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
            >
              Kandidati
            </Link>
            <Link
              to="/prijave"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
            >
              Prijave
            </Link>
            <Link
              to="/konkurs"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
            >
              Konkurs
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

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-2xl border border-slate-300 bg-white p-4">
            <h2 className="text-sm text-slate-600">Ukupno prijava</h2>
            <p className="mt-2 text-3xl font-bold">{metrics.totalPrijave}</p>
          </article>
          <article className="rounded-2xl border border-slate-300 bg-white p-4">
            <h2 className="text-sm text-slate-600">Odobrene prijave</h2>
            <p className="mt-2 text-3xl font-bold">{metrics.approvedPrijave}</p>
          </article>
          <article className="rounded-2xl border border-slate-300 bg-white p-4">
            <h2 className="text-sm text-slate-600">Odbijene prijave</h2>
            <p className="mt-2 text-3xl font-bold">{metrics.rejectedPrijave}</p>
          </article>
        </section>
        <div className="flex justify-end">
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
            onClick={() => void loadDashboardData()}
            disabled={isLoading}
          >
            {isLoading ? "Ucitavanje..." : "Osvezi podatke"}
          </button>
        </div>

        <DataTable
          title="Poslednje aktivnosti"
          rows={activityRows}
          emptyMessage="Nema aktivnosti za prikaz."
          columns={[
            { key: "time", header: "Vreme", render: (row) => row.time },
            { key: "module", header: "Modul", render: (row) => row.module },
            {
              key: "description",
              header: "Opis",
              render: (row) => row.description,
            },
            { key: "user", header: "Korisnik", render: (row) => row.user },
          ]}
        />

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
