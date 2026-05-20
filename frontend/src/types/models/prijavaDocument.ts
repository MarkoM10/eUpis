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

export interface DownloadedPrijavaDocument {
  blob: Blob;
  fileName: string;
  mimeType: string;
}
