import axios from "axios";
import type { ApiSuccess } from "../types/api/common";
import type {
  AuthSessionResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
} from "../types/models/auth";
import { buildApiUrl } from "./api";

export const loginRequest = async (payload: LoginRequest): Promise<ApiSuccess<LoginResponse>> => {
  const response = await axios.post<ApiSuccess<LoginResponse>>(
    buildApiUrl("/auth/login"),
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return response.data;
};

export const registerRequest = async (
  payload: RegisterRequest,
): Promise<ApiSuccess<LoginResponse>> => {
  const response = await axios.post<ApiSuccess<LoginResponse>>(
    buildApiUrl("/auth/register"),
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return response.data;
};

export const sessionRequest = async (token: string): Promise<ApiSuccess<AuthSessionResponse>> => {
  const response = await axios.get<ApiSuccess<AuthSessionResponse>>(buildApiUrl("/auth/me"), {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return response.data;
};
