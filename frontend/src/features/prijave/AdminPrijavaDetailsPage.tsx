import { useEffect, useMemo, useState, type ReactElement } from "react";
import { Link, useParams } from "react-router-dom";
import { OracleMessageCard } from "../../components/feedback/OracleMessageCard";
import { useAppSelector } from "../../redux/hooks";
import { toApiClientError } from "../../services/api";
import { listKonkursiRequest } from "../../services/konkursService";
import {
  downloadPrijavaDocumentRequest,
  getPrijavaDocumentsRequest,
  getPrijavaRequest,
  updatePrijavaRequest,
  updatePrijavaStatusRequest,
} from "../../services/prijaveService";
import type { Konkurs } from "../../types/models/konkurs";
import type { Prijava, PrijavaPayload } from "../../types/models/prijava";
import type {
  PrijavaDocumentType,
  PrijavaDocumentsRecord,
} from "../../types/models/prijavaDocument";
import { getDocumentActionKey, triggerFileDownload } from "../../utils/utils";

type AdminPrijavaEditForm = {
  datumPrijave: string;
  idKonkursa: string;
  idPrograma: string;
  statusPrijave: string;
  konkursniRok: string;
  jmbg: string;
  imePrezime: string;
  sistemskiUpdate: string;
};

const emptyAdminPrijavaEditForm: AdminPrijavaEditForm = {
  datumPrijave: "",
  idKonkursa: "",
  idPrograma: "",
  statusPrijave: "Podneta",
  konkursniRok: "",
  jmbg: "",
  imePrezime: "",
  sistemskiUpdate: "N",
};

const toAdminEditForm = (row: Prijava): AdminPrijavaEditForm => ({
  datumPrijave: row.datumPrijave ? row.datumPrijave.slice(0, 10) : "",
  idKonkursa: row.idKonkursa != null ? String(row.idKonkursa) : "",
  idPrograma: row.idPrograma != null ? String(row.idPrograma) : "",
  statusPrijave: row.statusPrijave ?? "Podneta",
  konkursniRok: row.konkursniRok ?? "",
  jmbg: row.jmbg ?? "",
  imePrezime: row.imePrezime ?? "",
  sistemskiUpdate: row.sistemskiUpdate ?? "N",
});

const toUpdatePrijavaPayload = (form: AdminPrijavaEditForm): PrijavaPayload => ({
  datumPrijave: form.datumPrijave || null,
  skolskaGodina: "",
  idKonkursa: form.idKonkursa ? Number(form.idKonkursa) : null,
  idPrograma: form.idPrograma ? Number(form.idPrograma) : null,
  statusPrijave: form.statusPrijave || null,
  konkursniRok: form.konkursniRok || null,
  jmbg: form.jmbg || null,
  imePrezime: form.imePrezime || null,
  sistemskiUpdate: form.sistemskiUpdate || null,
  kandidat: null,
});

const buildKonkursLabel = (konkurs: Konkurs): string =>
  `#${konkurs.idKonkursa} | ${konkurs.skolskaGodina} | ${konkurs.konkursniRok} | ${konkurs.nazivFakulteta ?? "Fakultet"}`;

const buildProgramLabel = (
  nazivPrograma: string | null,
  modul: string | null,
  idPrograma: number,
): string => `${nazivPrograma ?? `Program ${idPrograma}`}${modul ? ` | ${modul}` : ""}`;

