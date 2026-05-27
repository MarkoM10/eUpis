import type { ReactElement } from "react";
import type {
  DiplomaDocumentFormState,
  UverenjeDocumentFormState,
} from "../../types/forms/prijavaDocumentForm";
import type { PrijavaFormState } from "../../types/forms/prijavaForm";
import type { FakultetOption } from "../../types/models/fakultet";
import type { ActiveKonkursOption } from "../../types/models/konkurs";
import type { PrijavaDocumentsRecord } from "../../types/models/prijavaDocument";
import type { StudyProgramOption } from "../../types/models/upis";

interface StudentNoPrijavaSectionProps {
  form: PrijavaFormState;
  diplomaForm: DiplomaDocumentFormState;
  uverenjeForm: UverenjeDocumentFormState;
  documents: PrijavaDocumentsRecord;
  fakulteti: FakultetOption[];
  activeKonkursi: ActiveKonkursOption[];
  selectedKonkurs: ActiveKonkursOption | null;
  studyPrograms: StudyProgramOption[];
  isDocumentsLoading: boolean;
  isSubmitting: boolean;
  isSavingKandidat: boolean;
  wizardStep: 1 | 2;
  onFormChange: (field: keyof PrijavaFormState, value: string) => void;
  onDiplomaFormChange: (field: keyof DiplomaDocumentFormState, value: string | File | null) => void;
  onUverenjeFormChange: (
    field: keyof UverenjeDocumentFormState,
    value: string | File | null,
  ) => void;
  onSubmitKandidat: () => void;
  onSubmitPrijava: () => void;
  onBackToKandidatStep: () => void;
}

export default function StudentNoPrijavaSection({
  form,
  diplomaForm,
  uverenjeForm,
  documents,
  fakulteti,
  activeKonkursi,
  selectedKonkurs,
  studyPrograms,
  isDocumentsLoading,
  isSubmitting,
  isSavingKandidat,
  wizardStep,
  onFormChange,
  onDiplomaFormChange,
  onUverenjeFormChange,
  onSubmitKandidat,
  onSubmitPrijava,
  onBackToKandidatStep,
}: StudentNoPrijavaSectionProps): ReactElement {
  return (
    <>
      <section className="rounded-2xl border border-slate-300 bg-white p-4">
        <div className="flex items-center gap-3 text-sm">
          <span
            className={`rounded-full px-3 py-1 font-semibold ${
              wizardStep === 1 ? "bg-teal-700 text-white" : "bg-teal-100 text-teal-900"
            }`}
          >
            1. Kandidat
          </span>
          <span className="text-slate-400">-</span>
          <span
            className={`rounded-full px-3 py-1 font-semibold ${
              wizardStep === 2 ? "bg-teal-700 text-white" : "bg-slate-200 text-slate-700"
            }`}
          >
            2. Prijava i dokumenta
          </span>
        </div>
      </section>

      {wizardStep === 1 ? (
        <section className="rounded-2xl border border-slate-300 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Korak 1: Kreiranje kandidata</h2>
              <p className="mt-1 text-sm text-slate-600">
                Prvo unesite podatke kandidata. Nakon cuvanja otvara se korak za prijavu.
              </p>
            </div>
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
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              onClick={onSubmitKandidat}
              disabled={isSavingKandidat}
            >
              {isSavingKandidat ? "Cuvanje..." : "Sacuvaj kandidata i nastavi"}
            </button>
          </div>
        </section>
      ) : null}

      {wizardStep === 2 ? (
        <>
          <section className="rounded-2xl border border-slate-300 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Korak 2: Podaci o prijavi</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Unesite podatke prijave i prilozite Diplomu i Uverenje o polozenim predmetima.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <select
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={form.idKonkursa}
                onChange={(event) => onFormChange("idKonkursa", event.target.value)}
                disabled={activeKonkursi.length === 0}
              >
                <option value="">
                  {activeKonkursi.length === 0 ? "Nema aktivnih konkursa" : "Izaberite konkurs"}
                </option>
                {activeKonkursi.map((konkurs) => (
                  <option key={konkurs.idKonkursa} value={String(konkurs.idKonkursa)}>
                    #{konkurs.idKonkursa} | {konkurs.skolskaGodina} | {konkurs.konkursniRok} |{" "}
                    {konkurs.nazivFakulteta ?? "Fakultet"}
                  </option>
                ))}
              </select>
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Fakultet"
                value={selectedKonkurs?.nazivFakulteta ?? ""}
                readOnly
              />
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="JMBG"
                value={form.jmbg}
                onChange={(event) => onFormChange("jmbg", event.target.value)}
              />
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Ime i prezime (opciono)"
                value={form.imePrezime}
                onChange={(event) => onFormChange("imePrezime", event.target.value)}
              />
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Skolska godina"
                value={form.skolskaGodina}
                readOnly
              />
              <select
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={form.idPrograma}
                onChange={(event) => onFormChange("idPrograma", event.target.value)}
                disabled={!selectedKonkurs || activeKonkursi.length === 0}
              >
                <option value="">
                  {selectedKonkurs ? "Izaberite program i modul" : "Prvo izaberite konkurs"}
                </option>
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
                disabled
              >
                <option value="">Izaberite konkursni rok</option>
                {selectedKonkurs ? (
                  <option value={selectedKonkurs.konkursniRok}>
                    {selectedKonkurs.konkursniRok}
                  </option>
                ) : null}
              </select>
            </div>

            {activeKonkursi.length === 0 ? (
              <p className="mt-3 text-sm text-amber-700">
                Trenutno nema aktivnog konkursa u otvorenom roku. Administrator treba da postavi
                status konkursa na Aktivan i period koji ukljucuje danasnji datum.
              </p>
            ) : null}
          </section>

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
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
                onClick={onBackToKandidatStep}
                disabled={isSubmitting}
              >
                Nazad na kandidata
              </button>
              <button
                type="button"
                className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                onClick={onSubmitPrijava}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Slanje..." : "Posalji kompletnu prijavu"}
              </button>
            </div>
          </section>
        </>
      ) : null}
    </>
  );
}
