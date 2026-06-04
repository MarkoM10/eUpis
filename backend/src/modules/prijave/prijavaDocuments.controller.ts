import multer from "multer";
import { type NextFunction, type Request, type Response } from "express";
import { ApiError } from "../../shared/apiError";
import { ok } from "../../shared/httpResponse";
import type { PrijavaDocumentUploadInput } from "../../types/modules/prijavaDocuments";
import {
  buildAsciiFallbackFileName,
  getDiplomaInputFromRequest,
  getDocumentTypeFromRequest,
  getPrijavaKeyFromRequest,
  getUverenjeInputFromRequest,
} from "../../utils/modules/prijavaDocuments.utils";
import {
  downloadPrijavaDocumentService,
  getPrijavaDocumentsService,
  uploadPrijavaDocumentService,
} from "./prijavaDocuments.service";

const upload = multer({ storage: multer.memoryStorage() });

export const prijavaDocumentUploadMiddleware = upload.single("file");

export const getPrijavaDocumentsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await getPrijavaDocumentsService(getPrijavaKeyFromRequest(req));
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

    const type = getDocumentTypeFromRequest(req);
    const payload: PrijavaDocumentUploadInput = {
      type,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype || "application/octet-stream",
      fileSize: req.file.size,
      fileContent: req.file.buffer,
      diploma: type === "diploma" ? getDiplomaInputFromRequest(req) : undefined,
      uverenje: type === "uverenje" ? getUverenjeInputFromRequest(req) : undefined,
    };

    const result = await uploadPrijavaDocumentService(getPrijavaKeyFromRequest(req), payload);
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
    const result = await downloadPrijavaDocumentService(
      getPrijavaKeyFromRequest(req),
      getDocumentTypeFromRequest(req),
    );
    const asciiFallbackName = buildAsciiFallbackFileName(result.fileName);
    res.setHeader("Content-Type", result.mimeType);
    res.setHeader("Content-Length", String(result.fileSize));
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${asciiFallbackName}"; filename*=UTF-8''${encodeURIComponent(result.fileName)}`,
    );
    res.send(result.fileContent);
  } catch (error) {
    next(error);
  }
};
