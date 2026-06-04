export type KonkursRow = {
  ID_KONKURSA: number;
  ID_FAKULTETA: number | null;
  NAZIV_FAKULTETA: string | null;
  GODINA_KONKURSA: number;
  KONKURSNI_ROK: string;
  DATUM_OD: Date;
  DATUM_DO: Date;
  STATUS_KONKURSA: string | null;
};

export type KonkursWithStavkaRow = {
  ID_KONKURSA: number;
  ID_FAKULTETA: number | null;
  NAZIV_FAKULTETA: string | null;
  GODINA_KONKURSA: number;
  KONKURSNI_ROK: string;
  DATUM_OD: Date;
  DATUM_DO: Date;
  STATUS_KONKURSA: string | null;
  ID_STAVKE_KONKURSA: number | null;
  ID_PROGRAMA: number | null;
  NAZIV_PROGRAMA: string | null;
  MODUL: string | null;
  BROJ_DOSTUPNIH_MESTA: number | null;
};

export type NextIdRow = {
  NEXT_ID: number;
};

export type ExistsRow = {
  CNT: number;
};
