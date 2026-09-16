import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../lib/auth";
import { subscribeProfile, setProfile, subscribeConfig, setConfig } from "../lib/data";
import { subscribeNodes, updateNode } from "../data/nodes";
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
  const [nodes, setNodes] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [nodeSaving, setNodeSaving] = useState(false);
  const [nodeSaved, setNodeSaved] = useState(false);
  const [nodeSaveError, setNodeSaveError] = useState("");

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

    const unsubscribeNodes = subscribeNodes(user.uid, "core", (nextNodes) => {
      setNodes(nextNodes);
      setSelectedNodeId((current) => {
        if (current && nextNodes.some((node) => node.id === current)) return current;
        return nextNodes[0]?.id || "";
      });
    });

    return () => {
      unsubscribeProfile();
      unsubscribeConfig();
      unsubscribeNodes();
    };
  }, [user]);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

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
    event.preventDefault();
    setSaved(false);
    setSaveError("");

    try {
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

  function toggleNodeCapability(capabilityKey) {
    if (!selectedNode) return;

    const current = normalizeCapabilities(selectedNode.capabilities);
    const next = current.includes(capabilityKey)
      ? current.filter((key) => key !== capabilityKey)
      : [...current, capabilityKey];

    setNodeSaveError("");
    setNodeSaved(false);
    setNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.id === selectedNode.id ? { ...node, capabilities: next } : node
      )
    );

    saveNodeCapabilities(selectedNode.id, next);
  }

  async function saveNodeCapabilities(nodeId, capabilities) {
    if (!user) return;

    setNodeSaving(true);
    try {
      await updateNode(user.uid, nodeId, { capabilities });
      setNodeSaved(true);
      setTimeout(() => setNodeSaved(false), 2000);
    } catch (error) {
      console.error("FocusOS node capability save failed:", error);
      setNodeSaveError(error.message || "Unable to save node capabilities.");
    } finally {
      setNodeSaving(false);
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
              Choose which capabilities are available to assign to your nodes. This does not create any nodes.
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

        <section className="card p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-lg">Configure nodes</h3>
            <p className="text-xs text-parchment-300/70 mt-1">
              Select a node and choose which enabled capabilities it should use. Node hierarchy stays in Workspace.
            </p>
          </div>

          {nodes.length === 0 ? (
            <div className="border border-dashed border-ink-600 rounded-xl p-6 text-center">
              <p className="text-sm font-medium">No nodes yet.</p>
              <p className="text-xs text-parchment-300/60 mt-1">
                Create nodes in Workspace first, then configure their capabilities here.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs text-parchment-300 mb-1">Node</label>
                <select
                  value={selectedNodeId}
                  onChange={(event) => {
                    setSelectedNodeId(event.target.value);
                    setNodeSaveError("");
                    setNodeSaved(false);
                  }}
                  className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500"
                >
                  {nodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                {CAPABILITIES.filter((capability) => enabledCapabilities.includes(capability.key)).map((capability) => {
                  const assigned = selectedNode?.capabilities?.includes(capability.key) || false;
                  return (
                    <label key={capability.key} className="flex items-center justify-between gap-4 border-b border-ink-600/60 pb-3 last:border-b-0 last:pb-0">
                      <div>
                        <p className="text-sm font-medium">{capability.label}</p>
                        <p className="text-[11px] text-parchment-300/60">{capability.description}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={assigned}
                        disabled={nodeSaving}
                        onChange={() => toggleNodeCapability(capability.key)}
                        className="h-4 w-4 accent-brass-500"
                      />
                    </label>
                  );
                })}
                {CAPABILITIES.filter((capability) => enabledCapabilities.includes(capability.key)).length === 0 && (
                  <p className="text-sm text-parchment-300/60">
                    Enable at least one capability above before assigning capabilities to a node.
                  </p>
                )}
              </div>

              {nodeSaved && <p className="text-sm text-emerald-400">Node capabilities saved ✓</p>}
              {nodeSaveError && <p className="text-sm text-red-400">{nodeSaveError}</p>}
            </>
          )}
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
