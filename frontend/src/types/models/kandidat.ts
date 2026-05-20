export interface Kandidat {
  jmbg: string;
  imePrezime: string;
  tipKandidata: string;
  serijskiBroj: number;
  emailVrednost: string;
  adresaUlica: string;
  adresaBroj: number;
  adresaGrad: string;
}

export interface KandidatPayload {
  jmbg: string;
  imePrezime: string;
  tipKandidata: string;
  serijskiBroj: number;
  emailVrednost: string;
  adresaUlica: string;
  adresaBroj: number;
  adresaGrad: string;
}

export interface KandidatListResponse {
  rows: Kandidat[];
  page: number;
  pageSize: number;
}
