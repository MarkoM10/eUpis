import type { ReactElement } from "react";
import type {
  DiplomaDocumentFormState,
  UverenjeDocumentFormState,
} from "../../types/forms/prijavaDocumentForm";
import type { FakultetOption } from "../../types/models/fakultet";
import type { PrijavaDocumentsRecord } from "../../types/models/prijavaDocument";
import type { Prijava } from "../../types/models/prijava";
import StudentPrijavaSummaryCard from "./StudentPrijavaSummaryCard";

interface StudentExistingPrijavaSectionProps {
  prijava: Prijava;
  documents: PrijavaDocumentsRecord;
  diplomaForm: DiplomaDocumentFormState;
  uverenjeForm: UverenjeDocumentFormState;
  fakulteti: FakultetOption[];
  isDocumentsLoading: boolean;
  isSubmitting: boolean;
  activeDocumentKey: { brojPrijave: number; skolskaGodina: string } | null;
  onRefresh: () => void;
  onDiplomaFormChange: (field: keyof DiplomaDocumentFormState, value: string | File | null) => void;
  onUverenjeFormChange: (
    field: keyof UverenjeDocumentFormState,
    value: string | File | null,
  ) => void;
  onSubmit: () => void;
}

export default function StudentExistingPrijavaSection({
  prijava,
  documents,
  diplomaForm,
  uverenjeForm,
  fakulteti,
  isDocumentsLoading,
  isSubmitting,
  activeDocumentKey,
  onRefresh,
  onDiplomaFormChange,
  onUverenjeFormChange,
  onSubmit,
}: StudentExistingPrijavaSectionProps): ReactElement {
  const areStudentDocumentsAttached = documents.diploma.hasFile && documents.uverenje.hasFile;

  return (
    <>
      <StudentPrijavaSummaryCard
        prijava={prijava}
        documents={documents}
        isDocumentsLoading={isDocumentsLoading}
        onRefresh={onRefresh}
      />

      {!areStudentDocumentsAttached ? (
        <section className="rounded-2xl border border-slate-300 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Dopuna dokumentacije</h2>
              <p className="mt-1 text-sm text-slate-600">
                Prijava vec postoji. Potrebno je da dopunite dokumentaciju i ponovo posaljete.
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
                  onChange={(event) => onDiplomaFormChange("datumDiplomiranja", event.target.value)}
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
                  onChange={(event) => onDiplomaFormChange("file", event.target.files?.[0] ?? null)}
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
              onClick={onSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Slanje..." : "Posalji dopunjenu dokumentaciju"}
            </button>
          </div>
        </section>
      ) : null}
    </>
  );
}
