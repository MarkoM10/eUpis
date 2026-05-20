export interface Prijava {
  brojPrijave: number;
  datumPrijave: string | null;
  skolskaGodina: string;
  statusPrijave: string | null;
  konkursniRok: string | null;
  jmbg: string | null;
  imePrezime: string | null;
  sistemskiUpdate: string | null;
}

export interface PrijavaPayload {
  brojPrijave?: number | null;
  datumPrijave: string | null;
  skolskaGodina: string;
  statusPrijave: string | null;
  konkursniRok: string | null;
  jmbg: string | null;
  imePrezime: string | null;
  sistemskiUpdate?: string | null;
  kandidat?: {
    emailVrednost: string | null;
    adresaUlica: string | null;
    adresaBroj: number | null;
    adresaGrad: string | null;
  } | null;
}

export interface PrijavaListResponse {
  rows: Prijava[];
  page: number;
  pageSize: number;
}
