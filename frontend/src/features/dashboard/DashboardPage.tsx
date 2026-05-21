import { useEffect, useMemo, useState, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/authStore";
import { FilterBar } from "../../components/ui/FilterBar";
import { DataTable } from "../../components/ui/DataTable";
import { OracleMessageCard } from "../../components/feedback/OracleMessageCard";
import { toApiClientError } from "../../services/httpClient";
import { listKandidatiRequest } from "../../services/kandidatiService";
import { listPrijaveRequest } from "../../services/prijaveService";
import { listRankingItemsRequest, listRankingListsRequest } from "../../services/upisService";
import type { ActivityRow } from "../../types/models/dashboard";

const getCurrentCycleLabel = (): string => {
  const currentYear = new Date().getFullYear();
  const nextYearSuffix = String((currentYear + 1) % 100).padStart(2, "0");
  return `${currentYear}/${nextYearSuffix}`;
};

const toTimeLabel = (value: string | null | undefined): string => {
  if (!value) {
    return "--:--";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }

  return date.toLocaleTimeString("sr-RS", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const toTimestamp = (value: string | null | undefined): number => {
  if (!value) {
    return 0;
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const buildStatusLabel = (status: string | null | undefined): string => {
  if (!status) {
    return "Podneta";
  }

  return status;
};

type DashboardActivityRow = ActivityRow & {
  status: string;
  timestamp: number;
};

interface DashboardMetrics {
  totalPrijave: number;
  approvedPrijave: number;
  rejectedPrijave: number;
  enrolledStudents: number;
  totalKandidati: number;
}

const emptyMetrics: DashboardMetrics = {
  totalPrijave: 0,
  approvedPrijave: 0,
  rejectedPrijave: 0,
  enrolledStudents: 0,
  totalKandidati: 0,
};

export default function DashboardPage(): ReactElement {
  const { logout, token } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics>(emptyMetrics);
  const [activityRows, setActivityRows] = useState<DashboardActivityRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [oracleDetails, setOracleDetails] = useState<string | undefined>(undefined);

  const [searchValue, setSearchValue] = useState("");
  const [sortValue, setSortValue] = useState("datum_desc");
  const [statusValue, setStatusValue] = useState("svi");

  const loadDashboardData = async (): Promise<void> => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setOracleDetails(undefined);

    try {
      const [prijaveResponse, kandidatiResponse, rankingListsResponse] = await Promise.all([
        listPrijaveRequest(token, {
          page: 1,
          pageSize: 5000,
          sortBy: "datum_prijave",
          sortDirection: "desc",
        }),
        listKandidatiRequest(token, {
          page: 1,
          pageSize: 5000,
          sortBy: "ime_prezime",
          sortDirection: "asc",
        }),
        listRankingListsRequest(token),
      ]);

      const prijaveRows = prijaveResponse.data.rows ?? [];
      const kandidatiRows = kandidatiResponse.data.rows ?? [];

      const approvedPrijave = prijaveRows.filter((row) => row.statusPrijave === "Odobrena").length;
      const rejectedPrijave = prijaveRows.filter((row) => row.statusPrijave === "Odbijena").length;

      const rankingItemResponses = await Promise.all(
        (rankingListsResponse.data.rows ?? [])
          .filter((row) => row.idRangListe != null)
          .map((row) => listRankingItemsRequest(token, Number(row.idRangListe))),
      );

      const enrolledStudents = rankingItemResponses
        .flatMap((response) => response.data.rows ?? [])
        .filter((item) => item.status === "Approved").length;

      setMetrics({
        totalPrijave: prijaveRows.length,
        approvedPrijave,
        rejectedPrijave,
        enrolledStudents,
        totalKandidati: kandidatiRows.length,
      });

      const mappedActivities: DashboardActivityRow[] = prijaveRows
        .map((row) => {
          const status = buildStatusLabel(row.statusPrijave);
          const sourceDate = row.sistemskiUpdate ?? row.datumPrijave;

          return {
            time: toTimeLabel(sourceDate),
            module: "Prijava",
            description: `Prijava P-${row.brojPrijave} (${row.skolskaGodina}) ima status ${status}`,
            user: "admin",
            status,
            timestamp: toTimestamp(sourceDate),
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

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    let rows = activityRows.filter((row) => {
      if (statusValue !== "svi") {
        return row.status === statusValue;
      }

      return true;
    });

    if (normalizedSearch) {
      rows = rows.filter((row) =>
        [row.description, row.module, row.user].join(" ").toLowerCase().includes(normalizedSearch),
      );
    }

    rows = [...rows].sort((a, b) =>
      sortValue === "datum_asc" ? a.timestamp - b.timestamp : b.timestamp - a.timestamp,
    );

    return rows;
  }, [activityRows, searchValue, sortValue, statusValue]);

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-300 bg-white p-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Kontrolna tabla</h1>
            <p className="text-sm text-slate-600">Upisni ciklus {getCurrentCycleLabel()}</p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/kandidati"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
            >
              Modul kandidati
            </Link>
            <Link
              to="/prijave"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
            >
              Modul prijave
            </Link>
            <Link
              to="/upis"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
            >
              Modul upis
            </Link>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
              onClick={logout}
            >
              Odjavi se
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
          <article className="rounded-2xl border border-slate-300 bg-white p-4">
            <h2 className="text-sm text-slate-600">Upisani studenti</h2>
            <p className="mt-2 text-3xl font-bold">{metrics.enrolledStudents}</p>
          </article>
        </section>
        <FilterBar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          sortValue={sortValue}
          onSortChange={setSortValue}
          sortOptions={[
            { value: "datum_desc", label: "Datum (opadajuce)" },
            { value: "datum_asc", label: "Datum (rastuce)" },
          ]}
          statusValue={statusValue}
          onStatusChange={setStatusValue}
          statusOptions={[
            { value: "svi", label: "Svi statusi" },
            { value: "Odobrena", label: "Odobrena" },
            { value: "Podneta", label: "Podneta" },
            { value: "Odbijena", label: "Odbijena" },
          ]}
        />

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
          rows={filteredRows}
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
