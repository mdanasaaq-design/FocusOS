import { useEffect, useMemo, useRef, useState } from "react";
import { addCapabilityActivity, updateCapabilityActivity, subscribeCapabilityActivity } from "../data/capabilityActivity";
import { todayKey, formatDate } from "../lib/dates";

const card = "rounded-xl border border-ink-700 bg-ink-800/40 p-4";
const input = "w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500";
const Button = ({ children, onClick, disabled = false, secondary = false }) => (
  <button type="button" onClick={onClick} disabled={disabled} className={secondary ? "px-3 py-2 rounded-lg border border-ink-600 text-sm disabled:opacity-40" : "px-3 py-2 rounded-lg bg-brass-500 text-ink-950 font-semibold text-sm disabled:opacity-40"}>{children}</button>
);

function Focus({ user, pageId, config, items }) {
  const [focus, setFocus] = useState(Number(config.focusMinutes) || 25);
  const [breakMin, setBreakMin] = useState(Number(config.breakMinutes) || 5);
  const [phase, setPhase] = useState("focus");
  const [left, setLeft] = useState((Number(config.focusMinutes) || 25) * 60);
  const [run, setRun] = useState(false);
  const [label, setLabel] = useState("");
  const timer = useRef(null);
  const completed = items.filter((item) => item.capability === "focus" && item.type === "focus_completed");
  useEffect(() => { if (!run) setLeft(Number(phase === "focus" ? focus : breakMin) * 60); }, [focus, breakMin, phase, run]);
  useEffect(() => { if (!run) return undefined; timer.current = setInterval(() => setLeft((v) => { if (v <= 1) { complete(); return 0; } return v - 1; }), 1000); return () => clearInterval(timer.current); }, [run]);
  async function complete() {
    setRun(false);
    if (phase === "focus") {
      await addCapabilityActivity(user.uid, { pageId, capability: "focus", type: "focus_completed", title: label || "Focus session", date: todayKey(), durationMinutes: Number(focus), status: "completed", metadata: { taskTitle: label || null } });
      setLabel("");
      setPhase("break");
    } else setPhase("focus");
  }
  const mm = String(Math.floor(left / 60)).padStart(2, "0"), ss = String(left % 60).padStart(2, "0");
  return <div className={card}><div className="flex justify-between"><div><p className="text-sm font-semibold">Focus Sessions</p><p className="text-xs text-parchment-300/50">{completed.reduce((s, x) => s + (x.durationMinutes || 0), 0)} min recorded.</p></div><span className="text-xs text-brass-400">{completed.length} sessions</span></div>{!run && phase === "focus" && <div className="grid grid-cols-3 gap-2 mt-3"><label className="text-xs">Focus<input type="number" min="1" value={focus} onChange={(e) => setFocus(e.target.value)} className={input}/></label><label className="text-xs">Break<input type="number" min="1" value={breakMin} onChange={(e) => setBreakMin(e.target.value)} className={input}/></label><label className="text-xs">Task / context<input value={label} onChange={(e) => setLabel(e.target.value)} className={input}/></label></div>}<div className="text-5xl font-display text-center py-4 tabular-nums">{mm}:{ss}</div><div className="flex justify-center gap-2"><Button onClick={() => setRun((v) => !v)}>{run ? "Pause" : "Start"}</Button><Button secondary onClick={() => { setRun(false); setPhase("focus"); setLeft(Number(focus) * 60); }}>Reset</Button></div></div>;
}

