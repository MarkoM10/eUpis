import { type NextFunction, type Request, type Response } from "express";
import { ok } from "../../shared/httpResponse";
import {
  listRankingListsService,
  getRankingListService,
  listRankingItemsService,
  updateRankingListStudyProgramService,
} from "./rankingLists.service";
import type { RankingListStudyProgramUpdateInput } from "../../types/modules/upis";

export const listRankingListsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const query = req.query as Record<string, unknown>;

    const skolskaGodina = typeof query.skolskaGodina === "string" ? query.skolskaGodina : undefined;
    const nazivKonkursa = typeof query.nazivKonkursa === "string" ? query.nazivKonkursa : undefined;
    const nazivPrograma = typeof query.nazivPrograma === "string" ? query.nazivPrograma : undefined;

    const rows = await listRankingListsService(skolskaGodina, nazivKonkursa, nazivPrograma);

    res.json(ok("Rang liste su uspešno učitane.", { rows }));
  } catch (error) {
    next(error);
  }
};

export const getRankingListHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const idRangListe = Number(req.params.idRangListe);
    const rankingList = await getRankingListService(idRangListe);

    res.json(ok("Rang lista je uspešno učitana.", rankingList));
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

    res.json(ok("Stavke rang liste su uspešno učitane.", { rows }));
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
    const payload = req.body as RankingListStudyProgramUpdateInput;

    await updateRankingListStudyProgramService({
      idRangListe,
      studijskiProgram: payload.studijskiProgram,
    });

    res.json(ok("Studijski program rang liste je uspešno ažuriran.", { updated: true }));
  } catch (error) {
    next(error);
  }
};
