import oracledb from "oracledb";
import { env } from "../../config/env";

let poolReady = false;

export const initOraclePool = async (): Promise<void> => {
  if (poolReady) {
    return;
  }

  await oracledb.createPool({
    user: env.oracleUser,
    password: env.oraclePassword,
    connectString: env.oracleConnectString,
    poolMin: env.oraclePoolMin,
    poolMax: env.oraclePoolMax,
    poolIncrement: env.oraclePoolIncrement,
  });

  poolReady = true;
};

export const closeOraclePool = async (): Promise<void> => {
  const pool = oracledb.getPool();
  await pool.close(5);
  poolReady = false;
};

export const getOracleConnection = async (): Promise<oracledb.Connection> => {
  const pool = oracledb.getPool();
  return pool.getConnection();
};
