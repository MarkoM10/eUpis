import oracledb from "oracledb";
import { executeSql } from "../../db/oracle/execute";
import { ApiError } from "../../shared/apiError";
import type { PrijavaKey } from "../../types/modules/prijave";
import type {
  PrijavaDocumentDownloadRecord,
  PrijavaDocumentsRecord,
  PrijavaDocumentSummary,
  PrijavaDocumentType,
  PrijavaDocumentUploadInput,
} from "../../types/modules/prijavaDocuments";
import type {
  DiplomaRow,
  DownloadRow,
  UverenjeRow,
} from "../../types/modules/prijavaDocumentsRepository";
import { mapDiplomaRow, mapUverenjeRow } from "../../utils/modules/prijavaDocuments.utils";

export const getPrijavaDocuments = async (key: PrijavaKey): Promise<PrijavaDocumentsRecord> => {
  const [diplomaResult, uverenjeResult] = await Promise.all([
    executeSql<DiplomaRow>(
      `
        SELECT
          d.serijski_broj,
          d.datum_izdavanja,
          d.broj_espb,
          d.steceno_zvanje,
          d.datum_diplomiranja,
          d.godina_upisa,
          d.prosecna_ocena,
          d.id_fakulteta,
          d.id AS rektor_id,
          d.document_file_name,
          d.document_mime_type,
          d.document_file_size,
          d.document_uploaded_at,
          CASE WHEN d.document_file_content IS NOT NULL THEN 1 ELSE 0 END AS has_file
        FROM Diploma d
        WHERE d.broj_prijave = :brojPrijave
          AND d.skolska_godina = :skolskaGodina
      `,
      {
        brojPrijave: key.brojPrijave,
        skolskaGodina: key.skolskaGodina,
      },
    ),
    executeSql<UverenjeRow>(
      `
        SELECT
          u.serijski_broj,
          u.datum_izdavanja,
          u.id_fakulteta,
          u.ukupno_espb,
          u.prosecna_ocena,
          u.document_file_name,
          u.document_mime_type,
          u.document_file_size,
          u.document_uploaded_at,
          CASE WHEN u.document_file_content IS NOT NULL THEN 1 ELSE 0 END AS has_file
        FROM UverenjeOPolozenimPredmetima u
        WHERE u.broj_prijave = :brojPrijave
          AND u.skolska_godina = :skolskaGodina
      `,
      {
        brojPrijave: key.brojPrijave,
        skolskaGodina: key.skolskaGodina,
      },
    ),
  ]);

  return {
    diploma: mapDiplomaRow(diplomaResult.rows?.[0]),
    uverenje: mapUverenjeRow(uverenjeResult.rows?.[0]),
  };
};

