import { useState } from "react";
import { useAuth } from "../lib/auth";
import { setProfile } from "../lib/data";
import Logo from "../components/Logo";

export default function ProfileSetup({ onComplete }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await setProfile(user.uid, {
      name: name.trim(),
      hijriAdjustmentDays: 0,
      createdAt: new Date().toISOString(),
    });
    setSaving(false);
    onComplete?.();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-sm text-center">
        <Logo size={44} className="mx-auto mb-4" />
        <p className="text-xs tracking-[0.2em] text-brass-500 uppercase mb-2">
          Welcome to
        </p>
        <h1 className="text-2xl font-display font-semibold mb-8">
          Focus OS
        </h1>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4 text-left">
          <div>
            <label className="block text-xs text-parchment-300 mb-1">
              What should we call you?
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500"
            />
          </div>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="w-full bg-brass-500 hover:bg-brass-400 text-ink-950 font-semibold rounded-lg py-2 text-sm transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Continue"}
          </button>
        </form>

        <p className="text-xs text-parchment-300 mt-4">
          You can change this later from Settings.
        </p>
      </div>
    </div>
  );
}
