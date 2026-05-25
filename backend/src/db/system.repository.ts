import { executeSql } from "./oracle/execute";

type FakultetRow = {
  ID_FAKULTETA: number;
  NAZIV_FAKULTETA: string;
};

export interface FakultetRecord {
  idFakulteta: number;
  nazivFakulteta: string;
}

/**
 * Provera Oracle konekcije - SELECT 1 FROM dual
 * Koristi se za /api/db/ping endpoint
 */
export const checkDatabaseConnection = async (): Promise<{ status: "ok" }> => {
  await executeSql<{ VALUE: number }>("SELECT 1 AS VALUE FROM dual");
  return { status: "ok" };
};

/**
 * Listanje svih fakulteta iz baze
 * Koristi se za /api/meta/fakulteti endpoint
 */
export const listFakulteti = async (): Promise<FakultetRecord[]> => {
  const result = await executeSql<FakultetRow>(
    `
      SELECT
        f.id_fakulteta,
        f.naziv_fakulteta
      FROM Fakultet f
      ORDER BY f.naziv_fakulteta
    `,
  );

  return (result.rows ?? []).map((row) => ({
    idFakulteta: row.ID_FAKULTETA,
    nazivFakulteta: row.NAZIV_FAKULTETA,
  }));
};
