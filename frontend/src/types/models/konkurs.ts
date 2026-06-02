export type KonkursStatus = "Nacrt" | "Aktivan" | "Zatvoren" | "Arhiviran";

export interface KonkursStavka {
  idStavkeKonkursa: number;
  idKonkursa: number;
  idPrograma: number;
  nazivPrograma: string | null;
  modul: string | null;
  brojDostupnihMesta: number;
}

export interface Konkurs {
  idKonkursa: number;
  idFakulteta: number | null;
  nazivFakulteta: string | null;
  godinaKonkursa: number;
  konkursniRok: string;
  datumOd: string;
  datumDo: string;
  status: KonkursStatus;
  stavke: KonkursStavka[];
}

export interface ActiveKonkursOption {
  idKonkursa: number;
  idFakulteta: number | null;
  nazivFakulteta: string | null;
  godinaKonkursa: number;
  konkursniRok: string;
  datumOd: string;
  datumDo: string;
  stavke: Array<{
    idStavkeKonkursa: number;
    idPrograma: number;
    nazivPrograma: string | null;
    modul: string | null;
    brojDostupnihMesta: number;
  }>;
}
