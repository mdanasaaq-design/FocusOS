import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Plus, Save, Trash2 } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { addPage, normalizePageConfig, subscribePages, updatePage, trashPage, restorePage } from "../data/pages";
import { subscribeUserCapabilities } from "../data/userCapabilities";
import { CAPABILITIES, USER_CAPABILITY_PREFIX } from "../modules/capabilities";
import NodeFieldBuilder from "../components/NodeFieldBuilder";

const PAGE_PRESETS = { blank: { label: "Blank", capabilities: [], fields: [] }, project: { label: "Project", capabilities: ["tasks", "goals", "notes", "calendar"], fields: [{ id: "status", name: "Status", type: "text" }, { id: "owner", name: "Owner", type: "text" }] }, habit: { label: "Habit", capabilities: ["habits", "analytics"], fields: [] }, routine: { label: "Routine", capabilities: ["routines", "tasks"], fields: [] }, tracking: { label: "Tracking", capabilities: ["tracking", "analytics"], fields: [] } };

const DEFAULT_DRAFT = {
  name: "",
  description: "",
  icon: "◆",
  color: "#428475",
  parentId: null,
  config: normalizePageConfig(),
};

export default function Workspace() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedPageId = searchParams.get("edit") || "";
  const [pages, setPages] = useState([]);
  const [archivedPages, setArchivedPages] = useState([]);
  const [userCapabilities, setUserCapabilities] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState("");
  const [draft, setDraft] = useState(DEFAULT_DRAFT);
  const [newPageName, setNewPageName] = useState("");
  const [newPagePreset, setNewPagePreset] = useState("blank");
  const [newPageParentId, setNewPageParentId] = useState("");
  const [newPageIcon, setNewPageIcon] = useState("◆");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return undefined;
    const unsubPages = subscribePages(user.uid, setPages);
    const unsubArchivedPages = subscribePages(user.uid, (items) => setArchivedPages(items.filter((page) => page.archived)), { includeArchived: true });
    const unsubCapabilities = subscribeUserCapabilities(user.uid, setUserCapabilities);
    return () => {
      unsubPages();
      unsubArchivedPages();
      unsubCapabilities();
    };
  }, [user]);

  const selectedPage = useMemo(
    () => pages.find((page) => page.id === selectedPageId) || null,
    [pages, selectedPageId]
  );

  useEffect(() => {
    if (!pages.length) {
      setSelectedPageId("");
      return;
    }
    if (requestedPageId && pages.some((page) => page.id === requestedPageId)) {
      if (selectedPageId !== requestedPageId) setSelectedPageId(requestedPageId);
      return;
    }
    if (!selectedPageId || !pages.some((page) => page.id === selectedPageId)) {
      setSelectedPageId(pages[0].id);
    }
  }, [pages, selectedPageId, requestedPageId]);

  useEffect(() => {
    if (!selectedPage) return;
    setDraft({
      name: selectedPage.name || "",
      description: selectedPage.description || "",
      icon: selectedPage.icon || "◆",
      color: selectedPage.color || "#428475",
      parentId: selectedPage.parentId || null,
      config: normalizePageConfig(selectedPage.config),
    });
    setMessage("");
    setError("");
  }, [selectedPage]);

  function isDescendant(candidateId, ancestorId, seen = new Set()) {
    if (!candidateId || seen.has(candidateId)) return false;
    seen.add(candidateId);
    const candidate = pages.find((page) => page.id === candidateId);
    if (!candidate?.parentId) return false;
    return candidate.parentId === ancestorId || isDescendant(candidate.parentId, ancestorId, seen);
  }

  function updateCapabilityConfig(capabilityKey, fieldId, value) {
    setDraft((current) => ({
      ...current,
      config: {
        ...current.config,
        capabilityConfig: {
          ...current.config.capabilityConfig,
          [capabilityKey]: {
            ...(current.config.capabilityConfig?.[capabilityKey] || {}),
            [fieldId]: value,
          },
        },
      },
    }));
  }

  const allCapabilities = [
    ...CAPABILITIES.map((item) => ({
      key: item.key,
      label: item.label,
      description: item.description,
    })),
    ...userCapabilities.map((item) => ({
      key: `${USER_CAPABILITY_PREFIX}${item.id}`,
      label: item.name,
      description: item.description || "User-created capability.",
    })),
  ];

  async function createNewPage(event) {
    event.preventDefault();
    if (!user || !newPageName.trim()) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const preset = PAGE_PRESETS[newPagePreset] || PAGE_PRESETS.blank;
      const ref = await addPage(user.uid, { name: newPageName.trim(), icon: newPageIcon, parentId: newPageParentId || null });
      await updatePage(user.uid, ref.id, { config: normalizePageConfig({ capabilities: preset.capabilities, fields: preset.fields, showInNavigation: true, capabilityConfig: {} }) });
      setNewPageName("");
      setNewPageParentId("");
      setNewPageIcon("◆");
      setNewPagePreset("blank");
      setSelectedPageId(ref.id);
      setMessage("Page created ✓");
    } catch (err) {
      setError(err.message || "Unable to create Page.");
    } finally {
      setSaving(false);
    }
  }

  async function savePage() {
    if (!user || !selectedPage) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await updatePage(user.uid, selectedPage.id, {
        name: draft.name.trim(),
        description: draft.description.trim(),
        icon: draft.icon,
        color: draft.color,
        parentId: draft.parentId || null,
        config: normalizePageConfig(draft.config),
      });
      setMessage("Page saved ✓");
    } catch (err) {
      setError(err.message || "Unable to save Page.");
    } finally {
      setSaving(false);
    }
  }

  async function handleTrash() {
    if (!user || !selectedPage) return;
    if (!window.confirm(`Move “${selectedPage.name}” to Trash? It will be permanently deleted after 30 days.`)) return;
    setSaving(true);
    setError("");
    try {
      await trashPage(user.uid, selectedPage.id);
      setMessage("Page moved to Trash.");
    } catch (err) {
      setError(err.message || "Unable to move Page to Trash.");
    } finally {
      setSaving(false);
    }
  }

  function addTracker() { setDraft((current) => ({ ...current, config: { ...current.config, trackers: [...(current.config.trackers || []), { id: `tracker-${Date.now()}`, name: `Tracker ${(current.config.trackers || []).length + 1}`, type: "number", unit: "", target: "", color: "#428475" }] } })); }
  function updateTracker(id, patch) { setDraft((current) => ({ ...current, config: { ...current.config, trackers: (current.config.trackers || []).map((tracker) => tracker.id === id ? { ...tracker, ...patch } : tracker) } })); }
  function removeTracker(id) { setDraft((current) => ({ ...current, config: { ...current.config, trackers: (current.config.trackers || []).filter((tracker) => tracker.id !== id) } })); }

  function toggleCapability(key) {
    setDraft((current) => ({
      ...current,
      config: {
        ...current.config,
        capabilities: current.config.capabilities.includes(key)
          ? current.config.capabilities.filter((item) => item !== key)
          : [...current.config.capabilities, key],
      },
    }));
  }

  return (
    <div className="p-8 space-y-6 max-w-6xl">
      <header>
        <p className="text-xs text-brass-500 mb-1">Workspace</p>
        <h2 className="text-2xl font-display font-semibold">Page Builder</h2>
        <p className="text-sm text-parchment-300/70 mt-1">
          Create Pages, decide what each Page does, and open the live Page runtime.
        </p>
      </header>

      <section className="card p-5">
        <form onSubmit={createNewPage} className="flex flex-wrap gap-3">
          <select value={newPageIcon} onChange={(event) => setNewPageIcon(event.target.value)} className="w-16 bg-ink-700 border border-ink-600 rounded-lg px-2 py-2 text-center text-lg" aria-label="Page icon">{["◆","⌂","✓","◷","★","♡","☀","✦","✧","●","○","◇","△","⬟","⬢","☁","⚡","☕","📚","💼","🏠","🎯","💪","📝","📅","💡","🔧","🎨","🎵","💰","🌱","🚀","🧠","❤️","⭐"].map((icon) => <option key={icon} value={icon}>{icon}</option>)}</select>
          <input
            value={newPageName}
            onChange={(event) => setNewPageName(event.target.value)}
            placeholder="New Page name..."
            className="flex-1 min-w-[220px] bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500"
          />
          <select value={newPagePreset} onChange={(event) => setNewPagePreset(event.target.value)} className="bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm"><option value="blank">Blank Page</option>{Object.entries(PAGE_PRESETS).filter(([key]) => key !== "blank").map(([key, preset]) => <option key={key} value={key}>{preset.label}</option>)}</select>
          <select value={newPageParentId} onChange={(event) => setNewPageParentId(event.target.value)} className="bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm">
            <option value="">Root Page</option>
            {pages.filter((page) => page.id !== selectedPageId && !isDescendant(page.id, selectedPageId)).map((page) => <option key={page.id} value={page.id}>{page.name}</option>)}
          </select>
          <button
            type="submit"
            disabled={saving || !newPageName.trim()}
            className="inline-flex items-center gap-2 bg-brass-500 hover:bg-brass-400 disabled:opacity-40 text-ink-950 font-semibold rounded-lg px-4 py-2 text-sm"
          >
            <Plus size={16} /> Create Page
          </button>
        </form>
      </section>

      {archivedPages.filter((page) => !page.trashedAt).length > 0 && (
        <section className="card p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div><p className="text-sm font-semibold">Archived Pages</p><p className="text-xs text-parchment-300/50">Archive hides a Page without deleting its data. Trash permanently removes it after 30 days.</p></div>
            <span className="text-xs text-parchment-300/50">{archivedPages.length}</span>
          </div>
          <div className="space-y-2">{archivedPages.filter((page) => !page.trashedAt).map((page) => (
            <div key={page.id} className="flex items-center justify-between gap-3 rounded-lg bg-ink-800/50 px-3 py-2">
              <span className="text-sm">{page.icon || "◆"} {page.name}</span>
              <button type="button" onClick={async () => { setSaving(true); setError(""); try { await restorePage(user.uid, page.id); setMessage(`Restored ${page.name} ✓`); } catch (err) { setError(err.message || "Unable to restore Page."); } finally { setSaving(false); } }} className="text-xs px-3 py-1.5 rounded-lg border border-ink-600 text-brass-400">Restore</button>
            </div>
          ))}</div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5">
        <section className="card p-3 h-fit">
          <p className="px-3 py-2 text-xs uppercase tracking-wider text-parchment-300/40">Your Pages</p>
          {pages.length === 0 ? (
            <p className="px-3 py-5 text-sm text-parchment-300/60">No Pages yet.</p>
          ) : (
            <div className="space-y-1">
              {pages.map((page) => (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => setSelectedPageId(page.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                    selectedPageId === page.id
                      ? "bg-brass-500/15 text-brass-400"
                      : "text-parchment-300 hover:bg-ink-800"
                  }`}
                >
                  <span style={{ color: page.color || "#428475" }}>{page.icon || "◆"}</span>
                  <span className="truncate">{page.name}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        {selectedPage ? (
          <section className="card p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Configure Page</h3>
                <p className="text-xs text-parchment-300/60 mt-1">The Page starts empty; capabilities add behavior.</p>
              </div>
              <Link
                to={`/page/${selectedPage.id}`}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-ink-600 text-sm hover:bg-ink-800"
              >
                Open Page <ExternalLink size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-3">
              <div className="space-y-2"><p className="text-[11px] text-parchment-300/50">Icon</p><div className="flex flex-wrap gap-1.5">{["◆","⌂","✓","◷","★","♡","☀","✦","✧","●","○","◇","△","⬟","⬢","☁","⚡","☕","📚","💼","🏠","🎯","💪","📝","📅","💡","🔧","🎨","🎵","💰","🌱","🚀","🧠","❤️","⭐"].map((icon) => <button key={icon} type="button" onClick={() => setDraft((current) => ({ ...current, icon }))} className={`h-9 w-9 rounded-lg border text-base ${draft.icon === icon ? "border-brass-500 bg-brass-500/15 text-brass-400" : "border-ink-600 bg-ink-700"}`}>{icon}</button>)}</div></div>
              <input
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                className="bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm"
              />
              <select value={draft.parentId || ""} onChange={(event) => setDraft((current) => ({ ...current, parentId: event.target.value || null }))} className="bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm">
                <option value="">Root Page</option>
                {pages.filter((page) => page.id !== selectedPage.id && !isDescendant(page.id, selectedPage.id)).map((page) => <option key={page.id} value={page.id}>{page.name}</option>)}
              </select>
              <input
                type="color"
                value={draft.color}
                onChange={(event) => setDraft((current) => ({ ...current, color: event.target.value }))}
                className="h-10 w-14 bg-transparent border-0"
              />
            </div>

            <textarea
              value={draft.description}
              onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
              rows={2}
              placeholder="Optional Page description"
              className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm"
            />

            <div className="border-t border-ink-700 pt-5 space-y-3">
              <div>
                <p className="text-sm font-semibold">Page fields</p>
                <p className="text-xs text-parchment-300/55 mt-1">Define information this Page can store.</p>
              </div>
              <NodeFieldBuilder
                fields={draft.config.fields}
                onChange={(fields) => setDraft((current) => ({ ...current, config: { ...current.config, fields } }))}
              />
            </div>

            <div className="border-t border-ink-700 pt-5 space-y-3">
              <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold">Trackers</p><p className="text-xs text-parchment-300/55 mt-1">Create multiple independent trackers on the same Page.</p></div><button type="button" onClick={addTracker} className="px-3 py-1.5 rounded-lg border border-ink-600 text-xs">+ Add tracker</button></div>
              {(draft.config.trackers || []).map((tracker) => <div key={tracker.id} className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] gap-2 rounded-lg bg-ink-800/50 p-3"><input value={tracker.name} onChange={(e) => updateTracker(tracker.id, { name: e.target.value })} className="bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm" placeholder="Tracker name"/><select value={tracker.type} onChange={(e) => updateTracker(tracker.id, { type: e.target.value })} className="bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm"><option value="number">Number</option><option value="percentage">Percentage</option><option value="yesno">Yes / No</option><option value="duration">Duration</option></select><input value={tracker.unit} onChange={(e) => updateTracker(tracker.id, { unit: e.target.value })} className="bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm" placeholder="Unit"/><input value={tracker.target} onChange={(e) => updateTracker(tracker.id, { target: e.target.value })} className="bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm" placeholder="Target"/><button type="button" onClick={() => removeTracker(tracker.id)} className="px-3 py-2 rounded-lg border border-ink-600 text-clay-400">×</button></div>)}
            </div>

            <div className="border-t border-ink-700 pt-5 space-y-3">
              <div>
                <p className="text-sm font-semibold">Capabilities</p>
                <p className="text-xs text-parchment-300/55 mt-1">Attach only the behaviors this Page needs.</p>
              </div>
              {allCapabilities.map((capability) => (
                <label key={capability.key} className="flex items-center justify-between gap-4 border-b border-ink-700/60 pb-3 last:border-0">
                  <div>
                    <p className="text-sm">{capability.label}</p>
                    <p className="text-[11px] text-parchment-300/50">{capability.description}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={draft.config.capabilities.includes(capability.key)}
                    onChange={() => toggleCapability(capability.key)}
                    className="h-4 w-4 accent-brass-500"
                  />
                </label>
              ))}
            </div>

            {CAPABILITIES.filter((capability) => draft.config.capabilities.includes(capability.key) && capability.configFields?.length).map((capability) => (
              <div key={capability.key} className="border-t border-ink-700 pt-5 space-y-3">
                <div>
                  <p className="text-sm font-semibold">{capability.label} configuration</p>
                  <p className="text-xs text-parchment-300/50">Settings are stored with this Page and affect only this Page.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {capability.configFields.map((field) => {
                    const value = draft.config.capabilityConfig?.[capability.key]?.[field.id] ?? "";
                    return (
                      <label key={field.id} className="text-xs text-parchment-300">
                        {field.name}
                        {field.type === "select" ? (
                          <select value={value} onChange={(event) => updateCapabilityConfig(capability.key, field.id, event.target.value)} className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm">
                            <option value="">Default</option>
                            {(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
                          </select>
                        ) : (
                          <input type={field.type === "number" ? "number" : "text"} value={value} onChange={(event) => updateCapabilityConfig(capability.key, field.id, field.type === "number" ? Number(event.target.value) : event.target.value)} className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm" />
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="border-t border-ink-700 pt-5 space-y-3">
              <p className="text-sm font-semibold">Visibility</p>
              <label className="flex items-center justify-between gap-4 text-sm">
                <span>Show in left sidebar</span>
                <input
                  type="checkbox"
                  checked={draft.config.showInNavigation === true}
                  onChange={(event) => setDraft((current) => ({ ...current, config: { ...current.config, showInNavigation: event.target.checked } }))}
                  className="h-4 w-4 accent-brass-500"
                />
              </label>
              <label className="flex items-center justify-between gap-4 text-sm">
                <span>Show on Dashboard</span>
                <input
                  type="checkbox"
                  checked={draft.config.showOnDashboard === true}
                  onChange={(event) => setDraft((current) => ({ ...current, config: { ...current.config, showOnDashboard: event.target.checked } }))}
                  className="h-4 w-4 accent-brass-500"
                />
              </label>
              <label className="text-xs text-parchment-300 block">
                Sidebar order
                <input
                  type="number"
                  min="0"
                  value={draft.config.navigationOrder}
                  onChange={(event) => setDraft((current) => ({
                    ...current,
                    config: { ...current.config, navigationOrder: Math.max(0, Number(event.target.value) || 0) },
                  }))}
                  className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={savePage}
                disabled={saving || !draft.name.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brass-500 text-ink-950 font-semibold text-sm"
              >
                <Save size={15} /> {saving ? "Saving…" : message || "Save Page"}
              </button>
              <button
                type="button"
                onClick={handleTrash}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-ink-600 text-sm text-clay-400"
              >
                <Trash2 size={15} /> Move to Trash
              </button>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </section>
        ) : (
          <section className="card p-10 text-center text-sm text-parchment-300/60">
            Create a Page to start building your FocusOS.
          </section>
        )}
      </div>
    </div>
  );
}
