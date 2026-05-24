import { useState, type FormEvent, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../redux/hooks";
import { loginSuccess } from "../../redux/slices/authSlice";
import { loginRequest, registerRequest } from "../../services/authService";
import { ApiClientError, toApiClientError } from "../../services/api";

export default function LoginPage(): ReactElement {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("marko");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("marko123");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (mode === "register" && password !== confirmPassword) {
        setErrorMessage("Validacija: Lozinke se ne poklapaju.");
        return;
      }

      const response =
        mode === "login"
          ? await loginRequest({ username, password })
          : await registerRequest({ username, password, email });

      dispatch(
        loginSuccess({
          token: response.data.token,
          username: response.data.username,
          role: response.data.role,
          hasApplied: response.data.hasApplied,
        }),
      );
      navigate(response.data.role === "admin" ? "/dashboard" : "/prijave");
    } catch (error) {
      const parsedError = error instanceof ApiClientError ? error : toApiClientError(error);
      setErrorMessage(`${parsedError.title}: ${parsedError.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900 flex items-center">
      <div className="mx-auto flex max-w-5xl items-center gap-6">
        <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-xl lg:grid-cols-[1.2fr_1fr]">
          <section className="bg-teal-800 p-10 text-white">
            <span className="rounded-full bg-teal-200 px-3 py-1 text-xs font-bold tracking-wide text-teal-900">
              eUPIS portal
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight">eUpis Master studije</h1>
            <p className="mt-3 text-teal-100">
              Sistem za upravljanje procesom upisa na master studije.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              <li className="rounded-lg bg-white/90 p-2 text-slate-900">
                1. Napravi nalog i prijavi se na sistem
              </li>
              <li className="rounded-lg bg-white/90 p-2 text-slate-900">
                2. Odaberi studijski program i kreiraj prijavu
              </li>
              <li className="rounded-lg bg-white/90 p-2 text-slate-900">
                3. Prati status svoje prijave i sačekaj rezultate konkursa
              </li>
              <li className="rounded-lg bg-white/90 p-2 text-slate-900">
                4. Shodno rezultatima rangiraj se na konacnoj rang listi
              </li>
            </ul>
          </section>

          <section className="p-10">
            <h2 className="text-2xl font-bold">
              {mode === "login" ? "Prijava korisnika" : "Registracija studenta"}
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                className={`rounded-md px-3 py-2 text-sm font-semibold ${
                  mode === "login" ? "bg-white shadow" : "text-slate-600"
                }`}
                onClick={() => {
                  setMode("login");
                  setErrorMessage(null);
                }}
              >
                Prijava
              </button>
              <button
                type="button"
                className={`rounded-md px-3 py-2 text-sm font-semibold ${
                  mode === "register" ? "bg-white shadow" : "text-slate-600"
                }`}
                onClick={() => {
                  setMode("register");
                  setErrorMessage(null);
                }}
              >
                Registracija
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              <label className="block text-sm font-medium">
                Korisnicko ime
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </label>

              {mode === "register" ? (
                <label className="block text-sm font-medium">
                  Email
                  <input
                    type="email"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </label>
              ) : null}

              <label className="block text-sm font-medium">
                Lozinka
                <input
                  type="password"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>

              {mode === "register" ? (
                <label className="block text-sm font-medium">
                  Potvrdite lozinku
                  <input
                    type="password"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </label>
              ) : null}

              {errorMessage ? (
                <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {errorMessage}
                </p>
              ) : null}

              <button
                type="submit"
                className="w-full rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? mode === "login"
                    ? "Prijavljivanje..."
                    : "Registracija..."
                  : mode === "login"
                    ? "Prijavi se"
                    : "Registruj nalog"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
