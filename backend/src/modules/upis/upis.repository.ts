import oracledb from "oracledb";
import { executeSql } from "../../db/oracle/execute";
import { ApiError } from "../../shared/apiError";
import type {
  EnrollmentContractDownloadRecord,
  EnrollmentFinalizationRecord,
  EnrollmentFinalizationSummaryRecord,
  EligiblePrijavaRow,
  PendingEnrollmentFinalizationRow,
  RankingItem,
  RankingListSummary,
  StudyProgramOption,
} from "../../types/modules/upis";

type ProgramRow = {
  ID_PROGRAMA: number;
  NAZIV_PROGRAMA: string;
  MODUL: string;
  BROJ_DOSTUPNIH_MESTA: number | null;
};

type EligiblePrijavaDbRow = {
  BROJ_PRIJAVE: number;
  SKOLSKA_GODINA: string;
  DATUM_PRIJAVE: Date | null;
  ID_PROGRAMA: number | null;
  NAZIV_PROGRAMA: string | null;
  MODUL: string | null;
  STATUS_PRIJAVE: string | null;
  JMBG: string | null;
  IME_PREZIME: string | null;
  BROJ_POENA: number | null;
  RANKING_STATUS: string | null;
  STUDIJSKI_PROGRAM: string | null;
};

type RankingListRow = {
  ID_RANG_LISTE: number;
  ID_PROGRAMA: number | null;
  NAZIV_PROGRAMA: string | null;
  MODUL: string | null;
  STUDIJSKI_PROGRAM: string | null;
  SKOLSKA_GODINA: string | null;
  BROJ_MESTA: number | null;
  UKUPNO_KANDIDATA: number | null;
};

type RankingItemRow = {
  ID_STAVKE: number;
  ID_RANG_LISTE: number | null;
  BROJ_PRIJAVE: number | null;
  ID_PROGRAMA: number | null;
  IME_PREZIME: string | null;
  BROJ_POENA: number | null;
  RANG_MESTO: number | null;
  STATUS: string | null;
  STUDIJSKI_PROGRAM: string | null;
};

type EnrollmentFinalizationRow = {
  ID_UPISA: number;
  BROJ_PRIJAVE: number;
  SKOLSKA_GODINA: string;
  STATUS_UPISA: "UgovorOtpremljen" | "UpisZavrsen";
  UGOVOR_UPLOADED_AT: Date | null;
  BROJ_INDEKSA: string | null;
  DATUM_UPISA: Date | null;
  HAS_SIGNED_CONTRACT: number;
};

type EnrollmentContractDownloadRow = {
  UGOVOR_FILE_NAME: string | null;
  UGOVOR_MIME_TYPE: string | null;
  UGOVOR_FILE_SIZE: number | null;
  UGOVOR_FILE_CONTENT: Buffer | null;
};

type PendingEnrollmentFinalizationDbRow = {
  ID_UPISA: number;
  BROJ_PRIJAVE: number;
  SKOLSKA_GODINA: string;
  IME_PREZIME: string | null;
  STUDIJSKI_PROGRAM: string | null;
  BROJ_POENA: number | null;
  RANG_MESTO: number | null;
  STATUS_UPISA: "UgovorOtpremljen" | "UpisZavrsen";
  UGOVOR_UPLOADED_AT: Date | null;
};

type EnrollmentFinalizationSummaryRow = {
  UKUPNO_FINALIZOVANIH_UPISA: number;
};

const mapProgram = (row: ProgramRow): StudyProgramOption => ({
  idPrograma: row.ID_PROGRAMA,
  nazivPrograma: row.NAZIV_PROGRAMA,
  modul: row.MODUL,
  brojDostupnihMesta: row.BROJ_DOSTUPNIH_MESTA,
});

const mapEligiblePrijava = (row: EligiblePrijavaDbRow): EligiblePrijavaRow => ({
  brojPrijave: row.BROJ_PRIJAVE,
  skolskaGodina: row.SKOLSKA_GODINA,
  datumPrijave: row.DATUM_PRIJAVE ? row.DATUM_PRIJAVE.toISOString() : null,
  idPrograma: row.ID_PROGRAMA,
  nazivPrograma: row.NAZIV_PROGRAMA,
  modul: row.MODUL,
  jmbg: row.JMBG,
  imePrezime: row.IME_PREZIME,
  examPoints: row.BROJ_POENA,
  rankingStatus: row.RANKING_STATUS,
  studijskiProgram: row.STUDIJSKI_PROGRAM,
  statusPrijave: row.STATUS_PRIJAVE,
});

