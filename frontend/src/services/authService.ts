import type { ApiSuccess } from "../types/api/common";
import type {
  AuthSessionResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
} from "../types/models/auth";
import { httpClient } from "./httpClient";

export const loginRequest = async (payload: LoginRequest): Promise<ApiSuccess<LoginResponse>> => {
  const response = await httpClient.post<ApiSuccess<LoginResponse>>("/auth/login", payload);

  return response.data;
};

export const registerRequest = async (
  payload: RegisterRequest,
): Promise<ApiSuccess<LoginResponse>> => {
  const response = await httpClient.post<ApiSuccess<LoginResponse>>("/auth/register", payload);

  return response.data;
};

export const sessionRequest = async (token: string): Promise<ApiSuccess<AuthSessionResponse>> => {
  const response = await httpClient.get<ApiSuccess<AuthSessionResponse>>("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};
