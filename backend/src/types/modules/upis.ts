export interface StudyProgramOption {
  idPrograma: number;
  idFakulteta: number | null;
  nazivPrograma: string;
  modul: string;
  brojDostupnihMesta: number | null;
}

export interface EligiblePrijavaRow {
  brojPrijave: number;
  skolskaGodina: string;
  datumPrijave: string | null;
  idKonkursa: number | null;
  idPrograma: number | null;
  nazivPrograma: string | null;
  modul: string | null;
  jmbg: string | null;
  imePrezime: string | null;
  examPoints: number | null;
  rankingStatus: string | null;
  studijskiProgram: string | null;
  statusPrijave?: string | null;
}

export interface SaveExamScoreInput {
  brojPrijave: number;
  skolskaGodina: string;
  brojPoena: number;
}

export interface RankingListSummary {
  idRangListe: number;
  idKonkursa: number | null;
  idPrograma: number | null;
  nazivPrograma: string | null;
  modul: string | null;
  studijskiProgram: string | null;
  skolskaGodina: string | null;
  brojMesta: number | null;
  ukupnoKandidata: number | null;
}

export interface RankingItem {
  idStavke: number;
  idRangListe: number | null;
  brojPrijave: number | null;
  idPrograma: number | null;
  imePrezime: string | null;
  brojPoena: number | null;
  rangMesto: number | null;
  status: string | null;
  studijskiProgram: string | null;
}

export interface GenerateRankingInput {
  idKonkursa?: number;
  idPrograma: number;
  skolskaGodina: string;
  brojMesta: number;
}

export interface RankingListStudyProgramUpdateInput {
  studijskiProgram: string;
}

export interface RankingItemStudyProgramUpdateInput {
  studijskiProgram: string;
}

export interface StudentAdmissionStatus {
  stage:
    | "NemaPrijave"
    | "CekaObraduPrijave"
    | "OdobrenaBezBodova"
    | "CekaKonacnuOdluku"
    | "OdobrenUpis"
    | "UpisZavrsen"
    | "UpisOdbijen";
  prijavaStatus: string | null;
  brojPrijave: number | null;
  skolskaGodina: string | null;
  idPrograma: number | null;
  studijskiProgram: string | null;
  brojPoena: number | null;
  rangMesto: number | null;
  enrollmentStatus: string | null;
  enrollmentFinalizationStatus:
    | "NijePrimenljivo"
    | "UgovorNedostaje"
    | "UgovorOtpremljen"
    | "UpisZavrsen";
  hasSignedContract: boolean;
  signedContractUploadedAt: string | null;
  brojIndeksa: string | null;
  datumUpisa: string | null;
}

export interface EnrollmentFinalizationRecord {
  idUpisa: number;
  brojPrijave: number;
  skolskaGodina: string;
  statusUpisa: "UgovorOtpremljen" | "UpisZavrsen";
  hasSignedContract: boolean;
  signedContractUploadedAt: string | null;
  brojIndeksa: string | null;
  datumUpisa: string | null;
}

export interface EnrollmentContractDownloadRecord {
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileContent: Buffer;
}

export interface PendingEnrollmentFinalizationRow {
  idUpisa: number;
  brojPrijave: number;
  skolskaGodina: string;
  idKonkursa: number | null;
  imePrezime: string | null;
  studijskiProgram: string | null;
  brojPoena: number | null;
  rangMesto: number | null;
  statusUpisa: "UgovorOtpremljen" | "UpisZavrsen";
  signedContractUploadedAt: string | null;
}

export interface EnrollmentFinalizationSummaryRecord {
  ukupnoFinalizovanihUpisa: number;
}
