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
import type {
  EligiblePrijavaDbRow,
  EnrollmentContractDownloadRow,
  EnrollmentFinalizationRow,
  EnrollmentFinalizationSummaryRow,
  PendingEnrollmentFinalizationDbRow,
  ProgramRow,
  RankingItemRow,
  RankingListRow,
} from "../../types/modules/upisRepository";
import {
  mapEligiblePrijavaRow,
  mapEnrollmentFinalizationRow,
  mapPendingEnrollmentFinalizationRow,
  mapProgramRow,
  mapUpisRankingItemRow,
  mapUpisRankingListRow,
} from "../../utils/modules/upisRepository.utils";

export const listStudyPrograms = async (idFakulteta?: number): Promise<StudyProgramOption[]> => {
  const result = await executeSql<ProgramRow>(
    `
      SELECT
        sp.id_programa,
        spg.id_fakulteta,
        sp.naziv_programa,
        sp.modul,
        sp.broj_dostupnih_mesta
      FROM StudijskiProgram_VIEW sp
      LEFT JOIN StudijskiProgramGlavno spg ON spg.id_programa = sp.id_programa
      WHERE (:idFakulteta IS NULL OR spg.id_fakulteta = :idFakulteta)
      ORDER BY sp.naziv_programa, sp.modul
    `,
    {
      idFakulteta: idFakulteta ?? null,
    },
  );

  return (result.rows ?? []).map(mapProgramRow);
};

export const listEligiblePrijave = async (
  skolskaGodina?: string,
  idKonkursa?: number,
): Promise<EligiblePrijavaRow[]> => {
  const result = await executeSql<EligiblePrijavaDbRow>(
    `
      SELECT
        p.broj_prijave,
        p.skolska_godina,
        p.datum_prijave,
        p.id_konkursa,
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
        AND (:idKonkursa IS NULL OR p.id_konkursa = :idKonkursa)
      ORDER BY p.datum_prijave DESC NULLS LAST, p.broj_prijave DESC
    `,
    {
      skolskaGodina: skolskaGodina ?? null,
      idKonkursa: idKonkursa ?? null,
    },
  );

  return (result.rows ?? []).map(mapEligiblePrijavaRow);
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
        p.id_konkursa,
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
  return row ? mapEligiblePrijavaRow(row) : null;
};

export const findRankingListByProgramAndYear = async (
  idPrograma: number,
  skolskaGodina: string,
  idKonkursa?: number,
): Promise<RankingListSummary | null> => {
  const result = await executeSql<RankingListRow>(
    `
      SELECT
        kr.id_rang_liste,
        kr.id_konkursa,
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
        AND (:idKonkursa IS NULL OR kr.id_konkursa = :idKonkursa)
      ORDER BY kr.id_rang_liste DESC
      FETCH FIRST 1 ROWS ONLY
    `,
    { idPrograma, skolskaGodina, idKonkursa: idKonkursa ?? null },
  );

  const row = result.rows?.[0];
  return row ? mapUpisRankingListRow(row) : null;
};

export const createRankingList = async (
  idKonkursa: number | null,
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
        id_konkursa,
        id_programa,
        studijski_program,
        broj_mesta,
        skolska_godina,
        ukupno_kandidata
      )
      VALUES (
        :idRangListe,
        :idKonkursa,
        :idPrograma,
        :studijskiProgram,
        :brojMesta,
        :skolskaGodina,
        0
      )
    `,
    {
      idRangListe,
      idKonkursa,
      idPrograma,
      studijskiProgram,
      brojMesta,
      skolskaGodina,
    },
  );

  return idRangListe;
};

export const listRankingLists = async (
  idKonkursa?: number,
  idPrograma?: number,
  skolskaGodina?: string,
): Promise<RankingListSummary[]> => {
  const result = await executeSql<RankingListRow>(
    `
      SELECT
        kr.id_rang_liste,
        kr.id_konkursa,
        kr.id_programa,
        sp.naziv_programa,
        sp.modul,
        kr.studijski_program,
        kr.skolska_godina,
        kr.broj_mesta,
        kr.ukupno_kandidata
      FROM KonacnaRangLista kr
      LEFT JOIN StudijskiProgram_VIEW sp ON sp.id_programa = kr.id_programa
      WHERE (:idKonkursa IS NULL OR kr.id_konkursa = :idKonkursa)
        AND (:idPrograma IS NULL OR kr.id_programa = :idPrograma)
        AND (:skolskaGodina IS NULL OR kr.skolska_godina = :skolskaGodina)
      ORDER BY kr.id_rang_liste DESC
    `,
    {
      idKonkursa: idKonkursa ?? null,
      idPrograma: idPrograma ?? null,
      skolskaGodina: skolskaGodina ?? null,
    },
  );

  return (result.rows ?? []).map(mapUpisRankingListRow);
};

export const getRankingListById = async (
  idRangListe: number,
): Promise<RankingListSummary | null> => {
  const result = await executeSql<RankingListRow>(
    `
      SELECT
        kr.id_rang_liste,
        kr.id_konkursa,
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
  return row ? mapUpisRankingListRow(row) : null;
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

  return (result.rows ?? []).map(mapUpisRankingItemRow);
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
  return row ? mapUpisRankingItemRow(row) : null;
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
  return row ? mapEnrollmentFinalizationRow(row) : null;
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
  idKonkursa?: number,
): Promise<PendingEnrollmentFinalizationRow[]> => {
  const result = await executeSql<PendingEnrollmentFinalizationDbRow>(
    `
      SELECT
        uf.id_upisa,
        uf.broj_prijave,
        uf.skolska_godina,
        p.id_konkursa,
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
        AND (:idKonkursa IS NULL OR p.id_konkursa = :idKonkursa)
      ORDER BY uf.ugovor_uploaded_at DESC NULLS LAST, uf.id_upisa DESC
    `,
    {
      skolskaGodina: skolskaGodina ?? null,
      idKonkursa: idKonkursa ?? null,
    },
  );

  return (result.rows ?? []).map(mapPendingEnrollmentFinalizationRow);
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
