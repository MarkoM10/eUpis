import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { ApiError } from "../../shared/apiError";
import type { JwtPayload, RegisterInput } from "../../types/modules/auth";

export const createToken = (payload: JwtPayload): string =>
  jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  });

export const normalizeUsername = (value: string): string => value.trim();

export const normalizeEmail = (value: string): string => value.trim().toLowerCase();

export const validateRegistrationInput = (input: RegisterInput): void => {
  const username = normalizeUsername(input.username);
  const email = normalizeEmail(input.email);

  if (username.length < 3) {
    throw new ApiError(
      400,
      "Nevalidno korisnicko ime",
      "Korisnicko ime mora imati najmanje 3 karaktera.",
    );
  }

  if (input.password.length < 8) {
    throw new ApiError(400, "Nevalidna lozinka", "Lozinka mora imati najmanje 8 karaktera.");
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new ApiError(400, "Nevalidan email", "Unesite validnu email adresu.");
  }
};
