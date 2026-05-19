import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { ApiError } from "../../shared/apiError";

interface LoginInput {
  username: string;
  password: string;
}

export const login = ({ username, password }: LoginInput): string => {
  if (username !== env.adminUsername || password !== env.adminPassword) {
    throw new ApiError(401, "Prijava nije uspela", "Pogresno korisnicko ime ili lozinka.");
  }

  return jwt.sign({ username }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  });
};
