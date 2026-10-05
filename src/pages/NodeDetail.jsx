import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, Database, FolderTree, Palette, Settings2 } from "lucide-react";
import { useAuth } from "../lib/auth";
import { subscribeNodes, updateNode } from "../data/nodes";
import { getNodeFieldValues, setNodeFieldValues } from "../data/nodeValues";
import { childrenOf } from "../domain/nodeTree";
import { CAPABILITIES } from "../modules/capabilities";
import { subscribeUserCapabilities, userCapabilityKey } from "../data/userCapabilities";
import NodeCapabilityDataEditor from "../components/NodeCapabilityDataEditor";
import { subscribeNodeActivity } from "../data/nodeActivity";

function todayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function FieldInput({ field, value, onChange }) {
  const common = "w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500";
  if (field.type === "checkbox") return <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={value === true} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-brass-500" /> {field.name}</label>;
  if (field.type === "select") return <select value={value ?? ""} onChange={(event) => onChange(event.target.value)} className={common}><option value="">Select an option</option>{(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}</select>;
  if (field.type === "tags") return <input value={Array.isArray(value) ? value.join(", ") : value ?? ""} onChange={(event) => onChange(event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean))} placeholder="tag1, tag2, tag3" className={common} />;
  if (field.type === "file") return <p className="text-xs text-parchment-300/60 border border-dashed border-ink-600 rounded-lg px-3 py-3">File storage will be connected in a later step.</p>;
  const inputType = field.type === "number" || field.type === "percentage" ? "number" : ["date", "time", "url"].includes(field.type) ? field.type : "text";
  return <input type={inputType} value={value ?? ""} onChange={(event) => onChange(event.target.value)} className={common} />;
}

function CapabilityBadge({ label }) {
  return <span className="inline-flex items-center rounded-full border border-ink-600 bg-ink-800 px-2.5 py-1 text-[11px] text-parchment-300">{label}</span>;
}

