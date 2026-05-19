import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
  type ReactElement,
} from "react";

interface AuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AUTH_TOKEN_KEY = "eupis_auth_token";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren): ReactElement => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem(AUTH_TOKEN_KEY),
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      isAuthenticated: Boolean(token),
      login: (nextToken: string) => {
        localStorage.setItem(AUTH_TOKEN_KEY, nextToken);
        setToken(nextToken);
      },
      logout: () => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        setToken(null);
      },
    }),
    [token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
