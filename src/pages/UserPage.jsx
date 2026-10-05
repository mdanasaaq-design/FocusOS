import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useParams } from "react-router-dom";
import { Settings2, Plus, LayoutDashboard, ListTodo, Timer, Clock3, Repeat2, Target, Dumbbell, Scale, BarChart3, StickyNote, CalendarDays, Bell, Table2, FolderKanban, FileText, Trash2 } from "lucide-react";
import { useAuth } from "../lib/auth";
import { subscribePage, subscribePages, addPage, setPageValues } from "../data/pages";
import { subscribeUserCapabilities } from "../data/userCapabilities";
import { addCapabilityActivity, restoreCapabilityActivity, softDeleteCapabilityActivity, subscribeCapabilityActivity, updateCapabilityActivity } from "../data/capabilityActivity";
import { subscribeNodes, addNode } from "../data/nodes";
import { todayKey } from "../lib/dates";
import { CAPABILITIES, normalizeCapabilities } from "../modules/capabilities";
import PageCapabilityRuntime from "../components/PageCapabilityRuntime";

const ICONS = {
  tasks: ListTodo, focus: Timer, timeTracking: Clock3, habits: Repeat2, routines: Repeat2,
  goals: Target, workout: Dumbbell, measurements: Scale, analytics: BarChart3, notes: StickyNote,
  calendar: CalendarDays, reminders: Bell, tracking: BarChart3, timetables: Table2, files: FolderKanban,
  pomodoro: Timer, exercise: Dumbbell, study: FileText,
};

const LABELS = Object.fromEntries(CAPABILITIES.map((item) => [item.key, item.label]));
const configuredTimeZone = () => document.documentElement.dataset.timeZone || "Asia/Kolkata";

function FieldInput({ field, value, onChange }) {
  const common = "mt-1 w-full bg-ink-800 border border-ink-600 rounded-lg px-3 py-2 text-sm text-parchment-100 outline-none focus:border-brass-500";
  if (field.type === "checkbox") return <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} aria-label={field.name || "Checkbox"} className="mt-2 h-4 w-4 accent-brass-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-500/70" />;
  if (field.type === "select") return <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={common}><option value="">Select…</option>{(field.options || []).map((o) => <option key={o} value={o}>{o}</option>)}</select>;
  if (field.type === "tags") return <input value={Array.isArray(value) ? value.join(", ") : value ?? ""} onChange={(e) => onChange(e.target.value.split(",").map((v) => v.trim()).filter(Boolean))} className={common} placeholder="tag1, tag2" />;
  const type = field.type === "number" || field.type === "percentage" ? "number" : field.type === "date" ? "date" : field.type === "time" ? "time" : field.type === "url" ? "url" : "text";
  return <input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={common} />;
}

function capabilityPath(pageId, key) {
  return key.startsWith("custom:") ? `/page/${pageId}/custom_${key.slice(7)}` : `/page/${pageId}/${key}`;
}

