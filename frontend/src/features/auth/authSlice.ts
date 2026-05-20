import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthSession, UserRole } from "../../types/models/auth";

const AUTH_TOKEN_KEY = "eupis_auth_token";
const AUTH_USERNAME_KEY = "eupis_auth_username";
const AUTH_ROLE_KEY = "eupis_auth_role";
const AUTH_HAS_APPLIED_KEY = "eupis_auth_has_applied";

interface AuthState extends AuthSession {
  isAuthenticated: boolean;
}

const getInitialState = (): AuthState => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const username = localStorage.getItem(AUTH_USERNAME_KEY);
  const role = (localStorage.getItem(AUTH_ROLE_KEY) as UserRole | null) ?? null;
  const hasApplied = localStorage.getItem(AUTH_HAS_APPLIED_KEY) === "true";

  return {
    token,
    username,
    role,
    hasApplied,
    isAuthenticated: Boolean(token),
  };
};

const authSlice = createSlice({
  name: "auth",
  initialState: getInitialState(),
  reducers: {
    loginSuccess: (
      state,
      action: PayloadAction<{
        token: string;
        username: string;
        role: UserRole;
        hasApplied: boolean;
      }>,
    ) => {
      state.token = action.payload.token;
      state.username = action.payload.username;
      state.role = action.payload.role;
      state.hasApplied = action.payload.hasApplied;
      state.isAuthenticated = true;

      localStorage.setItem(AUTH_TOKEN_KEY, action.payload.token);
      localStorage.setItem(AUTH_USERNAME_KEY, action.payload.username);
      localStorage.setItem(AUTH_ROLE_KEY, action.payload.role);
      localStorage.setItem(AUTH_HAS_APPLIED_KEY, String(action.payload.hasApplied));
    },
    updateAuthSession: (
      state,
      action: PayloadAction<{ username: string; role: UserRole; hasApplied: boolean }>,
    ) => {
      state.username = action.payload.username;
      state.role = action.payload.role;
      state.hasApplied = action.payload.hasApplied;

      localStorage.setItem(AUTH_USERNAME_KEY, action.payload.username);
      localStorage.setItem(AUTH_ROLE_KEY, action.payload.role);
      localStorage.setItem(AUTH_HAS_APPLIED_KEY, String(action.payload.hasApplied));
    },
    logoutSuccess: (state) => {
      state.token = null;
      state.username = null;
      state.role = null;
      state.hasApplied = false;
      state.isAuthenticated = false;

      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USERNAME_KEY);
      localStorage.removeItem(AUTH_ROLE_KEY);
      localStorage.removeItem(AUTH_HAS_APPLIED_KEY);
    },
  },
});

export const { loginSuccess, updateAuthSession, logoutSuccess } = authSlice.actions;
export default authSlice.reducer;
