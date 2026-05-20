export type PrijavaDocumentType = "diploma" | "uverenje";

export interface PrijavaDocumentsRecord {
  diploma: PrijavaDocumentSummary;
  uverenje: PrijavaDocumentSummary;
}

export interface PrijavaDocumentSummary {
  documentType: PrijavaDocumentType;
  exists: boolean;
  serialNumber: number | null;
  datumIzdavanja: string | null;
  idFakulteta: number | null;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  uploadedAt: string | null;
  hasFile: boolean;
  brojEspb?: number | null;
  stecenoZvanje?: string | null;
  datumDiplomiranja?: string | null;
  godinaUpisa?: number | null;
  prosecnaOcena?: number | null;
  rektorId?: number | null;
  ukupnoEspb?: number | null;
}

export interface DiplomaDocumentInput {
  datumIzdavanja: string | null;
  brojEspb: number | null;
  stecenoZvanje: string | null;
  datumDiplomiranja: string | null;
  godinaUpisa: number | null;
  prosecnaOcena: number | null;
  idFakulteta: number | null;
  rektorId: number | null;
}

export interface UverenjeDocumentInput {
  datumIzdavanja: string | null;
  idFakulteta: number | null;
  ukupnoEspb: number | null;
  prosecnaOcena: number | null;
}

export interface PrijavaDocumentUploadInput {
  type: PrijavaDocumentType;
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileContent: Buffer;
  diploma?: DiplomaDocumentInput;
  uverenje?: UverenjeDocumentInput;
}

export interface PrijavaDocumentDownloadRecord {
  documentType: PrijavaDocumentType;
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileContent: Buffer;
}
