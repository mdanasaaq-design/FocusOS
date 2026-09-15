import { useEffect, useState } from "react";
import { Plus, X, Trash2, Check, AlertTriangle } from "lucide-react";
import { useAuth } from "../lib/auth";
import TimePicker from "../components/TimePicker";
import {
  subscribeCollection,
  addTimetable,
  updateTimetable,
  deleteTimetable,
  setActiveTimetable,
  subscribeTimetableCompletions,
  setTimetableCompletion,
} from "../lib/data";
import { todayKey } from "../lib/dates";
import {
  formatTime12,
  formatDuration,
  entryDuration,
  validateEntries,
} from "../lib/timetable";

function newEntry() {
  return {
    id: crypto.randomUUID(),
    from: "09:00",
    to: "10:00",
    task: "",
  };
}

const emptyTimetable = {
  name: "",
  description: "",
  entries: [],
};

export default function Timetables() {
  const { user } = useAuth();
  const [timetables, setTimetables] = useState([]);
  const [completions, setCompletions] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(emptyTimetable);

  useEffect(() => {
    if (!user) return;
    const u1 = subscribeCollection(user.uid, "timetables", setTimetables);
    const u2 = subscribeTimetableCompletions(user.uid, setCompletions);
    return () => {
      u1();
      u2();
    };
  }, [user]);

  const activeTimetable = timetables.find((t) => t.active);
  const today = todayKey();
  const todayCompletions = completions[today] || {};

  function openNew() {
    setDraft({ ...emptyTimetable, entries: [newEntry()] });
    setEditingId("new");
  }

  function openEdit(t) {
    setDraft({ name: t.name, description: t.description || "", entries: t.entries || [] });
    setEditingId(t.id);
  }

  function closeEditor() {
    setEditingId(null);
    setDraft(emptyTimetable);
  }

  function updateEntry(id, field, value) {
    setDraft((d) => ({
      ...d,
      entries: d.entries.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    }));
  }

  function addRow() {
    setDraft((d) => ({ ...d, entries: [...d.entries, newEntry()] }));
  }

  function removeRow(id) {
    setDraft((d) => ({ ...d, entries: d.entries.filter((e) => e.id !== id) }));
  }

  const validation = validateEntries(draft.entries);

  async function handleSave(e) {
    e.preventDefault();
    if (!draft.name.trim() || !validation.isValid) return;
    if (editingId === "new") {
      await addTimetable(user.uid, draft);
    } else {
      await updateTimetable(user.uid, editingId, draft);
    }
    closeEditor();
  }

  async function handleDelete(id) {
    await deleteTimetable(user.uid, id);
    closeEditor();
  }

  async function toggleCompletion(timetableId, entryId, checked) {
    await setTimetableCompletion(user.uid, today, `${timetableId}:${entryId}`, checked);
  }

  return (
    <div className="p-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-semibold">Timetables</h2>
          <p className="text-xs text-parchment-300 mt-1">
            Create as many as you need — only one is active at a time.
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 bg-brass-500 hover:bg-brass-400 text-ink-950 font-semibold rounded-lg px-3 py-2 text-sm"
        >
          <Plus size={16} /> New Timetable
        </button>
      </header>

      {activeTimetable && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">
              Today — <span className="text-brass-400">{activeTimetable.name}</span>
            </h3>
          </div>
          <div className="space-y-1.5">
            {[...(activeTimetable.entries || [])]
              .sort((a, b) => a.from.localeCompare(b.from))
              .map((entry) => {
                const key = `${activeTimetable.id}:${entry.id}`;
                const checked = !!todayCompletions[key];
                return (
                  <label
                    key={entry.id}
                    className="flex items-center gap-3 bg-ink-700/40 rounded-lg px-3 py-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => toggleCompletion(activeTimetable.id, entry.id, e.target.checked)}
                      className="accent-brass-500 w-4 h-4"
                    />
                    <span className="text-xs text-parchment-300 w-32 shrink-0">
                      {formatTime12(entry.from)} – {formatTime12(entry.to)}
                    </span>
                    <span className={`text-sm flex-1 ${checked ? "line-through text-parchment-300" : ""}`}>
                      {entry.task || "(untitled)"}
                    </span>
                    <span className="text-[11px] text-parchment-300">
                      {formatDuration(entryDuration(entry) || 0)}
                    </span>
                  </label>
                );
              })}
            {(!activeTimetable.entries || activeTimetable.entries.length === 0) && (
              <p className="text-xs text-parchment-300">This timetable has no entries yet.</p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {timetables.map((t) => {
          const v = validateEntries(t.entries || []);
          return (
            <div key={t.id} className="card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {t.active && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide bg-teal-500/20 text-teal-400">
                    Active
                  </span>
                )}
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-parchment-300">
                    {(t.entries || []).length} entries · {formatDuration(v.scheduledMinutes)} scheduled
                    {!v.isValid && (
                      <span className="text-clay-400 ml-2 inline-flex items-center gap-1">
                        <AlertTriangle size={11} /> needs fixing
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!t.active && (
                  <button
                    onClick={() => setActiveTimetable(user.uid, t.id)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-ink-600 text-parchment-300 hover:text-brass-400 hover:border-brass-500"
                  >
                    Set Active
                  </button>
                )}
                <button
                  onClick={() => openEdit(t)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-ink-600 text-parchment-300 hover:text-parchment-100"
                >
                  Edit
                </button>
              </div>
            </div>
          );
        })}
        {timetables.length === 0 && (
          <p className="text-sm text-parchment-300 text-center py-10">
            No timetables yet — create one above.
          </p>
        )}
      </div>

      {editingId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-semibold">
                {editingId === "new" ? "New Timetable" : "Edit Timetable"}
              </h3>
              <button onClick={closeEditor} className="text-parchment-300 hover:text-parchment-100">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <input
                required
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Timetable name (e.g. College Day)"
                className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500"
              />
              <input
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder="Description (optional)"
                className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500"
              />

                            <div className="space-y-2">
                {draft.entries.map((entry) => {
                  const invalid = validation.invalidIds.has(entry.id);
                  const conflict = validation.conflictIds.has(entry.id);
                  const duration = entryDuration(entry);
                  return (
                    <div
                      key={entry.id}
                      className={`flex flex-wrap items-center gap-2 p-2 rounded-lg border ${
                        invalid || conflict
                          ? "border-clay-500/60 bg-clay-500/5"
                          : "border-transparent bg-ink-700/40"
                      }`}
                    >
                      <TimePicker
                        value={entry.from}
                        onChange={(v) => updateEntry(entry.id, "from", v)}
                      />
                      <span className="text-parchment-300 text-xs">to</span>
                      <TimePicker
                        value={entry.to}
                        onChange={(v) => updateEntry(entry.id, "to", v)}
                      />
                      <input
                        value={entry.task}
                        onChange={(e) => updateEntry(entry.id, "task", e.target.value)}
                        placeholder="Task"
                        className="flex-1 min-w-[120px] bg-ink-700 border border-ink-600 rounded-md px-2 py-1.5 text-xs outline-none"
                      />
                      <span className="text-[11px] text-parchment-300 w-14 text-right shrink-0">
                        {duration ? formatDuration(duration) : "—"}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeRow(entry.id)}
                        className="text-parchment-300 hover:text-clay-400 shrink-0"
                        aria-label="Remove row"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={addRow}
                  className="w-full text-xs text-brass-400 hover:text-brass-300 flex items-center justify-center gap-1 py-2 border border-dashed border-ink-600 rounded-lg"
                >
                  <Plus size={13} /> Add row
                </button>
              </div>

              <div className="bg-ink-700/40 rounded-lg p-3 space-y-2">
                <div className="flex h-2 rounded-full overflow-hidden bg-ink-600">
                  <div
                    className="bg-teal-500"
                    style={{ width: `${(validation.scheduledMinutes / validation.totalMinutes) * 100}%` }}
                  />
                  <div
                    className="bg-clay-500"
                    style={{ width: `${(validation.conflictMinutes / validation.totalMinutes) * 100}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-parchment-300">
                  <span>Scheduled: <strong className="text-parchment-100">{formatDuration(validation.scheduledMinutes)}</strong></span>
                  <span>Unscheduled: <strong className="text-parchment-100">{formatDuration(validation.unscheduledMinutes)}</strong></span>
                  <span>Total: <strong className="text-parchment-100">24h</strong></span>
                </div>
                {validation.conflicts.length > 0 && (
                  <p className="text-xs text-clay-400 flex items-center gap-1.5">
                    <AlertTriangle size={13} /> Schedule Conflict — overlapping entries highlighted above
                  </p>
                )}
                {validation.invalidIds.size > 0 && (
                  <p className="text-xs text-clay-400 flex items-center gap-1.5">
                    <AlertTriangle size={13} /> End time must be after start time
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={!validation.isValid || !draft.name.trim()}
                  className="flex-1 bg-brass-500 hover:bg-brass-400 disabled:opacity-40 disabled:cursor-not-allowed text-ink-950 font-semibold rounded-lg py-2 text-sm flex items-center justify-center gap-1.5"
                >
                  <Check size={15} /> Save timetable
                </button>
                {editingId !== "new" && (
                  <button
                    type="button"
                    onClick={() => handleDelete(editingId)}
                    className="p-2 rounded-lg border border-clay-500/50 text-clay-400 hover:bg-clay-500/10"
                    aria-label="Delete timetable"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}