import oracledb, { BindParameters, ExecuteOptions } from "oracledb";
import { getOracleConnection } from "./pool";

export const executeSql = async <T>(
  sql: string,
  binds: BindParameters = {},
  options: ExecuteOptions = {},
): Promise<oracledb.Result<T>> => {
  const connection = await getOracleConnection();

  try {
    const result = await connection.execute<T>(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true,
      ...options,
    });

    return result;
  } finally {
    await connection.close();
  }
};
