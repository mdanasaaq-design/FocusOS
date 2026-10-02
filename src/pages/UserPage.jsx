import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Settings2, Plus } from "lucide-react";
import { useAuth } from "../lib/auth";
import { subscribePage, subscribePages, addPage, setPageValues } from "../data/pages";
import { subscribeUserCapabilities } from "../data/userCapabilities";
import { addCapabilityActivity } from "../data/capabilityActivity";
import { subscribeNodes, addNode } from "../data/nodes";
import { todayKey } from "../lib/dates";
import { CAPABILITIES, normalizeCapabilities } from "../modules/capabilities";
import PageCapabilityRuntime from "../components/PageCapabilityRuntime";

function FieldInput({ field, value, onChange }) {
  const common = "mt-1 w-full bg-ink-800 border border-ink-600 rounded-lg px-3 py-2 text-sm text-parchment-100 outline-none focus:border-brass-500";
  if (field.type === "checkbox") return <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} className="mt-2 h-4 w-4 accent-brass-500" />;
  if (field.type === "select") return <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={common}><option value="">Select…</option>{(field.options || []).map((o) => <option key={o} value={o}>{o}</option>)}</select>;
  if (field.type === "tags") return <input value={Array.isArray(value) ? value.join(", ") : value ?? ""} onChange={(e) => onChange(e.target.value.split(",").map((v) => v.trim()).filter(Boolean))} className={common} placeholder="tag1, tag2" />;
  const type = field.type === "number" || field.type === "percentage" ? "number" : field.type === "date" ? "date" : field.type === "time" ? "time" : field.type === "url" ? "url" : "text";
  return <input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={common} />;
}

