import { useMemo, useState } from "react";
import { useAuth } from "../lib/auth";
import { setConfig, setProfile } from "../lib/data";
import { addNode } from "../data/nodes";
import { DEFAULT_PREFERENCES, normalizePreferences } from "../lib/preferences";
import Logo from "../components/Logo";

const GREETING_PRESETS = [
  "Assalamualaikum",
  "Namaste",
  "Hello",
  "Hi",
];

const STEPS = [
  { title: "Let's make FocusOS yours", subtitle: "A few choices now will shape your everyday workspace." },
  { title: "What should we call you?", subtitle: "This name can appear throughout your personal dashboard." },
  { title: "How should FocusOS greet you?", subtitle: "Choose a fixed greeting or let FocusOS adapt it to the time of day." },
  { title: "Make your clock yours", subtitle: "Choose how time should appear in your dashboard." },
  { title: "Choose your date system", subtitle: "Pick the calendar system and regional format you prefer." },
  { title: "Your FocusOS is ready", subtitle: "You can keep it empty or create your first node and customize everything later." },
];

const inputClass = "w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brass-500";
const optionClass = "rounded-xl border border-ink-600 bg-ink-800/50 p-4 text-left hover:border-brass-500/60 transition-colors";

function getInitialPreferences() {
  const locale = navigator.language || DEFAULT_PREFERENCES.locale;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_PREFERENCES.timeZone;
  return normalizePreferences({ ...DEFAULT_PREFERENCES, locale, timeZone });
}

