import { useEffect, useState, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { OracleMessageCard } from "../../components/feedback/OracleMessageCard";
import { DataTable } from "../../components/ui/DataTable";
import { FilterBar } from "../../components/ui/FilterBar";
import { toApiClientError } from "../../services/api";
import {
  deleteKandidatRequest,
  getKandidatRequest,
  updateKandidatRequest,
} from "../../services/kandidatiService";
import type { KandidatPayload } from "../../types/models/kandidat";
import type { KandidatFormState } from "../../types/forms/kandidatForm";
import {
  clearKandidatiError,
  loadKandidati,
  setKandidatiSearch,
  setKandidatiSortValue,
  setTipKandidataFilter,
} from "../../redux/slices/kandidatiSlice";

const emptyForm: KandidatFormState = {
  jmbg: "",
  imePrezime: "",
  tipKandidata: "",
  serijskiBroj: "",
  emailVrednost: "",
  adresaUlica: "",
  adresaBroj: "",
  adresaGrad: "",
};

const toPayload = (form: KandidatFormState): KandidatPayload => ({
  jmbg: form.jmbg,
  imePrezime: form.imePrezime,
  tipKandidata: form.tipKandidata,
  serijskiBroj: Number(form.serijskiBroj),
  emailVrednost: form.emailVrednost,
  adresaUlica: form.adresaUlica,
  adresaBroj: Number(form.adresaBroj),
  adresaGrad: form.adresaGrad,
});

export default function KandidatiPage(): ReactElement {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const { rows, search, sortValue, tipKandidataFilter, isLoading, errorMessage, oracleDetails } =
    useAppSelector((state) => state.kandidati);

  const [form, setForm] = useState<KandidatFormState>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingJmbg, setEditingJmbg] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(null);
  const [localOracleDetails, setLocalOracleDetails] = useState<string | undefined>(undefined);

  useEffect(() => {
    void dispatch(loadKandidati());
  }, [dispatch, token]);

  const clearLocalFeedback = (): void => {
    setSuccessMessage(null);
    setLocalErrorMessage(null);
    setLocalOracleDetails(undefined);
  };

  const onFormChange = (field: keyof KandidatFormState, value: string): void => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onEdit = async (jmbg: string): Promise<void> => {
    if (!token) {
      return;
    }

    clearLocalFeedback();
    dispatch(clearKandidatiError());

    try {
      const response = await getKandidatRequest(token, jmbg);
      setForm({
        jmbg: response.data.jmbg,
        imePrezime: response.data.imePrezime,
        tipKandidata: response.data.tipKandidata,
        serijskiBroj: String(response.data.serijskiBroj),
        emailVrednost: response.data.emailVrednost,
        adresaUlica: response.data.adresaUlica,
        adresaBroj: String(response.data.adresaBroj),
        adresaGrad: response.data.adresaGrad,
      });
      setEditingJmbg(jmbg);
    } catch (error) {
      const parsed = toApiClientError(error);
      setLocalErrorMessage(`${parsed.title}: ${parsed.message}`);
      setLocalOracleDetails(parsed.oracleDetails);
    }
  };

  const onDelete = async (jmbg: string): Promise<void> => {
    if (!token) {
      return;
    }

    clearLocalFeedback();
    dispatch(clearKandidatiError());

    try {
      await deleteKandidatRequest(token, jmbg);
      setSuccessMessage("Kandidat je uspesno obrisan.");
      void dispatch(loadKandidati());
    } catch (error) {
      const parsed = toApiClientError(error);
      setLocalErrorMessage(`${parsed.title}: ${parsed.message}`);
      setLocalOracleDetails(parsed.oracleDetails);
    }
  };

  const onSubmit = async (): Promise<void> => {
    if (!token) {
      return;
    }

    setIsSubmitting(true);
    clearLocalFeedback();
    dispatch(clearKandidatiError());

    try {
      const payload = toPayload(form);
      await updateKandidatRequest(token, editingJmbg ?? form.jmbg, payload);
      setSuccessMessage("Kandidat je uspesno azuriran.");

      setForm(emptyForm);
      setEditingJmbg(null);
      void dispatch(loadKandidati());
    } catch (error) {
      const parsed = toApiClientError(error);
      setLocalErrorMessage(`${parsed.title}: ${parsed.message}`);
      setLocalOracleDetails(parsed.oracleDetails);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl w-10/12 space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-300 bg-white p-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Kandidati</h1>
          </div>
          <Link
            to="/dashboard"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
          >
            Nazad na kontrolnu tablu
          </Link>
        </header>

        <section className="rounded-2xl border border-slate-300 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900">Izmena kandidata</h2>
          {!editingJmbg ? (
            <p className="mt-1 text-sm text-slate-600">
              Izaberite kandidata iz tabele klikom na dugme Izmeni.
            </p>
          ) : null}

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="JMBG"
              value={form.jmbg}
              onChange={(event) => onFormChange("jmbg", event.target.value)}
            />
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Ime i prezime"
              value={form.imePrezime}
              onChange={(event) => onFormChange("imePrezime", event.target.value)}
            />
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Tip kandidata"
              value={form.tipKandidata}
              onChange={(event) => onFormChange("tipKandidata", event.target.value)}
            />
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Serijski broj"
              value={form.serijskiBroj}
              onChange={(event) => onFormChange("serijskiBroj", event.target.value)}
            />
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Email"
              value={form.emailVrednost}
              onChange={(event) => onFormChange("emailVrednost", event.target.value)}
            />
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Ulica"
              value={form.adresaUlica}
              onChange={(event) => onFormChange("adresaUlica", event.target.value)}
            />
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Broj"
              value={form.adresaBroj}
              onChange={(event) => onFormChange("adresaBroj", event.target.value)}
            />
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Grad"
              value={form.adresaGrad}
              onChange={(event) => onFormChange("adresaGrad", event.target.value)}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {editingJmbg ? (
              <button
                type="button"
                className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                onClick={() => void onSubmit()}
                disabled={isSubmitting}
              >
                Sacuvaj izmene
              </button>
            ) : null}
            {editingJmbg ? (
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
                onClick={() => {
                  setEditingJmbg(null);
                  setForm(emptyForm);
                }}
              >
                Odustani
              </button>
            ) : null}
          </div>
        </section>

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
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
            onClick={() => void dispatch(loadKandidati())}
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
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold"
                    onClick={() => void onEdit(row.jmbg)}
                  >
                    Izmeni
                  </button>
                  <button
                    type="button"
                    className="rounded border border-red-300 px-2 py-1 text-xs font-semibold text-red-700"
                    onClick={() => void onDelete(row.jmbg)}
                  >
                    Obrisi
                  </button>
                </div>
              ),
            },
          ]}
        />

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
