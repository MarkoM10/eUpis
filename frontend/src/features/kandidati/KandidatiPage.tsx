import { useEffect, useState, type ReactElement } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { OracleMessageCard } from "../../components/feedback/OracleMessageCard";
import { DataTable } from "../../components/ui/DataTable";
import { FilterBar } from "../../components/ui/FilterBar";
import {
  clearKandidatiError,
  loadKandidati,
  setKandidatiPage,
  setKandidatiPageSize,
  setKandidatiSearch,
  setKandidatiSortValue,
  setTipKandidataFilter,
} from "../../redux/slices/kandidatiSlice";

export default function KandidatiPage(): ReactElement {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const location = useLocation();
  const navigate = useNavigate();

  const {
    rows,
    search,
    sortValue,
    tipKandidataFilter,
    page,
    pageSize,
    isLoading,
    errorMessage,
    oracleDetails,
  } = useAppSelector((state) => state.kandidati);

  const hasNextPage = rows.length === pageSize;

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    void dispatch(loadKandidati());
  }, [dispatch, token]);

  useEffect(() => {
    const stateValue = location.state as { successMessage?: string } | null;
    if (stateValue?.successMessage) {
      setSuccessMessage(stateValue.successMessage);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl w-10/12 space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-300 bg-white p-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Kandidati</h1>
            <p className="text-sm text-slate-600">
              Pregled kandidata i odlazak na detalje kandidata
            </p>
          </div>
          <Link
            to="/dashboard"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100"
          >
            Nazad na kontrolnu tablu
          </Link>
        </header>

        <FilterBar
          searchValue={search}
          onSearchChange={(value) => dispatch(setKandidatiSearch(value))}
          sortValue={sortValue}
          onSortChange={(value) => dispatch(setKandidatiSortValue(value))}
          sortOptions={[
            { value: "ime_prezime:asc", label: "Ime (A-Z)" },
            { value: "ime_prezime:desc", label: "Ime (Z-A)" },
            { value: "jmbg:asc", label: "JMBG (rastuce)" },
            { value: "jmbg:desc", label: "JMBG (opadajuce)" },
          ]}
          statusValue={tipKandidataFilter}
          onStatusChange={(value) => dispatch(setTipKandidataFilter(value))}
          statusOptions={[
            { value: "svi", label: "Tip kandidata: svi" },
            { value: "MASTER", label: "Master" },
            { value: "DOKTOR", label: "Doktor" },
          ]}
          onApply={() => {
            void dispatch(loadKandidati());
          }}
        />

        <div className="flex justify-end">
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100 disabled:opacity-60"
            onClick={() => {
              dispatch(clearKandidatiError());
              void dispatch(loadKandidati());
            }}
            disabled={isLoading}
          >
            {isLoading ? "Ucitavanje..." : "Osvezi listu"}
          </button>
        </div>

        <DataTable
          title="Lista kandidata"
          rows={rows}
          emptyMessage="Nema kandidata za prikaz."
          columns={[
            { key: "jmbg", header: "JMBG", render: (row) => row.jmbg },
            { key: "ime", header: "Ime i prezime", render: (row) => row.imePrezime },
            { key: "tip", header: "Tip", render: (row) => row.tipKandidata },
            { key: "email", header: "Email", render: (row) => row.emailVrednost },
            {
              key: "adresa",
              header: "Adresa",
              render: (row) => `${row.adresaUlica} ${row.adresaBroj}, ${row.adresaGrad}`,
            },
            {
              key: "akcije",
              header: "Akcije",
              render: (row) => (
                <Link
                  to={`/kandidati/${encodeURIComponent(row.jmbg)}`}
                  className="inline-block rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold hover:bg-slate-100"
                >
                  Detalji
                </Link>
              ),
            },
          ]}
        />

        <section className="rounded-2xl border border-slate-300 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-700">
              Strana {page}
              {rows.length === 0 ? " | Nema rezultata" : ` | Prikazano: ${rows.length}`}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-sm text-slate-700" htmlFor="kandidati-page-size">
                Po strani
              </label>
              <select
                id="kandidati-page-size"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={String(pageSize)}
                onChange={(event) => {
                  dispatch(setKandidatiPageSize(Number(event.target.value)));
                  void dispatch(loadKandidati());
                }}
                disabled={isLoading}
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
                  dispatch(setKandidatiPage(Math.max(1, page - 1)));
                  void dispatch(loadKandidati());
                }}
                disabled={isLoading || page <= 1}
              >
                Prethodna
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100 disabled:opacity-60"
                onClick={() => {
                  dispatch(setKandidatiPage(page + 1));
                  void dispatch(loadKandidati());
                }}
                disabled={isLoading || !hasNextPage}
              >
                Sledeca
              </button>
            </div>
          </div>
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