function Tasks({ user, pageId, items, config }) {
  const [title, setTitle] = useState(""), [due, setDue] = useState(todayKey()), [priority, setPriority] = useState(config.defaultPriority || "normal"), [estimate, setEstimate] = useState(""), [recurrence, setRecurrence] = useState("none"), [parent, setParent] = useState("");
  const tasks = items.filter((i) => i.capability === "tasks" && i.type === "task");
  const open = tasks.filter((t) => t.status !== "completed");
  async function add(e) { e.preventDefault(); if (!title.trim()) return; await addCapabilityActivity(user.uid, { pageId, capability: "tasks", type: "task", title, date: todayKey(), dueDate: due, priority, status: "open", durationMinutes: Number(estimate) || null, metadata: { recurrence, parentTaskId: parent || null } }); setTitle(""); setEstimate(""); setParent(""); }
  async function done(t) { await updateCapabilityActivity(user.uid, t.id, { status: "completed", completedAt: todayKey() }); if (t.metadata?.recurrence && t.metadata.recurrence !== "none") { const next = new Date((t.dueDate || todayKey()) + "T00:00:00"); next.setDate(next.getDate() + (t.metadata.recurrence === "daily" ? 1 : t.metadata.recurrence === "weekly" ? 7 : 30)); await addCapabilityActivity(user.uid, { pageId, capability: "tasks", type: "task", title: t.title, date: todayKey(), dueDate: next.toISOString().slice(0, 10), priority: t.priority, status: "open", durationMinutes: t.durationMinutes, metadata: { ...t.metadata, generatedFrom: t.id } }); } }
  return <div className={card}><p className="text-sm font-semibold">Tasks</p><p className="text-xs text-parchment-300/50">{open.length} open · priorities, estimates, subtasks and recurrence.</p><form onSubmit={add} className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task" className={input}/><input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={input}/><select value={priority} onChange={(e) => setPriority(e.target.value)} className={input}><option>low</option><option>normal</option><option>high</option></select><input type="number" min="1" value={estimate} onChange={(e) => setEstimate(e.target.value)} placeholder="Estimate (min)" className={input}/><select value={recurrence} onChange={(e) => setRecurrence(e.target.value)} className={input}><option value="none">No recurrence</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select><select value={parent} onChange={(e) => setParent(e.target.value)} className={input}><option value="">Root task</option>{tasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select><div className="md:col-span-3"><Button>Add task</Button></div></form><div className="space-y-2 mt-4">{open.map((t) => <div key={t.id} className="flex items-center gap-2 border-b border-ink-700 pb-2"><button type="button" onClick={() => done(t)} className="h-4 w-4 rounded border border-ink-500"/><span className="flex-1 text-sm">{t.metadata?.parentTaskId ? "↳ " : ""}{t.title}</span><span className="text-[11px] text-parchment-300/50">{t.dueDate ? formatDate(t.dueDate) : "No date"}</span><span className="text-[10px] uppercase text-brass-400">{t.priority}</span></div>)}</div></div>;
}

function TimeTracking({ user, pageId, items }) {
  const [run, setRun] = useState(false), [started, setStarted] = useState(null), [elapsed, setElapsed] = useState(0), [title, setTitle] = useState(""), [manual, setManual] = useState("");
  useEffect(() => { if (!run) return undefined; const id = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000); return () => clearInterval(id); }, [run, started]);
  async function stop() { await save(Math.max(1, Math.round(elapsed / 60)), started); setRun(false); setElapsed(0); setStarted(null); setTitle(""); }
  async function save(minutes, startedAt = null) { await addCapabilityActivity(user.uid, { pageId, capability: "timeTracking", type: "time_entry", title: title || "Time entry", date: todayKey(), durationMinutes: Number(minutes), status: "completed", metadata: { startedAt, source: startedAt ? "timer" : "manual" } }); setManual(""); }
  const total = items.filter((i) => i.capability === "timeTracking").reduce((s, i) => s + (i.durationMinutes || 0), 0);
  return <div className={card}><div className="flex justify-between"><div><p className="text-sm font-semibold">Time Tracking</p><p className="text-xs text-parchment-300/50">{total} minutes recorded.</p></div><span className="text-2xl tabular-nums">{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}</span></div><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Activity" className={input}/><div className="flex gap-2 mt-2"><Button onClick={() => run ? stop() : (setStarted(Date.now()), setRun(true))}>{run ? "Stop & save" : "Start timer"}</Button><input type="number" min="1" value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Manual min" className={input}/><Button secondary disabled={!manual} onClick={() => save(manual)}>Add manual</Button></div></div>;
}

