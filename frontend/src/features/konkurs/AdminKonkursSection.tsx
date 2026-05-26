import { useEffect, useMemo, useState, type ReactElement } from "react";
import {
  createKonkursRequest,
  listKonkursiRequest,
  updateKonkursStatusRequest,
} from "../../services/konkursService";
import { ApiClientError } from "../../services/api";
import { listStudyProgramsRequest } from "../../services/upisService";
import type { Konkurs, KonkursStatus } from "../../types/models/konkurs";
import type { StudyProgramOption } from "../../types/models/upis";
import { getCurrentYearString } from "../../utils/utils";

interface AdminKonkursSectionProps {
  token: string;
  onClearFeedback: () => void;
  onRequestError: (error: unknown) => void;
  onSuccess: (message: string) => void;
}

type StavkaFormRow = {
  idPrograma: string;
  brojDostupnihMesta: string;
};

const emptyStavka = (): StavkaFormRow => ({
  idPrograma: "",
  brojDostupnihMesta: "",
});

export default function AdminKonkursSection({
  token,
  onClearFeedback,
  onRequestError,
  onSuccess,
}: AdminKonkursSectionProps): ReactElement {
  const [konkursi, setKonkursi] = useState<Konkurs[]>([]);
  const [studyPrograms, setStudyPrograms] = useState<StudyProgramOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [statusSavingId, setStatusSavingId] = useState<number | null>(null);

  const [skolskaGodina, setSkolskaGodina] = useState(getCurrentYearString());
  const [konkursniRok, setKonkursniRok] = useState("Septembar");
  const [datumOd, setDatumOd] = useState("");
  const [datumDo, setDatumDo] = useState("");
  const [status, setStatus] = useState<KonkursStatus>("Aktivan");
  const [stavke, setStavke] = useState<StavkaFormRow[]>([emptyStavka()]);

  const studyProgramMap = useMemo(() => {
    const map = new Map<number, StudyProgramOption>();
    studyPrograms.forEach((p) => map.set(p.idPrograma, p));
    return map;
  }, [studyPrograms]);

  const loadData = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const [konkursiResponse, programsResponse] = await Promise.all([
        listKonkursiRequest(token),
        listStudyProgramsRequest(token),
      ]);
      setKonkursi(konkursiResponse.data.rows);
      setStudyPrograms(programsResponse.data.rows);
    } catch (error) {
      onRequestError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const onStavkaChange = (index: number, patch: Partial<StavkaFormRow>): void => {
    setStavke((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const addStavka = (): void => {
    setStavke((prev) => [...prev, emptyStavka()]);
  };

  const removeStavka = (index: number): void => {
    setStavke((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const onCreate = async (): Promise<void> => {
    onClearFeedback();

    if (datumOd && datumDo && datumOd > datumDo) {
      onRequestError(
        new ApiClientError({
          success: false,
          title: "Neispravan period konkursa",
          message: "Datum od ne moze biti posle datuma do.",
        }),
      );
      return;
    }

    setIsCreating(true);

    try {
      await createKonkursRequest(token, {
        skolskaGodina,
        konkursniRok,
        datumOd,
        datumDo,
        status,
        stavke: stavke
          .filter((s) => s.idPrograma && s.brojDostupnihMesta)
          .map((s) => ({
            idPrograma: Number(s.idPrograma),
            brojDostupnihMesta: Number(s.brojDostupnihMesta),
          })),
      });

      onSuccess("Konkurs je uspesno kreiran.");
      setStavke([emptyStavka()]);
      setDatumOd("");
      setDatumDo("");
      await loadData();
    } catch (error) {
      onRequestError(error);
    } finally {
      setIsCreating(false);
    }
  };

  const onStatusChange = async (idKonkursa: number, nextStatus: KonkursStatus): Promise<void> => {
    onClearFeedback();
    setStatusSavingId(idKonkursa);

    try {
      await updateKonkursStatusRequest(token, idKonkursa, nextStatus);
      onSuccess("Status konkursa je uspesno azuriran.");
      await loadData();
    } catch (error) {
      onRequestError(error);
    } finally {
      setStatusSavingId(null);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-300 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Konkursi za master studije</h2>
          <p className="mt-1 text-sm text-slate-600">
            Prvo se kreira konkurs sa programima/modulima i brojem mesta, pa kandidati podnose
            prijave.
          </p>
        </div>
        <button
          type="button"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
          onClick={() => {
            void loadData();
          }}
          disabled={isLoading}
        >
          {isLoading ? "Ucitavanje..." : "Osvezi konkurse"}
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="Skolska godina"
          value={skolskaGodina}
          onChange={(event) => setSkolskaGodina(event.target.value)}
        />
        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="Konkursni rok"
          value={konkursniRok}
          onChange={(event) => setKonkursniRok(event.target.value)}
        />
        <input
          type="date"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={datumOd}
          onChange={(event) => setDatumOd(event.target.value)}
        />
        <input
          type="date"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={datumDo}
          onChange={(event) => setDatumDo(event.target.value)}
        />
        <select
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={status}
          onChange={(event) => setStatus(event.target.value as KonkursStatus)}
        >
          <option value="Nacrt">Nacrt</option>
          <option value="Aktivan">Aktivan</option>
          <option value="Zatvoren">Zatvoren</option>
          <option value="Arhiviran">Arhiviran</option>
        </select>
      </div>

      <div className="mt-4 space-y-2">
        {stavke.map((stavka, index) => (
          <div key={`stavka-${index}`} className="grid gap-2 md:grid-cols-[1fr,220px,120px]">
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={stavka.idPrograma}
              onChange={(event) => onStavkaChange(index, { idPrograma: event.target.value })}
            >
              <option value="">Izaberite program i modul</option>
              {studyPrograms.map((program) => (
                <option key={program.idPrograma} value={String(program.idPrograma)}>
                  {program.nazivPrograma} | {program.modul}
                </option>
              ))}
            </select>
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Broj dostupnih mesta"
              value={stavka.brojDostupnihMesta}
              onChange={(event) =>
                onStavkaChange(index, { brojDostupnihMesta: event.target.value })
              }
            />
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              onClick={() => removeStavka(index)}
            >
              Ukloni
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
          onClick={addStavka}
        >
          Dodaj program/modul
        </button>
        <button
          type="button"
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          onClick={() => {
            void onCreate();
          }}
          disabled={isCreating}
        >
          {isCreating ? "Kreiranje..." : "Kreiraj konkurs"}
        </button>
      </div>

      <div className="mt-6 overflow-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-left text-slate-700">
              <th className="border border-slate-300 px-3 py-2">Konkurs</th>
              <th className="border border-slate-300 px-3 py-2">Period</th>
              <th className="border border-slate-300 px-3 py-2">Status</th>
              <th className="border border-slate-300 px-3 py-2">Programi/moduli</th>
              <th className="border border-slate-300 px-3 py-2">Promena statusa</th>
            </tr>
          </thead>
          <tbody>
            {konkursi.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="border border-slate-300 px-3 py-4 text-center text-slate-500"
                >
                  Nema kreiranih konkursa.
                </td>
              </tr>
            ) : (
              konkursi.map((konkurs) => (
                <tr key={konkurs.idKonkursa} className="odd:bg-white even:bg-slate-50">
                  <td className="border border-slate-300 px-3 py-2">
                    #{konkurs.idKonkursa} | {konkurs.skolskaGodina} | {konkurs.konkursniRok}
                  </td>
                  <td className="border border-slate-300 px-3 py-2">
                    {konkurs.datumOd.slice(0, 10)} - {konkurs.datumDo.slice(0, 10)}
                  </td>
                  <td className="border border-slate-300 px-3 py-2">{konkurs.status}</td>
                  <td className="border border-slate-300 px-3 py-2">
                    {konkurs.stavke.length === 0
                      ? "Bez stavki"
                      : konkurs.stavke
                          .map((stavka) => {
                            const program = studyProgramMap.get(stavka.idPrograma);
                            const label = program
                              ? `${program.nazivPrograma} | ${program.modul}`
                              : `${stavka.nazivPrograma ?? "Program"} | ${stavka.modul ?? "modul"}`;
                            return `${label} (${stavka.brojDostupnihMesta})`;
                          })
                          .join(", ")}
                  </td>
                  <td className="border border-slate-300 px-3 py-2">
                    <select
                      className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                      value={konkurs.status}
                      onChange={(event) => {
                        void onStatusChange(
                          konkurs.idKonkursa,
                          event.target.value as KonkursStatus,
                        );
                      }}
                      disabled={statusSavingId === konkurs.idKonkursa}
                    >
                      <option value="Nacrt">Nacrt</option>
                      <option value="Aktivan">Aktivan</option>
                      <option value="Zatvoren">Zatvoren</option>
                      <option value="Arhiviran">Arhiviran</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
