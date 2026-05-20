export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ListPayload<T> {
  rows: T[];
  page: number;
  pageSize: number;
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

export const okList = <T>(
  message: string,
  rows: T[],
  page: number,
  pageSize: number,
): ApiSuccess<ListPayload<T>> => ({
  success: true,
  message,
  data: {
    rows,
    page,
    pageSize,
  },
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
