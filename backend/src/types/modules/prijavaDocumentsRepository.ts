export type DiplomaRow = {
  SERIJSKI_BROJ: number;
  DATUM_IZDAVANJA: Date | null;
  BROJ_ESPB: number | null;
  STECENO_ZVANJE: string | null;
  DATUM_DIPLOMIRANJA: Date | null;
  GODINA_UPISA: number | null;
  PROSECNA_OCENA: number | null;
  ID_FAKULTETA: number | null;
  REKTOR_ID: number | null;
  DOCUMENT_FILE_NAME: string | null;
  DOCUMENT_MIME_TYPE: string | null;
  DOCUMENT_FILE_SIZE: number | null;
  DOCUMENT_UPLOADED_AT: Date | null;
  HAS_FILE: number;
};

export type UverenjeRow = {
  SERIJSKI_BROJ: number;
  DATUM_IZDAVANJA: Date | null;
  ID_FAKULTETA: number | null;
  UKUPNO_ESPB: number | null;
  PROSECNA_OCENA: number | null;
  DOCUMENT_FILE_NAME: string | null;
  DOCUMENT_MIME_TYPE: string | null;
  DOCUMENT_FILE_SIZE: number | null;
  DOCUMENT_UPLOADED_AT: Date | null;
  HAS_FILE: number;
};

export type DownloadRow = {
  DOCUMENT_FILE_NAME: string | null;
  DOCUMENT_MIME_TYPE: string | null;
  DOCUMENT_FILE_SIZE: number | null;
  DOCUMENT_FILE_CONTENT: Buffer | null;
};
