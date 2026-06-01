import { useEffect, useState, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { logoutSuccess } from "../../redux/slices/authSlice";
import { OracleMessageCard } from "../../components/feedback/OracleMessageCard";
import { toApiClientError } from "../../services/api";
import { listPrijaveRequest } from "../../services/prijaveService";
import { getCurrentYearString } from "../../utils/utils";

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

const toPercent = (value: number): string => `${Math.round(value)}%`;

export default function DashboardPage(): ReactElement {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const [metrics, setMetrics] = useState<DashboardMetrics>(emptyMetrics);
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
      const prijaveResponse = await listPrijaveRequest(token, {
        page: 1,
        pageSize: 5000,
        sortBy: "datum_prijave",
        sortDirection: "desc",
      });

      const prijaveRows = prijaveResponse.data.rows ?? [];

      const approvedPrijave = prijaveRows.filter((row) => row.statusPrijave === "Odobrena").length;
      const rejectedPrijave = prijaveRows.filter((row) => row.statusPrijave === "Odbijena").length;

      setMetrics({
        totalPrijave: prijaveRows.length,
        approvedPrijave,
        rejectedPrijave,
      });
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

  const total = metrics.totalPrijave;
  const pendingPrijave = Math.max(total - metrics.approvedPrijave - metrics.rejectedPrijave, 0);
  const approvedShare = total > 0 ? (metrics.approvedPrijave / total) * 100 : 0;
  const rejectedShare = total > 0 ? (metrics.rejectedPrijave / total) * 100 : 0;
  const pendingShare = total > 0 ? (pendingPrijave / total) * 100 : 0;

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
            <Link
              to="/ranking-lists"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
            >
              Rang Liste
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

        <section className="overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 via-white to-slate-50 p-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                Operativni pregled
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                Status prijava za tekuci ciklus
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Brz pregled odobrenih, odbijenih i prijava koje cekaju obradu.
              </p>
            </div>
            <span className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-700">
              Ukupno: {metrics.totalPrijave}
            </span>
          </div>
          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-200">
            <div className="flex h-full w-full">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${approvedShare}%` }}
                title={`Odobrene ${toPercent(approvedShare)}`}
              />
              <div
                className="h-full bg-rose-500"
                style={{ width: `${rejectedShare}%` }}
                title={`Odbijene ${toPercent(rejectedShare)}`}
              />
              <div
                className="h-full bg-amber-400"
                style={{ width: `${pendingShare}%` }}
                title={`Na cekanju ${toPercent(pendingShare)}`}
              />
            </div>
          </div>
          <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
            <p className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              Odobrene: <strong>{metrics.approvedPrijave}</strong> ({toPercent(approvedShare)})
            </p>
            <p className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              Odbijene: <strong>{metrics.rejectedPrijave}</strong> ({toPercent(rejectedShare)})
            </p>
            <p className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              Na cekanju: <strong>{pendingPrijave}</strong> ({toPercent(pendingShare)})
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-2xl border border-slate-300 bg-white p-4 shadow-sm">
            <h2 className="text-sm text-slate-600">Ukupno prijava</h2>
            <p className="mt-2 text-3xl font-bold text-slate-900">{metrics.totalPrijave}</p>
            <p className="mt-2 text-xs text-slate-500">
              Zbir svih prijava za aktivni upisni ciklus.
            </p>
          </article>
          <article className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm text-slate-600">Odobrene prijave</h2>
            <p className="mt-2 text-3xl font-bold text-emerald-700">{metrics.approvedPrijave}</p>
            <p className="mt-2 text-xs text-slate-500">
              Spremne za naredne korake u procesu upisa.
            </p>
          </article>
          <article className="rounded-2xl border border-rose-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm text-slate-600">Odbijene prijave</h2>
            <p className="mt-2 text-3xl font-bold text-rose-700">{metrics.rejectedPrijave}</p>
            <p className="mt-2 text-xs text-slate-500">
              Prijave koje zahtevaju komunikaciju ili korekciju.
            </p>
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Brzi pristup modulima</h2>
            <p className="mt-1 text-sm text-slate-600">
              Najcesce akcije za administraciju upisnog procesa.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link
                to="/prijave"
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-300 hover:bg-blue-50"
              >
                <p className="text-sm font-semibold text-slate-900">Upravljanje prijavama</p>
                <p className="mt-1 text-xs text-slate-600">
                  Pregled, validacija dokumentacije i odluke po prijavama.
                </p>
              </Link>
              <Link
                to="/kandidati"
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-300 hover:bg-blue-50"
              >
                <p className="text-sm font-semibold text-slate-900">Evidencija kandidata</p>
                <p className="mt-1 text-xs text-slate-600">
                  Kontakt podaci kandidata i azuriranje njihovih informacija.
                </p>
              </Link>
              <Link
                to="/konkurs"
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-300 hover:bg-blue-50"
              >
                <p className="text-sm font-semibold text-slate-900">Konkurs i programi</p>
                <p className="mt-1 text-xs text-slate-600">
                  Upravljanje rokovima, kvotama i studijskim programima.
                </p>
              </Link>
              <Link
                to="/ranking-lists"
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-300 hover:bg-blue-50"
              >
                <p className="text-sm font-semibold text-slate-900">Rang liste</p>
                <p className="mt-1 text-xs text-slate-600">
                  Formiranje i finalizacija rang listi za upis kandidata.
                </p>
              </Link>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Kontrolna lista</h2>
            <p className="mt-1 text-sm text-slate-600">
              Predlog redosleda za svakodnevni rad administratora.
            </p>
            <ol className="mt-4 space-y-2 text-sm text-slate-700">
              <li className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                1. Proverite nove prijave i status dokumentacije.
              </li>
              <li className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                2. Potvrdite ili odbijte prijave koje ispunjavaju uslove.
              </li>
              <li className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                3. Azurirajte konkurs i finalizujte rang liste kada je potrebno.
              </li>
            </ol>
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