const mapRankingList = (row: RankingListRow): RankingListSummary => ({
  idRangListe: row.ID_RANG_LISTE,
  idPrograma: row.ID_PROGRAMA,
  nazivPrograma: row.NAZIV_PROGRAMA,
  modul: row.MODUL,
  studijskiProgram: row.STUDIJSKI_PROGRAM,
  skolskaGodina: row.SKOLSKA_GODINA,
  brojMesta: row.BROJ_MESTA,
  ukupnoKandidata: row.UKUPNO_KANDIDATA,
});

const mapRankingItem = (row: RankingItemRow): RankingItem => ({
  idStavke: row.ID_STAVKE,
  idRangListe: row.ID_RANG_LISTE,
  brojPrijave: row.BROJ_PRIJAVE,
  idPrograma: row.ID_PROGRAMA,
  imePrezime: row.IME_PREZIME,
  brojPoena: row.BROJ_POENA,
  rangMesto: row.RANG_MESTO,
  status: row.STATUS,
  studijskiProgram: row.STUDIJSKI_PROGRAM,
});

const mapEnrollmentFinalization = (
  row: EnrollmentFinalizationRow,
): EnrollmentFinalizationRecord => ({
  idUpisa: row.ID_UPISA,
  brojPrijave: row.BROJ_PRIJAVE,
  skolskaGodina: row.SKOLSKA_GODINA,
  statusUpisa: row.STATUS_UPISA,
  hasSignedContract: row.HAS_SIGNED_CONTRACT === 1,
  signedContractUploadedAt: row.UGOVOR_UPLOADED_AT ? row.UGOVOR_UPLOADED_AT.toISOString() : null,
  brojIndeksa: row.BROJ_INDEKSA,
  datumUpisa: row.DATUM_UPISA ? row.DATUM_UPISA.toISOString() : null,
});

const mapPendingEnrollmentFinalization = (
  row: PendingEnrollmentFinalizationDbRow,
): PendingEnrollmentFinalizationRow => ({
  idUpisa: row.ID_UPISA,
  brojPrijave: row.BROJ_PRIJAVE,
  skolskaGodina: row.SKOLSKA_GODINA,
  imePrezime: row.IME_PREZIME,
  studijskiProgram: row.STUDIJSKI_PROGRAM,
  brojPoena: row.BROJ_POENA,
  rangMesto: row.RANG_MESTO,
  statusUpisa: row.STATUS_UPISA,
  signedContractUploadedAt: row.UGOVOR_UPLOADED_AT ? row.UGOVOR_UPLOADED_AT.toISOString() : null,
});

export const listStudyPrograms = async (): Promise<StudyProgramOption[]> => {
  const result = await executeSql<ProgramRow>(
    `
      SELECT
        sp.id_programa,
        sp.naziv_programa,
        sp.modul,
        sp.broj_dostupnih_mesta
      FROM StudijskiProgram_VIEW sp
      ORDER BY sp.naziv_programa, sp.modul
    `,
  );

  return (result.rows ?? []).map(mapProgram);
};

export const listEligiblePrijave = async (
  skolskaGodina?: string,
): Promise<EligiblePrijavaRow[]> => {
  const result = await executeSql<EligiblePrijavaDbRow>(
    `
      SELECT
        p.broj_prijave,
        p.skolska_godina,
        p.datum_prijave,
        p.id_programa,
        sp.naziv_programa,
        sp.modul,
        p.status_prijave,
        p.jmbg,
        p.ime_prezime,
        s.broj_poena,
        s.status AS ranking_status,
        s.studijski_program
      FROM Prijava p
      LEFT JOIN StudijskiProgram_VIEW sp ON sp.id_programa = p.id_programa
      LEFT JOIN StavkaRangListe s
        ON s.id_stavke = (
          SELECT MAX(s2.id_stavke)
          FROM StavkaRangListe s2
          WHERE s2.broj_prijave = p.broj_prijave
        )
      WHERE p.status_prijave = 'Odobrena'
        AND p.id_programa IS NOT NULL
        AND (:skolskaGodina IS NULL OR p.skolska_godina = :skolskaGodina)
      ORDER BY p.datum_prijave DESC NULLS LAST, p.broj_prijave DESC
    `,
    {
      skolskaGodina: skolskaGodina ?? null,
    },
  );

  return (result.rows ?? []).map(mapEligiblePrijava);
};

