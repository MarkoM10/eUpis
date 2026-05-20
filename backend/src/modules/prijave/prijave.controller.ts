import { type NextFunction, type Request, type Response } from "express";
import { ok, okList } from "../../shared/httpResponse";
import type {
  PrijavaKey,
  PrijavaMutationInput,
  PrijavaStatusUpdateInput,
} from "../../types/modules/prijave";
import {
  createPrijavaService,
  deletePrijavaService,
  getPrijavaService,
  listPrijaveService,
  updatePrijavaService,
  updatePrijavaStatusService,
} from "./prijave.service";

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

export const listPrijaveHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await listPrijaveService(req.query as Record<string, unknown>);
    res.json(okList("Prijave su uspesno ucitane.", result.rows, result.page, result.pageSize));
  } catch (error) {
    next(error);
  }
};

export const getPrijavaHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await getPrijavaService(getKey(req));
    res.json(ok("Prijava je uspesno ucitana.", result));
  } catch (error) {
    next(error);
  }
};

export const createPrijavaHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const role = req.user?.role ?? "admin";
    const created = await createPrijavaService(req.body as PrijavaMutationInput, role);
    res.status(201).json(ok("Prijava je uspesno dodata.", { created: true, ...created }));
  } catch (error) {
    next(error);
  }
};

export const updatePrijavaHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await updatePrijavaService(getKey(req), req.body as PrijavaMutationInput);
    res.json(ok("Prijava je uspesno azurirana.", { updated: true }));
  } catch (error) {
    next(error);
  }
};

export const updatePrijavaStatusHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await updatePrijavaStatusService(getKey(req), req.body as PrijavaStatusUpdateInput);
    res.json(ok("Status prijave je uspesno azuriran.", { updated: true }));
  } catch (error) {
    next(error);
  }
};

export const deletePrijavaHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await deletePrijavaService(getKey(req));
    res.json(ok("Prijava je uspesno obrisana.", { deleted: true }));
  } catch (error) {
    next(error);
  }
};
