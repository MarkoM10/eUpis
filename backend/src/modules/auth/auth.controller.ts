import { NextFunction, Request, Response } from "express";
import { getSessionInfo, login, register } from "./auth.service";
import { ApiError } from "../../shared/apiError";
import { ok } from "../../shared/httpResponse";

export const loginHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const loginResult = await login({
      username: req.body.username,
      password: req.body.password,
    });

    res.json(
      ok("Uspesna prijava.", {
        token: loginResult.token,
        username: loginResult.username,
        role: loginResult.role,
        hasApplied: loginResult.hasApplied,
        latestPrijava: loginResult.latestPrijava,
      }),
    );
  } catch (error) {
    next(error);
  }
};

export const sessionHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, "Autentikacija", "Korisnik nije autentifikovan.");
    }

    const session = await getSessionInfo(req.user.username, req.user.role);

    res.json(
      ok("Sesija je uspesno ucitana.", {
        username: session.username,
        role: session.role,
        hasApplied: session.hasApplied,
        latestPrijava: session.latestPrijava,
      }),
    );
  } catch (error) {
    next(error);
  }
};

export const registerHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const registerResult = await register({
      username: req.body.username,
      password: req.body.password,
      email: req.body.email,
    });

    res.status(201).json(
      ok("Registracija je uspesna.", {
        token: registerResult.token,
        username: registerResult.username,
        role: registerResult.role,
        hasApplied: registerResult.hasApplied,
        latestPrijava: registerResult.latestPrijava,
      }),
    );
  } catch (error) {
    next(error);
  }
};
