export type KonkursStatus = "Nacrt" | "Aktivan" | "Zatvoren" | "Arhiviran";

export interface KonkursStavkaRecord {
  idStavkeKonkursa: number;
  idKonkursa: number;
  idPrograma: number;
  nazivPrograma: string | null;
  modul: string | null;
  brojDostupnihMesta: number;
}

export interface KonkursRecord {
  idKonkursa: number;
  idFakulteta: number | null;
  nazivFakulteta: string | null;
  skolskaGodina: string;
  konkursniRok: string;
  datumOd: string;
  datumDo: string;
  status: KonkursStatus;
  stavke: KonkursStavkaRecord[];
}

export interface CreateKonkursStavkaInput {
  idPrograma: number;
  brojDostupnihMesta: number;
}

export interface CreateKonkursInput {
  idFakulteta: number;
  skolskaGodina: string;
  konkursniRok: string;
  datumOd: string;
  datumDo: string;
  status?: KonkursStatus;
  stavke: CreateKonkursStavkaInput[];
}

export interface KonkursStatusUpdateInput {
  status: KonkursStatus;
}

export interface ActiveKonkursOption {
  idKonkursa: number;
  idFakulteta: number | null;
  nazivFakulteta: string | null;
  skolskaGodina: string;
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