export const findPrijavaForExam = async (
  brojPrijave: number,
  skolskaGodina: string,
): Promise<EligiblePrijavaRow | null> => {
  const result = await executeSql<EligiblePrijavaDbRow>(
    `
      SELECT
        p.broj_prijave,
        p.skolska_godina,
        p.datum_prijave,
        p.id_programa,
        sp.naziv_programa,
        sp.modul,
        p.status_prijave,
        p.jmbg,
        p.ime_prezime,
        s.broj_poena,
        s.status AS ranking_status,
        s.studijski_program
      FROM Prijava p
      LEFT JOIN StudijskiProgram_VIEW sp ON sp.id_programa = p.id_programa
      LEFT JOIN StavkaRangListe s ON s.broj_prijave = p.broj_prijave
      WHERE p.broj_prijave = :brojPrijave
        AND p.skolska_godina = :skolskaGodina
      FETCH FIRST 1 ROWS ONLY
    `,
    { brojPrijave, skolskaGodina },
  );

  const row = result.rows?.[0];
  return row ? mapEligiblePrijava(row) : null;
};

export const findRankingListByProgramAndYear = async (
  idPrograma: number,
  skolskaGodina: string,
): Promise<RankingListSummary | null> => {
  const result = await executeSql<RankingListRow>(
    `
      SELECT
        kr.id_rang_liste,
        kr.id_programa,
        sp.naziv_programa,
        sp.modul,
        kr.studijski_program,
        kr.skolska_godina,
        kr.broj_mesta,
        kr.ukupno_kandidata
      FROM KonacnaRangLista kr
      LEFT JOIN StudijskiProgram_VIEW sp ON sp.id_programa = kr.id_programa
      WHERE kr.id_programa = :idPrograma
        AND kr.skolska_godina = :skolskaGodina
      ORDER BY kr.id_rang_liste DESC
      FETCH FIRST 1 ROWS ONLY
    `,
    { idPrograma, skolskaGodina },
  );

  const row = result.rows?.[0];
  return row ? mapRankingList(row) : null;
};

export const createRankingList = async (
  idPrograma: number,
  studijskiProgram: string,
  skolskaGodina: string,
  brojMesta: number,
): Promise<number> => {
  const nextIdResult = await executeSql<{ NEXT_VAL: number }>(
    "SELECT NVL(MAX(kr.id_rang_liste), 0) + 1 AS next_val FROM KonacnaRangLista kr",
  );
  const idRangListe = nextIdResult.rows?.[0]?.NEXT_VAL ?? 1;

  await executeSql(
    `
      INSERT INTO KonacnaRangLista (
        id_rang_liste,
        id_programa,
        studijski_program,
        broj_mesta,
        skolska_godina,
        ukupno_kandidata
      )
      VALUES (
        :idRangListe,
        :idPrograma,
        :studijskiProgram,
        :brojMesta,
        :skolskaGodina,
        0
      )
    `,
    {
      idRangListe,
      idPrograma,
      studijskiProgram,
      brojMesta,
      skolskaGodina,
    },
  );

  return idRangListe;
};

export const listRankingLists = async (
  idPrograma?: number,
  skolskaGodina?: string,
): Promise<RankingListSummary[]> => {
  const result = await executeSql<RankingListRow>(
    `
      SELECT
        kr.id_rang_liste,
        kr.id_programa,
        sp.naziv_programa,
        sp.modul,
        kr.studijski_program,
        kr.skolska_godina,
        kr.broj_mesta,
        kr.ukupno_kandidata
      FROM KonacnaRangLista kr
      LEFT JOIN StudijskiProgram_VIEW sp ON sp.id_programa = kr.id_programa
      WHERE (:idPrograma IS NULL OR kr.id_programa = :idPrograma)
        AND (:skolskaGodina IS NULL OR kr.skolska_godina = :skolskaGodina)
      ORDER BY kr.id_rang_liste DESC
    `,
    {
      idPrograma: idPrograma ?? null,
      skolskaGodina: skolskaGodina ?? null,
    },
  );

  return (result.rows ?? []).map(mapRankingList);
};

