import { useState } from "react";
import { useAuth } from "../lib/auth";
import Logo from "../components/Logo";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError("Sign-in failed. Check your email and password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-sm">
          <div className="text-center mb-8">
          <Logo size={44} className="mx-auto mb-4" />
          <h1 className="text-2xl font-display font-semibold">
            Focus OS
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="block text-xs text-parchment-300 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm focus:border-brass-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-parchment-300 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm focus:border-brass-500 outline-none"
            />
          </div>

          {error && <p className="text-clay-400 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brass-500 hover:bg-brass-400 text-ink-950 font-semibold rounded-lg py-2 text-sm transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-center text-xs text-parchment-300 mt-4">
          Single-user system — account created in Firebase Console.
        </p>
      </div>
    </div>
  );
}
