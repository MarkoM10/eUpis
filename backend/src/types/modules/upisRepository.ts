export type ProgramRow = {
  ID_PROGRAMA: number;
  ID_FAKULTETA: number | null;
  NAZIV_PROGRAMA: string;
  MODUL: string;
  BROJ_DOSTUPNIH_MESTA: number | null;
};

export type EligiblePrijavaDbRow = {
  BROJ_PRIJAVE: number;
  SKOLSKA_GODINA: string;
  DATUM_PRIJAVE: Date | null;
  ID_KONKURSA: number | null;
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

export type RankingListRow = {
  ID_RANG_LISTE: number;
  ID_KONKURSA: number | null;
  ID_PROGRAMA: number | null;
  NAZIV_PROGRAMA: string | null;
  MODUL: string | null;
  STUDIJSKI_PROGRAM: string | null;
  SKOLSKA_GODINA: string | null;
  BROJ_MESTA: number | null;
  UKUPNO_KANDIDATA: number | null;
};

export type RankingItemRow = {
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

export type EnrollmentFinalizationRow = {
  ID_UPISA: number;
  BROJ_PRIJAVE: number;
  SKOLSKA_GODINA: string;
  STATUS_UPISA: "UgovorOtpremljen" | "UpisZavrsen";
  UGOVOR_UPLOADED_AT: Date | null;
  BROJ_INDEKSA: string | null;
  DATUM_UPISA: Date | null;
  HAS_SIGNED_CONTRACT: number;
};

export type EnrollmentContractDownloadRow = {
  UGOVOR_FILE_NAME: string | null;
  UGOVOR_MIME_TYPE: string | null;
  UGOVOR_FILE_SIZE: number | null;
  UGOVOR_FILE_CONTENT: Buffer | null;
};

export type PendingEnrollmentFinalizationDbRow = {
  ID_UPISA: number;
  BROJ_PRIJAVE: number;
  SKOLSKA_GODINA: string;
  ID_KONKURSA: number | null;
  IME_PREZIME: string | null;
  STUDIJSKI_PROGRAM: string | null;
  BROJ_POENA: number | null;
  RANG_MESTO: number | null;
  STATUS_UPISA: "UgovorOtpremljen" | "UpisZavrsen";
  UGOVOR_UPLOADED_AT: Date | null;
};

export type EnrollmentFinalizationSummaryRow = {
  UKUPNO_FINALIZOVANIH_UPISA: number;
};
