import type {
  EnrollmentFinalizationRecord,
  EligiblePrijavaRow,
  PendingEnrollmentFinalizationRow,
  RankingItem,
  RankingListSummary,
  StudyProgramOption,
} from "../../types/modules/upis";
import type {
  EligiblePrijavaDbRow,
  EnrollmentFinalizationRow,
  PendingEnrollmentFinalizationDbRow,
  ProgramRow,
  RankingItemRow,
  RankingListRow,
} from "../../types/modules/upisRepository";

export const mapProgramRow = (row: ProgramRow): StudyProgramOption => ({
  idPrograma: row.ID_PROGRAMA,
  idFakulteta: row.ID_FAKULTETA,
  nazivPrograma: row.NAZIV_PROGRAMA,
  modul: row.MODUL,
  brojDostupnihMesta: row.BROJ_DOSTUPNIH_MESTA,
});

export const mapEligiblePrijavaRow = (row: EligiblePrijavaDbRow): EligiblePrijavaRow => ({
  brojPrijave: row.BROJ_PRIJAVE,
  skolskaGodina: row.SKOLSKA_GODINA,
  datumPrijave: row.DATUM_PRIJAVE ? row.DATUM_PRIJAVE.toISOString() : null,
  idKonkursa: row.ID_KONKURSA,
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

export const mapUpisRankingListRow = (row: RankingListRow): RankingListSummary => ({
  idRangListe: row.ID_RANG_LISTE,
  idKonkursa: row.ID_KONKURSA,
  nazivKonkursa: null,
  idPrograma: row.ID_PROGRAMA,
  nazivPrograma: row.NAZIV_PROGRAMA,
  modul: row.MODUL,
  studijskiProgram: row.STUDIJSKI_PROGRAM,
  skolskaGodina: row.SKOLSKA_GODINA,
  brojMesta: row.BROJ_MESTA,
  ukupnoKandidata: row.UKUPNO_KANDIDATA,
  nazivFakulteta: null,
});

export const mapUpisRankingItemRow = (row: RankingItemRow): RankingItem => ({
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

export const mapEnrollmentFinalizationRow = (
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

export const mapPendingEnrollmentFinalizationRow = (
  row: PendingEnrollmentFinalizationDbRow,
): PendingEnrollmentFinalizationRow => ({
  idUpisa: row.ID_UPISA,
  brojPrijave: row.BROJ_PRIJAVE,
  skolskaGodina: row.SKOLSKA_GODINA,
  idKonkursa: row.ID_KONKURSA,
  imePrezime: row.IME_PREZIME,
  studijskiProgram: row.STUDIJSKI_PROGRAM,
  brojPoena: row.BROJ_POENA,
  rangMesto: row.RANG_MESTO,
  statusUpisa: row.STATUS_UPISA,
  signedContractUploadedAt: row.UGOVOR_UPLOADED_AT ? row.UGOVOR_UPLOADED_AT.toISOString() : null,
});
