import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../lib/auth";
import { subscribeProfile, setProfile, subscribeConfig, setConfig } from "../lib/data";
import { subscribeNodes, updateNode } from "../data/nodes";
import { subscribeUserCapabilities, addUserCapability, updateUserCapability } from "../data/userCapabilities";
import { MODULES } from "../modules/registry";
import { CAPABILITIES, normalizeCapabilities, isUserCapabilityKey, USER_CAPABILITY_PREFIX } from "../modules/capabilities";
import { getDefaultDashboard, normalizeDashboard } from "../modules/dashboard";
import NodeFieldBuilder from "../components/NodeFieldBuilder";
import DashboardBuilder from "../components/DashboardBuilder";

const DEFAULT_CONFIG = {
  enabledModules: MODULES.filter((module) => module.alwaysOn || module.key === "home").map((module) => module.key),
  enabledCapabilities: normalizeCapabilities(CAPABILITIES.map((capability) => capability.key)),
};

export default function Settings() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [adjustment, setAdjustment] = useState(0);
  const [enabledModules, setEnabledModules] = useState(DEFAULT_CONFIG.enabledModules);
  const [enabledCapabilities, setEnabledCapabilities] = useState(DEFAULT_CONFIG.enabledCapabilities);
  const [dashboard, setDashboard] = useState(getDefaultDashboard);
  const [nodes, setNodes] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [userCapabilities, setUserCapabilities] = useState([]);
  const [capabilityName, setCapabilityName] = useState("");
  const [capabilityDescription, setCapabilityDescription] = useState("");
  const [capabilityFields, setCapabilityFields] = useState([]);
  const [capabilitySaving, setCapabilitySaving] = useState(false);
  const [capabilitySaved, setCapabilitySaved] = useState(false);
  const [capabilityError, setCapabilityError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [nodeSaving, setNodeSaving] = useState(false);
  const [nodeSaved, setNodeSaved] = useState(false);
  const [nodeSaveError, setNodeSaveError] = useState("");
  const [capabilityConfigDraft, setCapabilityConfigDraft] = useState({});
  const [presentationDraft, setPresentationDraft] = useState({});

  useEffect(() => {
    if (!user) return;
    const unsubscribeProfile = subscribeProfile(user.uid, (profile) => {
      if (profile) {
        setName(profile.name || "");
        setAdjustment(profile.hijriAdjustmentDays || 0);
      }
    });
    const unsubscribeConfig = subscribeConfig(user.uid, (config) => {
      if (Array.isArray(config?.enabledModules)) setEnabledModules(config.enabledModules);
      if (Array.isArray(config?.enabledCapabilities)) setEnabledCapabilities(normalizeCapabilities(config.enabledCapabilities));
      setDashboard(normalizeDashboard(config?.dashboard || getDefaultDashboard()));
    });
    const unsubscribeNodes = subscribeNodes(user.uid, "core", (nextNodes) => {
      setNodes(nextNodes);
      setSelectedNodeId((current) => current && nextNodes.some((node) => node.id === current) ? current : nextNodes[0]?.id || "");
    });
    const unsubscribeUserCapabilities = subscribeUserCapabilities(user.uid, setUserCapabilities);
    return () => { unsubscribeProfile(); unsubscribeConfig(); unsubscribeNodes(); unsubscribeUserCapabilities(); };
  }, [user]);

  const selectedNode = useMemo(() => nodes.find((node) => node.id === selectedNodeId) || null, [nodes, selectedNodeId]);

  useEffect(() => {
    setCapabilityConfigDraft(selectedNode?.capabilityConfig || {});
    setPresentationDraft(selectedNode?.presentation || {});
  }, [selectedNodeId, selectedNode?.capabilityConfig, selectedNode?.presentation]);

  function toggleModule(moduleKey) {
    const module = MODULES.find((item) => item.key === moduleKey);
    if (!module || module.alwaysOn) return;
    setEnabledModules((current) => current.includes(moduleKey) ? current.filter((key) => key !== moduleKey) : [...current, moduleKey]);
  }

  function toggleCapability(capabilityKey) {
    setEnabledCapabilities((current) => current.includes(capabilityKey) ? current.filter((key) => key !== capabilityKey) : [...current, capabilityKey]);
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaved(false); setSaveError("");
    try {
      await setProfile(user.uid, { name: name.trim(), hijriAdjustmentDays: Number(adjustment) });
      await setConfig(user.uid, { enabledModules, enabledCapabilities: normalizeCapabilities(enabledCapabilities), dashboard: normalizeDashboard(dashboard) });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("FocusOS settings save failed:", error);
      setSaveError(error.message || "Unable to save settings.");
    }
  }

  function toggleNodeCapability(capabilityKey) {
    if (!selectedNode) return;
    const current = normalizeCapabilities(selectedNode.capabilities);
    const next = current.includes(capabilityKey) ? current.filter((key) => key !== capabilityKey) : [...current, capabilityKey];
    setNodeSaveError(""); setNodeSaved(false);
    setNodes((currentNodes) => currentNodes.map((node) => node.id === selectedNode.id ? { ...node, capabilities: next } : node));
    saveNodeCapabilities(selectedNode.id, next);
  }

  async function saveNodePresentation(nodeId, presentation) {
    if (!user) return;
    setNodeSaving(true);
    setNodeSaveError("");
    try {
      await updateNode(user.uid, nodeId, { presentation });
      setNodes((currentNodes) => currentNodes.map((node) => node.id === nodeId ? { ...node, presentation } : node));
      setNodeSaved(true);
      setTimeout(() => setNodeSaved(false), 2000);
    } catch (error) {
      setNodeSaveError(error.message || "Unable to save node presentation.");
    } finally {
      setNodeSaving(false);
    }
  }

  async function saveNodeCapabilityConfig(nodeId, capabilityConfig) {
    if (!user) return;
    setNodeSaving(true);
    setNodeSaveError("");
    try {
      await updateNode(user.uid, nodeId, { capabilityConfig });
      setNodes((currentNodes) => currentNodes.map((node) => node.id === nodeId ? { ...node, capabilityConfig } : node));
      setNodeSaved(true);
      setTimeout(() => setNodeSaved(false), 2000);
    } catch (error) {
      setNodeSaveError(error.message || "Unable to save capability configuration.");
    } finally {
      setNodeSaving(false);
    }
  }

  async function saveNodeCapabilities(nodeId, capabilities) {
    if (!user) return;
    setNodeSaving(true);
    try { await updateNode(user.uid, nodeId, { capabilities }); setNodeSaved(true); setTimeout(() => setNodeSaved(false), 2000); }
    catch (error) { console.error("FocusOS node capability save failed:", error); setNodeSaveError(error.message || "Unable to save node capabilities."); }
    finally { setNodeSaving(false); }
  }

  async function createCapability(event) {
    event.preventDefault();
    setCapabilitySaving(true); setCapabilitySaved(false); setCapabilityError("");
    try {
      await addUserCapability(user.uid, { name: capabilityName, description: capabilityDescription, fields: capabilityFields });
      setCapabilityName(""); setCapabilityDescription(""); setCapabilityFields([]); setCapabilitySaved(true);
      setTimeout(() => setCapabilitySaved(false), 2000);
    } catch (error) {
      console.error("FocusOS user capability creation failed:", error);
      setCapabilityError(error.message || "Unable to create capability.");
    } finally { setCapabilitySaving(false); }
  }

  async function archiveCapability(capabilityId) {
    try { await updateUserCapability(user.uid, capabilityId, { archived: true }); }
    catch (error) { setCapabilityError(error.message || "Unable to archive capability."); }
  }

  const customCapabilityDefinitions = userCapabilities.map((capability) => ({
    key: `${USER_CAPABILITY_PREFIX}${capability.id}`,
    label: capability.name,
    description: capability.description || "User-created capability.",
    definition: capability,
  }));
  const enabledNodeCapabilities = [
    ...CAPABILITIES.filter((capability) => enabledCapabilities.includes(capability.key)),
    ...customCapabilityDefinitions,
  ];

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <header><h2 className="text-2xl font-display font-semibold">Settings</h2><p className="text-sm text-parchment-300/70 mt-1">Customize your FocusOS workspace.</p></header>
      <form onSubmit={handleSave} className="space-y-6">
        <section className="card p-6 space-y-5">
          <div><h3 className="font-semibold text-lg">Personal preferences</h3><p className="text-xs text-parchment-300/70 mt-1">These preferences belong only to your account.</p></div>
          <div><label className="block text-xs text-parchment-300 mb-1">Display name</label><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter your display name" className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500" /></div>
          <div><label className="block text-xs text-parchment-300 mb-1">Hijri date adjustment</label><p className="text-[11px] text-parchment-300/70 mb-2">Adjust the calculated Hijri date by up to two days.</p><select value={adjustment} onChange={(event) => setAdjustment(event.target.value)} className="bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none"><option value={-2}>-2 days</option><option value={-1}>-1 day</option><option value={0}>No adjustment</option><option value={1}>+1 day</option><option value={2}>+2 days</option></select></div>
        </section>

        <section className="card p-6 space-y-4">
          <div><h3 className="font-semibold text-lg">Dashboard</h3><p className="text-xs text-parchment-300/70 mt-1">Build the dashboard you want to use. Configure visibility, order, layout, size and position here.</p></div>
          <DashboardBuilder dashboard={dashboard} onChange={setDashboard} />
        </section>

        <section className="card p-6 space-y-4"><div><h3 className="font-semibold text-lg">Workspace modules</h3><p className="text-xs text-parchment-300/70 mt-1">Choose which tools appear in your workspace navigation.</p></div><div className="space-y-3">{MODULES.map((module) => <label key={module.key} className="flex items-center justify-between gap-4 border-b border-ink-600/60 pb-3 last:border-b-0 last:pb-0"><div><p className="text-sm font-medium">{module.label}</p>{module.alwaysOn && <p className="text-[11px] text-parchment-300/60">Required module</p>}</div><input type="checkbox" checked={enabledModules.includes(module.key)} disabled={module.alwaysOn} onChange={() => toggleModule(module.key)} className="h-4 w-4 accent-brass-500" /></label>)}</div></section>

        <section className="card p-6 space-y-4"><div><h3 className="font-semibold text-lg">Built-in capabilities</h3><p className="text-xs text-parchment-300/70 mt-1">Choose which built-in capabilities are available for your nodes.</p></div><div className="space-y-3">{CAPABILITIES.map((capability) => <label key={capability.key} className="flex items-center justify-between gap-4 border-b border-ink-600/60 pb-3 last:border-b-0 last:pb-0"><div><p className="text-sm font-medium">{capability.label}</p><p className="text-[11px] text-parchment-300/60">{capability.description}</p></div><input type="checkbox" checked={enabledCapabilities.includes(capability.key)} onChange={() => toggleCapability(capability.key)} className="h-4 w-4 accent-brass-500" /></label>)}</div></section>

        <section className="card p-6 space-y-5"><div><h3 className="font-semibold text-lg">Create your own capability</h3><p className="text-xs text-parchment-300/70 mt-1">Build a reusable capability without adding a hard-coded FocusOS feature.</p></div><div className="space-y-3"><input value={capabilityName} onChange={(event) => setCapabilityName(event.target.value)} placeholder="Capability name, e.g. Water Intake" className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500" /><textarea value={capabilityDescription} onChange={(event) => setCapabilityDescription(event.target.value)} placeholder="What should this capability do?" rows={2} className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500" /><NodeFieldBuilder fields={capabilityFields} onChange={setCapabilityFields} /></div><button type="button" onClick={createCapability} disabled={capabilitySaving || !capabilityName.trim()} className="bg-brass-500 hover:bg-brass-400 disabled:opacity-50 text-ink-950 font-semibold rounded-lg px-4 py-2 text-sm">{capabilitySaved ? "Created ✓" : capabilitySaving ? "Creating…" : "Create capability"}</button>{capabilityError && <p className="text-sm text-red-400">{capabilityError}</p>}{userCapabilities.length > 0 && <div className="pt-3 border-t border-ink-600/60 space-y-2"><p className="text-xs uppercase tracking-wide text-parchment-300/60">Your capabilities</p>{userCapabilities.map((capability) => <div key={capability.id} className="flex items-center gap-3 border border-ink-600 rounded-lg p-3"><div className="flex-1"><p className="text-sm font-medium">{capability.name}</p>{capability.description && <p className="text-[11px] text-parchment-300/60">{capability.description}</p>}<p className="text-[11px] text-parchment-300/50 mt-1">{capability.fields?.length || 0} custom fields · Available to assign to nodes</p></div><button type="button" onClick={() => archiveCapability(capability.id)} className="px-3 py-1.5 rounded bg-ink-700 hover:bg-ink-600 text-xs">Archive</button></div>)}</div>}</section>

        <section className="card p-6 space-y-4"><div><h3 className="font-semibold text-lg">Configure nodes</h3><p className="text-xs text-parchment-300/70 mt-1">Select a node and choose which built-in or user-created capabilities it should use. Node hierarchy stays in Workspace.</p></div>{nodes.length === 0 ? <div className="border border-dashed border-ink-600 rounded-xl p-6 text-center"><p className="text-sm font-medium">No nodes yet.</p><p className="text-xs text-parchment-300/60 mt-1">Create nodes in Workspace first, then configure their capabilities here.</p></div> : <><div><label className="block text-xs text-parchment-300 mb-1">Node</label><select value={selectedNodeId} onChange={(event) => { setSelectedNodeId(event.target.value); setNodeSaveError(""); setNodeSaved(false); }} className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500">{nodes.map((node) => <option key={node.id} value={node.id}>{node.name}</option>)}</select></div><div className="space-y-3">{enabledNodeCapabilities.map((capability) => { const assigned = selectedNode?.capabilities?.includes(capability.key) || false; return <label key={capability.key} className="flex items-center justify-between gap-4 border-b border-ink-600/60 pb-3 last:border-b-0 last:pb-0"><div><p className="text-sm font-medium">{capability.label}</p><p className="text-[11px] text-parchment-300/60">{capability.description}</p>{isUserCapabilityKey(capability.key) && <p className="text-[10px] text-brass-400/80 mt-1">Custom capability</p>}</div><input type="checkbox" checked={assigned} disabled={nodeSaving} onChange={() => toggleNodeCapability(capability.key)} className="h-4 w-4 accent-brass-500" /></label>; })}</div>{enabledNodeCapabilities.length === 0 && <p className="text-xs text-parchment-300/60">Enable a built-in capability or create a custom capability above to make it available here.</p>}{selectedNode && (
  <div className="mt-5 pt-5 border-t border-ink-700 space-y-4">
    <div><p className="text-sm font-semibold">Visibility & presentation</p><p className="text-[11px] text-parchment-300/60">Control where this node appears without changing its hierarchy.</p></div>
    <label className="flex items-center justify-between gap-4">
      <div><p className="text-sm">Show in navigation</p><p className="text-[11px] text-parchment-300/60">Allow this node to appear in navigation/sidebar surfaces.</p></div>
      <input type="checkbox" checked={presentationDraft.showInNavigation !== false} onChange={(event) => setPresentationDraft((current) => ({ ...current, showInNavigation: event.target.checked }))} className="h-4 w-4 accent-brass-500" />
    </label>
    <label className="flex items-center justify-between gap-4">
      <div><p className="text-sm">Show on dashboard</p><p className="text-[11px] text-parchment-300/60">Make this node eligible for dashboard presentation.</p></div>
      <input type="checkbox" checked={presentationDraft.showOnDashboard === true} onChange={(event) => setPresentationDraft((current) => ({ ...current, showOnDashboard: event.target.checked }))} className="h-4 w-4 accent-brass-500" />
    </label>
    <label className="flex items-center justify-between gap-4">
      <div><p className="text-sm">Collapsed by default</p><p className="text-[11px] text-parchment-300/60">Start hierarchy views collapsed for this node.</p></div>
      <input type="checkbox" checked={presentationDraft.collapsedByDefault === true} onChange={(event) => setPresentationDraft((current) => ({ ...current, collapsedByDefault: event.target.checked }))} className="h-4 w-4 accent-brass-500" />
    </label>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <label className="text-xs text-parchment-300">Navigation order<input type="number" min="0" value={presentationDraft.navigationOrder ?? 0} onChange={(event) => setPresentationDraft((current) => ({ ...current, navigationOrder: Math.max(0, Number(event.target.value) || 0) }))} className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm" /></label>
      <label className="text-xs text-parchment-300">Dashboard order<input type="number" min="0" value={presentationDraft.dashboardOrder ?? 0} onChange={(event) => setPresentationDraft((current) => ({ ...current, dashboardOrder: Math.max(0, Number(event.target.value) || 0) }))} className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm" /></label>
    </div>
    <button type="button" disabled={nodeSaving} onClick={() => saveNodePresentation(selectedNode.id, presentationDraft)} className="px-4 py-2 rounded-lg bg-ink-700 hover:bg-ink-600 border border-ink-600 text-sm">Save visibility & presentation</button>
  </div>
)}

