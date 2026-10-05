import { useState } from "react";
import { useAuth } from "../lib/auth";
import Logo from "../components/Logo";

const AUTH_ERRORS = {
  "auth/email-already-in-use": "An account already exists with this email. Sign in instead.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/weak-password": "Use a stronger password with at least 6 characters.",
  "auth/invalid-credential": "Email or password is incorrect.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
};

export default function Login() {
  const { login, createAccount } = useAuth();
  const [mode, setMode] = useState("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isCreate = mode === "create";

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isCreate) {
        await createAccount(email.trim(), password, remember);
      } else {
        await login(email.trim(), password, remember);
      }
    } catch (e) {
      setError(AUTH_ERRORS[e?.code] || (isCreate
        ? "Account creation failed. Please try again."
        : "Sign-in failed. Check your email and password."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-950 px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Logo size={44} className="mx-auto mb-4" />
          <h1 className="text-2xl font-display font-semibold">FocusOS</h1>
          <p className="text-sm text-parchment-300/60 mt-2">
            {isCreate ? "Create your personal system." : "Welcome back."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs text-parchment-300 mb-1">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm focus:border-brass-500 outline-none"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-xs text-parchment-300 mb-1">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              required
              minLength={6}
              autoComplete={isCreate ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm focus:border-brass-500 outline-none"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-parchment-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Save login information
          </label>

          {error && <p role="alert" className="text-clay-400 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brass-500 hover:bg-brass-400 text-ink-950 font-semibold rounded-lg py-2 text-sm transition-colors disabled:opacity-50"
          >
            {loading ? (isCreate ? "Creating account…" : "Signing in…") : (isCreate ? "Create account" : "Sign in")}
          </button>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => switchMode(isCreate ? "signIn" : "create")}
              className="text-xs text-brass-400 hover:text-brass-300"
            >
              {isCreate ? "Already have an account? Sign in" : "Create account"}
            </button>
          </div>
        </form>

        <p className="text-center text-[11px] text-parchment-300/45 mt-4">
          Your account and FocusOS data are protected by your Firebase user account.
        </p>
      </div>
    </div>
  );
}
