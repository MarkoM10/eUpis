import multer from "multer";
import { type NextFunction, type Request, type Response } from "express";
import { ApiError } from "../../shared/apiError";
import { ok } from "../../shared/httpResponse";
import type { PrijavaKey } from "../../types/modules/prijave";
import type {
  DiplomaDocumentInput,
  PrijavaDocumentType,
  PrijavaDocumentUploadInput,
  UverenjeDocumentInput,
} from "../../types/modules/prijavaDocuments";
import {
  downloadPrijavaDocumentService,
  getPrijavaDocumentsService,
  uploadPrijavaDocumentService,
} from "./prijavaDocuments.service";

const upload = multer({ storage: multer.memoryStorage() });

const toNullableString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const toNullableNumber = (value: unknown): number | null => {
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

const getKey = (req: Request): PrijavaKey => {
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

const getDocumentType = (req: Request): PrijavaDocumentType => {
  const rawType = Array.isArray(req.params.documentType)
    ? req.params.documentType[0]
    : req.params.documentType;

  if (rawType === "diploma" || rawType === "uverenje") {
    return rawType;
  }

  throw new ApiError(400, "Nepoznat dokument", "Podrzani dokumenti su diploma i uverenje.");
};

const getDiplomaInput = (req: Request): DiplomaDocumentInput => ({
  datumIzdavanja: toNullableString(req.body.datumIzdavanja),
  brojEspb: toNullableNumber(req.body.brojEspb),
  stecenoZvanje: toNullableString(req.body.stecenoZvanje),
  datumDiplomiranja: toNullableString(req.body.datumDiplomiranja),
  godinaUpisa: toNullableNumber(req.body.godinaUpisa),
  prosecnaOcena: toNullableNumber(req.body.prosecnaOcena),
  idFakulteta: toNullableNumber(req.body.idFakulteta),
  rektorId: toNullableNumber(req.body.rektorId),
});

const getUverenjeInput = (req: Request): UverenjeDocumentInput => ({
  datumIzdavanja: toNullableString(req.body.datumIzdavanja),
  idFakulteta: toNullableNumber(req.body.idFakulteta),
  ukupnoEspb: toNullableNumber(req.body.ukupnoEspb),
  prosecnaOcena: toNullableNumber(req.body.prosecnaOcena),
});

export const prijavaDocumentUploadMiddleware = upload.single("file");

export const getPrijavaDocumentsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await getPrijavaDocumentsService(getKey(req));
    res.json(ok("Dokumenti prijave su uspesno ucitani.", result));
  } catch (error) {
    next(error);
  }
};

export const uploadPrijavaDocumentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.file) {
      throw new ApiError(400, "Fajl nedostaje", "Potrebno je izabrati fajl za otpremanje.");
    }

    const type = getDocumentType(req);
    const payload: PrijavaDocumentUploadInput = {
      type,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype || "application/octet-stream",
      fileSize: req.file.size,
      fileContent: req.file.buffer,
      diploma: type === "diploma" ? getDiplomaInput(req) : undefined,
      uverenje: type === "uverenje" ? getUverenjeInput(req) : undefined,
    };

    const result = await uploadPrijavaDocumentService(getKey(req), payload);
    res.status(201).json(ok("Dokument je uspesno otpremljen.", result));
  } catch (error) {
    next(error);
  }
};

export const downloadPrijavaDocumentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await downloadPrijavaDocumentService(getKey(req), getDocumentType(req));
    res.setHeader("Content-Type", result.mimeType);
    res.setHeader("Content-Length", String(result.fileSize));
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(result.fileName)}`,
    );
    res.send(result.fileContent);
  } catch (error) {
    next(error);
  }
};
