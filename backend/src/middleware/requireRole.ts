import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../shared/apiError";
import type { UserRole } from "../types/modules/auth";

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const role = req.user?.role;

    if (!role) {
      next(new ApiError(401, "Autentikacija", "Korisnik nije autentifikovan."));
      return;
    }

    if (!allowedRoles.includes(role)) {
      next(new ApiError(403, "Pristup odbijen", "Nemate dozvolu za ovu akciju."));
      return;
    }

    next();
  };
};
