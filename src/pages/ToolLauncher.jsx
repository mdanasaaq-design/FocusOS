import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { subscribeToolSettings, updateToolGlobalConfig } from "../data/toolSettings.js";
import { TOOL_DEFINITIONS } from "../tools/registry.js";
import { migrateLegacyTasks, previewLegacyTaskMigration, rollbackLegacyTaskMigration } from "../data/taskRecords.js";

export default function ToolLauncher() {
  const { user } = useAuth();
  const tools = TOOL_DEFINITIONS.filter((tool) => tool.surfaces.standalone === "implemented");
  const [globalSettings, setGlobalSettings] = useState({});
  const [savingTool, setSavingTool] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const editedTools = useRef(new Set());
  const [migrationSummary, setMigrationSummary] = useState(null);
  const [migrationBusy, setMigrationBusy] = useState("");
  const [migrationMessage, setMigrationMessage] = useState("");
  const [migrationError, setMigrationError] = useState("");

  useEffect(() => {
    if (!user) return undefined;
    return subscribeToolSettings(user.uid, (nextSettings) => {
      setGlobalSettings((current) => {
        const merged = { ...current };
        for (const tool of tools) {
          if (!editedTools.current.has(tool.key)) merged[tool.key] = nextSettings[tool.key];
        }
        return merged;
      });
    }, (err) => setError(err.message || "Unable to load tool settings."));
  }, [user]);

  async function saveDefaults(toolKey) {
    if (!user || savingTool) return;
    setSavingTool(toolKey);
    setMessage("");
    setError("");
    try {
      await updateToolGlobalConfig(user.uid, toolKey, globalSettings[toolKey] || {});
      editedTools.current.delete(toolKey);
      setMessage("Global defaults saved.");
    } catch (err) {
      setError(err.message || "Unable to save global tool defaults.");
    } finally {
      setSavingTool("");
    }
  }

  async function previewTaskMigration() {
    if (!user || migrationBusy) return;
    setMigrationBusy("preview"); setMigrationError(""); setMigrationMessage("");
    try {
      setMigrationSummary(await previewLegacyTaskMigration(user.uid));
    } catch (err) {
      setMigrationError(err.message || "Unable to preview legacy Task migration.");
    } finally { setMigrationBusy(""); }
  }

  async function runTaskMigration() {
    if (!user || migrationBusy) return;
    if (!window.confirm("Copy legacy Task records into the specialist Tasks collection? Original records will be preserved.")) return;
    setMigrationBusy("migrate"); setMigrationError(""); setMigrationMessage("");
    try {
      const result = await migrateLegacyTasks(user.uid);
      setMigrationSummary(await previewLegacyTaskMigration(user.uid));
      setMigrationMessage(`Migration complete: ${result.migratedNow} records copied; original records preserved.`);
    } catch (err) {
      setMigrationError(err.message || "Legacy Task migration failed. Original records were not intentionally deleted.");
    } finally { setMigrationBusy(""); }
  }

  async function rollbackTaskMigration() {
    if (!user || migrationBusy) return;
    if (!window.confirm("Remove only migration-created Task copies? Original legacy records will remain.")) return;
    setMigrationBusy("rollback"); setMigrationError(""); setMigrationMessage("");
    try {
      const result = await rollbackLegacyTaskMigration(user.uid);
      setMigrationSummary(await previewLegacyTaskMigration(user.uid));
      setMigrationMessage(`Rollback complete: ${result.deletedCopies} migrated copies removed; source records preserved.`);
    } catch (err) {
      setMigrationError(err.message || "Unable to roll back migrated Task copies.");
    } finally { setMigrationBusy(""); }
  }

  function updateDefault(toolKey, field, value) {
    editedTools.current.add(toolKey);
    setGlobalSettings((current) => ({
      ...current,
      [toolKey]: { ...(current[toolKey] || {}), [field]: value },
    }));
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <header>
        <p className="text-xs uppercase tracking-wider text-brass-400">Tool launcher</p>
        <h1 className="text-2xl font-display font-semibold mt-2">Tools</h1>
        <p className="text-sm text-parchment-300/60 mt-2 max-w-2xl">
          Open a tool independently. Tools use the same underlying records as Page views; launching a tool does not create a Page.
        </p>
      </header>

      {error && <p role="alert" className="rounded-lg border border-clay-500/30 bg-clay-500/10 px-3 py-2 text-sm text-clay-300">{error}</p>}
      {message && <p role="status" className="rounded-lg border border-ink-700 px-3 py-2 text-sm text-brass-400">{message}</p>}

      <section aria-label="Legacy Task migration" className="card p-4 space-y-3">
        <div><h2 className="text-lg font-semibold">Legacy Task migration</h2><p className="text-xs text-parchment-300/55 mt-1">Tasks now use their specialist collection. Existing legacy records remain readable; this additive migration copies them without deleting their sources and can be rolled back.</p></div>
        {migrationError && <p role="alert" className="text-xs text-clay-300">{migrationError}</p>}
        {migrationMessage && <p role="status" className="text-xs text-brass-400">{migrationMessage}</p>}
        {migrationSummary && <p className="text-xs text-parchment-300/70">Legacy Tasks: {migrationSummary.legacyTotal} · Migrated copies: {migrationSummary.migratedTotal} · Pending: {migrationSummary.pending} · Specialist records: {migrationSummary.specializedTotal}</p>}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={previewTaskMigration} disabled={Boolean(migrationBusy)} className="px-3 py-2 rounded-lg border border-ink-600 text-xs disabled:opacity-50">{migrationBusy === "preview" ? "Checking…" : "Preview migration"}</button>
          <button type="button" onClick={runTaskMigration} disabled={Boolean(migrationBusy) || (migrationSummary !== null && migrationSummary.pending === 0)} className="px-3 py-2 rounded-lg bg-brass-500 text-ink-950 text-xs font-semibold disabled:opacity-50">{migrationBusy === "migrate" ? "Migrating…" : "Migrate legacy Tasks"}</button>
          <button type="button" onClick={rollbackTaskMigration} disabled={Boolean(migrationBusy) || !migrationSummary?.migratedTotal} className="px-3 py-2 rounded-lg border border-ink-600 text-xs disabled:opacity-50">{migrationBusy === "rollback" ? "Rolling back…" : "Rollback migrated copies"}</button>
        </div>
      </section>

      <section aria-label="Global tool defaults" className="space-y-3">
        <div><h2 className="text-lg font-semibold">Global tool defaults</h2><p className="text-xs text-parchment-300/55 mt-1">These settings are defaults for new and existing views unless a Page view overrides them.</p></div>
        {tools.filter((tool) => Object.keys(tool.globalConfig.schema).length > 0).map((tool) => (
          <div key={tool.key} className="card p-4 space-y-3">
            <h3 className="text-sm font-semibold">{tool.label}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(tool.globalConfig.schema).map(([field, definition]) => (
                <label key={field} className="text-xs text-parchment-300">{({ focusMinutes: "Focus minutes", breakMinutes: "Break minutes", reminderTime: "Reminder time", period: "Period", statusFilter: "Status", priorityFilter: "Priority", sortBy: "Sort by", sortDirection: "Sort direction", groupBy: "Group by", layout: "Layout" })[field] || field}
                  {definition.type === "enum" ? <select value={globalSettings[tool.key]?.[field] ?? definition.default} onChange={(event) => updateDefault(tool.key, field, event.target.value)} className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm">{definition.values.map((value) => <option key={value} value={value}>{value}</option>)}</select> : <input type={definition.type === "time" ? "time" : "number"} min={definition.min} max={definition.max} value={globalSettings[tool.key]?.[field] ?? definition.default} onChange={(event) => updateDefault(tool.key, field, definition.type === "integer" ? Number(event.target.value) : event.target.value)} className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm"/>}
                </label>
              ))}
            </div>
            <button type="button" onClick={() => saveDefaults(tool.key)} disabled={Boolean(savingTool)} className="px-3 py-2 rounded-lg bg-brass-500 text-ink-950 text-sm font-semibold disabled:opacity-50">{savingTool === tool.key ? "Saving…" : "Save defaults"}</button>
          </div>
        ))}
        {tools.every((tool) => Object.keys(tool.globalConfig.schema).length === 0) && <p className="text-xs text-parchment-300/50">No configurable global defaults are registered yet.</p>}
      </section>

            <section aria-label="Available tools" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {tools.map((tool) => (
          <Link
            key={tool.key}
            to={`/tools/${tool.key}`}
            className="card p-4 block hover:border-brass-500/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-500/70"
          >
            <h2 className="text-sm font-semibold">{tool.label}</h2>
            <p className="text-xs text-parchment-300/60 mt-2 leading-5">{tool.description}</p>
            <span className="inline-block mt-4 text-xs text-brass-400">Open tool →</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