export const upsertPrijavaDocument = async (
  key: PrijavaKey,
  input: PrijavaDocumentUploadInput,
): Promise<PrijavaDocumentSummary> => {
  if (input.type === "diploma") {
    const existingSerialResult = await executeSql<{ SERIJSKI_BROJ: number }>(
      `
        SELECT d.serijski_broj
        FROM Diploma d
        WHERE d.broj_prijave = :brojPrijave
          AND d.skolska_godina = :skolskaGodina
      `,
      {
        brojPrijave: key.brojPrijave,
        skolskaGodina: key.skolskaGodina,
      },
    );

    const existingSerialNumber = existingSerialResult.rows?.[0]?.SERIJSKI_BROJ ?? null;

    let serialNumber = existingSerialNumber;
    if (!serialNumber) {
      const nextSerialResult = await executeSql<{ NEXT_SERIAL: number }>(
        "SELECT NVL(MAX(d.serijski_broj), 0) + 1 AS next_serial FROM Diploma d",
      );
      serialNumber = nextSerialResult.rows?.[0]?.NEXT_SERIAL ?? 1;
    }

    if (existingSerialNumber) {
      await executeSql(
        `
          UPDATE Diploma
          SET
            datum_izdavanja = TO_DATE(:datumIzdavanja, 'YYYY-MM-DD'),
            broj_espb = :brojEspb,
            steceno_zvanje = :stecenoZvanje,
            datum_diplomiranja = TO_DATE(:datumDiplomiranja, 'YYYY-MM-DD'),
            godina_upisa = :godinaUpisa,
            prosecna_ocena = :prosecnaOcena,
            id_fakulteta = :idFakulteta,
            id = :rektorId,
            document_file_name = :fileName,
            document_mime_type = :mimeType,
            document_file_size = :fileSize,
            document_file_content = :fileContent,
            document_uploaded_at = SYSDATE
          WHERE broj_prijave = :brojPrijave
            AND skolska_godina = :skolskaGodina
        `,
        {
          brojPrijave: key.brojPrijave,
          skolskaGodina: key.skolskaGodina,
          datumIzdavanja: input.diploma?.datumIzdavanja ?? null,
          brojEspb: input.diploma?.brojEspb ?? null,
          stecenoZvanje: input.diploma?.stecenoZvanje ?? null,
          datumDiplomiranja: input.diploma?.datumDiplomiranja ?? null,
          godinaUpisa: input.diploma?.godinaUpisa ?? null,
          prosecnaOcena: input.diploma?.prosecnaOcena ?? null,
          idFakulteta: input.diploma?.idFakulteta ?? null,
          rektorId: input.diploma?.rektorId ?? null,
          fileName: input.fileName,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
          fileContent: input.fileContent,
        },
      );
    } else {
      await executeSql(
        `
          INSERT INTO Diploma (
            serijski_broj,
            datum_izdavanja,
            broj_espb,
            steceno_zvanje,
            datum_diplomiranja,
            godina_upisa,
            prosecna_ocena,
            id_fakulteta,
            id,
            document_file_name,
            document_mime_type,
            document_file_size,
            document_file_content,
            document_uploaded_at,
            broj_prijave,
            skolska_godina
          )
          VALUES (
            :serialNumber,
            TO_DATE(:datumIzdavanja, 'YYYY-MM-DD'),
            :brojEspb,
            :stecenoZvanje,
            TO_DATE(:datumDiplomiranja, 'YYYY-MM-DD'),
            :godinaUpisa,
            :prosecnaOcena,
            :idFakulteta,
            :rektorId,
            :fileName,
            :mimeType,
            :fileSize,
            :fileContent,
            SYSDATE,
            :brojPrijave,
            :skolskaGodina
          )
        `,
        {
          serialNumber,
          brojPrijave: key.brojPrijave,
          skolskaGodina: key.skolskaGodina,
          datumIzdavanja: input.diploma?.datumIzdavanja ?? null,
          brojEspb: input.diploma?.brojEspb ?? null,
          stecenoZvanje: input.diploma?.stecenoZvanje ?? null,
          datumDiplomiranja: input.diploma?.datumDiplomiranja ?? null,
          godinaUpisa: input.diploma?.godinaUpisa ?? null,
          prosecnaOcena: input.diploma?.prosecnaOcena ?? null,
          idFakulteta: input.diploma?.idFakulteta ?? null,
          rektorId: input.diploma?.rektorId ?? null,
          fileName: input.fileName,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
          fileContent: input.fileContent,
        },
      );
    }
  } else {
    const existingSerialResult = await executeSql<{ SERIJSKI_BROJ: number }>(
      `
        SELECT u.serijski_broj
        FROM UverenjeOPolozenimPredmetima u
        WHERE u.broj_prijave = :brojPrijave
          AND u.skolska_godina = :skolskaGodina
      `,
      {
        brojPrijave: key.brojPrijave,
        skolskaGodina: key.skolskaGodina,
      },
    );

    const existingSerialNumber = existingSerialResult.rows?.[0]?.SERIJSKI_BROJ ?? null;

    let serialNumber = existingSerialNumber;
    if (!serialNumber) {
      const nextSerialResult = await executeSql<{ NEXT_SERIAL: number }>(
        "SELECT NVL(MAX(u.serijski_broj), 0) + 1 AS next_serial FROM UverenjeOPolozenimPredmetima u",
      );
      serialNumber = nextSerialResult.rows?.[0]?.NEXT_SERIAL ?? 1;
    }

    if (existingSerialNumber) {
      await executeSql(
        `
          UPDATE UverenjeOPolozenimPredmetima
          SET
            datum_izdavanja = TO_DATE(:datumIzdavanja, 'YYYY-MM-DD'),
            id_fakulteta = :idFakulteta,
            ukupno_espb = :ukupnoEspb,
            prosecna_ocena = :prosecnaOcena,
            document_file_name = :fileName,
            document_mime_type = :mimeType,
            document_file_size = :fileSize,
            document_file_content = :fileContent,
            document_uploaded_at = SYSDATE
          WHERE broj_prijave = :brojPrijave
            AND skolska_godina = :skolskaGodina
        `,
        {
          brojPrijave: key.brojPrijave,
          skolskaGodina: key.skolskaGodina,
          datumIzdavanja: input.uverenje?.datumIzdavanja ?? null,
          idFakulteta: input.uverenje?.idFakulteta ?? null,
          ukupnoEspb: input.uverenje?.ukupnoEspb ?? null,
          prosecnaOcena: input.uverenje?.prosecnaOcena ?? null,
          fileName: input.fileName,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
          fileContent: input.fileContent,
        },
      );
    } else {
      await executeSql(
        `
          INSERT INTO UverenjeOPolozenimPredmetima (
            serijski_broj,
            datum_izdavanja,
            id_fakulteta,
            ukupno_espb,
            prosecna_ocena,
            document_file_name,
            document_mime_type,
            document_file_size,
            document_file_content,
            document_uploaded_at,
            broj_prijave,
            skolska_godina
          )
          VALUES (
            :serialNumber,
            TO_DATE(:datumIzdavanja, 'YYYY-MM-DD'),
            :idFakulteta,
            :ukupnoEspb,
            :prosecnaOcena,
            :fileName,
            :mimeType,
            :fileSize,
            :fileContent,
            SYSDATE,
            :brojPrijave,
            :skolskaGodina
          )
        `,
        {
          serialNumber,
          brojPrijave: key.brojPrijave,
          skolskaGodina: key.skolskaGodina,
          datumIzdavanja: input.uverenje?.datumIzdavanja ?? null,
          idFakulteta: input.uverenje?.idFakulteta ?? null,
          ukupnoEspb: input.uverenje?.ukupnoEspb ?? null,
          prosecnaOcena: input.uverenje?.prosecnaOcena ?? null,
          fileName: input.fileName,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
          fileContent: input.fileContent,
        },
      );
    }
  }

  const documents = await getPrijavaDocuments(key);
  return input.type === "diploma" ? documents.diploma : documents.uverenje;
};

