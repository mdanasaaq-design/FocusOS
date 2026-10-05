import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Plus, Save, Trash2, Home, CheckSquare, Clock3, Star, Heart, Sun, Sparkles, Circle, CircleDot, Diamond, Triangle, Cloud, Zap, Coffee, BookOpen, Briefcase, House, Target, Dumbbell, FileText, CalendarDays, Lightbulb, Wrench, Palette, Music, Wallet, Sprout, Rocket, Brain, BadgeCheck, Folder, ChevronDown, ChevronRight, FolderOpen } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { addPage, normalizePageConfig, subscribePages, updatePage, archivePage, trashPage, restorePage } from "../data/pages";
import { subscribeUserCapabilities } from "../data/userCapabilities";
import { CAPABILITIES, USER_CAPABILITY_PREFIX } from "../modules/capabilities";

const PAGE_ICONS = [
  ["home", Home], ["check", CheckSquare], ["clock", Clock3], ["star", Star], ["heart", Heart], ["sun", Sun],
  ["sparkles", Sparkles], ["circle", Circle], ["circle-dot", CircleDot], ["diamond", Diamond], ["triangle", Triangle],
  ["cloud", Cloud], ["zap", Zap], ["coffee", Coffee], ["book", BookOpen], ["briefcase", Briefcase], ["house", House],
  ["target", Target], ["fitness", Dumbbell], ["note", FileText], ["calendar", CalendarDays], ["idea", Lightbulb],
  ["tools", Wrench], ["palette", Palette], ["music", Music], ["wallet", Wallet], ["growth", Sprout], ["rocket", Rocket],
  ["brain", Brain], ["badge", BadgeCheck], ["folder", Folder],
];

const DEFAULT_DRAFT = {
  name: "",
  description: "",
  icon: "home",
  color: "#428475",
  config: normalizePageConfig(),
};

function pageHasChildren(pages, pageId) {
  return pages.some((page) => page.parentId === pageId && !page.archived && !page.trashedAt);
}

