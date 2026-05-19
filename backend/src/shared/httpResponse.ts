export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  title: string;
  message: string;
  oracleDetails?: string;
}

export const ok = <T>(message: string, data: T): ApiSuccess<T> => ({
  success: true,
  message,
  data,
});

export const fail = (
  title: string,
  message: string,
  oracleDetails?: string,
): ApiError => ({
  success: false,
  title,
  message,
  oracleDetails,
});