export default function NodeDetail() {
  const { nodeId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [nodes, setNodes] = useState([]);
  const [customCapabilities, setCustomCapabilities] = useState([]);
  const [dateKey, setDateKey] = useState(todayKey);
  const [values, setValues] = useState({});
  const [loadingValues, setLoadingValues] = useState(true);
  const [savingValues, setSavingValues] = useState(false);
  const [message, setMessage] = useState("");
  const [editingIdentity, setEditingIdentity] = useState(false);
  const [identity, setIdentity] = useState({ name: "", description: "", icon: "◆", color: "#428475" });
  const [savingIdentity, setSavingIdentity] = useState(false);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    if (!user) return;
    return subscribeNodes(user.uid, "core", setNodes);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    return subscribeUserCapabilities(user.uid, setCustomCapabilities);
  }, [user]);

  useEffect(() => {
    if (!user || !nodeId) return;
    return subscribeNodeActivity(user.uid, nodeId, setActivity);
  }, [user, nodeId]);

  const node = useMemo(() => nodes.find((item) => item.id === nodeId) || null, [nodes, nodeId]);
  const children = useMemo(() => node ? childrenOf(nodes, node.id) : [], [nodes, node]);
  const parent = useMemo(() => node?.parentId ? nodes.find((item) => item.id === node.parentId) : null, [nodes, node]);

  useEffect(() => {
    if (!node) return;
    setIdentity({ name: node.name || "", description: node.description || "", icon: node.icon || "◆", color: node.color || "#428475" });
  }, [node]);

  useEffect(() => {
    if (!user || !node) return;
    let active = true;
    setLoadingValues(true);
    setMessage("");
    getNodeFieldValues(user.uid, node.id, dateKey)
      .then((nextValues) => { if (active) setValues(nextValues); })
      .catch((error) => { if (active) setMessage(error.message || "Unable to load saved data."); })
      .finally(() => { if (active) setLoadingValues(false); });
    return () => { active = false; };
  }, [user, node, dateKey]);

  const capabilityLabels = useMemo(() => {
    const customMap = new Map(customCapabilities.map((capability) => [userCapabilityKey(capability.id), capability.name]));
    return (node?.capabilities || []).map((key) => {
      const builtIn = CAPABILITIES.find((capability) => capability.key === key);
      return { key, label: builtIn?.label || customMap.get(key) || key.replace(/^custom:/, "Custom ") };
    });
  }, [node, customCapabilities]);

  async function saveValues() {
    setSavingValues(true); setMessage("");
    try {
      await setNodeFieldValues(user.uid, node.id, values, dateKey);
      setMessage("Node data saved ✓");
    } catch (error) { setMessage(error.message || "Unable to save node data."); }
    finally { setSavingValues(false); }
  }

  async function saveIdentity() {
    if (!identity.name.trim()) return;
    setSavingIdentity(true); setMessage("");
    try {
      await updateNode(user.uid, node.id, identity);
      setEditingIdentity(false); setMessage("Node identity saved ✓");
    } catch (error) { setMessage(error.message || "Unable to save node identity."); }
    finally { setSavingIdentity(false); }
  }

  if (!node) {
    return <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-5xl"><Link to="/pages" className="inline-flex items-center gap-2 text-sm text-brass-400 hover:text-brass-300"><ArrowLeft size={15} /> Back to Pages</Link><section className="card p-8 mt-5 text-center"><FolderTree size={30} className="mx-auto text-parchment-300/40 mb-3" /><h2 className="font-semibold">Page not found</h2><p className="text-sm text-parchment-300/60 mt-1">It may have been archived or removed.</p></section></div>;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center gap-2 text-xs text-parchment-300/60"><Link to="/pages" className="hover:text-parchment-100">Pages</Link>{parent && <><ChevronRight size={12} /><span>{parent.name}</span></>}<ChevronRight size={12} /><span className="text-parchment-100">{node.name}</span></div>

      <header className="card p-6 border border-ink-700">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="h-14 w-14 rounded-2xl bg-ink-800 border border-ink-600 flex items-center justify-center text-2xl" style={{ color: node.color || "#428475" }}>{node.icon || "◆"}</div>
            <div className="min-w-0"><p className="text-xs text-brass-500 uppercase tracking-wider">Page</p><h1 className="text-2xl font-display font-semibold truncate">{node.name}</h1>{node.description && <p className="text-sm text-parchment-300/65 mt-1 max-w-2xl">{node.description}</p>}<div className="flex flex-wrap gap-2 mt-3">{capabilityLabels.map((capability) => <CapabilityBadge key={capability.key} label={capability.label} />)}{capabilityLabels.length === 0 && <span className="text-xs text-parchment-300/50">No capabilities attached yet.</span>}</div></div>
          </div>
          <div className="flex items-center gap-2"><button type="button" onClick={() => setEditingIdentity((current) => !current)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-ink-600 hover:bg-ink-800 text-sm"><Palette size={14} /> Identity</button><button type="button" onClick={() => navigate(node.pageId ? `/pages?edit=${node.pageId}` : "/pages")} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-ink-600 hover:bg-ink-800 text-sm"><Settings2 size={14} /> Configure page</button></div>
        </div>

        {editingIdentity && <div className="mt-5 pt-5 border-t border-ink-700 grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-xs text-parchment-300">Name<input value={identity.name} onChange={(event) => setIdentity((current) => ({ ...current, name: event.target.value }))} className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500" /></label>
          <label className="text-xs text-parchment-300">Description<textarea value={identity.description} onChange={(event) => setIdentity((current) => ({ ...current, description: event.target.value }))} rows={2} className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500 resize-y" /></label>
          <label className="text-xs text-parchment-300">Icon<input value={identity.icon} onChange={(event) => setIdentity((current) => ({ ...current, icon: event.target.value.slice(0, 4) }))} className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm text-center outline-none focus:border-brass-500" /></label>
          <label className="text-xs text-parchment-300">Color<div className="mt-1 flex items-center gap-2"><input type="color" value={identity.color} onChange={(event) => setIdentity((current) => ({ ...current, color: event.target.value }))} className="h-10 w-14 bg-transparent border-0" /><input value={identity.color} onChange={(event) => setIdentity((current) => ({ ...current, color: event.target.value }))} className="flex-1 bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500" /></div></label>
          <div className="md:col-span-2 flex justify-end"><button type="button" onClick={saveIdentity} disabled={savingIdentity} className="px-4 py-2 rounded-lg bg-brass-500 hover:bg-brass-400 text-ink-950 font-semibold text-sm">{savingIdentity ? "Saving…" : "Save identity"}</button></div>
        </div>}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <section className="lg:col-span-2 card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5"><div><h2 className="font-semibold flex items-center gap-2"><Database size={16} className="text-brass-400" /> Page data</h2><p className="text-xs text-parchment-300/55 mt-1">Persistent values stored by this page and date.</p></div><input type="date" value={dateKey} onChange={(event) => setDateKey(event.target.value)} className="bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-xs outline-none" /></div>

          {loadingValues ? <p className="text-sm text-parchment-300/60">Loading saved data…</p> : (node.fields || []).length === 0 ? <div className="rounded-xl border border-dashed border-ink-600 p-6 text-center"><p className="text-sm">This node has no custom fields yet.</p><p className="text-xs text-parchment-300/55 mt-1">Open Configure to define the data and behavior this page should use.</p></div> : (
            <div className="space-y-4">{(node.fields || []).map((field) => <label key={field.id} className="block text-xs text-parchment-300">{field.name}{field.required ? " *" : ""}<FieldInput field={field} value={values[field.id]} onChange={(value) => setValues((current) => ({ ...current, [field.id]: value }))} />{field.unit && <span className="block text-[11px] text-parchment-300/45 mt-1">Unit: {field.unit}</span>}</label>)}<div className="flex items-center justify-between gap-3 pt-2"><p className={message.includes("✓") ? "text-sm text-emerald-400" : "text-sm text-clay-400"}>{message}</p><button type="button" onClick={saveValues} disabled={savingValues} className="px-4 py-2 rounded-lg bg-brass-500 hover:bg-brass-400 text-ink-950 font-semibold text-sm">{savingValues ? "Saving…" : "Save node data"}</button></div></div>
          )}
          <NodeCapabilityDataEditor node={node} user={user} dateKey={dateKey} />
        </section>

        <aside className="space-y-5">
          <section className="card p-5"><h2 className="font-semibold">Child pages</h2><p className="text-xs text-parchment-300/55 mt-1">{children.length} child page{children.length === 1 ? "" : "s"}</p><div className="mt-4 space-y-1.5">{children.length === 0 ? <p className="text-xs text-parchment-300/50">No child nodes yet.</p> : children.map((child) => <Link key={child.id} to={`/pages/node/${child.id}`} className="flex items-center gap-2 rounded-lg px-3 py-2 bg-ink-800/50 hover:bg-ink-800"><span style={{ color: child.color || "#428475" }}>{child.icon || "◆"}</span><span className="text-sm truncate">{child.name}</span><ChevronRight size={13} className="ml-auto text-parchment-300/40" /></Link>)}</div></section>
<section className="card p-5"><h2 className="font-semibold">Activity history</h2><p className="text-xs text-parchment-300/55 mt-1">Recent changes to this page are preserved here.</p><div className="mt-4 space-y-3">{activity.length === 0 ? <p className="text-xs text-parchment-300/50">No activity recorded yet.</p> : activity.map((item) => { const stamp = item.createdAt?.toDate ? item.createdAt.toDate() : item.createdAt ? new Date(item.createdAt) : null; return <div key={item.id} className="border-l-2 border-ink-600 pl-3"><p className="text-sm">{item.message}</p><p className="text-[11px] text-parchment-300/45 mt-0.5">{stamp ? stamp.toLocaleString() : "Just now"}</p></div>; })}</div></section>
                    <section className="card p-5"><h2 className="font-semibold">Page structure</h2><div className="mt-3 space-y-2 text-xs text-parchment-300/70"><p><span className="text-parchment-200">Parent page:</span> {parent?.name || "Root"}</p><p><span className="text-parchment-200">Child pages:</span> {children.length}</p><p><span className="text-parchment-200">Data fields:</span> {(node.fields || []).length}</p><p><span className="text-parchment-200">Capabilities:</span> {(node.capabilities || []).length}</p><p><span className="text-parchment-200">Status:</span> {node.archived ? "Archived" : "Active"}</p></div></section>
        </aside>
      </div>

      <div><Link to="/pages" className="inline-flex items-center gap-2 text-sm text-brass-400 hover:text-brass-300"><ArrowLeft size={15} /> Back to Pages</Link></div>
    </div>
  );
}
