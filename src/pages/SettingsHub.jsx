import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, RotateCcw } from "lucide-react";
import SystemPreferences from "../components/SystemPreferences";
import { useAuth } from "../lib/auth";
import { subscribePages, purgeExpiredTrash, restorePage, permanentlyDeletePage, trashExpiresAt } from "../data/pages";
import { getLegacyCounts, migrateExerciseAndWeight, migrateHabits, migratePomodoro, migrateTasks } from "../data/legacyMigration";

export default function SettingsHub() {
  const { user } = useAuth();
  const [pages, setPages] = useState([]);
  const [trashPages, setTrashPages] = useState([]);
  const [target, setTarget] = useState("");
  const [counts, setCounts] = useState(null);
  const [message, setMessage] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return undefined;
    const unsub = subscribePages(user.uid, setPages);
    const unsubTrash = subscribePages(user.uid, (items) => setTrashPages(items.filter((page) => page.trashedAt)), { includeArchived: true });
    purgeExpiredTrash(user.uid).catch((error) => console.error("Trash cleanup failed", error));
    getLegacyCounts(user.uid).then(setCounts).catch(() => setCounts(null));
    return () => { unsub(); unsubTrash(); };
  }, [user]);

  async function runMigration(kind) {
    if (!target) return;
    setRunning(true);
    setMessage("");
    try {
      const result = kind === "pomodoro"
        ? await migratePomodoro(user.uid, target)
        : kind === "tasks"
          ? await migrateTasks(user.uid, target)
          : kind === "habits"
            ? await migrateHabits(user.uid, target)
            : await migrateExerciseAndWeight(user.uid, target);
      setMessage(result.skipped ? "Already migrated to this Page; no duplicate records were created." : `Imported ${result.count} records.`);
    } catch (error) {
      setMessage(error.message || "Migration failed.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <header>
        <h2 className="text-2xl font-display font-semibold">System Settings</h2>
        <p className="text-sm text-parchment-300/70 mt-1">Configure FocusOS, build Pages, and safely bring forward existing data.</p>
      </header>
      <SystemPreferences />
      <section className="card p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div><h3 className="font-semibold text-lg">Trash</h3><p className="text-xs text-parchment-300/60 mt-1">Pages stay here for 30 days before permanent deletion. Cleanup runs when Settings is opened.</p></div>
          <Trash2 size={18} className="text-clay-400 shrink-0" />
        </div>
        {trashPages.length === 0 ? <p className="text-sm text-parchment-300/60">Trash is empty.</p> : <div className="space-y-2">{trashPages.map((page) => {
          const expiry = trashExpiresAt(page);
          const days = expiry ? Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / 86400000)) : 30;
          return <div key={page.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-ink-700 bg-ink-800/40 px-3 py-3">
            <div className="min-w-0"><p className="text-sm font-medium truncate">{page.icon || "◆"} {page.name}</p><p className="text-[11px] text-parchment-300/50 mt-1">{days} day{days === 1 ? "" : "s"} until permanent deletion</p></div>
            <div className="flex items-center gap-2 shrink-0">
              <button type="button" onClick={async () => { setError(""); try { await restorePage(user.uid, page.id); setMessage("Page restored."); } catch (error) { setError(error.message || "Unable to restore Page."); } }} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-ink-600 text-xs text-brass-400 hover:bg-ink-700"><RotateCcw size={13}/> Restore</button>
              <button type="button" onClick={async () => { if (!window.confirm("Permanently delete this Page and its Page history now?")) return; setError(""); try { await permanentlyDeletePage(user.uid, page.id); setMessage("Page permanently deleted."); } catch (error) { setError(error.message || "Unable to permanently delete Page."); } }} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-clay-500/40 text-xs text-clay-400 hover:bg-clay-500/10"><Trash2 size={13}/> Delete now</button>
            </div>
          </div>;
        })}</div>}
      </section>
      <section className="card p-6 space-y-3">
        <h3 className="font-semibold text-lg">Workspace</h3>
        <p className="text-sm text-parchment-300/70">Create Pages, define fields and capabilities, and decide where each Page appears.</p>
        <Link to="/workspace" className="inline-flex w-fit bg-ink-700 hover:bg-ink-600 rounded-lg px-4 py-2 text-sm">Open Page Builder</Link>
      </section>
      <section className="card p-6 space-y-4">
        <div><h3 className="font-semibold text-lg">Legacy data migration</h3><p className="text-xs text-parchment-300/60 mt-1">Imports are explicit, additive and non-destructive. Existing specialist records are never deleted or overwritten.</p></div>
        <select value={target} onChange={(e) => setTarget(e.target.value)} className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm">
          <option value="">Choose destination Page…</option>
          {pages.map((page) => <option key={page.id} value={page.id}>{page.name}</option>)}
        </select>
        {counts && <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs"><div className="rounded bg-ink-700/50 p-3">Focus<br/><b>{counts.pomodoro}</b></div><div className="rounded bg-ink-700/50 p-3">Tasks<br/><b>{counts.tasks}</b></div><div className="rounded bg-ink-700/50 p-3">Habits<br/><b>{counts.habits}</b></div><div className="rounded bg-ink-700/50 p-3">Workouts<br/><b>{counts.exercise}</b></div><div className="rounded bg-ink-700/50 p-3">Weights<br/><b>{counts.weights}</b></div></div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <button disabled={!target || running} onClick={() => runMigration("pomodoro")} className="px-3 py-2 rounded-lg border border-ink-600 text-sm disabled:opacity-40">Import Focus Sessions</button>
          <button disabled={!target || running} onClick={() => runMigration("tasks")} className="px-3 py-2 rounded-lg border border-ink-600 text-sm disabled:opacity-40">Import Tasks</button>
          <button disabled={!target || running} onClick={() => runMigration("habits")} className="px-3 py-2 rounded-lg border border-ink-600 text-sm disabled:opacity-40">Import Habits</button>
          <button disabled={!target || running} onClick={() => runMigration("fitness")} className="px-3 py-2 rounded-lg border border-ink-600 text-sm disabled:opacity-40">Import Workouts + Measurements</button>
        </div>
        {message && <p className="text-sm text-brass-400">{message}</p>}\n        {error && <p role="alert" className="text-sm text-clay-300">{error}</p>}
      </section>
    </div>
  );
}