export default function UserPage() {
  const { pageId } = useParams();
  const { user } = useAuth();
  const [page, setPage] = useState(undefined);
  const [nodes, setNodes] = useState([]);
  const [pages, setPages] = useState([]);
  const [childName, setChildName] = useState("");
  const [values, setValues] = useState({});
  const [newChild, setNewChild] = useState("");
  const [saving, setSaving] = useState(false);
  const [userCapabilities, setUserCapabilities] = useState([]);

  useEffect(() => {
    if (!user || !pageId) return;
    const unsubPage = subscribePage(user.uid, pageId, setPage);
    const unsubNodes = subscribeNodes(user.uid, "core", setNodes);
    const unsubCapabilities = subscribeUserCapabilities(user.uid, setUserCapabilities);
    const unsubPages = subscribePages(user.uid, setPages);
    return () => { unsubPage(); unsubNodes(); unsubCapabilities(); unsubPages(); };
  }, [user, pageId]);

  const config = page?.config || {};
  useEffect(() => {
    if (!page) return;
    setValues(page.values?.[todayKey()] || {});
  }, [page, page?.values]);
  const fields = Array.isArray(config.fields) ? config.fields : [];
  const capabilities = normalizeCapabilities(config.capabilities);
  const children = useMemo(() => nodes.filter((node) => node.pageId === pageId && !node.archived), [nodes, pageId]);
  const childPages = useMemo(() => pages.filter((item) => item.parentId === pageId), [pages, pageId]);

  if (page === undefined) return <div className="p-8 text-sm text-parchment-300/60">Loading page…</div>;
  if (!page) return <div className="p-8"><p className="text-lg font-semibold">Page not found</p><Link to="/settings" className="text-sm text-brass-400">Back to Settings</Link></div>;

  async function saveFields() {
    setSaving(true);
    try {
      await setPageValues(user.uid, page.id, todayKey(), values);
      await addCapabilityActivity(user.uid, { pageId: page.id, capability: "page", type: "field_snapshot", title: "Page fields saved", date: todayKey(), status: "completed", metadata: { values } });
    } finally {
      setSaving(false);
    }
  }

  async function createChild(event) {
    event.preventDefault();
    const name = newChild.trim();
    if (!name) return;
    await addNode(user.uid, { moduleKey: "core", pageId: page.id, name, parentId: null, fields: [] });
    setNewChild("");
  }
  async function createChildPage(event) {
    event.preventDefault();
    if (!childName.trim()) return;
    await addPage(user.uid, { name: childName.trim(), parentId: page.id });
    setChildName("");
  }

  return (
    <div className="p-8 space-y-6 max-w-6xl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-ink-800 border border-ink-700 text-xl" style={{ color: page.color || "#428475" }}>{page.icon || "◆"}</div>
          <div>
            <p className="text-xs text-brass-500 uppercase tracking-wider">Page</p>
            <h1 className="text-2xl font-display font-semibold">{page.name}</h1>
            {page.description && <p className="text-sm text-parchment-300/65 mt-1">{page.description}</p>}
          </div>
        </div>
        <Link to={`/settings?node=${page.id}&page=true`} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-ink-600 text-sm text-parchment-200 hover:bg-ink-800"><Settings2 size={15} /> Configure</Link>
      </header>

      {fields.length > 0 && (
        <section className="card p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div><h2 className="font-semibold">Data</h2><p className="text-xs text-parchment-300/50 mt-1">Only the fields you configured for this Page appear here.</p></div>
            <button type="button" onClick={saveFields} disabled={saving} className="px-4 py-2 rounded-lg bg-brass-500 text-ink-950 font-semibold text-sm">{saving ? "Saving…" : "Save"}</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => <label key={field.id} className="text-xs text-parchment-300">{field.name}{field.required ? " *" : ""}<FieldInput field={field} value={values[field.id]} onChange={(value) => setValues((current) => ({ ...current, [field.id]: value }))}/>{field.unit && <span className="block text-[11px] text-parchment-300/45 mt-1">{field.unit}</span>}</label>)}
          </div>
        </section>
      )}

      {capabilities.length > 0 && (
        <section className="card p-6">
          <h2 className="font-semibold">Capabilities</h2>
          <p className="text-xs text-parchment-300/50 mt-1">Only capabilities you attached to this Page are shown.</p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {capabilities.map((key) => {
              const definition = CAPABILITIES.find((item) => item.key === key);
              return <div key={key} className="rounded-lg border border-ink-700 bg-ink-800/50 p-4"><p className="text-sm font-medium">{definition?.label || key}</p><p className="text-xs text-parchment-300/50 mt-1">{definition?.description || "Configured capability"}</p></div>;
            })}
          </div>
        </section>
      )}

      <PageCapabilityRuntime user={user} pageId={page.id} capabilities={capabilities} capabilityConfig={config.capabilityConfig || {}} userCapabilities={userCapabilities} />

      {config.showChildren === true && (
        <section className="card p-6">
          <div className="flex items-center justify-between gap-3 mb-4"><div><h2 className="font-semibold">Children</h2><p className="text-xs text-parchment-300/50 mt-1">Optional child content for this Page.</p></div><span className="text-xs text-parchment-300/50">{children.length}</span></div>
          <form onSubmit={createChild} className="flex gap-2 mb-4"><input value={newChild} onChange={(e) => setNewChild(e.target.value)} placeholder="Child name" className="flex-1 bg-ink-800 border border-ink-600 rounded-lg px-3 py-2 text-sm"/><button type="submit" className="px-4 py-2 rounded-lg bg-ink-700 border border-ink-600 text-sm"><Plus size={15}/></button></form>
          <form onSubmit={createChildPage} className="flex gap-2 mb-3"><input value={childName} onChange={(e) => setChildName(e.target.value)} placeholder="New child Page" className="flex-1 bg-ink-800 border border-ink-600 rounded-lg px-3 py-2 text-sm"/><button type="submit" className="px-3 py-2 rounded-lg bg-brass-500 text-ink-950 text-sm">Add Page</button></form>
          <div className="space-y-2">{childPages.map((child) => <Link key={child.id} to={`/page/${child.id}`} className="flex items-center justify-between rounded-lg bg-ink-800/50 border border-ink-700 px-3 py-2 text-sm"><span>{child.icon || "◆"} {child.name}</span><span className="text-xs text-parchment-300/40">Open Page</span></Link>)}{children.map((child) => <Link key={child.id} to={`/workspace/node/${child.id}`} className="flex items-center justify-between rounded-lg bg-ink-800/50 border border-ink-700 px-3 py-2 text-sm"><span>{child.name}</span><span className="text-xs text-parchment-300/40">Open item</span></Link>)}{childPages.length === 0 && children.length === 0 && <p className="text-xs text-parchment-300/50">No child content yet.</p>}</div>
        </section>
      )}

      {fields.length === 0 && capabilities.length === 0 && config.showChildren !== true && (
        <section className="card p-8 text-center border-dashed">
          <p className="text-sm text-parchment-300/70">This Page is empty.</p>
          <p className="text-xs text-parchment-300/45 mt-1">Configure fields, capabilities, or child content in Settings to define what this Page does.</p>
          <Link to={`/settings?node=${page.id}&page=true`} className="inline-flex items-center gap-2 mt-4 text-sm text-brass-400"><Settings2 size={15}/> Configure Page</Link>
        </section>
      )}

      <Link to="/" className="inline-flex items-center gap-2 text-sm text-brass-400"><ArrowLeft size={15}/> Dashboard</Link>
    </div>
  );
}