export default function UserPage() {
  const { pageId, viewKey } = useParams();
  const { user } = useAuth();
  const [page, setPage] = useState(undefined);
  const [nodes, setNodes] = useState([]);
  const [pages, setPages] = useState([]);
  const [childName, setChildName] = useState("");
  const [values, setValues] = useState({});
  const [newChild, setNewChild] = useState("");
  const [saving, setSaving] = useState(false);
  const [userCapabilities, setUserCapabilities] = useState([]);
  const [activity, setActivity] = useState([]);
  const [error, setError] = useState("");
  const [deletedItem, setDeletedItem] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyCapability, setHistoryCapability] = useState("all");
  const [historyStatus, setHistoryStatus] = useState("all");

  useEffect(() => {
    if (!user || !pageId) return;
    const unsubPage = subscribePage(user.uid, pageId, setPage);
    const unsubNodes = subscribeNodes(user.uid, "core", setNodes);
    const unsubCapabilities = subscribeUserCapabilities(user.uid, setUserCapabilities);
    const unsubPages = subscribePages(user.uid, setPages);
    const unsubActivity = subscribeCapabilityActivity(user.uid, { pageId, limit: 0, onError: (err) => setError(err.message || "Unable to load Page activity.") }, setActivity);
    return () => { unsubPage(); unsubNodes(); unsubCapabilities(); unsubPages(); unsubActivity(); };
  }, [user, pageId]);

  const config = page?.config || {};
  useEffect(() => {
    if (!page) return;
    setValues(page.fieldValues || page.values?.[todayKey(new Date(), configuredTimeZone())] || {});
  }, [page]);
  const fields = Array.isArray(config.fields) ? config.fields : [];
  const capabilities = normalizeCapabilities(config.capabilities);
  const children = useMemo(() => nodes.filter((node) => node.pageId === pageId && !node.archived && !node.trashedAt), [nodes, pageId]);
  const childPages = useMemo(() => pages.filter((item) => item.parentId === pageId && !item.archived && !item.trashedAt), [pages, pageId]);

  const customDefinitions = userCapabilities.filter((item) => capabilities.includes("custom:" + item.id));
  const navItems = capabilities.map((key) => {
    const definition = key.startsWith("custom:") ? customDefinitions.find((item) => "custom:" + item.id === key) : null;
    return { key, label: definition?.name || LABELS[key] || key.replace(/^custom:/, ""), icon: ICONS[key] || FileText };
  });
  const selectedCapability = viewKey?.startsWith("custom_") ? "custom:" + viewKey.slice(7) : viewKey || null;
  const showHistory = viewKey === "history";
  const historyCapabilities = useMemo(() => [...new Set(activity.map((item) => item.capability).filter(Boolean))].sort(), [activity]);
  const historyStatuses = useMemo(() => [...new Set(activity.map((item) => item.status || "unknown"))].sort(), [activity]);
  const filteredHistory = useMemo(() => { const query = historyQuery.trim().toLowerCase(); return activity.filter((item) => { if (historyCapability !== "all" && item.capability !== historyCapability) return false; if (historyStatus !== "all" && (item.status || "unknown") !== historyStatus) return false; if (!query) return true; return [item.title, item.type, item.capability, item.date, item.value, item.unit].filter((value) => value !== undefined && value !== null).some((value) => String(value).toLowerCase().includes(query)); }); }, [activity, historyQuery, historyCapability, historyStatus]);
  const selectedNav = navItems.find((item) => item.key === selectedCapability);
  const showOverview = !selectedCapability || (!selectedNav && !showHistory);

  if (page === undefined) return <div className="p-8 text-sm text-parchment-300/60">Loading page…</div>;
  if (!page) return <div className="p-8"><p className="text-lg font-semibold">Page not found</p><Link to="/pages" className="text-sm text-brass-400">Back to Pages</Link></div>;

  async function saveFields() {
    const nextErrors = {};
    for (const field of fields) {
      if (!field.required) continue;
      const value = values[field.id];
      const empty = value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
      if (empty) nextErrors[field.id] = "This field is required.";
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setError("Complete the required Page fields before saving.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await setPageValues(user.uid, page.id, null, values);
      await addCapabilityActivity(user.uid, { pageId: page.id, capability: "page", type: "field_snapshot", title: "Page fields saved", date: todayKey(), status: "completed", metadata: { values } });
    } catch (err) {
      setError(err.message || "Unable to save Page fields.");
    } finally { setSaving(false); }
  }

  async function createChild(event) {
    event.preventDefault();
    const name = newChild.trim();
    if (!name) return;
    setError("");
    try {
      await addNode(user.uid, { moduleKey: "core", pageId: page.id, name, parentId: null, fields: [] });
      setNewChild("");
    } catch (err) {
      setError(err.message || "Unable to create item.");
    }
  }

  async function createChildPage(event) {
    event.preventDefault();
    if (!childName.trim()) return;
    setError("");
    try {
      await addPage(user.uid, { name: childName.trim(), parentId: page.id });
      setChildName("");
    } catch (err) {
      setError(err.message || "Unable to create sub-page.");
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <header className="border-b border-ink-700/60 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-ink-800 border border-ink-700 text-xl shrink-0" style={{ color: page.color || "#428475" }}>{page.icon || "◆"}</div>
            <div className="min-w-0">
              
              <h1 className="text-2xl font-display font-semibold truncate">{page.name}</h1>
              {page.description && <p className="text-sm text-parchment-300/60 mt-1 truncate">{page.description}</p>}
            </div>
          </div>
          <Link to={`/pages?edit=${page.id}`} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-ink-600 text-sm hover:bg-ink-800"><Settings2 size={15}/> Configure</Link>
        </div>

        <nav className="flex items-center gap-1 mt-5 overflow-x-auto pb-1">
          <NavLink to={`/page/${page.id}`} end className={({ isActive }) => `inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap ${isActive ? "bg-brass-500 text-ink-950 font-semibold" : "text-parchment-300 hover:bg-ink-800"}`}><LayoutDashboard size={15}/> Overview</NavLink>
          {navItems.map((item) => { const Icon = item.icon; return <NavLink key={item.key} to={capabilityPath(page.id, item.key)} className={({ isActive }) => `inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap ${isActive ? "bg-brass-500 text-ink-950 font-semibold" : "text-parchment-300 hover:bg-ink-800"}`}><Icon size={15}/> {item.label}</NavLink>; })}
          <NavLink to={`/page/${page.id}/history`} className={({ isActive }) => `inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap ${isActive ? "bg-brass-500 text-ink-950 font-semibold" : "text-parchment-300 hover:bg-ink-800"}`}><Clock3 size={15}/> History</NavLink>
        </nav>
      </header>

      <main className="py-6">{error && <p role="alert" className="mb-4 rounded-lg border border-clay-500/30 bg-clay-500/10 px-4 py-3 text-sm text-clay-300">{error}</p>}
        {showOverview ? (
          <div className="space-y-6">
            {fields.length > 0 && (
              <section className="card p-6">
                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-2 mb-4"><input value={historyQuery} onChange={(e) => setHistoryQuery(e.target.value)} placeholder="Search history…" aria-label="Search Page history" className="bg-ink-800 border border-ink-600 rounded-lg px-3 py-2 text-sm"/><select value={historyCapability} onChange={(e) => setHistoryCapability(e.target.value)} aria-label="Filter history by capability" className="bg-ink-800 border border-ink-600 rounded-lg px-3 py-2 text-sm"><option value="all">All capabilities</option>{historyCapabilities.map((key) => <option key={key} value={key}>{key}</option>)}</select><select value={historyStatus} onChange={(e) => setHistoryStatus(e.target.value)} aria-label="Filter history by status" className="bg-ink-800 border border-ink-600 rounded-lg px-3 py-2 text-sm"><option value="all">All statuses</option>{historyStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select><button type="button" onClick={() => { setHistoryQuery(""); setHistoryCapability("all"); setHistoryStatus("all"); }} className="rounded-lg border border-ink-600 px-3 py-2 text-xs hover:bg-ink-800">Reset</button></div><div className="flex items-center justify-between gap-3 mb-5"><div><h2 className="font-semibold">Page information</h2><p className="text-xs text-parchment-300/50 mt-1">Your configured fields.</p></div><button type="button" onClick={saveFields} disabled={saving} className="px-4 py-2 rounded-lg bg-brass-500 text-ink-950 font-semibold text-sm">{saving ? "Saving…" : "Save"}</button></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{fields.map((field) => <label key={field.id} className="text-xs text-parchment-300">{field.name}{field.required ? " *" : ""}<FieldInput field={field} value={values[field.id]} onChange={(value) => { setValues((current) => ({ ...current, [field.id]: value })); setFieldErrors((current) => ({ ...current, [field.id]: "" })); }}/>{field.unit && <span className="block text-[11px] text-parchment-300/45 mt-1">{field.unit}</span>}{fieldErrors[field.id] && <span className="block text-[11px] text-clay-300 mt-1" role="alert">{fieldErrors[field.id]}</span>}</label>)}</div>
              </section>
            )}

            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {navItems.map((item) => { const Icon = item.icon; return <Link key={item.key} to={capabilityPath(page.id, item.key)} className="card p-5 hover:border-brass-500/50 transition-colors"><div className="h-9 w-9 rounded-lg bg-ink-700 flex items-center justify-center text-brass-400"><Icon size={18}/></div><h3 className="font-semibold mt-4">{item.label}</h3><p className="text-xs text-parchment-300/50 mt-1">Open {item.label.toLowerCase()} for this Page.</p></Link>; })}
              {navItems.length === 0 && fields.length === 0 && <div className="card p-8 text-center text-sm text-parchment-300/60 sm:col-span-2 lg:col-span-3">This Page is empty. Configure fields or capabilities in Pages.</div>}
            </section>

            {(config.showChildren === true || childPages.length > 0) && (
              <section className="card p-6">
                <div className="flex items-center justify-between gap-3 mb-4"><div><h2 className="font-semibold">Sub-pages</h2><p className="text-xs text-parchment-300/50 mt-1">Build this Page into its own hierarchy.</p></div><span className="text-xs text-parchment-300/50">{childPages.length}</span></div>
                {config.showChildren === true && <><form onSubmit={createChildPage} className="flex gap-2 mb-4"><input value={childName} onChange={(e) => setChildName(e.target.value)} aria-label="New sub-page name" placeholder="New sub-page" className="flex-1 bg-ink-800 border border-ink-600 rounded-lg px-3 py-2 text-sm"/><button type="submit" className="px-4 py-2 rounded-lg bg-brass-500 text-ink-950 text-sm font-semibold">Add</button></form><form onSubmit={createChild} className="flex gap-2 mb-4"><input value={newChild} onChange={(e) => setNewChild(e.target.value)} aria-label="New item name" placeholder="New item" className="flex-1 bg-ink-800 border border-ink-600 rounded-lg px-3 py-2 text-sm"/><button type="submit" className="px-3 py-2 rounded-lg border border-ink-600"><Plus size={15}/></button></form></>}
                <div className="space-y-2">{childPages.map((child) => <Link key={child.id} to={`/page/${child.id}`} className="flex items-center gap-3 rounded-lg bg-ink-800/50 border border-ink-700 px-3 py-3 text-sm hover:bg-ink-800"><span style={{ color: child.color || "#428475" }}>{child.icon || "◆"}</span><span className="flex-1">{child.name}</span><span className="text-xs text-parchment-300/40">Open</span></Link>)}{children.map((child) => <Link key={child.id} to={`/pages/node/${child.id}`} className="flex items-center justify-between rounded-lg bg-ink-800/50 border border-ink-700 px-3 py-2 text-sm"><span>{child.name}</span><span className="text-xs text-parchment-300/40">Open item</span></Link>)}</div>
              </section>
            )}
          </div>
        ) : showHistory ? (
          <section className="card p-6">
            {deletedItem && <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-brass-500/30 bg-brass-500/5 px-3 py-2 text-xs"><span>History record hidden.</span><button type="button" onClick={async () => { try { await restoreCapabilityActivity(user.uid, deletedItem.id); setDeletedItem(null); } catch (err) { setError(err.message || "Unable to restore history record."); } }} className="text-brass-400 font-semibold">Undo</button></div>}
            <div className="flex items-center justify-between gap-3 mb-5"><div><p className="text-xs uppercase tracking-wider text-brass-500">Page history</p><h2 className="text-xl font-display font-semibold">Activity history</h2><p className="text-xs text-parchment-300/50 mt-1">Durable records created by this Page and its capabilities.</p></div><span className="text-xs text-parchment-300/50">{activity.length} records</span></div>
            {activity.length === 0 ? <p className="text-sm text-parchment-300/60">No activity has been recorded for this Page yet.</p> : <div className="space-y-2">{filteredHistory.map((item) => <div key={item.id} className="rounded-lg border border-ink-700 bg-ink-800/40 px-4 py-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-medium truncate">{item.title || item.type}</p><p className="text-[11px] text-parchment-300/50 mt-1">{item.capability} · {item.type}{item.status ? ` · ${item.status}` : ""}</p></div><div className="flex items-center gap-2 shrink-0"><span className="text-[11px] text-parchment-300/50">{item.date || "—"}</span><button type="button" onClick={async () => { const title = window.prompt("Edit history title", item.title || ""); if (title === null) return; try { await updateCapabilityActivity(user.uid, item.id, { title }); } catch (err) { setError(err.message || "Unable to edit history record."); } }} className="p-1.5 rounded-md text-parchment-300/50 hover:text-brass-400" aria-label="Edit history record">Edit</button><button type="button" onClick={async () => { if (!window.confirm("Hide this history record?")) return; try { await softDeleteCapabilityActivity(user.uid, item.id); setDeletedItem(item); setError(""); } catch (err) { setError(err.message || "Unable to delete history record."); } }} className="p-1.5 rounded-md text-parchment-300/50 hover:text-clay-400 hover:bg-clay-500/10" aria-label="Delete history record"><Trash2 size={13}/></button></div></div>{item.value !== null && item.value !== undefined && <p className="text-xs text-brass-400 mt-2">{item.value}{item.unit ? ` ${item.unit}` : ""}</p>}</div>)}</div>}
          </section>
        ) : (
          <section>
            <div className="flex items-center justify-between gap-3 mb-5"><div><p className="text-xs uppercase tracking-wider text-brass-500">Page tool</p><h2 className="text-xl font-display font-semibold">{selectedNav.label}</h2></div><Link to={`/page/${page.id}`} className="text-sm text-parchment-300 hover:text-parchment-100">Back to Overview</Link></div>
            <PageCapabilityRuntime user={user} pageId={page.id} capabilities={capabilities} capabilityConfig={config.capabilityConfig || {}} userCapabilities={userCapabilities} trackers={config.trackers || []} onlyCapability={selectedCapability} />
          </section>
        )}
      </main>
    </div>
  );
}
