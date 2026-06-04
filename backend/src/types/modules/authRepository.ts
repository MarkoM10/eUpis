export type KorisnikRow = {
  ID_KORISNIKA: number;
  KORISNICKO_IME: string;
  LOZINKA: string;
  EMAIL: string | null;
  ULOGA: string | null;
};

export type AuthPrijavaRow = {
  BROJ_PRIJAVE: number;
  DATUM_PRIJAVE: Date | null;
  SKOLSKA_GODINA: string;
  STATUS_PRIJAVE: string | null;
  KONKURSNI_ROK: string | null;
  JMBG: string | null;
  IME_PREZIME: string | null;
  SISTEMSKI_UPDATE: string | null;
};
