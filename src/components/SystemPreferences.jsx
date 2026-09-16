import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { subscribeConfig, setConfig } from "../lib/data";
import { DEFAULT_PREFERENCES, normalizePreferences } from "../lib/preferences";

const inputClass = "w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500";

export default function SystemPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    return subscribeConfig(user.uid, (config) => setPreferences(normalizePreferences(config?.preferences)));
  }, [user]);

  const update = (patch) => setPreferences((current) => normalizePreferences({ ...current, ...patch }));
  const updateNested = (key, patch) => setPreferences((current) => normalizePreferences({ ...current, [key]: { ...current[key], ...patch } }));

  async function save() {
    setError("");
    try {
      await setConfig(user.uid, { preferences: normalizePreferences(preferences) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { setError(e.message || "Unable to save preferences."); }
  }

  return <section className="card p-6 space-y-6">
    <div><h3 className="font-semibold text-lg">Language & Region</h3><p className="text-xs text-parchment-300/70 mt-1">These settings control how FocusOS presents dates, times, language direction, greetings and accessibility.</p></div>
    <div className="grid md:grid-cols-2 gap-4">
      <label className="text-xs text-parchment-300">Application language<input value={preferences.language} onChange={(e) => update({ language: e.target.value })} className={`${inputClass} mt-1`} placeholder="en" /></label>
      <label className="text-xs text-parchment-300">Locale<input value={preferences.locale} onChange={(e) => update({ locale: e.target.value })} className={`${inputClass} mt-1`} placeholder="en-IN" /></label>
      <label className="text-xs text-parchment-300">Time zone<input value={preferences.timeZone} onChange={(e) => update({ timeZone: e.target.value })} className={`${inputClass} mt-1`} placeholder="Asia/Kolkata" /></label>
      <label className="text-xs text-parchment-300">Time format<select value={preferences.timeFormat} onChange={(e) => update({ timeFormat: e.target.value })} className={`${inputClass} mt-1`}><option value="12h">12-hour</option><option value="24h">24-hour</option></select></label>
      <label className="text-xs text-parchment-300">Primary calendar<select value={preferences.calendar.primary} onChange={(e) => updateNested("calendar", { primary: e.target.value })} className={`${inputClass} mt-1`}><option value="gregorian">Gregorian</option><option value="hijri">Hijri</option></select></label>
      <label className="text-xs text-parchment-300">Secondary calendar<select value={preferences.calendar.secondary} onChange={(e) => updateNested("calendar", { secondary: e.target.value, showSecondary: e.target.value !== "none" })} className={`${inputClass} mt-1`}><option value="hijri">Hijri</option><option value="gregorian">Gregorian</option><option value="none">None</option></select></label>
      <label className="text-xs text-parchment-300">Date format<select value={preferences.dateFormat} onChange={(e) => update({ dateFormat: e.target.value })} className={`${inputClass} mt-1`}><option value="short">Short</option><option value="medium">Medium</option><option value="long">Long</option><option value="full">Full</option></select></label>
      <label className="text-xs text-parchment-300">Week starts on<select value={preferences.weekStartsOn} onChange={(e) => update({ weekStartsOn: Number(e.target.value) })} className={`${inputClass} mt-1`}><option value={0}>Sunday</option><option value={1}>Monday</option></select></label>
    </div>

    <div className="border-t border-ink-600 pt-5 space-y-4">
      <div><h4 className="font-medium">Greeting</h4><p className="text-xs text-parchment-300/60 mt-1">Choose a fixed greeting or let FocusOS adapt the greeting to the time of day.</p></div>
      <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={preferences.greeting.enabled} onChange={(e) => updateNested("greeting", { enabled: e.target.checked })} /> Enable greeting</label>
      <select value={preferences.greeting.mode} onChange={(e) => updateNested("greeting", { mode: e.target.value })} className={inputClass}><option value="time">Time-based greeting</option><option value="custom">Custom greeting</option></select>
      {preferences.greeting.mode === "custom" ? <input value={preferences.greeting.text} onChange={(e) => updateNested("greeting", { text: e.target.value })} className={inputClass} placeholder="Assalamualaikum, Namaste, Hello…" /> : <div className="grid md:grid-cols-2 gap-3">{Object.entries(preferences.greeting.timeMessages).map(([key, value]) => <label key={key} className="text-xs text-parchment-300 capitalize">{key}<input value={value} onChange={(e) => updateNested("greeting", { timeMessages: { ...preferences.greeting.timeMessages, [key]: e.target.value } })} className={`${inputClass} mt-1`} /></label>)}</div>}
      <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={preferences.greeting.includeName} onChange={(e) => updateNested("greeting", { includeName: e.target.checked })} /> Include display name</label>
    </div>

    <div className="border-t border-ink-600 pt-5 space-y-4">
      <div><h4 className="font-medium">Clock</h4><p className="text-xs text-parchment-300/60 mt-1">Control the dashboard clock without changing the rest of your time settings.</p></div>
      <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={preferences.clock.enabled} onChange={(e) => updateNested("clock", { enabled: e.target.checked })} /> Show clock</label>
      <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={preferences.clock.showSeconds} onChange={(e) => updateNested("clock", { showSeconds: e.target.checked })} /> Show seconds</label>
    </div>

    <div className="border-t border-ink-600 pt-5 space-y-4">
      <div><h4 className="font-medium">Accessibility</h4><p className="text-xs text-parchment-300/60 mt-1">These preferences apply system-wide.</p></div>
      <div className="grid md:grid-cols-2 gap-4"><label className="text-xs text-parchment-300">UI scale<select value={preferences.accessibility.scale} onChange={(e) => updateNested("accessibility", { scale: e.target.value })} className={`${inputClass} mt-1`}><option value="normal">Normal</option><option value="large">Large</option><option value="extra-large">Extra large</option></select></label><label className="text-xs text-parchment-300">Density<select value={preferences.accessibility.density} onChange={(e) => updateNested("accessibility", { density: e.target.value })} className={`${inputClass} mt-1`}><option value="compact">Compact</option><option value="comfortable">Comfortable</option><option value="spacious">Spacious</option></select></label></div>
      <div className="grid md:grid-cols-3 gap-3"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={preferences.accessibility.highContrast} onChange={(e) => updateNested("accessibility", { highContrast: e.target.checked })} /> High contrast</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={preferences.accessibility.reducedMotion} onChange={(e) => updateNested("accessibility", { reducedMotion: e.target.checked })} /> Reduced motion</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={preferences.accessibility.largeTargets} onChange={(e) => updateNested("accessibility", { largeTargets: e.target.checked })} /> Large targets</label></div>
    </div>

    <div className="flex items-center justify-between gap-3 border-t border-ink-600 pt-5">{error ? <p className="text-sm text-red-400">{error}</p> : <p className="text-sm text-emerald-400">{saved ? "Preferences saved ✓" : ""}</p>}<button type="button" onClick={save} className="bg-brass-500 hover:bg-brass-400 text-ink-950 font-semibold rounded-lg px-4 py-2 text-sm">Save preferences</button></div>
  </section>;
}