{selectedNode && enabledNodeCapabilities.filter((capability) => selectedNode.capabilities?.includes(capability.key)).map((capability) => {
  const configFields = capability.definition?.configFields || capability.configFields || [];
  if (configFields.length === 0) return null;
  const config = capabilityConfigDraft[capability.key] || {};
  return (
    <div key={"config-" + capability.key} className="mt-5 pt-5 border-t border-ink-700 space-y-3">
      <div><p className="text-sm font-semibold">Configure {capability.label}</p><p className="text-[11px] text-parchment-300/60">Settings apply only to this node.</p></div>
      {configFields.map((field) => (
        <label key={field.id} className="block text-xs text-parchment-300">
          {field.name}
          {field.type === "checkbox" ? (
            <span className="block mt-2"><input type="checkbox" checked={config[field.id] === true} onChange={(event) => setCapabilityConfigDraft((current) => ({ ...current, [capability.key]: { ...config, [field.id]: event.target.checked } }))} className="h-4 w-4 accent-brass-500" /></span>
          ) : (
            <select value={config[field.id] || ""} onChange={(event) => setCapabilityConfigDraft((current) => ({ ...current, [capability.key]: { ...config, [field.id]: event.target.value } }))} className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500"><option value="">Default</option>{(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}</select>
          )}
        </label>
      ))}
      <button type="button" disabled={nodeSaving} onClick={() => saveNodeCapabilityConfig(selectedNode.id, capabilityConfigDraft)} className="px-4 py-2 rounded-lg bg-ink-700 hover:bg-ink-600 border border-ink-600 text-sm">Save capability configuration</button>
    </div>
  );
})}
{nodeSaved && <p className="text-sm text-emerald-400">Node configuration saved ✓</p>}{nodeSaveError && <p className="text-sm text-red-400">{nodeSaveError}</p>}</>}</section>

        <button type="submit" className="bg-brass-500 hover:bg-brass-400 text-ink-950 font-semibold rounded-lg px-4 py-2 text-sm">{saved ? "Saved ✓" : "Save changes"}</button>{saveError && <p className="text-sm text-red-400">{saveError}</p>}
      </form>
    </div>
  );
}
