import multer from "multer";
import { type NextFunction, type Request, type Response } from "express";
import { ApiError } from "../../shared/apiError";
import { ok } from "../../shared/httpResponse";
import type {
  GenerateRankingInput,
  RankingItemStudyProgramUpdateInput,
  RankingListStudyProgramUpdateInput,
  SaveExamScoreInput,
} from "../../types/modules/upis";
import {
  confirmEnrollmentFinalizationService,
  downloadEnrollmentContractByPrijavaService,
  downloadStudentSignedEnrollmentContractService,
  generateRankingService,
  getEnrollmentFinalizationSummaryService,
  getStudentAdmissionStatusService,
  listEligiblePrijaveByKonkursService,
  listPendingEnrollmentFinalizationsService,
  listEligiblePrijaveService,
  listRankingItemsService,
  listRankingListsService,
  listStudyProgramsService,
  saveExamScoreService,
  updateRankingItemStudyProgramService,
  updateRankingListStudyProgramService,
  uploadSignedEnrollmentContractService,
} from "./upis.service";

const upload = multer({ storage: multer.memoryStorage() });

export const enrollmentContractUploadMiddleware = upload.single("file");

export const listStudyProgramsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const idFakultetaRaw = Array.isArray(req.query.idFakulteta)
      ? req.query.idFakulteta[0]
      : req.query.idFakulteta;
    const idFakulteta =
      typeof idFakultetaRaw === "string" && idFakultetaRaw.trim().length > 0
        ? Number(idFakultetaRaw)
        : undefined;

    const rows = await listStudyProgramsService(
      Number.isFinite(idFakulteta) ? idFakulteta : undefined,
    );
    res.json(ok("Studijski programi su uspesno ucitani.", { rows }));
  } catch (error) {
    next(error);
  }
};

export const listEligiblePrijaveHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const skolskaGodinaRaw = Array.isArray(req.query.skolskaGodina)
      ? req.query.skolskaGodina[0]
      : req.query.skolskaGodina;
    const skolskaGodina = typeof skolskaGodinaRaw === "string" ? skolskaGodinaRaw : undefined;
    const idKonkursaRaw = Array.isArray(req.query.idKonkursa)
      ? req.query.idKonkursa[0]
      : req.query.idKonkursa;
    const idKonkursa =
      typeof idKonkursaRaw === "string" && idKonkursaRaw.trim().length > 0
        ? Number(idKonkursaRaw)
        : undefined;

    const rows =
      Number.isFinite(idKonkursa) && idKonkursa != null
        ? await listEligiblePrijaveByKonkursService(idKonkursa, skolskaGodina)
        : await listEligiblePrijaveService(skolskaGodina);
    res.json(ok("Odobrene prijave su uspesno ucitane.", { rows }));
  } catch (error) {
    next(error);
  }
};

export const saveExamScoreHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await saveExamScoreService(req.body as SaveExamScoreInput);
    res.status(201).json(ok("Rezultat ispita je uspesno sacuvan.", result));
  } catch (error) {
    next(error);
  }
};

export const generateFinalRankingHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await generateRankingService(req.body as GenerateRankingInput);
    res.json(ok("Konacna rang lista je uspesno generisana.", result));
  } catch (error) {
    next(error);
  }
};

export const listRankingListsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const idProgramaRaw = Array.isArray(req.query.idPrograma)
      ? req.query.idPrograma[0]
      : req.query.idPrograma;
    const skolskaGodinaRaw = Array.isArray(req.query.skolskaGodina)
      ? req.query.skolskaGodina[0]
      : req.query.skolskaGodina;
    const idKonkursaRaw = Array.isArray(req.query.idKonkursa)
      ? req.query.idKonkursa[0]
      : req.query.idKonkursa;

    const idPrograma =
      typeof idProgramaRaw === "string" && idProgramaRaw.trim().length > 0
        ? Number(idProgramaRaw)
        : undefined;
    const idKonkursa =
      typeof idKonkursaRaw === "string" && idKonkursaRaw.trim().length > 0
        ? Number(idKonkursaRaw)
        : undefined;

    const rows = await listRankingListsService(
      Number.isFinite(idKonkursa) ? idKonkursa : undefined,
      Number.isFinite(idPrograma) ? idPrograma : undefined,
      typeof skolskaGodinaRaw === "string" ? skolskaGodinaRaw : undefined,
    );

    res.json(ok("Rang liste su uspesno ucitane.", { rows }));
  } catch (error) {
    next(error);
  }
};

export const listRankingItemsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const idRangListe = Number(req.params.idRangListe);
    const rows = await listRankingItemsService(idRangListe);
    res.json(ok("Stavke rang liste su uspesno ucitane.", { rows }));
  } catch (error) {
    next(error);
  }
};

export const updateRankingListStudyProgramHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const idRangListe = Number(req.params.idRangListe);
    await updateRankingListStudyProgramService({
      idRangListe,
      ...(req.body as RankingListStudyProgramUpdateInput),
    });
    res.json(
      ok("Studijski program na konacnoj rang listi je uspesno azuriran.", { updated: true }),
    );
  } catch (error) {
    next(error);
  }
};

export const updateRankingItemStudyProgramHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const idStavke = Number(req.params.idStavke);
    await updateRankingItemStudyProgramService({
      idStavke,
      ...(req.body as RankingItemStudyProgramUpdateInput),
    });
    res.json(ok("Studijski program stavke je uspesno azuriran.", { updated: true }));
  } catch (error) {
    next(error);
  }
};

export const getStudentAdmissionStatusHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const username = req.user?.username;
    if (!username) {
      res.status(401).json(ok("Korisnik nije autentifikovan.", { authenticated: false }));
      return;
    }

    const data = await getStudentAdmissionStatusService(username);
    res.json(ok("Status upisnog procesa je uspesno ucitan.", data));
  } catch (error) {
    next(error);
  }
};

export const uploadSignedEnrollmentContractHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const username = req.user?.username;
    if (!username) {
      throw new ApiError(401, "Autentikacija", "Korisnik nije autentifikovan.");
    }

    if (!req.file) {
      throw new ApiError(400, "Fajl nedostaje", "Potrebno je izabrati potpisani ugovor.");
    }

    const result = await uploadSignedEnrollmentContractService({
      username,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype || "application/octet-stream",
      fileSize: req.file.size,
      fileContent: req.file.buffer,
    });

    res.status(201).json(ok("Potpisani ugovor je uspesno otpremljen.", result));
  } catch (error) {
    next(error);
  }
};

export const downloadStudentSignedEnrollmentContractHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const username = req.user?.username;
    if (!username) {
      throw new ApiError(401, "Autentikacija", "Korisnik nije autentifikovan.");
    }

    const result = await downloadStudentSignedEnrollmentContractService(username);
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

export const listPendingEnrollmentFinalizationsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const skolskaGodinaRaw = Array.isArray(req.query.skolskaGodina)
      ? req.query.skolskaGodina[0]
      : req.query.skolskaGodina;
    const skolskaGodina = typeof skolskaGodinaRaw === "string" ? skolskaGodinaRaw : undefined;
    const idKonkursaRaw = Array.isArray(req.query.idKonkursa)
      ? req.query.idKonkursa[0]
      : req.query.idKonkursa;
    const idKonkursa =
      typeof idKonkursaRaw === "string" && idKonkursaRaw.trim().length > 0
        ? Number(idKonkursaRaw)
        : undefined;

    const rows = await listPendingEnrollmentFinalizationsService(
      skolskaGodina,
      Number.isFinite(idKonkursa) ? idKonkursa : undefined,
    );
    res.json(ok("Kandidati za finalizaciju upisa su uspesno ucitani.", { rows }));
  } catch (error) {
    next(error);
  }
};

export const getEnrollmentFinalizationSummaryHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const skolskaGodinaRaw = Array.isArray(req.query.skolskaGodina)
      ? req.query.skolskaGodina[0]
      : req.query.skolskaGodina;
    const skolskaGodina = typeof skolskaGodinaRaw === "string" ? skolskaGodinaRaw : undefined;

    const data = await getEnrollmentFinalizationSummaryService(skolskaGodina);
    res.json(ok("Statistika finalizacije upisa je uspesno ucitana.", data));
  } catch (error) {
    next(error);
  }
};

export const downloadEnrollmentContractByPrijavaHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const brojPrijave = Number(req.params.brojPrijave);
    const skolskaGodinaRaw = Array.isArray(req.params.skolskaGodina)
      ? req.params.skolskaGodina[0]
      : req.params.skolskaGodina;
    const skolskaGodina = skolskaGodinaRaw;
    const result = await downloadEnrollmentContractByPrijavaService(brojPrijave, skolskaGodina);

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

export const confirmEnrollmentFinalizationHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const adminUserId = req.user?.userId;
    if (!adminUserId) {
      throw new ApiError(401, "Autentikacija", "Korisnik nije autentifikovan.");
    }

    const brojPrijave = Number(req.params.brojPrijave);
    const skolskaGodinaRaw = Array.isArray(req.params.skolskaGodina)
      ? req.params.skolskaGodina[0]
      : req.params.skolskaGodina;
    const skolskaGodina = skolskaGodinaRaw;

    const result = await confirmEnrollmentFinalizationService({
      brojPrijave,
      skolskaGodina,
      adminUserId,
    });

    res.json(ok("Upis je uspesno finalizovan i dodeljen je broj indeksa.", result));
  } catch (error) {
    next(error);
  }
};