export const getPrijavaDocumentDownload = async (
  key: PrijavaKey,
  documentType: PrijavaDocumentType,
): Promise<PrijavaDocumentDownloadRecord> => {
  const result =
    documentType === "diploma"
      ? await executeSql<DownloadRow>(
          `
            SELECT
              d.document_file_name,
              d.document_mime_type,
              d.document_file_size,
              d.document_file_content
            FROM Diploma d
            WHERE d.broj_prijave = :brojPrijave
              AND d.skolska_godina = :skolskaGodina
          `,
          {
            brojPrijave: key.brojPrijave,
            skolskaGodina: key.skolskaGodina,
          },
          {
            fetchInfo: {
              DOCUMENT_FILE_CONTENT: { type: oracledb.BUFFER },
            },
          },
        )
      : await executeSql<DownloadRow>(
          `
            SELECT
              u.document_file_name,
              u.document_mime_type,
              u.document_file_size,
              u.document_file_content
            FROM UverenjeOPolozenimPredmetima u
            WHERE u.broj_prijave = :brojPrijave
              AND u.skolska_godina = :skolskaGodina
          `,
          {
            brojPrijave: key.brojPrijave,
            skolskaGodina: key.skolskaGodina,
          },
          {
            fetchInfo: {
              DOCUMENT_FILE_CONTENT: { type: oracledb.BUFFER },
            },
          },
        );

  const row = result.rows?.[0];
  if (!row || !row.DOCUMENT_FILE_CONTENT || !row.DOCUMENT_FILE_NAME) {
    throw new ApiError(404, "Dokument nije pronadjen", "Trazeni dokument nije otpremljen.");
  }

  return {
    documentType,
    fileName: row.DOCUMENT_FILE_NAME,
    mimeType: row.DOCUMENT_MIME_TYPE ?? "application/octet-stream",
    fileSize: row.DOCUMENT_FILE_SIZE ?? row.DOCUMENT_FILE_CONTENT.length,
    fileContent: row.DOCUMENT_FILE_CONTENT,
  };
};
