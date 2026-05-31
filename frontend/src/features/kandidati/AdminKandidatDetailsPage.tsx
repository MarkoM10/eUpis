import { useEffect, useState, type ReactElement } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { OracleMessageCard } from "../../components/feedback/OracleMessageCard";
import { useAppSelector } from "../../redux/hooks";
import { toApiClientError } from "../../services/api";
import {
  deleteKandidatRequest,
  getKandidatRequest,
  updateKandidatRequest,
} from "../../services/kandidatiService";
import type { KandidatPayload } from "../../types/models/kandidat";
import type { KandidatFormState } from "../../types/forms/kandidatForm";

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

export default function AdminKandidatDetailsPage(): ReactElement {
  const { jmbg } = useParams<{ jmbg: string }>();
  const navigate = useNavigate();
  const token = useAppSelector((state) => state.auth.token);

  const [form, setForm] = useState<KandidatFormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const loadKandidat = async (): Promise<void> => {
    if (!token || !jmbg) {
      return;
    }

    setIsLoading(true);
    clearFeedback();

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
    } catch (error) {
      setRequestError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadKandidat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, jmbg]);

  const onFormChange = (field: keyof KandidatFormState, value: string): void => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSave = async (): Promise<void> => {
    if (!token || !jmbg) {
      return;
    }

    setIsSaving(true);
    clearFeedback();

    try {
      await updateKandidatRequest(token, jmbg, toPayload(form));
      setSuccessMessage("Kandidat je uspešno ažuriran.");
      await loadKandidat();
    } catch (error) {
      setRequestError(error);
    } finally {
      setIsSaving(false);
    }
  };

  const onDelete = async (): Promise<void> => {
    if (!token || !jmbg) {
      return;
    }

    const confirmDelete = window.confirm(
      "Da li ste sigurni da želite da obrišete kandidata i sve povezane prijave?",
    );

    if (!confirmDelete) {
      return;
    }

    setIsDeleting(true);
    clearFeedback();

    try {
      await deleteKandidatRequest(token, jmbg);
      navigate("/kandidati", {
        replace: true,
        state: { successMessage: "Kandidat je uspešno obrisan." },
      });
    } catch (error) {
      setRequestError(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-300 bg-white p-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Detalji kandidata</h1>
            <p className="text-sm text-slate-600">JMBG: {jmbg ?? "-"}</p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/kandidati"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100"
            >
              Nazad na kandidate
            </Link>
            <Link
              to="/dashboard"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100"
            >
              Kontrolna tabla
            </Link>
          </div>
        </header>

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

        <section className="rounded-2xl border border-slate-300 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Podaci kandidata</h2>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100 disabled:opacity-60"
              onClick={() => {
                void loadKandidat();
              }}
              disabled={isLoading}
            >
              {isLoading ? "Učitavanje..." : "Osveži"}
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-slate-50"
              placeholder="JMBG"
              value={form.jmbg}
              disabled
            />
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ime i prezime"
              value={form.imePrezime}
              onChange={(event) => onFormChange("imePrezime", event.target.value)}
              disabled={isLoading}
            />
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tip kandidata"
              value={form.tipKandidata}
              onChange={(event) => onFormChange("tipKandidata", event.target.value)}
              disabled={isLoading}
            />
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Serijski broj"
              value={form.serijskiBroj}
              onChange={(event) => onFormChange("serijskiBroj", event.target.value)}
              disabled={isLoading}
            />
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Email"
              value={form.emailVrednost}
              onChange={(event) => onFormChange("emailVrednost", event.target.value)}
              disabled={isLoading}
            />
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ulica"
              value={form.adresaUlica}
              onChange={(event) => onFormChange("adresaUlica", event.target.value)}
              disabled={isLoading}
            />
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Broj"
              value={form.adresaBroj}
              onChange={(event) => onFormChange("adresaBroj", event.target.value)}
              disabled={isLoading}
            />
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Grad"
              value={form.adresaGrad}
              onChange={(event) => onFormChange("adresaGrad", event.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
              onClick={() => {
                void onSave();
              }}
              disabled={isSaving || isLoading}
            >
              {isSaving ? "Čuvanje..." : "Sačuvaj izmene"}
            </button>
            <button
              type="button"
              className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
              onClick={() => {
                void onDelete();
              }}
              disabled={isDeleting || isLoading}
            >
              {isDeleting ? "Brisanje..." : "Obriši kandidata"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
