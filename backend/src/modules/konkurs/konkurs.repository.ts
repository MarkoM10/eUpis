import { executeSql } from "../../db/oracle/execute";
import type { KonkursStatus } from "../../types/modules/konkurs";

type KonkursRow = {
  ID_KONKURSA: number;
  ID_FAKULTETA: number | null;
  NAZIV_FAKULTETA: string | null;
  GODINA_KONKURSA: number;
  KONKURSNI_ROK: string;
  DATUM_OD: Date;
  DATUM_DO: Date;
  STATUS_KONKURSA: string | null;
};

type KonkursWithStavkaRow = {
  ID_KONKURSA: number;
  ID_FAKULTETA: number | null;
  NAZIV_FAKULTETA: string | null;
  GODINA_KONKURSA: number;
  KONKURSNI_ROK: string;
  DATUM_OD: Date;
  DATUM_DO: Date;
  STATUS_KONKURSA: string | null;
  ID_STAVKE_KONKURSA: number | null;
  ID_PROGRAMA: number | null;
  NAZIV_PROGRAMA: string | null;
  MODUL: string | null;
  BROJ_DOSTUPNIH_MESTA: number | null;
};

type NextIdRow = {
  NEXT_ID: number;
};

type ExistsRow = {
  CNT: number;
};

export const getNextKonkursId = async (): Promise<number> => {
  const result = await executeSql<NextIdRow>(
    "SELECT NVL(MAX(k.id_konkursa), 0) + 1 AS next_id FROM KonkursZaMasterStudije k",
  );

  return result.rows?.[0]?.NEXT_ID ?? 1;
};

export const getNextKonkursStavkaId = async (): Promise<number> => {
  const result = await executeSql<NextIdRow>(
    "SELECT NVL(MAX(s.id_stavke_konkursa), 0) + 1 AS next_id FROM KonkursStavka s",
  );

  return result.rows?.[0]?.NEXT_ID ?? 1;
};

export const insertKonkurs = async (input: {
  idKonkursa: number;
  idFakulteta: number;
  godinaKonkursa: number;
  rokZaPrijavu: string;
  statusKonkursa: KonkursStatus;
  konkursniRok: string;
  datumOd: string;
  datumDo: string;
  createdByUserId: number | null;
}): Promise<void> => {
  await executeSql(
    `
      INSERT INTO KonkursZaMasterStudije (
        broj_konkursa,
        godina_konkursa,
        rok_za_prijavu,
        status_konkursa,
        id_konkursa,
        id_fakulteta,
        konkursni_rok,
        datum_od,
        datum_do,
        created_by,
        created_at
      )
      VALUES (
        :idKonkursa,
        :godinaKonkursa,
        TO_DATE(:rokZaPrijavu, 'YYYY-MM-DD'),
        :statusKonkursa,
        :idKonkursa,
        :idFakulteta,
        :konkursniRok,
        TO_DATE(:datumOd, 'YYYY-MM-DD'),
        TO_DATE(:datumDo, 'YYYY-MM-DD'),
        :createdByUserId,
        SYSDATE
      )
    `,
    {
      idKonkursa: input.idKonkursa,
      idFakulteta: input.idFakulteta,
      godinaKonkursa: input.godinaKonkursa,
      rokZaPrijavu: input.rokZaPrijavu,
      statusKonkursa: input.statusKonkursa,
      konkursniRok: input.konkursniRok,
      datumOd: input.datumOd,
      datumDo: input.datumDo,
      createdByUserId: input.createdByUserId,
    },
  );
};

export const insertKonkursStavka = async (input: {
  idStavkeKonkursa: number;
  idKonkursa: number;
  idPrograma: number;
  brojDostupnihMesta: number;
}): Promise<void> => {
  await executeSql(
    `
      INSERT INTO KonkursStavka (
        id_stavke_konkursa,
        id_konkursa,
        id_programa,
        broj_dostupnih_mesta
      )
      VALUES (
        :idStavkeKonkursa,
        :idKonkursa,
        :idPrograma,
        :brojDostupnihMesta
      )
    `,
    {
      idStavkeKonkursa: input.idStavkeKonkursa,
      idKonkursa: input.idKonkursa,
      idPrograma: input.idPrograma,
      brojDostupnihMesta: input.brojDostupnihMesta,
    },
  );
};

