import { type NextFunction, type Request, type Response } from "express";
import { ok } from "../../shared/httpResponse";
import { ApiError } from "../../shared/apiError";
import type { CreateKonkursInput, KonkursStatusUpdateInput } from "../../types/modules/konkurs";
import {
  createKonkursService,
  listActiveKonkursiService,
  listKonkursiService,
  updateKonkursStatusService,
} from "./konkurs.service";
import {
  confirmEnrollmentFinalizationService,
  generateRankingService,
  listEligiblePrijaveByKonkursService,
  listPendingEnrollmentFinalizationsService,
  listRankingItemsService,
  listRankingListsService,
  saveExamScoreService,
} from "../upis/upis.service";
import type { GenerateRankingInput, SaveExamScoreInput } from "../../types/modules/upis";

const parseGodinaKonkursa = (value: unknown): number | undefined => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string" || !raw.trim().length) {
    return undefined;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return Math.trunc(parsed);
};

const toSkolskaGodinaFromKonkursYear = (godinaKonkursa: number | undefined): string | undefined => {
  if (godinaKonkursa == null || !Number.isFinite(godinaKonkursa)) {
    return undefined;
  }

  return String(godinaKonkursa);
};

export const listKonkursiHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const rows = await listKonkursiService();
    res.json(ok("Konkursi su uspesno ucitani.", { rows }));
  } catch (error) {
    next(error);
  }
};

export const listActiveKonkursiHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const rows = await listActiveKonkursiService();
    res.json(ok("Aktivni konkursi su uspesno ucitani.", { rows }));
  } catch (error) {
    next(error);
  }
};

export const createKonkursHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const created = await createKonkursService(req.body as CreateKonkursInput, req.user?.userId);
    res.status(201).json(ok("Konkurs je uspesno kreiran.", { created: true, ...created }));
  } catch (error) {
    next(error);
  }
};

export const updateKonkursStatusHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const idKonkursa = Number(req.params.idKonkursa);
    const payload = req.body as KonkursStatusUpdateInput;
    await updateKonkursStatusService(idKonkursa, payload.status);
    res.json(ok("Status konkursa je uspesno azuriran.", { updated: true }));
  } catch (error) {
    next(error);
  }
};

export const listKonkursEligiblePrijaveHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const idKonkursa = Number(req.params.idKonkursa);
    const godinaKonkursa = parseGodinaKonkursa(req.query.godinaKonkursa);
    const skolskaGodina = toSkolskaGodinaFromKonkursYear(godinaKonkursa);

    const rows = await listEligiblePrijaveByKonkursService(idKonkursa, skolskaGodina);
    res.json(ok("Prijave za konkurs su uspesno ucitane.", { rows }));
  } catch (error) {
    next(error);
  }
};

export const generateKonkursFinalRankingHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const idKonkursa = Number(req.params.idKonkursa);
    const payload = req.body as GenerateRankingInput;
    const result = await generateRankingService({
      ...payload,
      idKonkursa,
    });

    res.json(ok("Konacna rang lista za konkurs je uspesno generisana.", result));
  } catch (error) {
    next(error);
  }
};

export const listKonkursRankingListsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const idKonkursa = Number(req.params.idKonkursa);
    const idProgramaRaw = Array.isArray(req.query.idPrograma)
      ? req.query.idPrograma[0]
      : req.query.idPrograma;
    const godinaKonkursa = parseGodinaKonkursa(req.query.godinaKonkursa);

    const idPrograma =
      typeof idProgramaRaw === "string" && idProgramaRaw.trim().length > 0
        ? Number(idProgramaRaw)
        : undefined;

    const rows = await listRankingListsService(
      idKonkursa,
      Number.isFinite(idPrograma) ? idPrograma : undefined,
      toSkolskaGodinaFromKonkursYear(godinaKonkursa),
    );

    res.json(ok("Rang liste za konkurs su uspesno ucitane.", { rows }));
  } catch (error) {
    next(error);
  }
};