export const getRankingListById = async (
  idRangListe: number,
): Promise<RankingListSummary | null> => {
  const result = await executeSql<RankingListRow>(
    `
      SELECT
        kr.id_rang_liste,
        kr.id_programa,
        sp.naziv_programa,
        sp.modul,
        kr.studijski_program,
        kr.skolska_godina,
        kr.broj_mesta,
        kr.ukupno_kandidata
      FROM KonacnaRangLista kr
      LEFT JOIN StudijskiProgram_VIEW sp ON sp.id_programa = kr.id_programa
      WHERE kr.id_rang_liste = :idRangListe
      FETCH FIRST 1 ROWS ONLY
    `,
    { idRangListe },
  );

  const row = result.rows?.[0];
  return row ? mapRankingList(row) : null;
};

export const listRankingItemsByListId = async (idRangListe: number): Promise<RankingItem[]> => {
  const result = await executeSql<RankingItemRow>(
    `
      SELECT
        s.id_stavke,
        s.id_rang_liste,
        s.broj_prijave,
        s.id_programa,
        s.ime_prezime,
        s.broj_poena,
        s.rang_mesto,
        s.status,
        s.studijski_program
      FROM StavkaRangListe s
      WHERE s.id_rang_liste = :idRangListe
      ORDER BY s.broj_poena DESC NULLS LAST, s.ime_prezime ASC NULLS LAST, s.id_stavke ASC
    `,
    { idRangListe },
  );

  return (result.rows ?? []).map(mapRankingItem);
};

export const findRankingItemByPrijava = async (
  brojPrijave: number,
): Promise<RankingItem | null> => {
  const result = await executeSql<RankingItemRow>(
    `
      SELECT
        s.id_stavke,
        s.id_rang_liste,
        s.broj_prijave,
        s.id_programa,
        s.ime_prezime,
        s.broj_poena,
        s.rang_mesto,
        s.status,
        s.studijski_program
      FROM StavkaRangListe s
      WHERE s.broj_prijave = :brojPrijave
      ORDER BY s.id_stavke DESC
      FETCH FIRST 1 ROWS ONLY
    `,
    { brojPrijave },
  );

  const row = result.rows?.[0];
  return row ? mapRankingItem(row) : null;
};

export const insertExamScore = async (input: {
  idRangListe: number;
  brojPrijave: number;
  idPrograma: number;
  imePrezime: string | null;
  brojPoena: number;
}): Promise<number> => {
  const nextIdResult = await executeSql<{ NEXT_VAL: number }>(
    "SELECT NVL(MAX(s.id_stavke), 0) + 1 AS next_val FROM StavkaRangListe s",
  );
  const idStavke = nextIdResult.rows?.[0]?.NEXT_VAL ?? 1;

  await executeSql(
    `
      INSERT INTO StavkaRangListe (
        id_stavke,
        id_rang_liste,
        broj_poena,
        ime_prezime,
        broj_prijave,
        id_programa,
        rang_mesto,
        status,
        sistemski_update
      )
      VALUES (
        :idStavke,
        :idRangListe,
        :brojPoena,
        :imePrezime,
        :brojPrijave,
        :idPrograma,
        NULL,
        'BodoviUneti',
        'N'
      )
    `,
    {
      idStavke,
      idRangListe: input.idRangListe,
      brojPoena: input.brojPoena,
      imePrezime: input.imePrezime,
      brojPrijave: input.brojPrijave,
      idPrograma: input.idPrograma,
    },
  );

  return idStavke;
};

export const updateRankingItemRank = async (idStavke: number, rangMesto: number): Promise<void> => {
  await executeSql(
    `
      UPDATE StavkaRangListe
      SET rang_mesto = :rangMesto
      WHERE id_stavke = :idStavke
    `,
    {
      idStavke,
      rangMesto,
    },
  );
};

export const updateRankingItemStatus = async (idStavke: number, status: string): Promise<void> => {
  await executeSql(
    `
      UPDATE StavkaRangListe
      SET status = :status
      WHERE id_stavke = :idStavke
    `,
    {
      idStavke,
      status,
    },
  );
};

export const updateRankingListCandidateCount = async (
  idRangListe: number,
  ukupnoKandidata: number,
): Promise<void> => {
  await executeSql(
    `
      UPDATE KonacnaRangLista
      SET ukupno_kandidata = :ukupnoKandidata
      WHERE id_rang_liste = :idRangListe
    `,
    {
      idRangListe,
      ukupnoKandidata,
    },
  );
};

export const updateRankingListSeats = async (
  idRangListe: number,
  brojMesta: number,
): Promise<void> => {
  await executeSql(
    `
      UPDATE KonacnaRangLista
      SET broj_mesta = :brojMesta
      WHERE id_rang_liste = :idRangListe
    `,
    {
      idRangListe,
      brojMesta,
    },
  );
};

