import { type NextFunction, type Request, type Response } from "express";
import { ok } from "../../shared/httpResponse";
import type { GenerateRankingInput, SaveExamScoreInput } from "../../types/modules/upis";
import {
  finalizeRankingService,
  generateRankingService,
  getStudentAdmissionStatusService,
  listEligiblePrijaveService,
  listRankingItemsService,
  listRankingListsService,
  listStudyProgramsService,
  saveExamScoreService,
} from "./upis.service";

export const listStudyProgramsHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const rows = await listStudyProgramsService();
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

    const rows = await listEligiblePrijaveService(skolskaGodina);
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

export const finalizeRankingHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const idRangListeRaw = (req.body as { idRangListe?: unknown }).idRangListe;
    const idRangListe = Number(idRangListeRaw);

    const result = await finalizeRankingService(idRangListe);
    res.json(ok("Odluke o upisu su uspesno finalizovane.", result));
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

    const idPrograma =
      typeof idProgramaRaw === "string" && idProgramaRaw.trim().length > 0
        ? Number(idProgramaRaw)
        : undefined;

    const rows = await listRankingListsService(
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