export const listKonkursRankingItemsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const idKonkursa = Number(req.params.idKonkursa);
    const idProgramaRaw = Array.isArray(req.query.idPrograma)
      ? req.query.idPrograma[0]
      : req.query.idPrograma;

    const idPrograma =
      typeof idProgramaRaw === "string" && idProgramaRaw.trim().length > 0
        ? Number(idProgramaRaw)
        : Number.NaN;

    if (!Number.isFinite(idPrograma) || idPrograma <= 0) {
      throw new ApiError(
        400,
        "Neispravan program",
        "ID programa je obavezan za prikaz stavki rang liste.",
      );
    }

    const rankingLists = await listRankingListsService(idKonkursa, idPrograma);
    const rankingList = rankingLists[0] ?? null;

    if (!rankingList) {
      res.json(ok("Stavke rang liste za konkurs su uspesno ucitane.", { rows: [] }));
      return;
    }

    const rows = await listRankingItemsService(rankingList.idRangListe);
    res.json(ok("Stavke rang liste za konkurs su uspesno ucitane.", { rows }));
  } catch (error) {
    next(error);
  }
};

export const listKonkursPendingFinalizationsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const idKonkursa = Number(req.params.idKonkursa);
    const godinaKonkursa = parseGodinaKonkursa(req.query.godinaKonkursa);

    const rows = await listPendingEnrollmentFinalizationsService(
      toSkolskaGodinaFromKonkursYear(godinaKonkursa),
      idKonkursa,
    );

    res.json(ok("Finalizacije upisa za konkurs su uspesno ucitane.", { rows }));
  } catch (error) {
    next(error);
  }
};

export const saveKonkursExamScoreHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const idKonkursa = Number(req.params.idKonkursa);
    const payload = req.body as SaveExamScoreInput;
    const result = await saveExamScoreService(payload);

    const rows = await listEligiblePrijaveByKonkursService(idKonkursa, payload.skolskaGodina);
    const row = rows.find(
      (candidate) =>
        candidate.brojPrijave === payload.brojPrijave &&
        candidate.skolskaGodina === payload.skolskaGodina,
    );

    if (!row || row.idKonkursa !== idKonkursa) {
      throw new ApiError(
        400,
        "Prijava nije deo konkursa",
        "Izabrana prijava ne pripada prosledjenom konkursu.",
      );
    }

    res.status(201).json(ok("Rezultat ispita za konkurs je uspesno sacuvan.", result));
  } catch (error) {
    next(error);
  }
};

export const confirmKonkursEnrollmentFinalizationHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const idKonkursa = Number(req.params.idKonkursa);
    const adminUserId = req.user?.userId;
    if (!adminUserId) {
      throw new ApiError(401, "Autentikacija", "Korisnik nije autentifikovan.");
    }

    const brojPrijave = Number(req.params.brojPrijave);
    const skolskaGodinaRaw = Array.isArray(req.params.skolskaGodina)
      ? req.params.skolskaGodina[0]
      : req.params.skolskaGodina;
    const skolskaGodina = skolskaGodinaRaw;

    const pendingRows = await listPendingEnrollmentFinalizationsService(skolskaGodina, idKonkursa);
    const target = pendingRows.find(
      (row) => row.brojPrijave === brojPrijave && row.skolskaGodina === skolskaGodina,
    );

    if (!target) {
      throw new ApiError(
        400,
        "Prijava nije dostupna za finalizaciju",
        "Prosledjena prijava nije dostupna za finalizaciju u izabranom konkursu.",
      );
    }

    const result = await confirmEnrollmentFinalizationService({
      brojPrijave,
      skolskaGodina,
      adminUserId,
    });

    res.json(ok("Upis za konkurs je uspesno finalizovan.", result));
  } catch (error) {
    next(error);
  }
};