export const updateRankingListStudyProgram = async (
  idRangListe: number,
  studijskiProgram: string,
): Promise<void> => {
  await executeSql(
    `
      UPDATE KonacnaRangLista
      SET studijski_program = :studijskiProgram
      WHERE id_rang_liste = :idRangListe
    `,
    {
      idRangListe,
      studijskiProgram,
    },
  );
};

export const updateRankingItemStudyProgram = async (
  idStavke: number,
  studijskiProgram: string,
): Promise<void> => {
  await executeSql(
    `
      UPDATE StavkaRangListe
      SET studijski_program = :studijskiProgram
      WHERE id_stavke = :idStavke
    `,
    {
      idStavke,
      studijskiProgram,
    },
  );
};

export const getEnrollmentFinalizationByPrijava = async (
  brojPrijave: number,
  skolskaGodina: string,
): Promise<EnrollmentFinalizationRecord | null> => {
  const result = await executeSql<EnrollmentFinalizationRow>(
    `
      SELECT
        uf.id_upisa,
        uf.broj_prijave,
        uf.skolska_godina,
        uf.status_upisa,
        uf.ugovor_uploaded_at,
        uf.broj_indeksa,
        uf.datum_upisa,
        CASE WHEN uf.ugovor_file_content IS NOT NULL THEN 1 ELSE 0 END AS has_signed_contract
      FROM Upis_Finalizacija uf
      WHERE uf.broj_prijave = :brojPrijave
        AND uf.skolska_godina = :skolskaGodina
      FETCH FIRST 1 ROWS ONLY
    `,
    {
      brojPrijave,
      skolskaGodina,
    },
  );

  const row = result.rows?.[0];
  return row ? mapEnrollmentFinalization(row) : null;
};

export const upsertSignedEnrollmentContract = async (input: {
  brojPrijave: number;
  skolskaGodina: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileContent: Buffer;
}): Promise<EnrollmentFinalizationRecord> => {
  const existing = await getEnrollmentFinalizationByPrijava(input.brojPrijave, input.skolskaGodina);

  if (existing) {
    await executeSql(
      `
        UPDATE Upis_Finalizacija
        SET
          status_upisa = 'UgovorOtpremljen',
          ugovor_file_name = :fileName,
          ugovor_mime_type = :mimeType,
          ugovor_file_size = :fileSize,
          ugovor_file_content = :fileContent,
          ugovor_uploaded_at = SYSDATE,
          updated_at = SYSDATE
        WHERE id_upisa = :idUpisa
      `,
      {
        idUpisa: existing.idUpisa,
        fileName: input.fileName,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        fileContent: input.fileContent,
      },
    );
  } else {
    const nextIdResult = await executeSql<{ NEXT_VAL: number }>(
      "SELECT NVL(MAX(uf.id_upisa), 0) + 1 AS next_val FROM Upis_Finalizacija uf",
    );
    const idUpisa = nextIdResult.rows?.[0]?.NEXT_VAL ?? 1;

    await executeSql(
      `
        INSERT INTO Upis_Finalizacija (
          id_upisa,
          broj_prijave,
          skolska_godina,
          status_upisa,
          ugovor_file_name,
          ugovor_mime_type,
          ugovor_file_size,
          ugovor_file_content,
          ugovor_uploaded_at,
          created_at,
          updated_at
        )
        VALUES (
          :idUpisa,
          :brojPrijave,
          :skolskaGodina,
          'UgovorOtpremljen',
          :fileName,
          :mimeType,
          :fileSize,
          :fileContent,
          SYSDATE,
          SYSDATE,
          SYSDATE
        )
      `,
      {
        idUpisa,
        brojPrijave: input.brojPrijave,
        skolskaGodina: input.skolskaGodina,
        fileName: input.fileName,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        fileContent: input.fileContent,
      },
    );
  }

  const updated = await getEnrollmentFinalizationByPrijava(input.brojPrijave, input.skolskaGodina);
  if (!updated) {
    throw new ApiError(
      500,
      "Cuvanje ugovora nije uspelo",
      "Doslo je do greske prilikom cuvanja potpisanog ugovora.",
    );
  }

  return updated;
};