function Habits({ user, pageId, items, config }) {
  const [name, setName] = useState(""), [cadence, setCadence] = useState(config.period || "daily");
  const habits = items.filter((i) => i.capability === "habits" && i.type === "habit");
  const checkins = items.filter((i) => i.capability === "habits" && i.type === "habit_checkin");
  function streak(id) { let n = 0, d = new Date(); for (let i = 0; i < 90; i += 1) { const key = d.toISOString().slice(0, 10); if (checkins.some((x) => x.metadata?.habitId === id && x.date === key)) n += 1; else if (i > 0) break; d.setDate(d.getDate() - 1); } return n; }
  async function add(e) { e.preventDefault(); if (!name.trim()) return; await addCapabilityActivity(user.uid, { pageId, capability: "habits", type: "habit", title: name, date: todayKey(), status: "active", metadata: { cadence } }); setName(""); }
  function due(h) { const cadence = h.metadata?.cadence || "daily"; const days = cadence === "weekly" ? 7 : cadence === "monthly" ? 30 : 1; const last = checkins.filter((x) => x.metadata?.habitId === h.id).map((x) => x.date).sort().at(-1); if (!last) return true; const diff = Math.floor((new Date(todayKey()) - new Date(last)) / 86400000); return diff >= days; }
  async function check(h) { if (!due(h)) return; await addCapabilityActivity(user.uid, { pageId, capability: "habits", type: "habit_checkin", title: h.title, date: todayKey(), status: "completed", metadata: { habitId: h.id, cadence: h.metadata?.cadence || "daily" } }); }
  return <div className={card}><p className="text-sm font-semibold">Habits</p><p className="text-xs text-parchment-300/50">Cadence, adherence and streaks. Missed days remain in history.</p><form onSubmit={add} className="grid grid-cols-[1fr_auto_auto] gap-2 mt-3"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="New habit" className={input}/><select value={cadence} onChange={(e) => setCadence(e.target.value)} className={input}><option>daily</option><option>weekly</option><option>monthly</option></select><Button>Add</Button></form><div className="space-y-2 mt-4">{habits.map((h) => <div key={h.id} className="flex items-center gap-2"><button type="button" disabled={!due(h)} onClick={() => check(h)} className="h-5 w-5 rounded border border-ink-500 disabled:bg-brass-500"/><span className="flex-1 text-sm">{h.title}</span><span className="text-xs text-brass-400">{streak(h.id)}d</span></div>)}</div></div>;
}

function Routines({ user, pageId, items }) {
  const [name, setName] = useState(""), [steps, setSteps] = useState("");
  const routines = items.filter((i) => i.capability === "routines" && i.type === "routine");
  async function add(e) { e.preventDefault(); if (!name.trim()) return; await addCapabilityActivity(user.uid, { pageId, capability: "routines", type: "routine", title: name, date: todayKey(), status: "active", metadata: { steps: steps.split(",").map((x) => x.trim()).filter(Boolean) } }); setName(""); setSteps(""); }
  async function run(r) { await addCapabilityActivity(user.uid, { pageId, capability: "routines", type: "routine_run", title: r.title, date: todayKey(), status: "completed", metadata: { routineId: r.id, steps: r.metadata?.steps || [] } }); }
  return <div className={card}><p className="text-sm font-semibold">Routines</p><p className="text-xs text-parchment-300/50">Ordered steps plus completion history.</p><form onSubmit={add} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2 mt-3"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Routine" className={input}/><input value={steps} onChange={(e) => setSteps(e.target.value)} placeholder="Steps, separated by commas" className={input}/><Button>Add</Button></form><div className="space-y-2 mt-3">{routines.map((r) => <div key={r.id} className="flex items-center gap-2"><div className="flex-1"><p className="text-sm">{r.title}</p><p className="text-[11px] text-parchment-300/45">{(r.metadata?.steps || []).join(" → ") || "No steps"}</p></div><Button secondary onClick={() => run(r)}>Complete</Button></div>)}</div></div>;
}

