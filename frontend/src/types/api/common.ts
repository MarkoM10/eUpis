export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorPayload {
  success: false;
  title: string;
  message: string;
  oracleDetails?: string;
}