export default function AdminPrijavaDetailsPage(): ReactElement {
  const { brojPrijave, skolskaGodina } = useParams<{
    brojPrijave: string;
    skolskaGodina: string;
  }>();
  const token = useAppSelector((state) => state.auth.token);

  const prijavaBroj = Number(brojPrijave);
  const godina = skolskaGodina ?? "";

  const [prijava, setPrijava] = useState<Prijava | null>(null);
  const [documents, setDocuments] = useState<PrijavaDocumentsRecord | null>(null);
  const [konkursiById, setKonkursiById] = useState<Record<number, Konkurs>>({});
  const [editForm, setEditForm] = useState<AdminPrijavaEditForm>(emptyAdminPrijavaEditForm);
  const [selectedStatus, setSelectedStatus] = useState<string>("Podneta");
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [downloadingDocumentKey, setDownloadingDocumentKey] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [oracleDetails, setOracleDetails] = useState<string | undefined>(undefined);

  const currentKonkurs = useMemo(() => {
    return editForm.idKonkursa ? (konkursiById[Number(editForm.idKonkursa)] ?? null) : null;
  }, [editForm.idKonkursa, konkursiById]);

  const currentProgram = useMemo(() => {
    if (!currentKonkurs || !editForm.idPrograma) {
      return null;
    }

    return (
      currentKonkurs.stavke.find((stavka) => stavka.idPrograma === Number(editForm.idPrograma)) ??
      null
    );
  }, [currentKonkurs, editForm.idPrograma]);

  const setRequestError = (error: unknown): void => {
    const parsed = toApiClientError(error);
    const oracleMessage = parsed.oracleDetails?.trim() || parsed.message;
    setErrorMessage(oracleMessage);
    setOracleDetails(undefined);
  };

  const clearFeedback = (): void => {
    setSuccessMessage(null);
    setErrorMessage(null);
    setOracleDetails(undefined);
  };

  const loadData = async (): Promise<void> => {
    if (!token || !Number.isFinite(prijavaBroj) || prijavaBroj <= 0 || !godina) {
      return;
    }

    setIsLoading(true);
    clearFeedback();

    try {
      const [prijavaResponse, docsResponse, konkursiResponse] = await Promise.all([
        getPrijavaRequest(token, prijavaBroj, godina),
        getPrijavaDocumentsRequest(token, prijavaBroj, godina),
        listKonkursiRequest(token),
      ]);

      const row = prijavaResponse.data;
      setPrijava(row);
      setEditForm(toAdminEditForm(row));
      setSelectedStatus(row.statusPrijave ?? "Podneta");
      setDocuments(docsResponse.data);

      const nextKonkursi = konkursiResponse.data.rows.reduce<Record<number, Konkurs>>(
        (acc, item) => {
          acc[item.idKonkursa] = item;
          return acc;
        },
        {},
      );
      setKonkursiById(nextKonkursi);
    } catch (error) {
      setRequestError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, prijavaBroj, godina]);

  const onEditFormChange = (field: keyof AdminPrijavaEditForm, value: string): void => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSaveEdit = async (): Promise<void> => {
    if (!token || !prijava) {
      return;
    }

    setIsSavingEdit(true);
    clearFeedback();

    try {
      const payload = toUpdatePrijavaPayload(editForm);
      await updatePrijavaRequest(token, prijava.brojPrijave, prijava.skolskaGodina, {
        ...payload,
        skolskaGodina: prijava.skolskaGodina,
      });

      setSuccessMessage("Prijava je uspešno ažurirana.");
      await loadData();
    } catch (error) {
      setRequestError(error);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const onSaveStatus = async (): Promise<void> => {
    if (!token || !prijava) {
      return;
    }

    setIsSavingStatus(true);
    clearFeedback();

    try {
      await updatePrijavaStatusRequest(
        token,
        prijava.brojPrijave,
        prijava.skolskaGodina,
        selectedStatus as "Podneta" | "Odobrena" | "Odbijena",
      );
      setSuccessMessage("Status prijave je uspešno sačuvan.");
      await loadData();
    } catch (error) {
      setRequestError(error);
    } finally {
      setIsSavingStatus(false);
    }
  };

  const onDownloadDocument = async (documentType: PrijavaDocumentType): Promise<void> => {
    if (!token || !prijava) {
      return;
    }

    const actionKey = getDocumentActionKey(
      prijava.brojPrijave,
      prijava.skolskaGodina,
      documentType,
    );
    setDownloadingDocumentKey(actionKey);

    try {
      const result = await downloadPrijavaDocumentRequest(
        token,
        prijava.brojPrijave,
        prijava.skolskaGodina,
        documentType,
      );
      triggerFileDownload(result.blob, result.fileName);
      setSuccessMessage(
        documentType === "diploma"
          ? "Diploma je uspešno preuzeta."
          : "Uverenje je uspešno preuzeto.",
      );
    } catch (error) {
      setRequestError(error);
    } finally {
      setDownloadingDocumentKey(null);
    }
  };

  const isInvalidParams = !Number.isFinite(prijavaBroj) || prijavaBroj <= 0 || !godina;

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-300 bg-white p-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Detalji prijave</h1>
            <p className="text-sm text-slate-600">
              Broj prijave: {Number.isFinite(prijavaBroj) ? prijavaBroj : "-"} | Školska godina:{" "}
              {godina || "-"}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/prijave"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100"
            >
              Nazad na prijave
            </Link>
            <Link
              to="/dashboard"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100"
            >
              Kontrolna tabla
            </Link>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-300 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Izmena podataka prijave</h2>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100 disabled:opacity-60"
              onClick={() => {
                void loadData();
              }}
              disabled={isLoading}
            >
              {isLoading ? "Učitavanje..." : "Osveži"}
            </button>
          </div>

          <div className="mt-4 grid items-start gap-3 md:grid-cols-2 xl:grid-cols-4">
            <input
              type="date"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Datum prijave"
              value={editForm.datumPrijave}
              onChange={(event) => onEditFormChange("datumPrijave", event.target.value)}
              disabled={isLoading || !prijava}
            />
            <div className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm text-slate-800">
              <div
                className="truncate"
                title={currentKonkurs ? buildKonkursLabel(currentKonkurs) : "Nije izabran konkurs"}
              >
                {currentKonkurs ? buildKonkursLabel(currentKonkurs) : "Nije izabran konkurs"}
              </div>
            </div>
            <div className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm text-slate-800">
              <div
                className="truncate"
                title={
                  currentProgram
                    ? buildProgramLabel(
                        currentProgram.nazivPrograma,
                        currentProgram.modul,
                        currentProgram.idPrograma,
                      )
                    : editForm.idPrograma
                      ? `Program #${editForm.idPrograma}`
                      : "Nije izabran program"
                }
              >
                {currentProgram
                  ? buildProgramLabel(
                      currentProgram.nazivPrograma,
                      currentProgram.modul,
                      currentProgram.idPrograma,
                    )
                  : editForm.idPrograma
                    ? `Program #${editForm.idPrograma}`
                    : "Nije izabran program"}
              </div>
            </div>
            <select
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={editForm.konkursniRok}
              onChange={(event) => onEditFormChange("konkursniRok", event.target.value)}
              disabled={isLoading || !prijava}
            >
              <option value="">Konkursni rok</option>
              <option value="Septembar">Septembarski</option>
            </select>
            <input
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              placeholder="JMBG"
              value={editForm.jmbg}
              onChange={(event) => onEditFormChange("jmbg", event.target.value)}
              disabled
            />
            <input
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ime i prezime"
              value={editForm.imePrezime}
              onChange={(event) => onEditFormChange("imePrezime", event.target.value)}
              disabled={isLoading || !prijava}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
              onClick={() => {
                void onSaveEdit();
              }}
              disabled={isSavingEdit || !prijava}
            >
              {isSavingEdit ? "Čuvanje..." : "Sačuvaj izmene"}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-300 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Dokumenta i status prijave</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm">
              <div className="font-semibold text-slate-900">Diploma</div>
              <div className="text-slate-600">
                {documents?.diploma.hasFile ? "Otpremljena" : "Nedostaje"}
              </div>
              <button
                type="button"
                className="mt-2 rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold hover:bg-slate-100 disabled:opacity-60"
                onClick={() => {
                  void onDownloadDocument("diploma");
                }}
                disabled={
                  !documents?.diploma.hasFile ||
                  downloadingDocumentKey === getDocumentActionKey(prijavaBroj, godina, "diploma")
                }
              >
                {downloadingDocumentKey === getDocumentActionKey(prijavaBroj, godina, "diploma")
                  ? "Preuzimanje..."
                  : "Preuzmi diplomu"}
              </button>
            </div>

            <div className="rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm">
              <div className="font-semibold text-slate-900">Uverenje</div>
              <div className="text-slate-600">
                {documents?.uverenje.hasFile ? "Otpremljeno" : "Nedostaje"}
              </div>
              <button
                type="button"
                className="mt-2 rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold hover:bg-slate-100 disabled:opacity-60"
                onClick={() => {
                  void onDownloadDocument("uverenje");
                }}
                disabled={
                  !documents?.uverenje.hasFile ||
                  downloadingDocumentKey === getDocumentActionKey(prijavaBroj, godina, "uverenje")
                }
              >
                {downloadingDocumentKey === getDocumentActionKey(prijavaBroj, godina, "uverenje")
                  ? "Preuzimanje..."
                  : "Preuzmi uverenje"}
              </button>
            </div>

            <div className="rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm">
              <div className="font-semibold text-slate-900">Status prijave</div>
              <select
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value)}
                disabled={!prijava}
              >
                <option value="Podneta">Podneta</option>
                <option value="Odobrena">Odobrena</option>
                <option value="Odbijena">Odbijena</option>
              </select>
              <button
                type="button"
                className="mt-2 rounded-lg border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                onClick={() => {
                  void onSaveStatus();
                }}
                disabled={
                  isSavingStatus ||
                  !prijava ||
                  selectedStatus === (prijava.statusPrijave ?? "Podneta")
                }
              >
                {isSavingStatus ? "Čuvanje..." : "Sačuvaj status"}
              </button>
            </div>
          </div>
        </section>
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

        {isInvalidParams ? (
          <OracleMessageCard
            title="Greška"
            message="Neispravni parametri prijave."
            variant="error"
          />
        ) : null}
      </div>
    </main>
  );
}