export const listKonkursiWithStavke = async (): Promise<KonkursWithStavkaRow[]> => {
  const result = await executeSql<KonkursWithStavkaRow>(
    `
      SELECT
        k.id_konkursa,
        k.id_fakulteta,
        f.naziv_fakulteta,
        k.godina_konkursa,
        k.konkursni_rok,
        k.datum_od,
        k.datum_do,
        k.status_konkursa,
        s.id_stavke_konkursa,
        s.id_programa,
        sp.naziv_programa,
        sp.modul,
        s.broj_dostupnih_mesta
      FROM KonkursZaMasterStudije k
      LEFT JOIN Fakultet f ON f.id_fakulteta = k.id_fakulteta
      LEFT JOIN KonkursStavka s ON s.id_konkursa = k.id_konkursa
      LEFT JOIN StudijskiProgram_VIEW sp ON sp.id_programa = s.id_programa
      ORDER BY k.created_at DESC, k.id_konkursa DESC, s.id_stavke_konkursa ASC
    `,
  );

  return result.rows ?? [];
};

export const listActiveKonkursiWithStavke = async (): Promise<KonkursWithStavkaRow[]> => {
  const result = await executeSql<KonkursWithStavkaRow>(
    `
      SELECT
        k.id_konkursa,
        k.id_fakulteta,
        f.naziv_fakulteta,
        k.godina_konkursa,
        k.konkursni_rok,
        k.datum_od,
        k.datum_do,
        k.status_konkursa,
        s.id_stavke_konkursa,
        s.id_programa,
        sp.naziv_programa,
        sp.modul,
        s.broj_dostupnih_mesta
      FROM KonkursZaMasterStudije k
      LEFT JOIN Fakultet f ON f.id_fakulteta = k.id_fakulteta
      JOIN KonkursStavka s ON s.id_konkursa = k.id_konkursa
      LEFT JOIN StudijskiProgram_VIEW sp ON sp.id_programa = s.id_programa
      WHERE k.status_konkursa = 'Aktivan'
        AND TRUNC(SYSDATE) BETWEEN TRUNC(k.datum_od) AND TRUNC(k.datum_do)
      ORDER BY k.datum_od DESC, k.id_konkursa DESC, s.id_stavke_konkursa ASC
    `,
  );

  return result.rows ?? [];
};

export const findKonkursById = async (idKonkursa: number): Promise<KonkursRow | null> => {
  const result = await executeSql<KonkursRow>(
    `
      SELECT
        k.id_konkursa,
        k.id_fakulteta,
        f.naziv_fakulteta,
        k.godina_konkursa,
        k.konkursni_rok,
        k.datum_od,
        k.datum_do,
        k.status_konkursa
      FROM KonkursZaMasterStudije k
      LEFT JOIN Fakultet f ON f.id_fakulteta = k.id_fakulteta
      WHERE k.id_konkursa = :idKonkursa
      FETCH FIRST 1 ROWS ONLY
    `,
    { idKonkursa },
  );

  return result.rows?.[0] ?? null;
};

export const isProgramInKonkurs = async (
  idKonkursa: number,
  idPrograma: number,
): Promise<boolean> => {
  const result = await executeSql<ExistsRow>(
    `
      SELECT COUNT(*) AS cnt
      FROM KonkursStavka s
      WHERE s.id_konkursa = :idKonkursa
        AND s.id_programa = :idPrograma
    `,
    {
      idKonkursa,
      idPrograma,
    },
  );

  return (result.rows?.[0]?.CNT ?? 0) > 0;
};

export const isProgramInFakultet = async (
  idPrograma: number,
  idFakulteta: number,
): Promise<boolean> => {
  const result = await executeSql<ExistsRow>(
    `
      SELECT COUNT(*) AS cnt
      FROM StudijskiProgramGlavno sp
      WHERE sp.id_programa = :idPrograma
        AND sp.id_fakulteta = :idFakulteta
    `,
    {
      idPrograma,
      idFakulteta,
    },
  );

  return (result.rows?.[0]?.CNT ?? 0) > 0;
};

export const updateKonkursStatus = async (
  idKonkursa: number,
  statusKonkursa: KonkursStatus,
): Promise<void> => {
  await executeSql(
    `
      UPDATE KonkursZaMasterStudije
      SET status_konkursa = :statusKonkursa
      WHERE id_konkursa = :idKonkursa
    `,
    {
      idKonkursa,
      statusKonkursa,
    },
  );
};
