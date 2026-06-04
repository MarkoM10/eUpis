import type { Request } from "express";
import { ApiError } from "../../shared/apiError";
import type { PrijavaKey } from "../../types/modules/prijave";
import type {
  DiplomaDocumentInput,
  PrijavaDocumentSummary,
  PrijavaDocumentType,
  UverenjeDocumentInput,
} from "../../types/modules/prijavaDocuments";
import type { DiplomaRow, UverenjeRow } from "../../types/modules/prijavaDocumentsRepository";

export const toNullableString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const toNullableNumber = (value: unknown): number | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed.length) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
};

export const getPrijavaKeyFromRequest = (req: Request): PrijavaKey => {
  const brojPrijaveRaw = Array.isArray(req.params.brojPrijave)
    ? req.params.brojPrijave[0]
    : req.params.brojPrijave;
  const skolskaGodinaRaw = Array.isArray(req.params.skolskaGodina)
    ? req.params.skolskaGodina[0]
    : req.params.skolskaGodina;

  return {
    brojPrijave: Number(brojPrijaveRaw),
    skolskaGodina: skolskaGodinaRaw,
  };
};

export const getDocumentTypeFromRequest = (req: Request): PrijavaDocumentType => {
  const rawType = Array.isArray(req.params.documentType)
    ? req.params.documentType[0]
    : req.params.documentType;

  if (rawType === "diploma" || rawType === "uverenje") {
    return rawType;
  }

  throw new ApiError(400, "Nepoznat dokument", "Podrzani dokumenti su diploma i uverenje.");
};

export const getDiplomaInputFromRequest = (req: Request): DiplomaDocumentInput => ({
  datumIzdavanja: toNullableString(req.body.datumIzdavanja),
  brojEspb: toNullableNumber(req.body.brojEspb),
  stecenoZvanje: toNullableString(req.body.stecenoZvanje),
  datumDiplomiranja: toNullableString(req.body.datumDiplomiranja),
  godinaUpisa: toNullableNumber(req.body.godinaUpisa),
  prosecnaOcena: toNullableNumber(req.body.prosecnaOcena),
  idFakulteta: toNullableNumber(req.body.idFakulteta),
  rektorId: toNullableNumber(req.body.rektorId),
});

export const getUverenjeInputFromRequest = (req: Request): UverenjeDocumentInput => ({
  datumIzdavanja: toNullableString(req.body.datumIzdavanja),
  idFakulteta: toNullableNumber(req.body.idFakulteta),
  ukupnoEspb: toNullableNumber(req.body.ukupnoEspb),
  prosecnaOcena: toNullableNumber(req.body.prosecnaOcena),
});

export const buildAsciiFallbackFileName = (fileName: string): string => {
  const normalized = fileName.normalize("NFKD").replace(/[^\x20-\x7E]/g, "");
  const trimmed = normalized.trim();
  return trimmed.length ? trimmed : "document.bin";
};

export const toIso = (value: Date | null): string | null => (value ? value.toISOString() : null);

export const emptySummary = (documentType: PrijavaDocumentType): PrijavaDocumentSummary => ({
  documentType,
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
  ukupnoEspb: null,
});

export const mapDiplomaRow = (row: DiplomaRow | undefined): PrijavaDocumentSummary => {
  if (!row) {
    return emptySummary("diploma");
  }

  return {
    documentType: "diploma",
    exists: true,
    serialNumber: row.SERIJSKI_BROJ,
    datumIzdavanja: toIso(row.DATUM_IZDAVANJA),
    idFakulteta: row.ID_FAKULTETA,
    fileName: row.DOCUMENT_FILE_NAME,
    mimeType: row.DOCUMENT_MIME_TYPE,
    fileSize: row.DOCUMENT_FILE_SIZE,
    uploadedAt: toIso(row.DOCUMENT_UPLOADED_AT),
    hasFile: row.HAS_FILE === 1,
    brojEspb: row.BROJ_ESPB,
    stecenoZvanje: row.STECENO_ZVANJE,
    datumDiplomiranja: toIso(row.DATUM_DIPLOMIRANJA),
    godinaUpisa: row.GODINA_UPISA,
    prosecnaOcena: row.PROSECNA_OCENA,
    rektorId: row.REKTOR_ID,
  };
};

export const mapUverenjeRow = (row: UverenjeRow | undefined): PrijavaDocumentSummary => {
  if (!row) {
    return emptySummary("uverenje");
  }

  return {
    documentType: "uverenje",
    exists: true,
    serialNumber: row.SERIJSKI_BROJ,
    datumIzdavanja: toIso(row.DATUM_IZDAVANJA),
    idFakulteta: row.ID_FAKULTETA,
    fileName: row.DOCUMENT_FILE_NAME,
    mimeType: row.DOCUMENT_MIME_TYPE,
    fileSize: row.DOCUMENT_FILE_SIZE,
    uploadedAt: toIso(row.DOCUMENT_UPLOADED_AT),
    hasFile: row.HAS_FILE === 1,
    prosecnaOcena: row.PROSECNA_OCENA,
    ukupnoEspb: row.UKUPNO_ESPB,
    brojEspb: null,
    stecenoZvanje: null,
    datumDiplomiranja: null,
    godinaUpisa: null,
    rektorId: null,
  };
};
