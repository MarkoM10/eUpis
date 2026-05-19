import { httpClient, type ApiSuccess } from "./httpClient";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export const loginRequest = async (
  payload: LoginRequest,
): Promise<ApiSuccess<LoginResponse>> => {
  const response = await httpClient.post<ApiSuccess<LoginResponse>>(
    "/auth/login",
    payload,
  );

  return response.data;
};
