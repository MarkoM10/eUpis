export interface KandidatRecord {
  jmbg: string;
  imePrezime: string;
  tipKandidata: string;
  serijskiBroj: number;
  emailVrednost: string;
  adresaUlica: string;
  adresaBroj: number;
  adresaGrad: string;
}

export interface KandidatMutationInput {
  jmbg: string;
  imePrezime: string;
  tipKandidata: string;
  serijskiBroj: number;
  emailVrednost: string;
  adresaUlica: string;
  adresaBroj: number;
  adresaGrad: string;
}
