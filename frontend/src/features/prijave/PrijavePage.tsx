import { useEffect, useState, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { logoutSuccess, updateAuthSession } from "../../redux/slices/authSlice";
import { OracleMessageCard } from "../../components/feedback/OracleMessageCard";
import { DataTable } from "../../components/ui/DataTable";
import { FilterBar } from "../../components/ui/FilterBar";
import { sessionRequest } from "../../services/authService";
import { toApiClientError } from "../../services/api";
import { listStudyProgramsRequest } from "../../services/upisService";
import {
  createPrijavaRequest,
  downloadPrijavaDocumentRequest,
  getPrijavaDocumentsRequest,
  updatePrijavaStatusRequest,
  uploadPrijavaDocumentRequest,
} from "../../services/prijaveService";
import type { PrijavaDocumentType } from "../../types/models/prijavaDocument";
import type {
  DiplomaDocumentFormState,
  UverenjeDocumentFormState,
} from "../../types/forms/prijavaDocumentForm";
import type { PrijavaFormState } from "../../types/forms/prijavaForm";
import type { PrijavaDocumentsRecord } from "../../types/models/prijavaDocument";
import type { Prijava, PrijavaPayload } from "../../types/models/prijava";
import type { StudyProgramOption } from "../../types/models/upis";
import {
  clearPrijaveError,
  loadFakulteti,
  loadPrijaveRows,
  setPrijavaSearch,
  setPrijavaSortValue,
  setPrijavaStatusFilter,
} from "../../redux/slices/prijaveSlice";
import StudentPrijavaSummaryCard from "./StudentPrijavaSummaryCard";

type ActivePrijavaKey = {
  brojPrijave: number;
  skolskaGodina: string;
};

const todayValue = new Date().toISOString().slice(0, 10);
const currentSchoolYearValue = String(new Date().getFullYear());

const createEmptyPrijavaForm = (isAdmin: boolean): PrijavaFormState => ({
  brojPrijave: "",
  datumPrijave: todayValue,
  skolskaGodina: currentSchoolYearValue,
  idPrograma: "",
  statusPrijave: isAdmin ? "" : "Podneta",
  konkursniRok: "",
  jmbg: "",
  imePrezime: "",
  emailVrednost: "",
  adresaUlica: "",
  adresaBroj: "",
  adresaGrad: "",
  sistemskiUpdate: "N",
});

const emptyDiplomaForm: DiplomaDocumentFormState = {
  datumIzdavanja: "",
  brojEspb: "",
  stecenoZvanje: "",
  datumDiplomiranja: "",
  godinaUpisa: "",
  prosecnaOcena: "",
  idFakulteta: "",
  file: null,
};

const emptyUverenjeForm: UverenjeDocumentFormState = {
  datumIzdavanja: "",
  idFakulteta: "",
  ukupnoEspb: "",
  prosecnaOcena: "",
  file: null,
};

const emptyDocuments: PrijavaDocumentsRecord = {
  diploma: {
    documentType: "diploma",
    exists: false,
    serialNumber: null,
    datumIzdavanja: null,
    idFakulteta: null,
    fileName: null,
    mimeType: null,
    fileSize: null,
    uploadedAt: null,
    hasFile: false,
    brojEspb: null,
    stecenoZvanje: null,
    datumDiplomiranja: null,
    godinaUpisa: null,
    prosecnaOcena: null,
    rektorId: null,
  },
  uverenje: {
    documentType: "uverenje",
    exists: false,
    serialNumber: null,
    datumIzdavanja: null,
    idFakulteta: null,
    fileName: null,
    mimeType: null,
    fileSize: null,
    uploadedAt: null,
    hasFile: false,
    prosecnaOcena: null,
    ukupnoEspb: null,
  },
};

const toPayload = (form: PrijavaFormState, isAdmin: boolean): PrijavaPayload => ({
  brojPrijave: form.brojPrijave ? Number(form.brojPrijave) : null,
  datumPrijave: form.datumPrijave || null,
  skolskaGodina: form.skolskaGodina,
  idPrograma: form.idPrograma ? Number(form.idPrograma) : null,
  statusPrijave: isAdmin ? form.statusPrijave || null : "Podneta",
  konkursniRok: form.konkursniRok || null,
  jmbg: form.jmbg || null,
  imePrezime: form.imePrezime || null,
  sistemskiUpdate: null,
  kandidat: {
    emailVrednost: form.emailVrednost || null,
    adresaUlica: form.adresaUlica || null,
    adresaBroj: form.adresaBroj ? Number(form.adresaBroj) : null,
    adresaGrad: form.adresaGrad || null,
  },
});

const toDiplomaForm = (document: PrijavaDocumentsRecord["diploma"]): DiplomaDocumentFormState => ({
  datumIzdavanja: document.datumIzdavanja ? document.datumIzdavanja.slice(0, 10) : "",
  brojEspb: document.brojEspb != null ? String(document.brojEspb) : "",
  stecenoZvanje: document.stecenoZvanje ?? "",
  datumDiplomiranja: document.datumDiplomiranja ? document.datumDiplomiranja.slice(0, 10) : "",
  godinaUpisa: document.godinaUpisa != null ? String(document.godinaUpisa) : "",
  prosecnaOcena: document.prosecnaOcena != null ? String(document.prosecnaOcena) : "",
  idFakulteta: document.idFakulteta != null ? String(document.idFakulteta) : "",
  file: null,
});

const toUverenjeForm = (
  document: PrijavaDocumentsRecord["uverenje"],
): UverenjeDocumentFormState => ({
  datumIzdavanja: document.datumIzdavanja ? document.datumIzdavanja.slice(0, 10) : "",
  idFakulteta: document.idFakulteta != null ? String(document.idFakulteta) : "",
  ukupnoEspb: document.ukupnoEspb != null ? String(document.ukupnoEspb) : "",
  prosecnaOcena: document.prosecnaOcena != null ? String(document.prosecnaOcena) : "",
  file: null,
});

export default function PrijavePage(): ReactElement {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const username = useAppSelector((state) => state.auth.username);
  const role = useAppSelector((state) => state.auth.role);
  const isAdmin = role === "admin";
  const {
    rows,
    fakulteti,
    search,
    sortValue,
    statusFilter,
    isLoadingRows,
    errorMessage: globalErrorMessage,
    oracleDetails: globalOracleDetails,
  } = useAppSelector((state) => state.prijave);

  const [form, setForm] = useState<PrijavaFormState>(() => createEmptyPrijavaForm(isAdmin));
  const [diplomaForm, setDiplomaForm] = useState<DiplomaDocumentFormState>(emptyDiplomaForm);
  const [uverenjeForm, setUverenjeForm] = useState<UverenjeDocumentFormState>(emptyUverenjeForm);
  const [documents, setDocuments] = useState<PrijavaDocumentsRecord>(emptyDocuments);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(false);
  const [studentDocumentKey, setStudentDocumentKey] = useState<ActivePrijavaKey | null>(null);
  const [existingStudentPrijava, setExistingStudentPrijava] = useState<Prijava | null>(null);
  const [isCheckingExistingPrijava, setIsCheckingExistingPrijava] = useState(false);
  const [adminDocumentsByKey, setAdminDocumentsByKey] = useState<
    Record<string, { diplomaHasFile: boolean; uverenjeHasFile: boolean; isLoading: boolean }>
  >({});
  const [adminStatusByKey, setAdminStatusByKey] = useState<Record<string, string>>({});
  const [studyPrograms, setStudyPrograms] = useState<StudyProgramOption[]>([]);
  const [savingStatusKey, setSavingStatusKey] = useState<string | null>(null);
  const [downloadingDocumentKey, setDownloadingDocumentKey] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(null);
  const [localOracleDetails, setLocalOracleDetails] = useState<string | undefined>(undefined);

  const activeDocumentKey = studentDocumentKey;
  const areStudentDocumentsAttached = documents.diploma.hasFile && documents.uverenje.hasFile;
  const shouldShowStudentSummary =
    !isAdmin && Boolean(existingStudentPrijava) && areStudentDocumentsAttached;
  const getRowKey = (brojPrijave: number, skolskaGodina: string): string =>
    `${brojPrijave}|${skolskaGodina}`;
  const getDocumentActionKey = (
    brojPrijave: number,
    skolskaGodina: string,
    documentType: PrijavaDocumentType,
  ): string => `${brojPrijave}|${skolskaGodina}|${documentType}`;

  const handleLogout = (): void => {
    dispatch(logoutSuccess());
  };

  const clearFeedback = (): void => {
    setSuccessMessage(null);
    setLocalErrorMessage(null);
    setLocalOracleDetails(undefined);
    dispatch(clearPrijaveError());
  };

  const resetDocuments = (): void => {
    setDocuments(emptyDocuments);
    setDiplomaForm(emptyDiplomaForm);
    setUverenjeForm(emptyUverenjeForm);
  };

  const resetPrijavaForm = (): void => {
    setForm(createEmptyPrijavaForm(isAdmin));
  };

  const setRequestError = (error: unknown): void => {
    const parsed = toApiClientError(error);
    setLocalErrorMessage(`${parsed.title}: ${parsed.message}`);
    setLocalOracleDetails(parsed.oracleDetails);
  };

  const loadRows = async (): Promise<void> => {
    clearFeedback();
    await dispatch(loadPrijaveRows());
  };

  const refreshFakulteti = async (): Promise<void> => {
    await dispatch(loadFakulteti());
  };

  const loadStudyPrograms = async (): Promise<void> => {
    if (!token) {
      return;
    }

    try {
      const response = await listStudyProgramsRequest(token);
      setStudyPrograms(response.data.rows);
    } catch {
      setStudyPrograms([]);
    }
  };

  const loadDocuments = async (key: ActivePrijavaKey): Promise<void> => {
    if (!token) {
      return;
    }

    setIsDocumentsLoading(true);
    clearFeedback();

    try {
      const response = await getPrijavaDocumentsRequest(token, key.brojPrijave, key.skolskaGodina);
      setDocuments(response.data);
      setDiplomaForm(toDiplomaForm(response.data.diploma));
      setUverenjeForm(toUverenjeForm(response.data.uverenje));
    } catch (error) {
      resetDocuments();
      setRequestError(error);
    } finally {
      setIsDocumentsLoading(false);
    }
  };

  const loadStudentExistingPrijava = async (): Promise<void> => {
    if (!token || isAdmin) {
      return;
    }

    setIsCheckingExistingPrijava(true);
    try {
      const response = await sessionRequest(token);
      dispatch(
        updateAuthSession({
          username: response.data.username,
          role: response.data.role,
          hasApplied: response.data.hasApplied,
        }),
      );

      const latestPrijava = response.data.latestPrijava;
      setExistingStudentPrijava(latestPrijava);

      if (latestPrijava) {
        const key = {
          brojPrijave: latestPrijava.brojPrijave,
          skolskaGodina: latestPrijava.skolskaGodina,
        };
        setStudentDocumentKey(key);
        await loadDocuments(key);
      } else {
        setStudentDocumentKey(null);
      }
    } catch {
      setExistingStudentPrijava(null);
      setStudentDocumentKey(null);
    } finally {
      setIsCheckingExistingPrijava(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      void loadRows();
    }
    if (!isAdmin) {
      void loadStudentExistingPrijava();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAdmin]);

  useEffect(() => {
    void refreshFakulteti();
    void loadStudyPrograms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!isAdmin && form.statusPrijave !== "Podneta") {
      setForm((prev) => ({ ...prev, statusPrijave: "Podneta" }));
    }
  }, [form.statusPrijave, isAdmin]);

  useEffect(() => {
    if (!isAdmin || !token || rows.length === 0) {
      if (isAdmin && rows.length === 0) {
        setAdminDocumentsByKey({});
        setAdminStatusByKey({});
      }
      return;
    }

    const initialStatusMap = rows.reduce<Record<string, string>>((acc, row) => {
      acc[getRowKey(row.brojPrijave, row.skolskaGodina)] = row.statusPrijave ?? "Podneta";
      return acc;
    }, {});
    setAdminStatusByKey(initialStatusMap);

    const loadingMap = rows.reduce<
      Record<string, { diplomaHasFile: boolean; uverenjeHasFile: boolean; isLoading: boolean }>
    >((acc, row) => {
      acc[getRowKey(row.brojPrijave, row.skolskaGodina)] = {
        diplomaHasFile: false,
        uverenjeHasFile: false,
        isLoading: true,
      };
      return acc;
    }, {});
    setAdminDocumentsByKey(loadingMap);

    void Promise.all(
      rows.map(async (row) => {
        const key = getRowKey(row.brojPrijave, row.skolskaGodina);
        try {
          const response = await getPrijavaDocumentsRequest(
            token,
            row.brojPrijave,
            row.skolskaGodina,
          );
          return {
            key,
            data: {
              diplomaHasFile: response.data.diploma.hasFile,
              uverenjeHasFile: response.data.uverenje.hasFile,
              isLoading: false,
            },
          };
        } catch {
          return {
            key,
            data: {
              diplomaHasFile: false,
              uverenjeHasFile: false,
              isLoading: false,
            },
          };
        }
      }),
    ).then((results) => {
      setAdminDocumentsByKey((prev) => {
        const next = { ...prev };
        results.forEach((result) => {
          next[result.key] = result.data;
        });
        return next;
      });
    });
  }, [isAdmin, rows, token]);

  const onFormChange = (field: keyof PrijavaFormState, value: string): void => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onDiplomaFormChange = (
    field: keyof DiplomaDocumentFormState,
    value: string | File | null,
  ): void => {
    setDiplomaForm((prev) => ({ ...prev, [field]: value }));
  };

  const onUverenjeFormChange = (
    field: keyof UverenjeDocumentFormState,
    value: string | File | null,
  ): void => {
    setUverenjeForm((prev) => ({ ...prev, [field]: value }));
  };

  const onAdminStatusSave = async (row: Prijava): Promise<void> => {
    if (!token) {
      return;
    }

    const key = getRowKey(row.brojPrijave, row.skolskaGodina);
    const nextStatus = adminStatusByKey[key] ?? row.statusPrijave ?? "Podneta";

    clearFeedback();
    setSavingStatusKey(key);

    try {
      if (nextStatus !== "Podneta" && nextStatus !== "Odobrena" && nextStatus !== "Odbijena") {
        setLocalErrorMessage("Neispravan status prijave.");
        return;
      }

      await updatePrijavaStatusRequest(token, row.brojPrijave, row.skolskaGodina, nextStatus);

      setSuccessMessage("Status prijave je uspesno azuriran.");
      await loadRows();
    } catch (error) {
      setRequestError(error);
    } finally {
      setSavingStatusKey(null);
    }
  };

  const onAdminDownloadDocument = async (
    row: Prijava,
    documentType: PrijavaDocumentType,
  ): Promise<void> => {
    if (!token) {
      return;
    }

    const actionKey = getDocumentActionKey(row.brojPrijave, row.skolskaGodina, documentType);
    setDownloadingDocumentKey(actionKey);

    try {
      const result = await downloadPrijavaDocumentRequest(
        token,
        row.brojPrijave,
        row.skolskaGodina,
        documentType,
      );

      const blobUrl = window.URL.createObjectURL(result.blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);

      setSuccessMessage(
        documentType === "diploma"
          ? "Diploma je uspesno preuzeta."
          : "Uverenje je uspesno preuzeto.",
      );
    } catch (error) {
      setRequestError(error);
    } finally {
      setDownloadingDocumentKey(null);
    }
  };

  const onStudentCreate = async (): Promise<void> => {
    if (!token) {
      return;
    }

    const missingFields: string[] = [];
    const requiresPrijavaCreate = !existingStudentPrijava;

    if (requiresPrijavaCreate) {
      if (!form.jmbg.trim()) missingFields.push("JMBG");
      if (!form.imePrezime.trim()) missingFields.push("Ime i prezime");
      if (!form.emailVrednost.trim()) missingFields.push("Email");
      if (!form.adresaUlica.trim()) missingFields.push("Adresa - ulica");
      if (!form.adresaBroj.trim()) missingFields.push("Adresa - broj");
      if (!form.adresaGrad.trim()) missingFields.push("Adresa - grad");
      if (!form.skolskaGodina.trim()) missingFields.push("Skolska godina");
      if (!form.datumPrijave.trim()) missingFields.push("Datum prijave");
      if (!form.konkursniRok.trim()) missingFields.push("Konkursni rok");
      if (!form.idPrograma.trim()) missingFields.push("Studijski program i modul");
    }

    if (!diplomaForm.datumIzdavanja.trim()) missingFields.push("Diploma - datum izdavanja");
    if (!diplomaForm.brojEspb.trim()) missingFields.push("Diploma - broj ESPB");
    if (!diplomaForm.stecenoZvanje.trim()) missingFields.push("Diploma - steceno zvanje");
    if (!diplomaForm.datumDiplomiranja.trim()) missingFields.push("Diploma - datum diplomiranja");
    if (!diplomaForm.godinaUpisa.trim()) missingFields.push("Diploma - godina upisa");
    if (!diplomaForm.prosecnaOcena.trim()) missingFields.push("Diploma - prosecna ocena");
    if (!diplomaForm.idFakulteta.trim()) missingFields.push("Diploma - fakultet");
    if (!diplomaForm.file && !documents.diploma.hasFile) missingFields.push("Diploma - fajl");

    if (!uverenjeForm.datumIzdavanja.trim()) missingFields.push("Uverenje - datum izdavanja");
    if (!uverenjeForm.idFakulteta.trim()) missingFields.push("Uverenje - fakultet");
    if (!uverenjeForm.ukupnoEspb.trim()) missingFields.push("Uverenje - ukupno ESPB");
    if (!uverenjeForm.prosecnaOcena.trim()) missingFields.push("Uverenje - prosecna ocena");
    if (!uverenjeForm.file && !documents.uverenje.hasFile) missingFields.push("Uverenje - fajl");

    if (missingFields.length > 0) {
      setLocalErrorMessage(`Popunite obavezna polja: ${missingFields.join(", ")}.`);
      setLocalOracleDetails(undefined);
      return;
    }

    setIsSubmitting(true);
    clearFeedback();

    try {
      let key: ActivePrijavaKey;

      if (existingStudentPrijava) {
        key = {
          brojPrijave: existingStudentPrijava.brojPrijave,
          skolskaGodina: existingStudentPrijava.skolskaGodina,
        };
      } else {
        const payload = toPayload(form, false);
        const response = await createPrijavaRequest(token, payload);
        key = {
          brojPrijave: response.data.brojPrijave,
          skolskaGodina: response.data.skolskaGodina,
        };

        setExistingStudentPrijava({
          brojPrijave: response.data.brojPrijave,
          datumPrijave: payload.datumPrijave,
          skolskaGodina: response.data.skolskaGodina,
          idPrograma: payload.idPrograma,
          statusPrijave: "Podneta",
          konkursniRok: payload.konkursniRok,
          jmbg: payload.jmbg,
          imePrezime: payload.imePrezime,
          sistemskiUpdate: null,
        });
      }

      if (diplomaForm.file) {
        await uploadPrijavaDocumentRequest(
          token,
          key.brojPrijave,
          key.skolskaGodina,
          "diploma",
          diplomaForm.file,
          {
            datumIzdavanja: diplomaForm.datumIzdavanja,
            brojEspb: diplomaForm.brojEspb,
            stecenoZvanje: diplomaForm.stecenoZvanje,
            datumDiplomiranja: diplomaForm.datumDiplomiranja,
            godinaUpisa: diplomaForm.godinaUpisa,
            prosecnaOcena: diplomaForm.prosecnaOcena,
            idFakulteta: diplomaForm.idFakulteta,
          },
        );
      }

      if (uverenjeForm.file) {
        await uploadPrijavaDocumentRequest(
          token,
          key.brojPrijave,
          key.skolskaGodina,
          "uverenje",
          uverenjeForm.file,
          {
            datumIzdavanja: uverenjeForm.datumIzdavanja,
            idFakulteta: uverenjeForm.idFakulteta,
            ukupnoEspb: uverenjeForm.ukupnoEspb,
            prosecnaOcena: uverenjeForm.prosecnaOcena,
          },
        );
      }

      setStudentDocumentKey(key);
      dispatch(
        updateAuthSession({
          username: username ?? form.jmbg,
          role: "student",
          hasApplied: true,
        }),
      );
      await loadDocuments(key);
      setSuccessMessage("Prijava i dokumentacija su uspesno poslati.");
    } catch (error) {
      setRequestError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-300 bg-white p-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Prijave</h1>
            <p className="text-sm text-slate-600">
              {isAdmin
                ? "Administracija, pregled dokumentacije i obrada statusa prijava"
                : "Podnosenje prijave i otpremanje dokumentacije za master studije"}
            </p>
          </div>
          {isAdmin ? (
            <div className="flex gap-2">
              <Link
                to="/upis"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
              >
                Modul upis
              </Link>
              <Link
                to="/dashboard"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
              >
                Nazad na kontrolnu tablu
              </Link>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link
                to="/upis"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
              >
                Status upisa
              </Link>
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
                onClick={handleLogout}
              >
                Odjavi se
              </button>
            </div>
          )}
        </header>

        {!isAdmin && isCheckingExistingPrijava ? (
          <section className="rounded-2xl border border-slate-300 bg-white p-5">
            <p className="text-sm text-slate-600">Proveravamo da li vec postoji vasa prijava...</p>
          </section>
        ) : null}

        {shouldShowStudentSummary ? (
          <StudentPrijavaSummaryCard
            prijava={existingStudentPrijava!}
            documents={documents}
            isDocumentsLoading={isDocumentsLoading}
            onRefresh={() => {
              void loadStudentExistingPrijava();
            }}
          />
        ) : null}

        {!isAdmin && !shouldShowStudentSummary ? (
          <section className="rounded-2xl border border-slate-300 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {existingStudentPrijava ? "Dopuna dokumentacije" : "Podaci o prijavi"}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Popunite sve podatke i prilozite oba dokumenta. Slanje se dozvoljava tek kada je
                  kompletna prijava spremna.
                </p>
              </div>
              {activeDocumentKey ? (
                <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                  Aktivna prijava:{" "}
                  <span className="font-semibold">{activeDocumentKey.brojPrijave}</span>
                  {" / "}
                  <span className="font-semibold">{activeDocumentKey.skolskaGodina}</span>
                </div>
              ) : null}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Ime i prezime"
                value={form.imePrezime}
                onChange={(event) => onFormChange("imePrezime", event.target.value)}
              />
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="JMBG"
                value={form.jmbg}
                onChange={(event) => onFormChange("jmbg", event.target.value)}
              />
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Email"
                value={form.emailVrednost}
                onChange={(event) => onFormChange("emailVrednost", event.target.value)}
              />
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Adresa - ulica"
                value={form.adresaUlica}
                onChange={(event) => onFormChange("adresaUlica", event.target.value)}
              />
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Adresa - broj"
                value={form.adresaBroj}
                onChange={(event) => onFormChange("adresaBroj", event.target.value)}
              />
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Adresa - grad"
                value={form.adresaGrad}
                onChange={(event) => onFormChange("adresaGrad", event.target.value)}
              />
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Skolska godina"
                value={form.skolskaGodina}
                onChange={(event) => onFormChange("skolskaGodina", event.target.value)}
                disabled={Boolean(existingStudentPrijava)}
              />
              <select
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={form.idPrograma}
                onChange={(event) => onFormChange("idPrograma", event.target.value)}
                disabled={Boolean(existingStudentPrijava)}
              >
                <option value="">Izaberite program i modul</option>
                {studyPrograms.map((program) => (
                  <option key={program.idPrograma} value={String(program.idPrograma)}>
                    {program.nazivPrograma} | {program.modul}
                  </option>
                ))}
              </select>
              <input
                type="date"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={form.datumPrijave}
                onChange={(event) => onFormChange("datumPrijave", event.target.value)}
              />
              <select
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={form.konkursniRok}
                onChange={(event) => onFormChange("konkursniRok", event.target.value)}
              >
                <option value="">Izaberite konkursni rok</option>
                <option value="September">Septembar</option>
                <option value="Oktobar">Oktobar</option>
              </select>
            </div>
          </section>
        ) : null}

        {!isAdmin && !shouldShowStudentSummary ? (
          <section className="rounded-2xl border border-slate-300 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Dokumentacija</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Ucitajte diplomu i uverenje. Prijava ce biti poslata tek kada oba dokumenta budu
                  spremna.
                </p>
              </div>
              {isDocumentsLoading ? (
                <span className="text-sm text-slate-500">Ucitavanje dokumenata...</span>
              ) : null}
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <article className="rounded-2xl border border-slate-200 p-4">
                <h3 className="text-base font-semibold text-slate-900">Diploma</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <input
                    type="date"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={diplomaForm.datumIzdavanja}
                    onChange={(event) => onDiplomaFormChange("datumIzdavanja", event.target.value)}
                  />
                  <input
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Broj ESPB"
                    value={diplomaForm.brojEspb}
                    onChange={(event) => onDiplomaFormChange("brojEspb", event.target.value)}
                  />
                  <input
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Steceno zvanje"
                    value={diplomaForm.stecenoZvanje}
                    onChange={(event) => onDiplomaFormChange("stecenoZvanje", event.target.value)}
                  />
                  <input
                    type="date"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={diplomaForm.datumDiplomiranja}
                    onChange={(event) =>
                      onDiplomaFormChange("datumDiplomiranja", event.target.value)
                    }
                  />
                  <input
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Godina upisa"
                    value={diplomaForm.godinaUpisa}
                    onChange={(event) => onDiplomaFormChange("godinaUpisa", event.target.value)}
                  />
                  <input
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Prosecna ocena"
                    value={diplomaForm.prosecnaOcena}
                    onChange={(event) => onDiplomaFormChange("prosecnaOcena", event.target.value)}
                  />
                  <select
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={diplomaForm.idFakulteta}
                    onChange={(event) => onDiplomaFormChange("idFakulteta", event.target.value)}
                  >
                    <option value="">Izaberite fakultet</option>
                    {fakulteti.map((fakultet) => (
                      <option key={fakultet.idFakulteta} value={String(fakultet.idFakulteta)}>
                        {fakultet.nazivFakulteta}
                      </option>
                    ))}
                  </select>
                  <input
                    type="file"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2"
                    onChange={(event) =>
                      onDiplomaFormChange("file", event.target.files?.[0] ?? null)
                    }
                  />
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-600">
                    {documents.diploma.hasFile
                      ? `Poslednji fajl: ${documents.diploma.fileName}`
                      : diplomaForm.file
                        ? `Izabran fajl: ${diplomaForm.file.name}`
                        : "Diploma jos nije izabrana."}
                  </span>
                </div>
              </article>

              <article className="rounded-2xl border border-slate-200 p-4">
                <h3 className="text-base font-semibold text-slate-900">
                  Uverenje o polozenim predmetima
                </h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <input
                    type="date"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={uverenjeForm.datumIzdavanja}
                    onChange={(event) => onUverenjeFormChange("datumIzdavanja", event.target.value)}
                  />
                  <select
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={uverenjeForm.idFakulteta}
                    onChange={(event) => onUverenjeFormChange("idFakulteta", event.target.value)}
                  >
                    <option value="">Izaberite fakultet</option>
                    {fakulteti.map((fakultet) => (
                      <option key={fakultet.idFakulteta} value={String(fakultet.idFakulteta)}>
                        {fakultet.nazivFakulteta}
                      </option>
                    ))}
                  </select>
                  <input
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Ukupno ESPB"
                    value={uverenjeForm.ukupnoEspb}
                    onChange={(event) => onUverenjeFormChange("ukupnoEspb", event.target.value)}
                  />
                  <input
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Prosecna ocena"
                    value={uverenjeForm.prosecnaOcena}
                    onChange={(event) => onUverenjeFormChange("prosecnaOcena", event.target.value)}
                  />
                  <input
                    type="file"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2"
                    onChange={(event) =>
                      onUverenjeFormChange("file", event.target.files?.[0] ?? null)
                    }
                  />
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-600">
                    {documents.uverenje.hasFile
                      ? `Poslednji fajl: ${documents.uverenje.fileName}`
                      : uverenjeForm.file
                        ? `Izabran fajl: ${uverenjeForm.file.name}`
                        : "Uverenje jos nije izabrano."}
                  </span>
                </div>
              </article>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                onClick={() => void onStudentCreate()}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Slanje..." : "Posalji kompletnu prijavu"}
              </button>
              {!isAdmin && !existingStudentPrijava && studentDocumentKey ? (
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
                  onClick={() => {
                    setStudentDocumentKey(null);
                    resetDocuments();
                    resetPrijavaForm();
                    clearFeedback();
                  }}
                >
                  Nova prijava
                </button>
              ) : null}
            </div>
          </section>
        ) : null}

        {isAdmin ? (
          <>
            <FilterBar
              searchValue={search}
              onSearchChange={(value) => dispatch(setPrijavaSearch(value))}
              sortValue={sortValue}
              onSortChange={(value) => dispatch(setPrijavaSortValue(value))}
              sortOptions={[
                { value: "broj_prijave:asc", label: "Broj prijave (rastuce)" },
                { value: "broj_prijave:desc", label: "Broj prijave (opadajuce)" },
                { value: "datum_prijave:desc", label: "Datum prijave (novije)" },
                { value: "datum_prijave:asc", label: "Datum prijave (starije)" },
              ]}
              statusValue={statusFilter}
              onStatusChange={(value) => dispatch(setPrijavaStatusFilter(value))}
              statusOptions={[
                { value: "svi", label: "Status: svi" },
                { value: "Podneta", label: "Podneta" },
                { value: "Odobrena", label: "Odobrena" },
                { value: "Odbijena", label: "Odbijena" },
              ]}
              onApply={() => {
                void loadRows();
              }}
            />
            <div className="flex justify-end">
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
                onClick={() => void loadRows()}
                disabled={isLoadingRows}
              >
                {isLoadingRows ? "Ucitavanje..." : "Osvezi listu"}
              </button>
            </div>

            <DataTable
              title="Lista prijava"
              rows={rows}
              emptyMessage="Nema prijava za prikaz."
              columns={[
                { key: "broj", header: "Broj", render: (row) => row.brojPrijave },
                {
                  key: "godina",
                  header: "Skolska godina",
                  render: (row) => row.skolskaGodina,
                },
                {
                  key: "datum",
                  header: "Datum",
                  render: (row) => (row.datumPrijave ? row.datumPrijave.slice(0, 10) : "-"),
                },
                {
                  key: "diploma",
                  header: "Diploma",
                  render: (row) => {
                    const key = getRowKey(row.brojPrijave, row.skolskaGodina);
                    const docState = adminDocumentsByKey[key];
                    if (!docState || docState.isLoading) {
                      return "Ucitavanje...";
                    }
                    return docState.diplomaHasFile ? "Otpremljena" : "Nedostaje";
                  },
                },
                {
                  key: "uverenje",
                  header: "Uverenje",
                  render: (row) => {
                    const key = getRowKey(row.brojPrijave, row.skolskaGodina);
                    const docState = adminDocumentsByKey[key];
                    if (!docState || docState.isLoading) {
                      return "Ucitavanje...";
                    }
                    return docState.uverenjeHasFile ? "Otpremljeno" : "Nedostaje";
                  },
                },
                {
                  key: "status",
                  header: "Status",
                  render: (row) => {
                    const key = getRowKey(row.brojPrijave, row.skolskaGodina);
                    const value = adminStatusByKey[key] ?? row.statusPrijave ?? "Podneta";

                    return (
                      <select
                        className="rounded border border-slate-300 px-2 py-1 text-xs"
                        value={value}
                        onChange={(event) => {
                          setAdminStatusByKey((prev) => ({
                            ...prev,
                            [key]: event.target.value,
                          }));
                        }}
                      >
                        <option value="Podneta">Podneta</option>
                        <option value="Odobrena">Odobrena</option>
                        <option value="Odbijena">Odbijena</option>
                      </select>
                    );
                  },
                },
                { key: "ime", header: "Kandidat", render: (row) => row.imePrezime ?? "-" },
                { key: "jmbg", header: "JMBG", render: (row) => row.jmbg ?? "-" },
                {
                  key: "akcije",
                  header: "Akcije",
                  render: (row) =>
                    (() => {
                      const key = getRowKey(row.brojPrijave, row.skolskaGodina);
                      const currentStatus = row.statusPrijave ?? "Podneta";
                      const selectedStatus = adminStatusByKey[key] ?? currentStatus;
                      const hasStatusChanged = selectedStatus !== currentStatus;

                      return (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold disabled:opacity-60"
                            onClick={() => void onAdminDownloadDocument(row, "diploma")}
                            disabled={(() => {
                              const docState = adminDocumentsByKey[key];
                              if (!docState || docState.isLoading || !docState.diplomaHasFile) {
                                return true;
                              }
                              return (
                                downloadingDocumentKey ===
                                getDocumentActionKey(row.brojPrijave, row.skolskaGodina, "diploma")
                              );
                            })()}
                          >
                            {downloadingDocumentKey ===
                            getDocumentActionKey(row.brojPrijave, row.skolskaGodina, "diploma")
                              ? "Preuzimanje..."
                              : "Preuzmi diploma"}
                          </button>
                          <button
                            type="button"
                            className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold disabled:opacity-60"
                            onClick={() => void onAdminDownloadDocument(row, "uverenje")}
                            disabled={(() => {
                              const docState = adminDocumentsByKey[key];
                              if (!docState || docState.isLoading || !docState.uverenjeHasFile) {
                                return true;
                              }
                              return (
                                downloadingDocumentKey ===
                                getDocumentActionKey(row.brojPrijave, row.skolskaGodina, "uverenje")
                              );
                            })()}
                          >
                            {downloadingDocumentKey ===
                            getDocumentActionKey(row.brojPrijave, row.skolskaGodina, "uverenje")
                              ? "Preuzimanje..."
                              : "Preuzmi uverenje"}
                          </button>
                          <button
                            type="button"
                            className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold disabled:opacity-60"
                            onClick={() => void onAdminStatusSave(row)}
                            disabled={savingStatusKey === key || !hasStatusChanged}
                          >
                            {savingStatusKey === key ? "Cuvanje..." : "Sacuvaj status"}
                          </button>
                        </div>
                      );
                    })(),
                },
              ]}
            />
          </>
        ) : null}

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
