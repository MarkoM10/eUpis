import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { ApiError } from "../shared/apiError";
import type { JwtPayload } from "../types/modules/auth";

export const authMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    next(new ApiError(401, "Autentikacija", "Nedostaje JWT token."));
    return;
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    req.user = { userId: payload.userId, username: payload.username, role: payload.role };
    next();
  } catch {
    next(new ApiError(401, "Autentikacija", "Token nije validan."));
  }
};