function Goals({ user, pageId, items }) {
  const [title, setTitle] = useState(""), [target, setTarget] = useState(""), [unit, setUnit] = useState(""), [period, setPeriod] = useState("open"), [progress, setProgress] = useState({});
  const goals = items.filter((i) => i.capability === "goals" && i.type === "goal");
  const updates = items.filter((i) => i.capability === "goals" && i.type === "goal_progress");
  async function add(e) { e.preventDefault(); if (!title.trim() || !target) return; await addCapabilityActivity(user.uid, { pageId, capability: "goals", type: "goal", title, date: todayKey(), status: "active", value: Number(target), unit, metadata: { period } }); setTitle(""); setTarget(""); setUnit(""); }
  async function log(g) { const value = Number(progress[g.id]); if (!Number.isFinite(value)) return; await addCapabilityActivity(user.uid, { pageId, capability: "goals", type: "goal_progress", title: g.title, date: todayKey(), status: "completed", value, unit: g.unit, metadata: { goalId: g.id } }); setProgress((p) => ({ ...p, [g.id]: "" })); }
  function current(g) { return updates.filter((u) => u.metadata?.goalId === g.id).reduce((sum, u) => sum + Number(u.value || 0), 0); }
  return <div className={card}><p className="text-sm font-semibold">Goals & Metrics</p><form onSubmit={add} className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-3"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Goal" className={input}/><input type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Target" className={input}/><input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit" className={input}/><select value={period} onChange={(e) => setPeriod(e.target.value)} className={input}><option value="open">Open</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select><div className="md:col-span-4"><Button>Add goal</Button></div></form><div className="mt-4 space-y-3">{goals.map((g) => { const currentValue = current(g); const pct = Math.min(100, Math.round((currentValue / Math.max(1, Number(g.value))) * 100)); return <div key={g.id} className="border-b border-ink-700 pb-3"><div className="flex justify-between text-sm"><span>{g.title}</span><span>{currentValue} / {g.value} {g.unit}</span></div><div className="h-2 bg-ink-700 rounded mt-2"><div className="h-full bg-brass-500 rounded" style={{ width: pct + "%" }}/></div><div className="flex gap-2 mt-2"><input type="number" value={progress[g.id] || ""} onChange={(e) => setProgress((p) => ({ ...p, [g.id]: e.target.value }))} placeholder="Add progress" className={input}/><Button secondary onClick={() => log(g)}>Log</Button></div></div>; })}</div></div>;
}

function Workout({ user, pageId, items }) {
  const [exercise, setExercise] = useState(""), [sets, setSets] = useState(""), [reps, setReps] = useState(""), [load, setLoad] = useState(""), [duration, setDuration] = useState("");
  const logs = items.filter((i) => i.capability === "workout" && i.type === "workout");
  async function add(e) { e.preventDefault(); if (!exercise.trim()) return; await addCapabilityActivity(user.uid, { pageId, capability: "workout", type: "workout", title: exercise, date: todayKey(), status: "completed", durationMinutes: Number(duration) || null, metadata: { sets: Number(sets) || null, reps: Number(reps) || null, load: Number(load) || null } }); setExercise(""); setSets(""); setReps(""); setLoad(""); setDuration(""); }
  return <div className={card}><p className="text-sm font-semibold">Workouts</p><form onSubmit={add} className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3"><input value={exercise} onChange={(e) => setExercise(e.target.value)} placeholder="Exercise" className={input}/><input type="number" value={sets} onChange={(e) => setSets(e.target.value)} placeholder="Sets" className={input}/><input type="number" value={reps} onChange={(e) => setReps(e.target.value)} placeholder="Reps" className={input}/><input type="number" value={load} onChange={(e) => setLoad(e.target.value)} placeholder="Load" className={input}/><input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Minutes" className={input}/><div className="col-span-2 md:col-span-5"><Button>Add workout</Button></div></form><div className="space-y-2 mt-4">{logs.slice(0,8).map((l) => <div key={l.id} className="flex gap-3 text-sm border-b border-ink-700 pb-2"><span className="flex-1">{l.title}</span><span className="text-xs text-parchment-300/50">{l.metadata?.sets || "—"}×{l.metadata?.reps || "—"}{l.metadata?.load ? " · " + l.metadata.load : ""}{l.durationMinutes ? " · " + l.durationMinutes + "m" : ""}</span><span className="text-xs text-parchment-300/40">{formatDate(l.date)}</span></div>)}</div></div>;
}

function Measurements({ user, pageId, items }) {
  const [name, setName] = useState("Weight"), [value, setValue] = useState(""), [unit, setUnit] = useState("kg");
  const logs = items.filter((i) => i.capability === "measurements" && i.type === "measurement");
  async function add(e) { e.preventDefault(); if (!value) return; await addCapabilityActivity(user.uid, { pageId, capability: "measurements", type: "measurement", title: name, date: todayKey(), value: Number(value), unit, status: "completed" }); setValue(""); }
  return <div className={card}><p className="text-sm font-semibold">Measurements</p><form onSubmit={add} className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-3"><input value={name} onChange={(e) => setName(e.target.value)} className={input}/><input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Value" className={input}/><input value={unit} onChange={(e) => setUnit(e.target.value)} className={input}/><Button>Log</Button></form><div className="mt-3 space-y-1">{logs.slice(0,8).map((l) => <div key={l.id} className="flex justify-between text-sm"><span>{l.title}</span><span>{l.value} {l.unit} · {formatDate(l.date)}</span></div>)}</div></div>;
}

