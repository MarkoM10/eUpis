import { useEffect, useState, type ReactElement } from "react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { updateAuthSession } from "../../redux/slices/authSlice";
import { loadFakulteti } from "../../redux/slices/prijaveSlice";
import { sessionRequest } from "../../services/authService";
import { listActiveKonkursiRequest } from "../../services/konkursService";
import {
  createPrijavaRequest,
  getPrijavaDocumentsRequest,
  upsertStudentKandidatRequest,
  uploadPrijavaDocumentRequest,
} from "../../services/prijaveService";
import type {
  DiplomaDocumentFormState,
  UverenjeDocumentFormState,
} from "../../types/forms/prijavaDocumentForm";
import type { PrijavaFormState } from "../../types/forms/prijavaForm";
import type { PrijavaDocumentsRecord } from "../../types/models/prijavaDocument";
import type { Prijava, PrijavaPayload } from "../../types/models/prijava";
import type { UserRole } from "../../types/models/auth";
import type { ActiveKonkursOption } from "../../types/models/konkurs";
import type { StudyProgramOption } from "../../types/models/upis";
import { getCurrentYearString, getTodayDateISO } from "../../utils/utils";
import StudentExistingPrijavaSection from "./StudentExistingPrijavaSection";
import StudentNoPrijavaSection from "./StudentNoPrijavaSection";

type ActivePrijavaKey = {
  brojPrijave: number;
  skolskaGodina: string;
};

interface StudentPrijavaFlowSectionProps {
  onClearFeedback: () => void;
  onSetRequestError: (error: unknown) => void;
  onSetSuccessMessage: (message: string) => void;
  onSetValidationError: (message: string) => void;
}