export default function ProfileSetup({ onComplete }) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [firstNode, setFirstNode] = useState("");
  const [preferences, setPreferences] = useState(getInitialPreferences);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const progress = useMemo(() => `${Math.round(((step + 1) / STEPS.length) * 100)}%`, [step]);

  function update(patch) {
    setPreferences((current) => normalizePreferences({ ...current, ...patch }));
  }

  function updateNested(key, patch) {
    setPreferences((current) => normalizePreferences({ ...current, [key]: { ...current[key], ...patch } }));
  }

  function next() {
    setError("");
    if (step === 1 && !name.trim()) {
      setError("Please enter your name to continue.");
      return;
    }
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function back() {
    setError("");
    setStep((current) => Math.max(current - 1, 0));
  }

  async function finish() {
    if (!user || !name.trim()) return;
    setSaving(true);
    setError("");
    try {
      await setProfile(user.uid, {
        name: name.trim(),
        hijriAdjustmentDays: 0,
        onboardingCompleted: true,
        createdAt: new Date().toISOString(),
      });
      await setConfig(user.uid, { preferences: normalizePreferences(preferences) });
      if (firstNode.trim()) {
        await addNode(user.uid, { name: firstNode.trim(), moduleKey: "core" });
      }
      onComplete?.();
    } catch (e) {
      setError(e.message || "Unable to finish setup. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-950 px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <Logo size={44} className="mx-auto mb-4" />
          <p className="text-xs tracking-[0.2em] text-brass-500 uppercase mb-2">Welcome to</p>
          <h1 className="text-3xl font-display font-semibold">FocusOS</h1>
          <div className="mt-5 h-1 rounded-full bg-ink-700 overflow-hidden">
            <div className="h-full bg-brass-500 transition-all" style={{ width: progress }} />
          </div>
          <p className="text-[11px] text-parchment-300/50 mt-2">Step {step + 1} of {STEPS.length}</p>
        </div>

        <section className="card p-6 md:p-8">
          <div className="mb-7">
            <h2 className="text-xl font-semibold">{STEPS[step].title}</h2>
            <p className="text-sm text-parchment-300/65 mt-1">{STEPS[step].subtitle}</p>
          </div>

          {step === 0 && (
            <div className="space-y-4">
              {[
                ["Your identity", "Tell FocusOS what to call you."],
                ["Your greeting", "Choose a greeting such as Assalamualaikum, Namaste, or your own text."],
                ["Your time", "Configure the clock, timezone and 12/24-hour format."],
                ["Your calendar", "Choose Gregorian, Hijri, or the calendar options FocusOS supports."],
                ["Your system", "Then FocusOS will show you where to create nodes, capabilities, dashboards and other settings."],
              ].map(([title, text]) => (
                <div key={title} className="rounded-xl bg-ink-800/50 border border-ink-700 p-4">
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-xs text-parchment-300/60 mt-1">{text}</p>
                </div>
              ))}
            </div>
          )}

          {step === 1 && (
            <div>
              <label className="block text-xs text-parchment-300 mb-1">Your name</label>
              <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="What should FocusOS call you?" className={inputClass} />
              <p className="text-xs text-parchment-300/50 mt-2">You can change this later from Settings.</p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-3">
                <button type="button" onClick={() => updateNested("greeting", { mode: "time" })} className={`${optionClass} ${preferences.greeting.mode === "time" ? "border-brass-500 ring-1 ring-brass-500/30" : ""}`}>
                  <p className="font-semibold text-sm">Time-based</p>
                  <p className="text-xs text-parchment-300/60 mt-1">Good morning · Good afternoon · Good evening · Good night</p>
                </button>
                <button type="button" onClick={() => updateNested("greeting", { mode: "custom" })} className={`${optionClass} ${preferences.greeting.mode === "custom" ? "border-brass-500 ring-1 ring-brass-500/30" : ""}`}>
                  <p className="font-semibold text-sm">Custom greeting</p>
                  <p className="text-xs text-parchment-300/60 mt-1">Use the same greeting whenever you open FocusOS.</p>
                </button>
              </div>

              {preferences.greeting.mode === "custom" ? (
                <div>
                  <label className="block text-xs text-parchment-300 mb-1">Greeting</label>
                  <input value={preferences.greeting.text} onChange={(e) => updateNested("greeting", { text: e.target.value })} className={inputClass} placeholder="Assalamualaikum, Namaste, Hello…" />
                  <div className="flex flex-wrap gap-2 mt-3">
                    {GREETING_PRESETS.map((preset) => <button key={preset} type="button" onClick={() => updateNested("greeting", { text: preset })} className="px-3 py-1.5 rounded-lg border border-ink-600 text-xs hover:border-brass-500/60">{preset}</button>)}
                  </div>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {Object.entries(preferences.greeting.timeMessages).map(([key, value]) => (
                    <label key={key} className="text-xs text-parchment-300 capitalize">{key}<input value={value} onChange={(e) => updateNested("greeting", { timeMessages: { ...preferences.greeting.timeMessages, [key]: e.target.value } })} className={`${inputClass} mt-1`} /></label>
                  ))}
                </div>
              )}

              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={preferences.greeting.includeName} onChange={(e) => updateNested("greeting", { includeName: e.target.checked })} /> Include my name</label>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={preferences.clock.enabled} onChange={(e) => updateNested("clock", { enabled: e.target.checked })} /> Show the clock on my dashboard</label>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="text-xs text-parchment-300">Time format<select value={preferences.timeFormat} onChange={(e) => update({ timeFormat: e.target.value })} className={`${inputClass} mt-1`}><option value="12h">12-hour (1:30 PM)</option><option value="24h">24-hour (13:30)</option></select></label>
                <label className="text-xs text-parchment-300">Time zone<input value={preferences.timeZone} onChange={(e) => update({ timeZone: e.target.value })} className={`${inputClass} mt-1`} /></label>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={preferences.clock.showSeconds} onChange={(e) => updateNested("clock", { showSeconds: e.target.checked })} /> Show seconds</label>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="text-xs text-parchment-300">Primary calendar<select value={preferences.calendar.primary} onChange={(e) => updateNested("calendar", { primary: e.target.value })} className={`${inputClass} mt-1`}><option value="gregorian">Gregorian</option><option value="hijri">Hijri</option></select></label>
                <label className="text-xs text-parchment-300">Secondary calendar<select value={preferences.calendar.secondary} onChange={(e) => updateNested("calendar", { secondary: e.target.value, showSecondary: e.target.value !== "none" })} className={`${inputClass} mt-1`}><option value="none">None</option><option value="gregorian">Gregorian</option><option value="hijri">Hijri</option></select></label>
                <label className="text-xs text-parchment-300">Date format<select value={preferences.dateFormat} onChange={(e) => update({ dateFormat: e.target.value })} className={`${inputClass} mt-1`}><option value="short">Short</option><option value="medium">Medium</option><option value="long">Long</option><option value="full">Full</option></select></label>
                <label className="text-xs text-parchment-300">Week starts on<select value={preferences.weekStartsOn} onChange={(e) => update({ weekStartsOn: Number(e.target.value) })} className={`${inputClass} mt-1`}><option value={0}>Sunday</option><option value={1}>Monday</option></select></label>
              </div>
              <p className="text-xs text-parchment-300/55">More calendar systems can be added to FocusOS later without changing the rest of your workspace.</p>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <div className="rounded-xl border border-brass-500/30 bg-brass-500/5 p-4">
                <p className="text-sm font-semibold">How FocusOS works</p>
                <p className="text-xs text-parchment-300/65 mt-2">Dashboard, Calendar and Settings are the fixed system areas. Everything else is yours to build from universal nodes, capabilities, fields and views.</p>
              </div>
              <div>
                <label className="block text-xs text-parchment-300 mb-1">Create your first node (optional)</label>
                <input value={firstNode} onChange={(e) => setFirstNode(e.target.value)} placeholder="e.g. Personal, Work, Project, Health…" className={inputClass} />
                <p className="text-xs text-parchment-300/50 mt-2">Leave this blank if you want to start with an empty workspace.</p>
              </div>
              <div className="grid sm:grid-cols-3 gap-3 text-xs text-parchment-300/65">
                <div className="rounded-lg bg-ink-800/50 p-3"><b className="text-parchment-200">Workspace</b><br />Build your hierarchy.</div>
                <div className="rounded-lg bg-ink-800/50 p-3"><b className="text-parchment-200">Dashboard</b><br />Customize what you see.</div>
                <div className="rounded-lg bg-ink-800/50 p-3"><b className="text-parchment-200">Settings</b><br />Configure your system.</div>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-400 mt-5">{error}</p>}

          <div className="flex items-center justify-between gap-3 mt-8 pt-5 border-t border-ink-700">
            <button type="button" onClick={back} disabled={step === 0 || saving} className="btn-secondary text-sm px-4 py-2 disabled:opacity-30">Back</button>
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={next} disabled={saving} className="btn-primary text-sm px-5 py-2">Continue</button>
            ) : (
              <button type="button" onClick={finish} disabled={saving || !name.trim()} className="btn-primary text-sm px-5 py-2 disabled:opacity-50">{saving ? "Setting up…" : "Enter FocusOS"}</button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