export const getEnrollmentContractDownload = async (
  brojPrijave: number,
  skolskaGodina: string,
): Promise<EnrollmentContractDownloadRecord> => {
  const result = await executeSql<EnrollmentContractDownloadRow>(
    `
      SELECT
        uf.ugovor_file_name,
        uf.ugovor_mime_type,
        uf.ugovor_file_size,
        uf.ugovor_file_content
      FROM Upis_Finalizacija uf
      WHERE uf.broj_prijave = :brojPrijave
        AND uf.skolska_godina = :skolskaGodina
      FETCH FIRST 1 ROWS ONLY
    `,
    {
      brojPrijave,
      skolskaGodina,
    },
    {
      fetchInfo: {
        UGOVOR_FILE_CONTENT: { type: oracledb.BUFFER },
      },
    },
  );

  const row = result.rows?.[0];
  if (!row || !row.UGOVOR_FILE_CONTENT || !row.UGOVOR_FILE_NAME || !row.UGOVOR_FILE_SIZE) {
    throw new ApiError(404, "Ugovor nije pronadjen", "Potpisani ugovor nije otpremljen.");
  }

  return {
    fileName: row.UGOVOR_FILE_NAME,
    mimeType: row.UGOVOR_MIME_TYPE ?? "application/octet-stream",
    fileSize: row.UGOVOR_FILE_SIZE,
    fileContent: row.UGOVOR_FILE_CONTENT,
  };
};

export const listPendingEnrollmentFinalizations = async (
  skolskaGodina?: string,
): Promise<PendingEnrollmentFinalizationRow[]> => {
  const result = await executeSql<PendingEnrollmentFinalizationDbRow>(
    `
      SELECT
        uf.id_upisa,
        uf.broj_prijave,
        uf.skolska_godina,
        p.ime_prezime,
        s.studijski_program,
        s.broj_poena,
        s.rang_mesto,
        uf.status_upisa,
        uf.ugovor_uploaded_at
      FROM Upis_Finalizacija uf
      JOIN Prijava p
        ON p.broj_prijave = uf.broj_prijave
       AND p.skolska_godina = uf.skolska_godina
      LEFT JOIN StavkaRangListe s
        ON s.id_stavke = (
          SELECT MAX(s2.id_stavke)
          FROM StavkaRangListe s2
          WHERE s2.broj_prijave = uf.broj_prijave
        )
      WHERE uf.status_upisa = 'UgovorOtpremljen'
        AND (:skolskaGodina IS NULL OR uf.skolska_godina = :skolskaGodina)
      ORDER BY uf.ugovor_uploaded_at DESC NULLS LAST, uf.id_upisa DESC
    `,
    {
      skolskaGodina: skolskaGodina ?? null,
    },
  );

  return (result.rows ?? []).map(mapPendingEnrollmentFinalization);
};

export const getEnrollmentFinalizationSummary = async (
  skolskaGodina?: string,
): Promise<EnrollmentFinalizationSummaryRecord> => {
  const result = await executeSql<EnrollmentFinalizationSummaryRow>(
    `
      SELECT COUNT(*) AS ukupno_finalizovanih_upisa
      FROM Upis_Finalizacija uf
      WHERE uf.status_upisa = 'UpisZavrsen'
        AND (:skolskaGodina IS NULL OR uf.skolska_godina = :skolskaGodina)
    `,
    {
      skolskaGodina: skolskaGodina ?? null,
    },
  );

  return {
    ukupnoFinalizovanihUpisa: result.rows?.[0]?.UKUPNO_FINALIZOVANIH_UPISA ?? 0,
  };
};

export const confirmEnrollmentFinalization = async (input: {
  brojPrijave: number;
  skolskaGodina: string;
  brojIndeksa: string;
  adminUserId: number;
}): Promise<EnrollmentFinalizationRecord> => {
  await executeSql(
    `
      UPDATE Upis_Finalizacija
      SET
        status_upisa = 'UpisZavrsen',
        broj_indeksa = :brojIndeksa,
        datum_upisa = SYSDATE,
        potvrdio_admin_id = :adminUserId,
        updated_at = SYSDATE
      WHERE broj_prijave = :brojPrijave
        AND skolska_godina = :skolskaGodina
    `,
    {
      brojPrijave: input.brojPrijave,
      skolskaGodina: input.skolskaGodina,
      brojIndeksa: input.brojIndeksa,
      adminUserId: input.adminUserId,
    },
  );

  const updated = await getEnrollmentFinalizationByPrijava(input.brojPrijave, input.skolskaGodina);
  if (!updated) {
    throw new ApiError(
      500,
      "Finalizacija upisa nije uspela",
      "Nije moguce potvrditi finalizaciju upisa za izabranu prijavu.",
    );
  }

  return updated;
};
