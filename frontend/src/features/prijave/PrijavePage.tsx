import { useEffect, useState, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { logoutSuccess } from "../../redux/slices/authSlice";
import { OracleMessageCard } from "../../components/feedback/OracleMessageCard";
import { toApiClientError } from "../../services/api";
import {
  updatePrijavaRequest,
  downloadPrijavaDocumentRequest,
  getPrijavaDocumentsRequest,
  updatePrijavaStatusRequest,
} from "../../services/prijaveService";
import { listKonkursiRequest } from "../../services/konkursService";
import type { PrijavaDocumentType } from "../../types/models/prijavaDocument";
import type { Prijava, PrijavaPayload } from "../../types/models/prijava";
import type { Konkurs } from "../../types/models/konkurs";
import {
  clearPrijaveError,
  loadPrijaveRows,
  setPrijavaSearch,
  setPrijavaSortValue,
  setPrijavaStatusFilter,
  setPrijavaPartitionFilter,
} from "../../redux/slices/prijaveSlice";
import {
  getDocumentActionKey,
  getPrijavaRowKey as getRowKey,
  triggerFileDownload,
} from "../../utils/utils";
import AdminPrijaveSection from "./AdminPrijaveSection";
import StudentPrijavaFlowSection from "./StudentPrijavaFlowSection";

type EditingPrijavaKey = {
  brojPrijave: number;
  skolskaGodina: string;
};

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

export default function PrijavePage(): ReactElement {
  const dispatch = useAppDispatch();
  const { token, role } = useAppSelector((state) => state.auth);

  const isAdmin = role === "admin";
  const {
    rows,
    search,
    sortValue,
    statusFilter,
    partitionFilter,
    isLoadingRows,
    errorMessage: globalErrorMessage,
    oracleDetails: globalOracleDetails,
  } = useAppSelector((state) => state.prijave);

  const [adminDocumentsByKey, setAdminDocumentsByKey] = useState<
    Record<string, { diplomaHasFile: boolean; uverenjeHasFile: boolean; isLoading: boolean }>
  >({});
  const [adminStatusByKey, setAdminStatusByKey] = useState<Record<string, string>>({});
  const [konkursiById, setKonkursiById] = useState<Record<number, Konkurs>>({});
  const [savingStatusKey, setSavingStatusKey] = useState<string | null>(null);
  const [downloadingDocumentKey, setDownloadingDocumentKey] = useState<string | null>(null);
  const [editingPrijavaKey, setEditingPrijavaKey] = useState<EditingPrijavaKey | null>(null);
  const [editForm, setEditForm] = useState<AdminPrijavaEditForm>(emptyAdminPrijavaEditForm);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(null);
  const [localOracleDetails, setLocalOracleDetails] = useState<string | undefined>(undefined);

  const handleLogout = (): void => {
    dispatch(logoutSuccess());
  };

  const clearFeedback = (): void => {
    setSuccessMessage(null);
    setLocalErrorMessage(null);
    setLocalOracleDetails(undefined);
    dispatch(clearPrijaveError());
  };

  const setRequestError = (error: unknown): void => {
    const parsed = toApiClientError(error);
    setLocalErrorMessage(`${parsed.title}: ${parsed.message}`);
    setLocalOracleDetails(parsed.oracleDetails);
  };

  const onEditFormChange = (field: keyof AdminPrijavaEditForm, value: string): void => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const currentKonkurs = editForm.idKonkursa
    ? (konkursiById[Number(editForm.idKonkursa)] ?? null)
    : null;
  const currentProgram =
    currentKonkurs && editForm.idPrograma
      ? (currentKonkurs.stavke.find(
          (stavka) => stavka.idPrograma === Number(editForm.idPrograma),
        ) ?? null)
      : null;

  const onStartEditPrijava = (row: Prijava): void => {
    clearFeedback();
    setEditingPrijavaKey({
      brojPrijave: row.brojPrijave,
      skolskaGodina: row.skolskaGodina,
    });
    setEditForm(toAdminEditForm(row));
  };

  const onCancelEditPrijava = (): void => {
    setEditingPrijavaKey(null);
    setEditForm(emptyAdminPrijavaEditForm);
  };

  const onSavePrijavaEdit = async (): Promise<void> => {
    if (!token || !editingPrijavaKey) {
      return;
    }

    setIsSavingEdit(true);
    clearFeedback();

    try {
      const payload = toUpdatePrijavaPayload(editForm);
      await updatePrijavaRequest(
        token,
        editingPrijavaKey.brojPrijave,
        editingPrijavaKey.skolskaGodina,
        {
          ...payload,
          skolskaGodina: editingPrijavaKey.skolskaGodina,
        },
      );
      setSuccessMessage("Prijava je uspesno azurirana.");
      onCancelEditPrijava();
      await loadRows();
    } catch (error) {
      setRequestError(error);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const loadRows = async (): Promise<void> => {
    clearFeedback();
    await dispatch(loadPrijaveRows());
  };

  useEffect(() => {
    if (isAdmin) {
      void loadRows();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAdmin]);

  useEffect(() => {
    if (!isAdmin || !token) {
      setKonkursiById({});
      return;
    }

    void listKonkursiRequest(token)
      .then((response) => {
        const next = response.data.rows.reduce<Record<number, Konkurs>>((acc, konkurs) => {
          acc[konkurs.idKonkursa] = konkurs;
          return acc;
        }, {});
        setKonkursiById(next);
      })
      .catch(() => {
        setKonkursiById({});
      });
  }, [isAdmin, token]);

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

  const onAdminStatusSave = async (row: Prijava): Promise<void> => {
    if (!token) {
      return;
    }

    const key = getRowKey(row.brojPrijave, row.skolskaGodina);
    const nextStatus = adminStatusByKey[key] ?? row.statusPrijave ?? "Podneta";

    clearFeedback();
    setSavingStatusKey(key);

    try {
      await updatePrijavaStatusRequest(
        token,
        row.brojPrijave,
        row.skolskaGodina,
        nextStatus as "Podneta" | "Odobrena" | "Odbijena",
      );

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

      triggerFileDownload(result.blob, result.fileName);

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

  const onAdminStatusValueChange = (rowKey: string, value: string): void => {
    setAdminStatusByKey((prev) => ({
      ...prev,
      [rowKey]: value,
    }));
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
                to="/konkurs"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
              >
                Modul konkurs
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

        {isAdmin ? (
          <>
            <section className="rounded-2xl border border-slate-300 bg-white p-4">
              <h2 className="text-lg font-semibold text-slate-900">Izmena prijave</h2>
              {!editingPrijavaKey ? (
                <p className="mt-1 text-sm text-slate-600">
                  Izaberite prijavu iz tabele klikom na dugme Izmeni.
                </p>
              ) : (
                <p className="mt-1 text-sm text-slate-600">
                  Aktivna prijava: {editingPrijavaKey.brojPrijave} /{" "}
                  {editingPrijavaKey.skolskaGodina}
                </p>
              )}

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <input
                  type="date"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Datum prijave"
                  value={editForm.datumPrijave}
                  onChange={(event) => onEditFormChange("datumPrijave", event.target.value)}
                />
                <div className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Konkurs</div>
                  <div>
                    {currentKonkurs ? buildKonkursLabel(currentKonkurs) : "Nije izabran konkurs"}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Program</div>
                  <div>
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
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={editForm.statusPrijave}
                  onChange={(event) => onEditFormChange("statusPrijave", event.target.value)}
                >
                  <option value="Podneta">Podneta</option>
                  <option value="Odobrena">Odobrena</option>
                  <option value="Odbijena">Odbijena</option>
                </select>
                <select
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={editForm.konkursniRok}
                  onChange={(event) => onEditFormChange("konkursniRok", event.target.value)}
                >
                  <option value="">Konkursni rok</option>
                  <option value="Septembar">Septembarski</option>
                </select>
                <input
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="JMBG"
                  value={editForm.jmbg}
                  onChange={(event) => onEditFormChange("jmbg", event.target.value)}
                />
                <input
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Ime i prezime"
                  value={editForm.imePrezime}
                  onChange={(event) => onEditFormChange("imePrezime", event.target.value)}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                {editingPrijavaKey ? (
                  <button
                    type="button"
                    className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    onClick={() => {
                      void onSavePrijavaEdit();
                    }}
                    disabled={isSavingEdit}
                  >
                    {isSavingEdit ? "Cuvanje..." : "Sacuvaj izmene"}
                  </button>
                ) : null}
                {editingPrijavaKey ? (
                  <button
                    type="button"
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
                    onClick={onCancelEditPrijava}
                  >
                    Odustani
                  </button>
                ) : null}
              </div>
            </section>

            <AdminPrijaveSection
              rows={rows}
              search={search}
              sortValue={sortValue}
              statusFilter={statusFilter}
              partitionFilter={partitionFilter}
              isLoadingRows={isLoadingRows}
              adminDocumentsByKey={adminDocumentsByKey}
              adminStatusByKey={adminStatusByKey}
              savingStatusKey={savingStatusKey}
              downloadingDocumentKey={downloadingDocumentKey}
              onSearchChange={(value) => dispatch(setPrijavaSearch(value))}
              onSortChange={(value) => dispatch(setPrijavaSortValue(value))}
              onStatusFilterChange={(value) => dispatch(setPrijavaStatusFilter(value))}
              onPartitionFilterChange={(value) => dispatch(setPrijavaPartitionFilter(value))}
              onApply={() => {
                void loadRows();
              }}
              onRefresh={() => {
                void loadRows();
              }}
              onStatusValueChange={onAdminStatusValueChange}
              onDownloadDocument={(row, documentType) => {
                void onAdminDownloadDocument(row, documentType);
              }}
              onSaveStatus={(row) => {
                void onAdminStatusSave(row);
              }}
              onEdit={onStartEditPrijava}
            />
          </>
        ) : (
          <StudentPrijavaFlowSection
            onClearFeedback={clearFeedback}
            onSetRequestError={setRequestError}
            onSetSuccessMessage={setSuccessMessage}
            onSetValidationError={(message) => {
              setLocalErrorMessage(message);
              setLocalOracleDetails(undefined);
            }}
          />
        )}

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