function Analytics({ items }) {
  const [range, setRange] = useState(7);
  const days = Array.from({ length: range }, (_, index) => { const d = new Date(); d.setDate(d.getDate() - (range - 1 - index)); return d.toISOString().slice(0, 10); });
  const focus = items.filter((i) => i.capability === "focus").reduce((s, i) => s + (i.durationMinutes || 0), 0);
  const tracked = items.filter((i) => i.capability === "timeTracking").reduce((s, i) => s + (i.durationMinutes || 0), 0);
  const tasks = items.filter((i) => i.capability === "tasks" && i.status === "completed").length;
  const workouts = items.filter((i) => i.capability === "workout").length;
  return <div className={card}><div className="flex items-center justify-between"><div><p className="text-sm font-semibold">Analytics</p><p className="text-xs text-parchment-300/50">Cross-capability Page trends and summary.</p></div><div className="flex gap-1">{[7,30].map((n) => <button key={n} type="button" onClick={() => setRange(n)} className={`px-2 py-1 rounded text-[11px] ${range === n ? "bg-brass-500 text-ink-950" : "bg-ink-700"}`}>{n}d</button>)}</div></div><div className="grid grid-cols-4 gap-2 mt-3"><div className="rounded bg-ink-700/50 p-2"><b>{focus}m</b><p className="text-[10px] text-parchment-300/50">Focus</p></div><div className="rounded bg-ink-700/50 p-2"><b>{tracked}m</b><p className="text-[10px] text-parchment-300/50">Tracked</p></div><div className="rounded bg-ink-700/50 p-2"><b>{tasks}</b><p className="text-[10px] text-parchment-300/50">Tasks</p></div><div className="rounded bg-ink-700/50 p-2"><b>{workouts}</b><p className="text-[10px] text-parchment-300/50">Workouts</p></div></div><div className={`grid ${range === 30 ? "grid-cols-10" : "grid-cols-7"} gap-1 mt-4`}>{days.map((day) => { const x = items.filter((i) => i.date === day); const minutes = x.reduce((sum, i) => sum + (i.durationMinutes || 0), 0); return <div key={day} className="text-center"><div className="h-20 bg-ink-700/60 rounded flex items-end overflow-hidden"><div className="w-full bg-brass-500" style={{ height: Math.min(100, Math.max(4, minutes * 2)) + "%" }}/></div><p className="text-[8px] text-parchment-300/50 mt-1">{day.slice(5)}</p></div>; })}</div></div>;
}

function Notes({ user, pageId, items }) {
  const [title, setTitle] = useState(""), [body, setBody] = useState("");
  const notes = items.filter((i) => i.capability === "notes" && i.type === "note");
  async function add(e) { e.preventDefault(); if (!body.trim()) return; await addCapabilityActivity(user.uid, { pageId, capability: "notes", type: "note", title: title || "Note", date: todayKey(), status: "active", metadata: { body } }); setTitle(""); setBody(""); }
  return <div className={card}><p className="text-sm font-semibold">Notes</p><form onSubmit={add} className="space-y-2 mt-3"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className={input}/><textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a note…" rows="3" className={input}/><Button>Save note</Button></form><div className="mt-3 space-y-2">{notes.slice(0,5).map((n) => <div key={n.id} className="rounded-lg bg-ink-700/50 p-3"><p className="text-sm font-medium">{n.title}</p><p className="text-xs text-parchment-300/70 whitespace-pre-wrap mt-1">{n.metadata?.body}</p></div>)}</div></div>;
}