export default function Pages() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedPageId = searchParams.get("edit") || "";
  const [pages, setPages] = useState([]);
  const [archivedPages, setArchivedPages] = useState([]);
  const [userCapabilities, setUserCapabilities] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState("");
  const [draft, setDraft] = useState(DEFAULT_DRAFT);
  const [newPageName, setNewPageName] = useState("");
  const [newPageIcon, setNewPageIcon] = useState("home");
  const [childName, setChildName] = useState("");
  const [childIcon, setChildIcon] = useState("folder");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pageQuery, setPageQuery] = useState("");
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    if (!user) return undefined;
    const unsubPages = subscribePages(user.uid, setPages);
    const unsubArchivedPages = subscribePages(user.uid, (items) => setArchivedPages(items.filter((page) => page.archived)), { includeArchived: true });
    const unsubCapabilities = subscribeUserCapabilities(user.uid, setUserCapabilities);
    return () => { unsubPages(); unsubArchivedPages(); unsubCapabilities(); };
  }, [user]);

  const activeArchivedPages = useMemo(() => archivedPages.filter((page) => !page.trashedAt), [archivedPages]);
  const visiblePageList = useMemo(() => pages.filter((page) => !page.trashedAt).sort((a, b) => (Number(a.config?.navigationOrder) || 0) - (Number(b.config?.navigationOrder) || 0) || a.name.localeCompare(b.name)), [pages]);
  const filteredPageList = useMemo(() => {
    const query = pageQuery.trim().toLowerCase();
    if (!query) return visiblePageList;
    const ids = new Set();
    const byId = new Map(visiblePageList.map((page) => [page.id, page]));
    visiblePageList.forEach((page) => {
      if (!page.name.toLowerCase().includes(query)) return;
      let current = page;
      while (current) {
        ids.add(current.id);
        current = current.parentId ? byId.get(current.parentId) : null;
      }
    });
    return visiblePageList.filter((page) => ids.has(page.id));
  }, [pageQuery, visiblePageList]);

  const selectedPage = useMemo(() => pages.find((page) => page.id === selectedPageId) || null, [pages, selectedPageId]);
  const childPages = useMemo(() => visiblePageList.filter((page) => page.parentId === selectedPageId), [visiblePageList, selectedPageId]);

  const draftSignature = useMemo(() => JSON.stringify({
    name: draft.name.trim(), description: draft.description.trim(), icon: draft.icon, color: draft.color,
    config: normalizePageConfig(draft.config),
  }), [draft]);
  const selectedPageSignature = useMemo(() => selectedPage ? JSON.stringify({
    name: String(selectedPage.name || "").trim(), description: String(selectedPage.description || "").trim(),
    icon: selectedPage.icon || "home", color: selectedPage.color || "#428475", config: normalizePageConfig(selectedPage.config),
  }) : "", [selectedPage]);
  const isDirty = Boolean(selectedPage && draftSignature !== selectedPageSignature);

  useEffect(() => {
    if (!pages.length) { setSelectedPageId(""); return; }
    if (requestedPageId && pages.some((page) => page.id === requestedPageId)) {
      if (selectedPageId !== requestedPageId) setSelectedPageId(requestedPageId);
      return;
    }
    if (!selectedPageId || !pages.some((page) => page.id === selectedPageId)) setSelectedPageId(pages[0].id);
  }, [pages, selectedPageId, requestedPageId]);

  useEffect(() => {
    if (!selectedPage) return;
    setDraft({
      name: selectedPage.name || "", description: selectedPage.description || "", icon: selectedPage.icon || "home",
      color: selectedPage.color || "#428475", config: normalizePageConfig(selectedPage.config),
    });
    setMessage("");
    setError("");
    setExpanded((current) => ({ ...current, [selectedPage.id]: true }));
  }, [selectedPage]);

  useEffect(() => {
    if (!isDirty) return undefined;
    const handleBeforeUnload = (event) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  function toggleCapability(key) {
    setDraft((current) => {
      const capabilities = Array.isArray(current.config.capabilities) ? current.config.capabilities : [];
      return { ...current, config: { ...current.config, capabilities: capabilities.includes(key) ? capabilities.filter((item) => item !== key) : [...capabilities, key] } };
    });
  }

  const allCapabilities = [
    ...CAPABILITIES.map((item) => ({ key: item.key, label: item.label, description: item.description })),
    ...userCapabilities.map((item) => ({ key: `${USER_CAPABILITY_PREFIX}${item.id}`, label: item.name, description: item.description || "User-created capability." })),
  ];

  async function createNewPage(event) {
    event.preventDefault();
    if (!user || !newPageName.trim()) return;
    setSaving(true); setMessage(""); setError("");
    try {
      const ref = await addPage(user.uid, { name: newPageName.trim(), icon: newPageIcon, parentId: null });
      setNewPageName(""); setNewPageIcon("home"); setSelectedPageId(ref.id); setMessage("Page created ✓");
    } catch (err) { setError(err.message || "Unable to create Page."); }
    finally { setSaving(false); }
  }

  async function createChildPage(event) {
    event.preventDefault();
    if (!user || !selectedPage || !childName.trim()) return;
    setSaving(true); setMessage(""); setError("");
    try {
      const ref = await addPage(user.uid, { name: childName.trim(), icon: childIcon, parentId: selectedPage.id });
      await updatePage(user.uid, selectedPage.id, { config: normalizePageConfig({ ...selectedPage.config, showChildren: true }) });
      setChildName(""); setChildIcon("folder"); setExpanded((current) => ({ ...current, [selectedPage.id]: true }));
      setSelectedPageId(ref.id); setMessage("Child Page created ✓");
    } catch (err) { setError(err.message || "Unable to create Child Page."); }
    finally { setSaving(false); }
  }

  async function savePage() {
    if (!user || !selectedPage) return;
    setSaving(true); setMessage(""); setError("");
    try {
      await updatePage(user.uid, selectedPage.id, {
        name: draft.name.trim(), description: draft.description.trim(), icon: draft.icon, color: draft.color,
        config: normalizePageConfig(draft.config),
      });
      setMessage("Page saved ✓");
    } catch (err) { setError(err.message || "Unable to save Page."); }
    finally { setSaving(false); }
  }

  async function handleArchive() {
    if (!user || !selectedPage) return;
    setSaving(true); setError("");
    try { await archivePage(user.uid, selectedPage.id, !selectedPage.archived); setMessage(selectedPage.archived ? "Page restored." : "Page archived."); }
    catch (err) { setError(err.message || "Unable to update Page archive state."); }
    finally { setSaving(false); }
  }

  async function handleTrash() {
    if (!user || !selectedPage) return;
    if (!window.confirm(`Move “${selectedPage.name}” to Trash? Its child Pages and Page data will also be moved to Trash.`)) return;
    setSaving(true); setError("");
    try { await trashPage(user.uid, selectedPage.id); setMessage("Page and its child Pages moved to Trash."); }
    catch (err) { setError(err.message || "Unable to move Page to Trash."); }
    finally { setSaving(false); }
  }

  function renderTree(parentId = null, level = 0) {
    return filteredPageList.filter((page) => (page.parentId || null) === parentId).map((page) => {
      const hasChildren = pageHasChildren(visiblePageList, page.id);
      const open = expanded[page.id] !== false;
      const Icon = PAGE_ICONS.find(([key]) => key === page.icon)?.[1] || FileText;
      return (
        <div key={page.id}>
          <div className="flex items-center gap-1">
            {hasChildren ? (
              <button type="button" onClick={() => setExpanded((current) => ({ ...current, [page.id]: !open }))} className="p-1 rounded text-parchment-300/60 hover:bg-ink-800" aria-label={open ? "Collapse Page" : "Expand Page"}>
                {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </button>
            ) : <span className="w-6" />}
            <button type="button" onClick={() => {
              if (!isDirty || page.id === selectedPageId || window.confirm("You have unsaved Page changes. Switch Pages and discard them?")) setSelectedPageId(page.id);
            }} className={`flex-1 text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${selectedPageId === page.id ? "bg-brass-500/15 text-brass-400" : "text-parchment-300 hover:bg-ink-800"}`} style={{ marginLeft: level * 14 }}>
              <Icon size={16} /><span className="truncate">{page.name}</span>{hasChildren && <span className="text-[10px] text-parchment-300/40">{visiblePageList.filter((item) => item.parentId === page.id).length}</span>}
            </button>
          </div>
          {hasChildren && open && renderTree(page.id, level + 1)}
        </div>
      );
    });
  }

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-6xl">
      <section className="card p-5">
        <form onSubmit={createNewPage} className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
            <select value={newPageIcon} onChange={(event) => setNewPageIcon(event.target.value)} className="w-28 h-10 bg-ink-700 border border-ink-600 rounded-lg px-2 text-sm" aria-label="Page icon">
              {PAGE_ICONS.map(([key]) => <option key={key} value={key}>{key}</option>)}
            </select>
            <input value={newPageName} onChange={(event) => setNewPageName(event.target.value)} placeholder="New Page name..." className="flex-1 bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500" />
          </div>
          <button type="submit" disabled={saving || !newPageName.trim()} className="inline-flex items-center gap-2 bg-brass-500 hover:bg-brass-400 disabled:opacity-40 text-ink-950 font-semibold rounded-lg px-4 py-2 text-sm"><Plus size={16} /> Create Page</button>
        </form>
      </section>

      {activeArchivedPages.length > 0 && <section className="card p-4"><div className="flex items-center justify-between gap-3 mb-3"><div><p className="text-sm font-semibold">Archived Pages</p><p className="text-xs text-parchment-300/50">Archive hides a Page without deleting its data.</p></div><span className="text-xs text-parchment-300/50">{activeArchivedPages.length}</span></div><div className="space-y-2">{activeArchivedPages.map((page) => <div key={page.id} className="flex items-center justify-between gap-3 rounded-lg bg-ink-800/50 px-3 py-2"><span className="text-sm">{page.name}</span><button type="button" onClick={async () => { setSaving(true); try { await restorePage(user.uid, page.id); setMessage(`Restored ${page.name} ✓`); } catch (err) { setError(err.message || "Unable to restore Page."); } finally { setSaving(false); } }} className="text-xs px-3 py-1.5 rounded-lg border border-ink-600 text-brass-400">Restore</button></div>)}</div></section>}

      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-5">
        <section className="card p-3 h-fit">
          <div className="px-3 py-2"><p className="text-xs uppercase tracking-wider text-parchment-300/40">Pages</p><input value={pageQuery} onChange={(event) => setPageQuery(event.target.value)} placeholder="Search Pages..." aria-label="Search Pages" className="mt-2 w-full bg-ink-800 border border-ink-700 rounded-lg px-2.5 py-2 text-xs text-parchment-100 outline-none focus:border-brass-500" /></div>
          <div className="space-y-1">{renderTree()}</div>
          {visiblePageList.length === 0 && <p className="px-3 py-5 text-sm text-parchment-300/60">No Pages yet.</p>}
        </section>

        {selectedPage ? <section className="card p-5 sm:p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-lg font-semibold flex items-center gap-2">{selectedPage.parentId ? "Child Page" : "Page"}: {selectedPage.name}{isDirty && <span className="text-[10px] uppercase tracking-wider text-brass-400 bg-brass-500/10 border border-brass-500/20 rounded-full px-2 py-0.5">Unsaved</span>}</h2><p className="text-xs text-parchment-300/60 mt-1">{selectedPage.parentId ? "This Page is a folder inside its parent. It has its own capabilities, items and history." : "This Page can contain child Pages, like folders inside folders."}</p></div>
            <Link to={`/page/${selectedPage.id}`} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-ink-600 text-sm hover:bg-ink-800">Open Page <ExternalLink size={14} /></Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-3">
            <div><p className="text-[11px] text-parchment-300/50 mb-2">Icon</p><div className="flex flex-wrap gap-1.5">{PAGE_ICONS.map(([key, Icon]) => <button key={key} type="button" onClick={() => setDraft((current) => ({ ...current, icon: key }))} aria-label={key} title={key} className={`h-9 w-9 rounded-lg border flex items-center justify-center ${draft.icon === key ? "border-brass-500 bg-brass-500/15 text-brass-400" : "border-ink-600 bg-ink-700"}`}><Icon size={17} /></button>)}</div></div>
            <div className="space-y-3"><input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm" /><textarea value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} rows={2} placeholder="Optional Page description" className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm" /></div>
            <input type="color" value={draft.color} onChange={(event) => setDraft((current) => ({ ...current, color: event.target.value }))} className="h-10 w-14 bg-transparent border-0" />
          </div>

          <section className="border-t border-ink-700 pt-5 space-y-3">
            <div><p className="text-sm font-semibold">Child Pages</p><p className="text-xs text-parchment-300/55 mt-1">Create folders inside this Page. Each child is a complete Page with its own capabilities, items and history.</p></div>
            <form onSubmit={createChildPage} className="flex flex-wrap gap-2">
              <select value={childIcon} onChange={(event) => setChildIcon(event.target.value)} className="w-28 bg-ink-700 border border-ink-600 rounded-lg px-2 py-2 text-sm" aria-label="Child Page icon">
                {PAGE_ICONS.map(([key]) => <option key={key} value={key}>{key}</option>)}
              </select>
              <input value={childName} onChange={(event) => setChildName(event.target.value)} placeholder={`New Page inside “${selectedPage.name}”...`} className="flex-1 min-w-[180px] bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm" />
              <button type="submit" disabled={saving || !childName.trim()} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brass-500 text-ink-950 font-semibold text-sm"><Plus size={15} /> Add child</button>
            </form>
            {childPages.length > 0 && <div className="grid sm:grid-cols-2 gap-2">{childPages.map((child) => { const Icon = PAGE_ICONS.find(([key]) => key === child.icon)?.[1] || FileText; return <button key={child.id} type="button" onClick={() => setSelectedPageId(child.id)} className="flex items-center gap-3 rounded-lg border border-ink-700 bg-ink-800/50 px-3 py-3 text-left hover:bg-ink-800"><Icon size={17} /><span className="min-w-0 flex-1"><span className="block text-sm truncate">{child.name}</span><span className="block text-[11px] text-parchment-300/40">{pageHasChildren(visiblePageList, child.id) ? "Folder" : "Page"}</span></span><ChevronRight size={14} /></button>; })}</div>}
          </section>

          <section className="border-t border-ink-700 pt-5 space-y-3">
            <div><p className="text-sm font-semibold">Capabilities</p><p className="text-xs text-parchment-300/55 mt-1">Attach only the behaviors this Page needs. Activity is stored against this Page.</p></div>
            {allCapabilities.map((capability) => <label key={capability.key} className="flex items-center justify-between gap-4 border-b border-ink-700/60 pb-3 last:border-0"><div><p className="text-sm">{capability.label}</p><p className="text-[11px] text-parchment-300/50">{capability.description}</p></div><input type="checkbox" checked={draft.config.capabilities.includes(capability.key)} onChange={() => toggleCapability(capability.key)} className="h-4 w-4 accent-brass-500" /></label>)}
          </section>

          {CAPABILITIES.filter((capability) => draft.config.capabilities.includes(capability.key) && capability.configFields?.length).map((capability) => <div key={capability.key} className="border-t border-ink-700 pt-5 space-y-3"><p className="text-sm font-semibold">{capability.label} configuration</p><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{capability.configFields.map((field) => <label key={field.id} className="text-xs text-parchment-300">{field.name}<input type={field.type === "number" ? "number" : "text"} value={draft.config.capabilityConfig?.[capability.key]?.[field.id] ?? ""} onChange={(event) => setDraft((current) => ({ ...current, config: { ...current.config, capabilityConfig: { ...current.config.capabilityConfig, [capability.key]: { ...(current.config.capabilityConfig?.[capability.key] || {}), [field.id]: field.type === "number" ? Number(event.target.value) : event.target.value } } } }))} className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm" /></label>)}</div></div>)}

          <section className="border-t border-ink-700 pt-5 space-y-3">
            <p className="text-sm font-semibold">Visibility & navigation</p>
            <label className="flex items-center justify-between gap-4 text-sm"><span><span className="block">Primary navigation</span><span className="block text-[11px] text-parchment-300/50">Show this Page in the main sidebar.</span></span><input type="checkbox" checked={draft.config.showInNavigation === true} onChange={(event) => setDraft((current) => ({ ...current, config: { ...current.config, showInNavigation: event.target.checked } }))} className="h-4 w-4 accent-brass-500" /></label>
            <label className="flex items-center justify-between gap-4 text-sm"><span><span className="block">Pin to Dashboard</span><span className="block text-[11px] text-parchment-300/50">Pinning adds this Page to Dashboard and primary navigation. Unpinning removes the automatic navigation promotion.</span></span><input type="checkbox" checked={draft.config.showOnDashboard === true} onChange={(event) => setDraft((current) => ({ ...current, config: { ...current.config, showOnDashboard: event.target.checked, showInNavigation: event.target.checked ? true : (current.config.navigationPromotedByDashboard ? false : current.config.showInNavigation), navigationPromotedByDashboard: event.target.checked ? true : false } }))} className="h-4 w-4 accent-brass-500" /></label>
            <label className="text-xs text-parchment-300 block">Sidebar order<input type="number" min="0" value={draft.config.navigationOrder} onChange={(event) => setDraft((current) => ({ ...current, config: { ...current.config, navigationOrder: Math.max(0, Number(event.target.value) || 0) } }))} className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm" /></label>
          </section>

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={savePage} disabled={saving || !draft.name.trim() || !isDirty} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brass-500 text-ink-950 font-semibold text-sm"><Save size={15} /> {saving ? "Saving…" : isDirty ? "Save Page" : message || "Saved"}</button>
            <button type="button" onClick={handleArchive} disabled={saving} className="px-4 py-2 rounded-lg border border-ink-600 text-sm">{selectedPage.archived ? "Restore Page" : "Archive Page"}</button>
            <button type="button" onClick={handleTrash} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-ink-600 text-clay-400 text-sm"><Trash2 size={15} /> Move to Trash</button>
          </div>
          {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        </section> : <section className="card p-10 text-center text-sm text-parchment-300/60">Create a Page to start building FocusOS.</section>}
      </div>
    </div>
  );
}