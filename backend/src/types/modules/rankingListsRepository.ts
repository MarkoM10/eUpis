export type RankingListRow = {
  ID_RANG_LISTE: number;
  ID_KONKURSA: number | null;
  NAZIV_KONKURSA: string | null;
  ID_PROGRAMA: number | null;
  NAZIV_PROGRAMA: string | null;
  MODUL: string | null;
  STUDIJSKI_PROGRAM: string | null;
  SKOLSKA_GODINA: string | null;
  BROJ_MESTA: number | null;
  UKUPNO_KANDIDATA: number | null;
  NAZIV_FAKULTETA: string | null;
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
