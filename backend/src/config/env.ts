import dotenv from "dotenv";

dotenv.config();

const requiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const toNumber = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: toNumber(process.env.PORT, 4000),
  jwtSecret: requiredEnv("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "8h",
  adminUsername: requiredEnv("ADMIN_USERNAME"),
  adminPassword: requiredEnv("ADMIN_PASSWORD"),
  oracleUser: requiredEnv("ORACLE_USER"),
  oraclePassword: requiredEnv("ORACLE_PASSWORD"),
  oracleConnectString: requiredEnv("ORACLE_CONNECT_STRING"),
  oraclePoolMin: toNumber(process.env.ORACLE_POOL_MIN, 1),
  oraclePoolMax: toNumber(process.env.ORACLE_POOL_MAX, 4),
  oraclePoolIncrement: toNumber(process.env.ORACLE_POOL_INCREMENT, 1),
};
