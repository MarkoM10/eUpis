import { type NextFunction, type Request, type Response } from "express";
import { ok, okList } from "../../shared/httpResponse";
import type {
  PrijavaMutationInput,
  PrijavaStatusUpdateInput,
  StudentKandidatSetupInput,
} from "../../types/modules/prijave";
import {
  addStudentKandidatiService,
  createPrijavaService,
  deletePrijavaService,
  getPrijavaService,
  listPrijaveService,
  updatePrijavaService,
  updatePrijavaStatusService,
} from "./prijave.service";
import { getPrijavaKeyFromRequest } from "../../utils/modules/prijave.utils";

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
    const result = await getPrijavaService(getPrijavaKeyFromRequest(req));
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
    const created = await createPrijavaService(
      req.body as PrijavaMutationInput,
      role,
      req.user?.userId,
    );
    res.status(201).json(ok("Prijava je uspesno dodata.", { created: true, ...created }));
  } catch (error) {
    next(error);
  }
};

export const addStudentKandidatHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await addStudentKandidatiService(req.body as StudentKandidatSetupInput);
    res.json(ok("Podaci kandidata su uspesno sacuvani.", { added: true }));
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
    console.log("[Prijave] PUT /api/prijave/:brojPrijave/:skolskaGodina", {
      key: getPrijavaKeyFromRequest(req),
      bodyKeys: Object.keys((req.body as Record<string, unknown>) ?? {}),
    });
    await updatePrijavaService(getPrijavaKeyFromRequest(req), req.body as PrijavaMutationInput);
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
    console.log("[Prijave] PUT /api/prijave/:brojPrijave/:skolskaGodina/status", {
      key: getPrijavaKeyFromRequest(req),
      bodyKeys: Object.keys((req.body as Record<string, unknown>) ?? {}),
    });
    await updatePrijavaStatusService(
      getPrijavaKeyFromRequest(req),
      req.body as PrijavaStatusUpdateInput,
    );
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
    await deletePrijavaService(getPrijavaKeyFromRequest(req));
    res.json(ok("Prijava je uspesno obrisana.", { deleted: true }));
  } catch (error) {
    next(error);
  }
};
