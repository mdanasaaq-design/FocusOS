import { useEffect, useMemo, useState } from "react";
import { Archive, ExternalLink, Plus, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { addPage, archivePage, normalizePageConfig, subscribePages, updatePage } from "../data/pages";
import { subscribeUserCapabilities } from "../data/userCapabilities";
import { CAPABILITIES, USER_CAPABILITY_PREFIX } from "../modules/capabilities";
import NodeFieldBuilder from "../components/NodeFieldBuilder";

const DEFAULT_DRAFT = {
  name: "",
  description: "",
  icon: "◆",
  color: "#428475",
  config: normalizePageConfig(),
};

export default function Workspace() {
  const { user } = useAuth();
  const [pages, setPages] = useState([]);
  const [userCapabilities, setUserCapabilities] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState("");
  const [draft, setDraft] = useState(DEFAULT_DRAFT);
  const [newPageName, setNewPageName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return undefined;
    const unsubPages = subscribePages(user.uid, setPages);
    const unsubCapabilities = subscribeUserCapabilities(user.uid, setUserCapabilities);
    return () => {
      unsubPages();
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
    if (!selectedPageId || !pages.some((page) => page.id === selectedPageId)) {
      setSelectedPageId(pages[0].id);
    }
  }, [pages, selectedPageId]);

  useEffect(() => {
    if (!selectedPage) return;
    setDraft({
      name: selectedPage.name || "",
      description: selectedPage.description || "",
      icon: selectedPage.icon || "◆",
      color: selectedPage.color || "#428475",
      config: normalizePageConfig(selectedPage.config),
    });
    setMessage("");
    setError("");
  }, [selectedPage]);

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
      const ref = await addPage(user.uid, { name: newPageName.trim() });
      setNewPageName("");
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
        config: normalizePageConfig(draft.config),
      });
      setMessage("Page saved ✓");
    } catch (err) {
      setError(err.message || "Unable to save Page.");
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive() {
    if (!user || !selectedPage) return;
    if (!window.confirm(`Archive “${selectedPage.name}”? Existing data will be preserved.`)) return;
    setSaving(true);
    setError("");
    try {
      await archivePage(user.uid, selectedPage.id, true);
      setMessage("Page archived.");
    } catch (err) {
      setError(err.message || "Unable to archive Page.");
    } finally {
      setSaving(false);
    }
  }

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
          <input
            value={newPageName}
            onChange={(event) => setNewPageName(event.target.value)}
            placeholder="New Page name..."
            className="flex-1 min-w-[240px] bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500"
          />
          <button
            type="submit"
            disabled={saving || !newPageName.trim()}
            className="inline-flex items-center gap-2 bg-brass-500 hover:bg-brass-400 disabled:opacity-40 text-ink-950 font-semibold rounded-lg px-4 py-2 text-sm"
          >
            <Plus size={16} /> Create Page
          </button>
        </form>
      </section>

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
              <input
                value={draft.icon}
                onChange={(event) => setDraft((current) => ({ ...current, icon: event.target.value.slice(0, 4) }))}
                className="w-20 bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-center"
              />
              <input
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                className="bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm"
              />
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
                onClick={handleArchive}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-ink-600 text-sm text-clay-400"
              >
                <Archive size={15} /> Archive
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
