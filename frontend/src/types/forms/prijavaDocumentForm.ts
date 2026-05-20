export interface DiplomaDocumentFormState {
  datumIzdavanja: string;
  brojEspb: string;
  stecenoZvanje: string;
  datumDiplomiranja: string;
  godinaUpisa: string;
  prosecnaOcena: string;
  idFakulteta: string;
  file: File | null;
}

export interface UverenjeDocumentFormState {
  datumIzdavanja: string;
  idFakulteta: string;
  ukupnoEspb: string;
  prosecnaOcena: string;
  file: File | null;
}
