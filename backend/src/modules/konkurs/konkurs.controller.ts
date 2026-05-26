import { type NextFunction, type Request, type Response } from "express";
import { ok } from "../../shared/httpResponse";
import type { CreateKonkursInput, KonkursStatusUpdateInput } from "../../types/modules/konkurs";
import {
  createKonkursService,
  listActiveKonkursiService,
  listKonkursiService,
  updateKonkursStatusService,
} from "./konkurs.service";

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