function Tracker({ user, pageId, tracker, items }) {
  const [value, setValue] = useState("");
  const logs = items.filter((item) => item.capability === "tracking" && item.type === "tracker_entry" && item.metadata?.trackerId === tracker.id);
  async function save(e) {
    e.preventDefault();
    if (value === "") return;
    await addCapabilityActivity(user.uid, { pageId, capability: "tracking", type: "tracker_entry", title: tracker.name, date: todayKey(), value: tracker.type === "yesno" ? (value === "yes" ? 1 : 0) : Number(value), unit: tracker.unit || null, status: "completed", metadata: { trackerId: tracker.id, trackerType: tracker.type } });
    setValue("");
  }
  const latest = logs[0];
  return <div className={card}>
    <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold">{tracker.name}</p><p className="text-xs text-parchment-300/50">{tracker.target ? `Target: ${tracker.target}${tracker.unit ? " " + tracker.unit : ""}` : "Independent tracker"}</p></div><span className="text-xs text-brass-400">{latest ? `${latest.value}${latest.unit ? " " + latest.unit : ""}` : "No entries"}</span></div>
    <form onSubmit={save} className="flex gap-2 mt-3">
      {tracker.type === "yesno" ? <select value={value} onChange={(e) => setValue(e.target.value)} className={input}><option value="">Select…</option><option value="yes">Yes</option><option value="no">No</option></select> : <input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder={tracker.type === "duration" ? "Minutes" : "Value"} className={input}/>}
      <Button disabled={value === ""}>Record</Button>
    </form>
    <div className="mt-3 space-y-1">{logs.slice(0, 5).map((entry) => <div key={entry.id} className="flex justify-between text-xs text-parchment-300/60"><span>{formatDate(entry.date)}</span><span>{entry.value}{entry.unit ? " " + entry.unit : ""}</span></div>)}</div>
  </div>;
}

function CustomCapability({ user, pageId, definition }) {
  const fields = Array.isArray(definition?.fields) ? definition.fields : [];
  const [values, setValues] = useState({});
  async function save(e) { e.preventDefault(); if (!Object.values(values).some((v) => v !== "" && v !== undefined)) return; await addCapabilityActivity(user.uid, { pageId, capability: "custom:" + definition.id, type: "custom_record", title: definition.name, date: todayKey(), status: "completed", metadata: { values } }); setValues({}); }
  return <div className={card}><p className="text-sm font-semibold">{definition?.name || "Custom capability"}</p><p className="text-xs text-parchment-300/50">{definition?.description || "Reusable user-defined records."}</p>{fields.length ? <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">{fields.map((f) => <label key={f.id} className="text-xs">{f.name}<input value={values[f.id] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [f.id]: e.target.value }))} className={input} placeholder={f.unit || ""}/></label>)}<div className="md:col-span-2"><Button>Record</Button></div></form> : <p className="text-xs text-parchment-300/50 mt-3">Configure fields for this capability in Settings.</p>}</div>;
}

export default function PageCapabilityRuntime({ user, pageId, capabilities, capabilityConfig = {}, userCapabilities = [], trackers = [], onlyCapability = null }) {
  const [items, setItems] = useState([]);
  const active = useMemo(() => (capabilities || []).filter((key) => !onlyCapability || key === onlyCapability), [capabilities, onlyCapability]);
  useEffect(() => subscribeCapabilityActivity(user.uid, { pageId, capabilities: active }, setItems), [user, pageId, active]);
  const built = active.filter((key) => !key.startsWith("custom:"));
  const custom = active.filter((key) => key.startsWith("custom:"));
  const has = (key) => built.includes(key);
  if (!active.length) return null;
  return <section className="space-y-4"><div><h2 className="font-semibold">Tools</h2><p className="text-xs text-parchment-300/50 mt-1">Live capabilities write durable Page activity; history remains even when a capability is later disabled.</p></div>
    {has("tasks") && <Tasks user={user} pageId={pageId} items={items} config={capabilityConfig.tasks || {}}/>}
    {has("focus") && <Focus user={user} pageId={pageId} items={items} config={capabilityConfig.focus || {}}/>}
    {has("timeTracking") && <TimeTracking user={user} pageId={pageId} items={items}/>}
    {has("habits") && <Habits user={user} pageId={pageId} items={items} config={capabilityConfig.habits || {}}/>}
    {has("routines") && <Routines user={user} pageId={pageId} items={items}/>}
    {has("goals") && <Goals user={user} pageId={pageId} items={items}/>}
    {has("workout") && <Workout user={user} pageId={pageId} items={items}/>}
    {has("measurements") && <Measurements user={user} pageId={pageId} items={items}/>}
    {has("notes") && <Notes user={user} pageId={pageId} items={items}/>}\n    {has("tracking") && trackers.map((tracker) => <Tracker key={tracker.id} user={user} pageId={pageId} tracker={tracker} items={items}/>)}
    {has("analytics") && <Analytics items={items}/>}
    {custom.map((key) => <CustomCapability key={key} user={user} pageId={pageId} definition={userCapabilities.find((capability) => "custom:" + capability.id === key)}/>)}
  </section>;
}
