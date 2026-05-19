import { useState, type FormEvent, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { loginRequest } from "../../services/authService";
import { ApiClientError, toApiClientError } from "../../services/httpClient";
import { useAuth } from "./authStore";

export default function LoginPage(): ReactElement {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await loginRequest({
        username,
        password,
      });
      login(response.data.token);
      navigate("/dashboard");
    } catch (error) {
      const parsedError =
        error instanceof ApiClientError ? error : toApiClientError(error);
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
            <span className="rounded-full bg-teal-200 px-3 py-1 text-xs font-bold uppercase tracking-wide text-teal-900">
                MVP administratorski portal
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight">eUpis Master studije</h1>
            <p className="mt-3 text-teal-100">
                Upravljanje konkursom, prijavama, rangiranjem i upisom kandidata.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
                <li className="rounded-lg bg-white/90 p-2 text-slate-900">1. Konkurs i stavke konkursa</li>
                <li className="rounded-lg bg-white/90 p-2 text-slate-900">2. Kandidati i prijave</li>
                <li className="rounded-lg bg-white/90 p-2 text-slate-900">3. Konacna rang lista</li>
                <li className="rounded-lg bg-white/90 p-2 text-slate-900">4. Potvrda upisa i student</li>
            </ul>
            </section>

            <section className="p-10">
            <h2 className="text-2xl font-bold">Prijava administratora</h2>
            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                <label className="block text-sm font-medium">
                Korisnicko ime
                <input
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                />
                </label>

                <label className="block text-sm font-medium">
                Lozinka
                <input
                    type="password"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                />
                </label>

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
                {isSubmitting ? "Prijavljivanje..." : "Prijavi se"}
                </button>
            </form>
            </section>
        </div>
        </div>
    </main>
  );
}
