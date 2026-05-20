import { NextFunction, Request, Response } from "express";
import { ok, okList } from "../../shared/httpResponse";
import {
  createKandidatService,
  deleteKandidatService,
  getKandidatService,
  listKandidatiService,
  updateKandidatService,
} from "./kandidati.service";
import type { KandidatMutationInput } from "../../types/modules/kandidati";

const getJmbgParam = (req: Request): string => {
  const value = req.params.jmbg;
  return Array.isArray(value) ? value[0] : value;
};

export const listKandidatiHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await listKandidatiService(req.query as Record<string, unknown>);
    res.json(okList("Kandidati su uspesno ucitani.", result.rows, result.page, result.pageSize));
  } catch (error) {
    next(error);
  }
};

export const getKandidatHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await getKandidatService(getJmbgParam(req));
    res.json(ok("Kandidat je uspesno ucitan.", result));
  } catch (error) {
    next(error);
  }
};

export const createKandidatHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await createKandidatService(req.body as KandidatMutationInput);
    res.status(201).json(ok("Kandidat je uspesno dodat.", { created: true }));
  } catch (error) {
    next(error);
  }
};

export const updateKandidatHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await updateKandidatService(getJmbgParam(req), req.body as KandidatMutationInput);
    res.json(ok("Kandidat je uspesno azuriran.", { updated: true }));
  } catch (error) {
    next(error);
  }
};

export const deleteKandidatHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await deleteKandidatService(getJmbgParam(req));
    res.json(ok("Kandidat je uspesno obrisan.", { deleted: true }));
  } catch (error) {
    next(error);
  }
};
