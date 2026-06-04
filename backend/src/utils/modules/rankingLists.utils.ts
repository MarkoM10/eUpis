import type { RankingItem, RankingListSummary } from "../../types/modules/upis";
import type { RankingItemRow, RankingListRow } from "../../types/modules/rankingListsRepository";

export const mapRankingListRow = (row: RankingListRow): RankingListSummary => ({
  idRangListe: row.ID_RANG_LISTE,
  idKonkursa: row.ID_KONKURSA,
  nazivKonkursa: row.NAZIV_KONKURSA,
  idPrograma: row.ID_PROGRAMA,
  nazivPrograma: row.NAZIV_PROGRAMA,
  modul: row.MODUL,
  studijskiProgram: row.STUDIJSKI_PROGRAM,
  skolskaGodina: row.SKOLSKA_GODINA,
  brojMesta: row.BROJ_MESTA,
  ukupnoKandidata: row.UKUPNO_KANDIDATA,
  nazivFakulteta: row.NAZIV_FAKULTETA,
});

export const mapRankingItemRow = (row: RankingItemRow): RankingItem => ({
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
