import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { subscribeProfile, setProfile, subscribeConfig, setConfig } from "../lib/data";
import { MODULES } from "../modules/registry";
import { CAPABILITIES, normalizeCapabilities } from "../modules/capabilities";

const DEFAULT_CONFIG = {
  enabledModules: MODULES.filter((module) => module.alwaysOn || module.key === "home")
    .map((module) => module.key),
  enabledCapabilities: normalizeCapabilities(CAPABILITIES.map((capability) => capability.key)),
};

export default function Settings() {
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [adjustment, setAdjustment] = useState(0);
  const [enabledModules, setEnabledModules] = useState(DEFAULT_CONFIG.enabledModules);
  const [enabledCapabilities, setEnabledCapabilities] = useState(DEFAULT_CONFIG.enabledCapabilities);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!user) return;

    const unsubscribeProfile = subscribeProfile(user.uid, (profile) => {
      if (profile) {
        setName(profile.name || "");
        setAdjustment(profile.hijriAdjustmentDays || 0);
      }
    });

    const unsubscribeConfig = subscribeConfig(user.uid, (config) => {
      if (Array.isArray(config?.enabledModules)) {
        setEnabledModules(config.enabledModules);
      }
      if (Array.isArray(config?.enabledCapabilities)) {
        setEnabledCapabilities(normalizeCapabilities(config.enabledCapabilities));
      }
    });

    return () => {
      unsubscribeProfile();
      unsubscribeConfig();
    };
  }, [user]);

  function toggleModule(moduleKey) {
    const module = MODULES.find((item) => item.key === moduleKey);

    if (!module || module.alwaysOn) return;

    setEnabledModules((current) =>
      current.includes(moduleKey)
        ? current.filter((key) => key !== moduleKey)
        : [...current, moduleKey]
    );
  }

  function toggleCapability(capabilityKey) {
    setEnabledCapabilities((current) =>
      current.includes(capabilityKey)
        ? current.filter((key) => key !== capabilityKey)
        : [...current, capabilityKey]
    );
  }

  async function handleSave(event) {
    console.log("FocusOS: Save button clicked");
    event.preventDefault();
    setSaved(false);
    setSaveError("");

    try {
      console.log("FocusOS: attempting Firestore save", {
        uid: user?.uid,
        enabledModules,
        enabledCapabilities,
        adjustment,
      });

      await setProfile(user.uid, {
        name: name.trim(),
        hijriAdjustmentDays: Number(adjustment),
      });

      await setConfig(user.uid, {
        enabledModules,
        enabledCapabilities: normalizeCapabilities(enabledCapabilities),
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("FocusOS settings save failed:", error);
      setSaveError(error.message || "Unable to save settings.");
    }
  }

  return (
    <div className="p-8 space-y-6 max-w-2xl">
      <header>
        <h2 className="text-2xl font-display font-semibold">Settings</h2>
        <p className="text-sm text-parchment-300/70 mt-1">
          Customize your FocusOS workspace.
        </p>
      </header>

      <form onSubmit={handleSave} className="space-y-6">
        <section className="card p-6 space-y-5">
          <div>
            <h3 className="font-semibold text-lg">Personal preferences</h3>
            <p className="text-xs text-parchment-300/70 mt-1">
              These preferences belong only to your account.
            </p>
          </div>

          <div>
            <label className="block text-xs text-parchment-300 mb-1">Display name</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your display name"
              className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500"
            />
          </div>

          <div>
            <label className="block text-xs text-parchment-300 mb-1">Hijri date adjustment</label>
            <p className="text-[11px] text-parchment-300/70 mb-2">
              Adjust the calculated Hijri date by up to two days.
            </p>
            <select
              value={adjustment}
              onChange={(event) => setAdjustment(event.target.value)}
              className="bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none"
            >
              <option value={-2}>-2 days</option>
              <option value={-1}>-1 day</option>
              <option value={0}>No adjustment</option>
              <option value={1}>+1 day</option>
              <option value={2}>+2 days</option>
            </select>
          </div>
        </section>

        <section className="card p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-lg">Workspace modules</h3>
            <p className="text-xs text-parchment-300/70 mt-1">
              Choose which tools appear in your workspace navigation.
            </p>
          </div>

          <div className="space-y-3">
            {MODULES.map((module) => (
              <label key={module.key} className="flex items-center justify-between gap-4 border-b border-ink-600/60 pb-3 last:border-b-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">{module.label}</p>
                  {module.alwaysOn && (
                    <p className="text-[11px] text-parchment-300/60">Required module</p>
                  )}
                </div>
                <input
                  type="checkbox"
                  checked={enabledModules.includes(module.key)}
                  disabled={module.alwaysOn}
                  onChange={() => toggleModule(module.key)}
                  className="h-4 w-4 accent-brass-500"
                />
              </label>
            ))}
          </div>
        </section>

        <section className="card p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-lg">Node capabilities</h3>
            <p className="text-xs text-parchment-300/70 mt-1">
              Choose which capabilities can be assigned to your nodes. This does not create any nodes.
            </p>
          </div>

          <div className="space-y-3">
            {CAPABILITIES.map((capability) => (
              <label key={capability.key} className="flex items-center justify-between gap-4 border-b border-ink-600/60 pb-3 last:border-b-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">{capability.label}</p>
                  <p className="text-[11px] text-parchment-300/60">{capability.description}</p>
                </div>
                <input
                  type="checkbox"
                  checked={enabledCapabilities.includes(capability.key)}
                  onChange={() => toggleCapability(capability.key)}
                  className="h-4 w-4 accent-brass-500"
                />
              </label>
            ))}
          </div>
        </section>

        <button
          type="submit"
          className="bg-brass-500 hover:bg-brass-400 text-ink-950 font-semibold rounded-lg px-4 py-2 text-sm"
        >
          {saved ? "Saved ✓" : "Save changes"}
        </button>
        {saveError && <p className="text-sm text-red-400">{saveError}</p>}
      </form>
    </div>
  );
}
