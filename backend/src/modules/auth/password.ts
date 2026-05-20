import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCallback);

const SALT_BYTES = 16;
const KEY_LENGTH = 64;

export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(SALT_BYTES).toString("hex");
  const derived = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;

  return `scrypt$${salt}$${derived.toString("hex")}`;
};

export const verifyPassword = async (password: string, stored: string): Promise<boolean> => {
  if (!stored.startsWith("scrypt$")) {
    // Backward compatibility for existing plain-text rows.
    return stored === password;
  }

  const parts = stored.split("$");
  if (parts.length !== 3) {
    return false;
  }

  const [, salt, expectedHex] = parts;
  const derived = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  const expected = Buffer.from(expectedHex, "hex");

  if (expected.length !== derived.length) {
    return false;
  }

  return timingSafeEqual(expected, derived);
};
