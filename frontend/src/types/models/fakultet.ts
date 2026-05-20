export interface FakultetOption {
  idFakulteta: number;
  nazivFakulteta: string;
}

export interface FakultetListResponse {
  rows: FakultetOption[];
}
