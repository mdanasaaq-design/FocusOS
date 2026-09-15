import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { subscribeProfile, setProfile } from "../lib/data";

export default function Settings() {
  const { user } = useAuth();
  const [, setProfileState] = useState(null);
  const [name, setName] = useState("");
  const [adjustment, setAdjustment] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    return subscribeProfile(user.uid, (p) => {
      setProfileState(p);
      if (p) {
        setName(p.name || "");
        setAdjustment(p.hijriAdjustmentDays || 0);
      }
    });
  }, [user]);

  async function handleSave(e) {
    e.preventDefault();
    await setProfile(user.uid, {
      name: name.trim(),
      hijriAdjustmentDays: Number(adjustment),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-8 space-y-6 max-w-lg">
      <header>
        <h2 className="text-2xl font-display font-semibold">Settings</h2>
      </header>

      <form onSubmit={handleSave} className="card p-6 space-y-5">
        <div>
          <label className="block text-xs text-parchment-300 mb-1">
            Display name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500"
          />
        </div>

        <div>
          <label className="block text-xs text-parchment-300 mb-1">
            Hijri date adjustment (days)
          </label>
          <p className="text-[11px] text-parchment-300/70 mb-2">
            The Hijri date shown is calculated arithmetically and can be ±1
            day off from your local moon-sighting announcement. Adjust here
            if needed.
          </p>
          <select
            value={adjustment}
            onChange={(e) => setAdjustment(e.target.value)}
            className="bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none"
          >
            <option value={-2}>-2 days</option>
            <option value={-1}>-1 day</option>
            <option value={0}>No adjustment</option>
            <option value={1}>+1 day</option>
            <option value={2}>+2 days</option>
          </select>
        </div>

        <button
          type="submit"
          className="bg-brass-500 hover:bg-brass-400 text-ink-950 font-semibold rounded-lg px-4 py-2 text-sm"
        >
          {saved ? "Saved ✓" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
