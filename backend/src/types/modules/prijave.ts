export interface PrijavaRecord {
  brojPrijave: number;
  datumPrijave: string | null;
  skolskaGodina: string;
  idKonkursa: number | null;
  idKorisnika: number | null;
  idPrograma: number | null;
  statusPrijave: string | null;
  konkursniRok: string | null;
  jmbg: string | null;
  imePrezime: string | null;
  sistemskiUpdate: string | null;
}

export interface KandidatFromPrijavaInput {
  emailVrednost: string | null;
  adresaUlica: string | null;
  adresaBroj: number | null;
  adresaGrad: string | null;
}

export interface PrijavaMutationInput {
  brojPrijave?: number | null;
  datumPrijave: string | null;
  skolskaGodina: string;
  idKonkursa: number | null;
  idKorisnika?: number | null;
  idPrograma: number | null;
  statusPrijave: string | null;
  konkursniRok: string | null;
  jmbg: string | null;
  imePrezime: string | null;
  sistemskiUpdate?: string | null;
  kandidat?: KandidatFromPrijavaInput | null;
}

export interface StudentKandidatSetupInput {
  jmbg: string | null;
  imePrezime: string | null;
  kandidat: KandidatFromPrijavaInput | null;
}

export interface PrijavaStatusUpdateInput {
  statusPrijave: string | null;
  sistemskiUpdate?: string | null;
}

export interface PrijavaKey {
  brojPrijave: number;
  skolskaGodina: string;
}
