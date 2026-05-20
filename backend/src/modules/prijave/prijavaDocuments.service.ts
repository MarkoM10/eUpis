import { ApiError } from "../../shared/apiError";
import type { PrijavaKey } from "../../types/modules/prijave";
import type {
  PrijavaDocumentDownloadRecord,
  PrijavaDocumentsRecord,
  PrijavaDocumentType,
  PrijavaDocumentUploadInput,
  PrijavaDocumentSummary,
} from "../../types/modules/prijavaDocuments";
import { getPrijavaByKey } from "./prijave.repository";
import {
  getPrijavaDocumentDownload,
  getPrijavaDocuments,
  upsertPrijavaDocument,
} from "./prijavaDocuments.repository";

const assertPrijavaExists = async (key: PrijavaKey): Promise<void> => {
  await getPrijavaByKey(key);
};

export const getPrijavaDocumentsService = async (
  key: PrijavaKey,
): Promise<PrijavaDocumentsRecord> => {
  await assertPrijavaExists(key);
  return getPrijavaDocuments(key);
};

export const uploadPrijavaDocumentService = async (
  key: PrijavaKey,
  input: PrijavaDocumentUploadInput,
): Promise<PrijavaDocumentSummary> => {
  if (!input.fileContent.length) {
    throw new ApiError(400, "Fajl nedostaje", "Potrebno je izabrati fajl za otpremanje.");
  }

  await assertPrijavaExists(key);
  return upsertPrijavaDocument(key, input);
};

export const downloadPrijavaDocumentService = async (
  key: PrijavaKey,
  documentType: PrijavaDocumentType,
): Promise<PrijavaDocumentDownloadRecord> => {
  await assertPrijavaExists(key);
  return getPrijavaDocumentDownload(key, documentType);
};
