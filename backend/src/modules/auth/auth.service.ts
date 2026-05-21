import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { ApiError } from "../../shared/apiError";
import type { JwtPayload, LoginInput, LoginResult, RegisterInput } from "../../types/modules/auth";
import {
  findKorisnikByEmail,
  findKorisnikByUsername,
  findLatestPrijavaForKorisnik,
  insertKorisnik,
  updateKorisnikLastLogin,
} from "./auth.repository";
import { hashPassword, verifyPassword } from "./password";

const createToken = (payload: JwtPayload): string =>
  jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  });

const normalizeUsername = (value: string): string => value.trim();
const normalizeEmail = (value: string): string => value.trim().toLowerCase();

const validateRegistrationInput = (input: RegisterInput): void => {
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

const buildLoginResult = async (username: string, roleFromToken?: "admin" | "student") => {
  const korisnik = await findKorisnikByUsername(username);

  if (!korisnik) {
    throw new ApiError(401, "Prijava nije uspela", "Korisnik nije pronadjen.");
  }

  const role = roleFromToken ?? korisnik.role;
  const latestPrijava =
    role === "student" ? await findLatestPrijavaForKorisnik(korisnik.idKorisnika) : null;

  return {
    username: korisnik.korisnickoIme,
    role,
    hasApplied: Boolean(latestPrijava),
    latestPrijava,
  };
};

export const login = async ({ username, password }: LoginInput): Promise<LoginResult> => {
  const korisnik = await findKorisnikByUsername(normalizeUsername(username));

  if (!korisnik || !(await verifyPassword(password, korisnik.lozinka))) {
    throw new ApiError(401, "Prijava nije uspela", "Pogresno korisnicko ime ili lozinka.");
  }

  await updateKorisnikLastLogin(korisnik.idKorisnika);

  const payload: JwtPayload = {
    userId: korisnik.idKorisnika,
    username: korisnik.korisnickoIme,
    role: korisnik.role,
  };
  const token = createToken(payload);

  const sessionData = await buildLoginResult(korisnik.korisnickoIme, korisnik.role);

  return {
    token,
    username: sessionData.username,
    role: sessionData.role,
    hasApplied: sessionData.hasApplied,
    latestPrijava: sessionData.latestPrijava,
  };
};

export const register = async (input: RegisterInput): Promise<LoginResult> => {
  validateRegistrationInput(input);

  const username = normalizeUsername(input.username);
  const email = normalizeEmail(input.email);

  const existingByUsername = await findKorisnikByUsername(username);
  if (existingByUsername) {
    throw new ApiError(409, "Registracija nije uspela", "Korisnicko ime je vec zauzeto.");
  }

  const existingByEmail = await findKorisnikByEmail(email);
  if (existingByEmail) {
    throw new ApiError(409, "Registracija nije uspela", "Email adresa je vec registrovana.");
  }

  const lozinkaHash = await hashPassword(input.password);

  const korisnik = await insertKorisnik({
    korisnickoIme: username,
    lozinka: lozinkaHash,
    email,
    role: "student",
  });

  const payload: JwtPayload = {
    userId: korisnik.idKorisnika,
    username: korisnik.korisnickoIme,
    role: korisnik.role,
  };
  const token = createToken(payload);

  return {
    token,
    username: korisnik.korisnickoIme,
    role: korisnik.role,
    hasApplied: false,
    latestPrijava: null,
  };
};

export const getSessionInfo = async (username: string, role: "admin" | "student") => {
  return buildLoginResult(username, role);
};