const createEmptyPrijavaForm = (): PrijavaFormState => ({
  brojPrijave: "",
  datumPrijave: getTodayDateISO(),
  skolskaGodina: getCurrentYearString(),
  idKonkursa: "",
  idPrograma: "",
  statusPrijave: "Podneta",
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

const toPayload = (form: PrijavaFormState): PrijavaPayload => ({
  brojPrijave: form.brojPrijave ? Number(form.brojPrijave) : null,
  datumPrijave: form.datumPrijave || null,
  skolskaGodina: form.skolskaGodina,
  idKonkursa: form.idKonkursa ? Number(form.idKonkursa) : null,
  idPrograma: form.idPrograma ? Number(form.idPrograma) : null,
  statusPrijave: "Podneta",
  konkursniRok: form.konkursniRok || null,
  jmbg: form.jmbg || null,
  imePrezime: form.imePrezime || null,
  sistemskiUpdate: null,
  kandidat: null,
});

const toStudentKandidatPayload = (form: PrijavaFormState) => ({
  jmbg: form.jmbg || null,
  imePrezime: form.imePrezime || null,
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

const areRequiredDocumentsAttached = (
  documents: PrijavaDocumentsRecord,
  diplomaForm: DiplomaDocumentFormState,
  uverenjeForm: UverenjeDocumentFormState,
): boolean => {
  const hasDiploma = documents.diploma.hasFile || Boolean(diplomaForm.file);
  const hasUverenje = documents.uverenje.hasFile || Boolean(uverenjeForm.file);
  return hasDiploma && hasUverenje;
};

const buildExistingPrijavaFromPayload = (
  payload: PrijavaPayload,
  brojPrijave: number,
  skolskaGodina: string,
): Prijava => ({
  brojPrijave,
  datumPrijave: payload.datumPrijave,
  skolskaGodina,
  idKonkursa: payload.idKonkursa,
  idPrograma: payload.idPrograma,
  statusPrijave: "Podneta",
  konkursniRok: payload.konkursniRok,
  jmbg: payload.jmbg,
  imePrezime: payload.imePrezime,
  sistemskiUpdate: null,
});

export default function StudentPrijavaFlowSection({
  onClearFeedback,
  onSetRequestError,
  onSetSuccessMessage,
  onSetValidationError,
}: StudentPrijavaFlowSectionProps): ReactElement {
  const dispatch = useAppDispatch();
  const { token, username } = useAppSelector((state) => state.auth);
  const fakulteti = useAppSelector((state) => state.prijave.fakulteti);

  const [form, setForm] = useState<PrijavaFormState>(() => createEmptyPrijavaForm());
  const [diplomaForm, setDiplomaForm] = useState<DiplomaDocumentFormState>(emptyDiplomaForm);
  const [uverenjeForm, setUverenjeForm] = useState<UverenjeDocumentFormState>(emptyUverenjeForm);
  const [documents, setDocuments] = useState<PrijavaDocumentsRecord>(emptyDocuments);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(false);
  const [studentDocumentKey, setStudentDocumentKey] = useState<ActivePrijavaKey | null>(null);
  const [existingStudentPrijava, setExistingStudentPrijava] = useState<Prijava | null>(null);
  const [isCheckingExistingPrijava, setIsCheckingExistingPrijava] = useState(false);
  const [activeKonkursi, setActiveKonkursi] = useState<ActiveKonkursOption[]>([]);
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [isSavingKandidat, setIsSavingKandidat] = useState(false);
  const [isKandidatPrepared, setIsKandidatPrepared] = useState(false);

  const selectedKonkurs =
    form.idKonkursa && Number.isFinite(Number(form.idKonkursa))
      ? (activeKonkursi.find((k) => k.idKonkursa === Number(form.idKonkursa)) ?? null)
      : null;

  const studyPrograms: StudyProgramOption[] = selectedKonkurs
    ? selectedKonkurs.stavke.map((stavka) => ({
        idPrograma: stavka.idPrograma,
        nazivPrograma: stavka.nazivPrograma ?? "Nepoznat program",
        modul: stavka.modul ?? "",
        brojDostupnihMesta: stavka.brojDostupnihMesta,
      }))
    : [];

  const resetDocuments = (): void => {
    setDocuments(emptyDocuments);
    setDiplomaForm(emptyDiplomaForm);
    setUverenjeForm(emptyUverenjeForm);
  };

  const loadActiveKonkursi = async (): Promise<void> => {
    if (!token) {
      return;
    }

    try {
      const response = await listActiveKonkursiRequest(token);
      setActiveKonkursi(response.data.rows);
    } catch {
      setActiveKonkursi([]);
    }
  };

  const loadDocuments = async (key: ActivePrijavaKey): Promise<void> => {
    if (!token) {
      return;
    }

    setIsDocumentsLoading(true);
    onClearFeedback();

    try {
      const response = await getPrijavaDocumentsRequest(token, key.brojPrijave, key.skolskaGodina);
      setDocuments(response.data);
      setDiplomaForm(toDiplomaForm(response.data.diploma));
      setUverenjeForm(toUverenjeForm(response.data.uverenje));
    } catch (error) {
      resetDocuments();
      onSetRequestError(error);
    } finally {
      setIsDocumentsLoading(false);
    }
  };

  const loadStudentExistingPrijava = async (): Promise<void> => {
    if (!token) {
      return;
    }

    setIsCheckingExistingPrijava(true);
    try {
      const response = await sessionRequest(token);
      dispatch(
        updateAuthSession({
          username: response.data.username,
          role: response.data.role as UserRole,
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
        setWizardStep(1);
        setIsKandidatPrepared(false);
      }
    } catch {
      setExistingStudentPrijava(null);
      setStudentDocumentKey(null);
    } finally {
      setIsCheckingExistingPrijava(false);
    }
  };

  const resolvePrijavaKey = async (): Promise<ActivePrijavaKey> => {
    if (!token) {
      throw new Error("Missing token");
    }

    if (existingStudentPrijava) {
      return {
        brojPrijave: existingStudentPrijava.brojPrijave,
        skolskaGodina: existingStudentPrijava.skolskaGodina,
      };
    }

    const payload = toPayload(form);
    const response = await createPrijavaRequest(token, payload);

    setExistingStudentPrijava(
      buildExistingPrijavaFromPayload(
        payload,
        response.data.brojPrijave,
        response.data.skolskaGodina,
      ),
    );

    return {
      brojPrijave: response.data.brojPrijave,
      skolskaGodina: response.data.skolskaGodina,
    };
  };

  const uploadDiplomaIfNeeded = async (key: ActivePrijavaKey): Promise<void> => {
    if (!token || !diplomaForm.file) {
      return;
    }

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
  };

  const uploadUverenjeIfNeeded = async (key: ActivePrijavaKey): Promise<void> => {
    if (!token || !uverenjeForm.file) {
      return;
    }

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
  };

  const finalizeStudentSubmission = async (key: ActivePrijavaKey): Promise<void> => {
    setStudentDocumentKey(key);
    dispatch(
      updateAuthSession({
        username: username ?? form.jmbg,
        role: "student",
        hasApplied: true,
      }),
    );
    await loadDocuments(key);
    onSetSuccessMessage("Prijava i dokumentacija su uspesno poslati.");
  };

  const onStudentCreate = async (): Promise<void> => {
    if (!token) {
      return;
    }

    if (!existingStudentPrijava && !isKandidatPrepared) {
      onSetValidationError("Prvo sacuvajte podatke kandidata u koraku 1.");
      return;
    }

    if (!areRequiredDocumentsAttached(documents, diplomaForm, uverenjeForm)) {
      onSetValidationError(
        "Za slanje prijave potrebno je da diploma i uverenje budu prilozene (postojeci ili novi fajlovi).",
      );
      return;
    }

    if (!form.idKonkursa) {
      onSetValidationError("Izaberite konkurs pre slanja prijave.");
      return;
    }

    if (!form.idPrograma) {
      onSetValidationError("Izaberite program/modul iz konkursa pre slanja prijave.");
      return;
    }

    setIsSubmitting(true);
    onClearFeedback();

    try {
      const key = await resolvePrijavaKey();
      await uploadDiplomaIfNeeded(key);
      await uploadUverenjeIfNeeded(key);
      await finalizeStudentSubmission(key);
    } catch (error) {
      onSetRequestError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSaveStudentKandidat = async (): Promise<void> => {
    if (!token) {
      return;
    }

    setIsSavingKandidat(true);
    onClearFeedback();

    try {
      await upsertStudentKandidatRequest(token, toStudentKandidatPayload(form));
      await loadActiveKonkursi();
      setIsKandidatPrepared(true);
      setWizardStep(2);
      onSetSuccessMessage("Podaci kandidata su uspesno sacuvani. Nastavite na korak prijave.");
    } catch (error) {
      onSetRequestError(error);
    } finally {
      setIsSavingKandidat(false);
    }
  };

  useEffect(() => {
    void loadStudentExistingPrijava();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    void dispatch(loadFakulteti());
    void loadActiveKonkursi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    setForm((prev) =>
      prev.statusPrijave === "Podneta" ? prev : { ...prev, statusPrijave: "Podneta" },
    );
  }, [form.statusPrijave]);

  const onFormChange = (field: keyof PrijavaFormState, value: string): void => {
    if (field === "idKonkursa") {
      const konkurs = activeKonkursi.find((item) => item.idKonkursa === Number(value));
      setForm((prev) => ({
        ...prev,
        idKonkursa: value,
        idPrograma: "",
        skolskaGodina: konkurs?.skolskaGodina ?? prev.skolskaGodina,
        konkursniRok: konkurs?.konkursniRok ?? prev.konkursniRok,
      }));
      return;
    }

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

  if (isCheckingExistingPrijava) {
    return (
      <section className="rounded-2xl border border-slate-300 bg-white p-5">
        <p className="text-sm text-slate-600">Proveravamo da li vec postoji vasa prijava...</p>
      </section>
    );
  }

  if (existingStudentPrijava) {
    return (
      <StudentExistingPrijavaSection
        prijava={existingStudentPrijava}
        documents={documents}
        diplomaForm={diplomaForm}
        uverenjeForm={uverenjeForm}
        fakulteti={fakulteti}
        isDocumentsLoading={isDocumentsLoading}
        isSubmitting={isSubmitting}
        activeDocumentKey={studentDocumentKey}
        onRefresh={() => {
          void loadStudentExistingPrijava();
        }}
        onDiplomaFormChange={onDiplomaFormChange}
        onUverenjeFormChange={onUverenjeFormChange}
        onSubmit={() => {
          void onStudentCreate();
        }}
      />
    );
  }

  return (
    <StudentNoPrijavaSection
      form={form}
      diplomaForm={diplomaForm}
      uverenjeForm={uverenjeForm}
      documents={documents}
      fakulteti={fakulteti}
      activeKonkursi={activeKonkursi}
      selectedKonkurs={selectedKonkurs}
      studyPrograms={studyPrograms}
      isDocumentsLoading={isDocumentsLoading}
      isSubmitting={isSubmitting}
      isSavingKandidat={isSavingKandidat}
      wizardStep={wizardStep}
      onFormChange={onFormChange}
      onDiplomaFormChange={onDiplomaFormChange}
      onUverenjeFormChange={onUverenjeFormChange}
      onSubmitKandidat={() => {
        void onSaveStudentKandidat();
      }}
      onSubmitPrijava={() => {
        void onStudentCreate();
      }}
      onBackToKandidatStep={() => {
        setWizardStep(1);
      }}
    />
  );
}
