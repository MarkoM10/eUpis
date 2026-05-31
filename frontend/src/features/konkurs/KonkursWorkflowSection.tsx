import { useEffect, useMemo, useState, type ReactElement } from "react";
import {
  confirmKonkursEnrollmentFinalizationRequest,
  downloadKonkursEnrollmentContractRequest,
  generateKonkursFinalRankingRequest,
  listKonkursEligiblePrijaveRequest,
  listKonkursPendingFinalizationsRequest,
  listKonkursiRequest,
  saveKonkursExamScoreRequest,
} from "../../services/konkursService";
import { ApiClientError } from "../../services/api";
import type { Konkurs } from "../../types/models/konkurs";
import type { EligiblePrijavaRow, PendingEnrollmentFinalizationRow } from "../../types/models/upis";
import { triggerFileDownload } from "../../utils/utils";

interface KonkursWorkflowSectionProps {
  token: string;
  onRequestError: (error: unknown) => void;
  onSuccess: (message: string) => void;
  onClearFeedback: () => void;
}

export default function KonkursWorkflowSection({
  token,
  onRequestError,
  onSuccess,
  onClearFeedback,
}: KonkursWorkflowSectionProps): ReactElement {
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [konkursi, setKonkursi] = useState<Konkurs[]>([]);
  const [selectedKonkursId, setSelectedKonkursId] = useState<string>("");
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [eligibleRows, setEligibleRows] = useState<EligiblePrijavaRow[]>([]);
  const [pendingRows, setPendingRows] = useState<PendingEnrollmentFinalizationRow[]>([]);
  const [scoreByPrijava, setScoreByPrijava] = useState<Record<string, string>>({});
  const [savingScoreKey, setSavingScoreKey] = useState<string | null>(null);
  const [confirmingFinalizationKey, setConfirmingFinalizationKey] = useState<string | null>(null);
  const [downloadingContractKey, setDownloadingContractKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedKonkurs = useMemo(
    () => konkursi.find((k) => String(k.idKonkursa) === selectedKonkursId) ?? null,
    [konkursi, selectedKonkursId],
  );

  const selectedProgramSeats = useMemo(() => {
    if (!selectedKonkurs || !selectedProgramId) {
      return 0;
    }

    const stavka = selectedKonkurs.stavke.find((s) => String(s.idPrograma) === selectedProgramId);
    return stavka?.brojDostupnihMesta ?? 0;
  }, [selectedKonkurs, selectedProgramId]);

  const selectedProgramRows = useMemo(() => {
    if (!selectedProgramId) {
      return [] as EligiblePrijavaRow[];
    }

    const selectedProgramNumber = Number(selectedProgramId);
    return eligibleRows.filter((row) => row.idPrograma === selectedProgramNumber);
  }, [eligibleRows, selectedProgramId]);

  const finalRankingRows = useMemo(() => {
    return selectedProgramRows
      .filter((row) => row.examPoints != null)
      .sort((a, b) => {
        const scoreDelta = (b.examPoints ?? 0) - (a.examPoints ?? 0);
        if (scoreDelta !== 0) {
          return scoreDelta;
        }

        return (a.imePrezime ?? "").localeCompare(b.imePrezime ?? "");
      })
      .map((row, index) => ({
        rangMesto: index + 1,
        brojPrijave: row.brojPrijave,
        imePrezime: row.imePrezime ?? "-",
        studijskiProgram: `${row.nazivPrograma ?? "-"} | ${row.modul ?? "-"}`,
        brojPoena: row.examPoints ?? 0,
        status: row.rankingStatus ?? "-",
      }));
  }, [selectedProgramRows]);

  const hasSelection = Boolean(selectedKonkurs && selectedProgramId);
  const hasCandidatesInProgram = selectedProgramRows.length > 0;
  const hasAllScoresSaved =
    hasCandidatesInProgram && selectedProgramRows.every((row) => row.examPoints != null);
  const hasFinalRanking =
    hasCandidatesInProgram &&
    selectedProgramRows.every(
      (row) => row.rankingStatus === "Odobrena" || row.rankingStatus === "Odbijena",
    );

  const loadKonkursi = async (): Promise<void> => {
    const response = await listKonkursiRequest(token);
    setKonkursi(response.data.rows);

    if (!selectedKonkursId && response.data.rows.length > 0) {
      setSelectedKonkursId(String(response.data.rows[0].idKonkursa));
    }
  };

  const loadWorkflow = async (): Promise<void> => {
    if (!selectedKonkursId) {
      setEligibleRows([]);
      setPendingRows([]);
      return;
    }

    setIsLoading(true);
    onClearFeedback();

    try {
      const konkursId = Number(selectedKonkursId);
      const [eligibleResponse, pendingResponse] = await Promise.all([
        listKonkursEligiblePrijaveRequest(token, konkursId),
        listKonkursPendingFinalizationsRequest(token, konkursId),
      ]);

      setEligibleRows(eligibleResponse.data.rows);
      setPendingRows(pendingResponse.data.rows);

      setScoreByPrijava((prev) => {
        const next = { ...prev };
        eligibleResponse.data.rows.forEach((row) => {
          const key = `${row.brojPrijave}|${row.skolskaGodina}`;
          if (!(key in next)) {
            next[key] = row.examPoints != null ? String(row.examPoints) : "";
          }
        });
        return next;
      });
    } catch (error) {
      onRequestError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSaveScore = async (row: EligiblePrijavaRow): Promise<void> => {
    if (!selectedKonkurs) {
      return;
    }

    const key = `${row.brojPrijave}|${row.skolskaGodina}`;
    const rawPoints = scoreByPrijava[key] ?? "";
    const brojPoena = Number(rawPoints);

    if (!Number.isFinite(brojPoena) || brojPoena < 0 || brojPoena > 100) {
      onRequestError(
        new ApiClientError({
          success: false,
          title: "Neispravni poeni",
          message: "Broj poena mora biti broj izmedju 0 i 100.",
        }),
      );
      return;
    }

    setSavingScoreKey(key);
    onClearFeedback();

    try {
      await saveKonkursExamScoreRequest(token, selectedKonkurs.idKonkursa, {
        brojPrijave: row.brojPrijave,
        skolskaGodina: row.skolskaGodina,
        brojPoena,
      });

      onSuccess("Rezultat ispita je uspesno sacuvan.");
      await loadWorkflow();
    } catch (error) {
      onRequestError(error);
    } finally {
      setSavingScoreKey(null);
    }
  };

  const onConfirmFinalization = async (row: PendingEnrollmentFinalizationRow): Promise<void> => {
    if (!selectedKonkurs) {
      return;
    }

    const key = `${row.brojPrijave}|${row.skolskaGodina}`;
    setConfirmingFinalizationKey(key);
    onClearFeedback();

    try {
      const response = await confirmKonkursEnrollmentFinalizationRequest(
        token,
        selectedKonkurs.idKonkursa,
        row.brojPrijave,
        row.skolskaGodina,
      );
      onSuccess(`Upis finalizovan. Broj indeksa: ${response.data.brojIndeksa ?? "-"}.`);
      await loadWorkflow();
    } catch (error) {
      onRequestError(error);
    } finally {
      setConfirmingFinalizationKey(null);
    }
  };

  const onDownloadContract = async (row: PendingEnrollmentFinalizationRow): Promise<void> => {
    const key = `${row.brojPrijave}|${row.skolskaGodina}`;
    setDownloadingContractKey(key);
    onClearFeedback();

    try {
      const result = await downloadKonkursEnrollmentContractRequest(
        token,
        row.brojPrijave,
        row.skolskaGodina,
      );
      triggerFileDownload(result.blob, result.fileName);
      onSuccess("Ugovor je uspesno preuzet.");
    } catch (error) {
      onRequestError(error);
    } finally {
      setDownloadingContractKey(null);
    }
  };

  useEffect(() => {
    void loadKonkursi().catch(onRequestError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    setSelectedProgramId("");
    setWizardStep(1);
    void loadWorkflow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKonkursId]);

  const onNextStep = (): void => {
    if (wizardStep === 1) {
      if (!hasSelection) {
        onRequestError(
          new ApiClientError({
            success: false,
            title: "Nedostaje izbor",
            message: "Prvo izaberite konkurs i studijski program.",
          }),
        );
        return;
      }

      setWizardStep(2);
      return;
    }

    if (wizardStep === 2) {
      if (!hasCandidatesInProgram) {
        onRequestError(
          new ApiClientError({
            success: false,
            title: "Nema prijava",
            message: "Nema odobrenih prijava za izabrani program.",
          }),
        );
        return;
      }

      if (!hasAllScoresSaved) {
        onRequestError(
          new ApiClientError({
            success: false,
            title: "Nedostaju poeni",
            message: "Prelaz na rang listu je moguc tek kada svi kandidati imaju sacuvane poene.",
          }),
        );
        return;
      }

      setWizardStep(3);
      return;
    }

    if (wizardStep === 3) {
      if (!hasFinalRanking) {
        onRequestError(
          new ApiClientError({
            success: false,
            title: "Rang lista nije finalizovana",
            message: "Prvo generisite konacnu rang listu, pa tek onda predjite na finalizaciju.",
          }),
        );
        return;
      }

      setWizardStep(4);
    }
  };

  const onPreviousStep = (): void => {
    setWizardStep((prev) => {
      if (prev === 1) {
        return prev;
      }

      return (prev - 1) as 1 | 2 | 3 | 4;
    });
  };

  const onGenerateFinalRanking = async (): Promise<void> => {
    if (!selectedKonkurs || !selectedProgramId) {
      return;
    }

    setIsSubmitting(true);
    onClearFeedback();

    try {
      const result = await generateKonkursFinalRankingRequest(token, selectedKonkurs.idKonkursa, {
        idPrograma: Number(selectedProgramId),
        skolskaGodina: selectedKonkurs.skolskaGodina,
        brojMesta: selectedProgramSeats,
      });

      onSuccess(
        `Konkursna rang lista generisana. Odobreno: ${result.data.approvedCount}, odbijeno: ${result.data.rejectedCount}.`,
      );
      await loadWorkflow();
    } catch (error) {
      onRequestError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-300 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Konkursni workflow</h2>
          <p className="mt-1 text-sm text-slate-600">
            Korak po korak: izbor konkursa, bodovanje, rangiranje i finalizacija upisa.
          </p>
        </div>
        <button
          type="button"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100 disabled:opacity-60"
          onClick={() => {
            void loadWorkflow();
          }}
          disabled={isLoading}
        >
          {isLoading ? "Ucitavanje..." : "Osvezi workflow"}
        </button>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-4">
        {[
          { step: 1, label: "1. Izbor konkursa" },
          { step: 2, label: "2. Unos bodova" },
          { step: 3, label: "3. Konacna rang lista" },
          { step: 4, label: "4. Finalizacija upisa" },
        ].map((item) => (
          <div
            key={item.step}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
              wizardStep === item.step
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : "border-slate-300 bg-slate-50 text-slate-700"
            }`}
          >
            {item.label}
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 p-4">
        {wizardStep === 1 ? (
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-slate-900">
              Korak 1: Izbor konkursa i programa
            </h3>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <select
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedKonkursId}
                onChange={(event) => setSelectedKonkursId(event.target.value)}
              >
                <option value="">Izaberite konkurs</option>
                {konkursi.map((konkurs) => (
                  <option key={konkurs.idKonkursa} value={String(konkurs.idKonkursa)}>
                    #{konkurs.idKonkursa} | {konkurs.skolskaGodina} | {konkurs.konkursniRok}
                  </option>
                ))}
              </select>

              <select
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedProgramId}
                onChange={(event) => setSelectedProgramId(event.target.value)}
                disabled={!selectedKonkurs}
              >
                <option value="">Izaberite program/modul</option>
                {(selectedKonkurs?.stavke ?? []).map((stavka) => (
                  <option key={stavka.idStavkeKonkursa} value={String(stavka.idPrograma)}>
                    {(stavka.nazivPrograma ?? "Program") + " | " + (stavka.modul ?? "modul")}
                  </option>
                ))}
              </select>

              <div className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                Broj mesta: {selectedProgramSeats || "-"}
              </div>
            </div>
          </div>
        ) : null}

        {wizardStep === 2 ? (
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-slate-900">
              Korak 2: Odobrene prijave i unos bodova
            </h3>
            <div className="overflow-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-900">
                      Prijava
                    </th>
                    <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-900">
                      Kandidat
                    </th>
                    <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-900">
                      Program
                    </th>
                    <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-900">
                      Poeni
                    </th>
                    <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-900">
                      Status
                    </th>
                    <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-900">
                      Akcija
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProgramRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-4 text-center text-slate-500">
                        Nema odobrenih prijava za izabrani program.
                      </td>
                    </tr>
                  ) : (
                    selectedProgramRows.map((row) => (
                      <tr
                        key={`${row.brojPrijave}-${row.skolskaGodina}`}
                        className="border-b border-slate-200 odd:bg-white even:bg-slate-50 hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 text-slate-700">{row.brojPrijave}</td>
                        <td className="px-4 py-3 text-slate-700">{row.imePrezime ?? "-"}</td>
                        <td className="px-4 py-3 text-slate-700">
                          {(row.nazivPrograma ?? "-") + " | " + (row.modul ?? "-")}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          <input
                            className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={scoreByPrijava[`${row.brojPrijave}|${row.skolskaGodina}`] ?? ""}
                            onChange={(event) => {
                              const key = `${row.brojPrijave}|${row.skolskaGodina}`;
                              setScoreByPrijava((prev) => ({
                                ...prev,
                                [key]: event.target.value,
                              }));
                            }}
                            placeholder={row.examPoints != null ? String(row.examPoints) : "0-100"}
                            disabled={row.examPoints != null}
                          />
                        </td>
                        <td className="px-4 py-3 text-slate-700">{row.rankingStatus ?? "-"}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                            onClick={() => {
                              void onSaveScore(row);
                            }}
                            disabled={
                              row.examPoints != null ||
                              savingScoreKey === `${row.brojPrijave}|${row.skolskaGodina}`
                            }
                          >
                            {savingScoreKey === `${row.brojPrijave}|${row.skolskaGodina}`
                              ? "Cuvanje..."
                              : row.examPoints != null
                                ? "Uneto"
                                : "Sacuvaj poene"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {wizardStep === 3 ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-slate-900">
                Korak 3: Rang lista i generisanje konacnog plasmana
              </h3>
              <button
                type="button"
                className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                onClick={() => {
                  void onGenerateFinalRanking();
                }}
                disabled={
                  !selectedKonkurs || !selectedProgramId || isSubmitting || !hasAllScoresSaved
                }
              >
                {isSubmitting ? "Generisanje..." : "Generisi konacnu rang listu"}
              </button>
            </div>

            <div className="overflow-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-900">
                      Mesto
                    </th>
                    <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-900">
                      Prijava
                    </th>
                    <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-900">
                      Kandidat
                    </th>
                    <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-900">
                      Poeni
                    </th>
                    <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-900">
                      Status konacne liste
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {finalRankingRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-center text-slate-500">
                        Konacna rang lista jos nije dostupna za prikaz.
                      </td>
                    </tr>
                  ) : (
                    finalRankingRows.map((row) => (
                      <tr
                        key={`${row.brojPrijave}-${row.rangMesto}`}
                        className="border-b border-slate-200 odd:bg-white even:bg-slate-50 hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 text-slate-700">{row.rangMesto}</td>
                        <td className="px-4 py-3 text-slate-700">{row.brojPrijave}</td>
                        <td className="px-4 py-3 text-slate-700">{row.imePrezime}</td>
                        <td className="px-4 py-3 text-slate-700">{row.brojPoena}</td>
                        <td className="px-4 py-3 text-slate-700">{row.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {wizardStep === 4 ? (
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-slate-900">Korak 4: Finalizacija upisa</h3>
            <div className="overflow-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-900">
                      Prijava
                    </th>
                    <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-900">
                      Kandidat
                    </th>
                    <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-900">
                      Program
                    </th>
                    <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-900">
                      Ugovor
                    </th>
                    <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-900">
                      Akcija
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-center text-slate-500">
                        Nema kandidata za finalizaciju u ovom konkursu.
                      </td>
                    </tr>
                  ) : (
                    pendingRows.map((row) => (
                      <tr
                        key={row.idUpisa}
                        className="border-b border-slate-200 odd:bg-white even:bg-slate-50 hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 text-slate-700">{row.brojPrijave}</td>
                        <td className="px-4 py-3 text-slate-700">{row.imePrezime ?? "-"}</td>
                        <td className="px-4 py-3 text-slate-700">{row.studijskiProgram ?? "-"}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold hover:bg-slate-100 disabled:opacity-60"
                            onClick={() => {
                              void onDownloadContract(row);
                            }}
                            disabled={
                              !row.signedContractUploadedAt ||
                              downloadingContractKey === `${row.brojPrijave}|${row.skolskaGodina}`
                            }
                          >
                            {downloadingContractKey === `${row.brojPrijave}|${row.skolskaGodina}`
                              ? "Preuzimanje..."
                              : "Preuzmi ugovor"}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                            onClick={() => {
                              void onConfirmFinalization(row);
                            }}
                            disabled={
                              downloadingContractKey ===
                                `${row.brojPrijave}|${row.skolskaGodina}` ||
                              confirmingFinalizationKey ===
                                `${row.brojPrijave}|${row.skolskaGodina}`
                            }
                          >
                            {confirmingFinalizationKey === `${row.brojPrijave}|${row.skolskaGodina}`
                              ? "Potvrda..."
                              : "Potvrdi upis"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap justify-between gap-3">
        <button
          type="button"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100 disabled:opacity-60"
          onClick={onPreviousStep}
          disabled={wizardStep === 1}
        >
          Nazad
        </button>

        <button
          type="button"
          className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
          onClick={onNextStep}
          disabled={wizardStep === 4}
        >
          Sledeci korak
        </button>
      </div>
    </section>
  );
}
