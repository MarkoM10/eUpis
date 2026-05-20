import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { loginSuccess, logoutSuccess, updateAuthSession } from "./authSlice";
import type { AuthLatestPrijava, UserRole } from "../../types/models/auth";
import type { AuthContextValue } from "../../types/models/authContext";

export const useAuth = (): AuthContextValue => {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const username = useAppSelector((state) => state.auth.username);
  const role = useAppSelector((state) => state.auth.role);
  const hasApplied = useAppSelector((state) => state.auth.hasApplied);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  return useMemo(
    () => ({
      token,
      username,
      role,
      hasApplied,
      isAuthenticated,
      login: (
        nextToken: string,
        nextUsername: string,
        nextRole: UserRole,
        nextHasApplied: boolean,
        _latestPrijava?: AuthLatestPrijava | null,
      ) => {
        dispatch(
          loginSuccess({
            token: nextToken,
            username: nextUsername,
            role: nextRole,
            hasApplied: nextHasApplied,
          }),
        );
      },
      updateSession: (nextUsername: string, nextRole: UserRole, nextHasApplied: boolean) => {
        dispatch(
          updateAuthSession({
            username: nextUsername,
            role: nextRole,
            hasApplied: nextHasApplied,
          }),
        );
      },
      logout: () => {
        dispatch(logoutSuccess());
      },
    }),
    [dispatch, hasApplied, isAuthenticated, role, token, username],
  );
};
