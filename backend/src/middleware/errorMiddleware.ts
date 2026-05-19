import { NextFunction, Request, Response } from "express";
import { extractOracleDetails } from "../db/oracle/oracleError";
import { ApiError } from "../shared/apiError";
import { fail } from "../shared/httpResponse";

export const errorMiddleware = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (error instanceof ApiError) {
    res
      .status(error.statusCode)
      .json(fail(error.userTitle, error.userMessage, error.oracleDetails));
    return;
  }

  const oracleDetails = extractOracleDetails(error);

  res
    .status(500)
    .json(
      fail(
        "Serverska greska",
        "Doslo je do greske prilikom obrade zahteva.",
        oracleDetails,
      ),
    );
};
