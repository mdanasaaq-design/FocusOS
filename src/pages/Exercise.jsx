import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "../lib/auth";
import {
  subscribeCollection,
  subscribeProfile,
  setProfile,
  addExerciseLog,
  updateExerciseLog,
  deleteExerciseLog,
  subscribeWeightLogs,
  setWeightLog,
} from "../lib/data";
import { todayKey, formatDate } from "../lib/dates";

export default function Exercise() {
  const { user } = useAuth();
  const [, setProfileState] = useState(null);
  const [logs, setLogs] = useState([]);
  const [weightLogs, setWeightLogs] = useState({});
  const [view, setView] = useState("today");

  const [heightInput, setHeightInput] = useState("");
  const [weightInput, setWeightInput] = useState("");
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");

  useEffect(() => {
    if (!user) return;
    const u1 = subscribeProfile(user.uid, (p) => {
      setProfileState(p);
      if (p?.heightCm) setHeightInput(p.heightCm);
    });
    const u2 = subscribeCollection(user.uid, "exerciseLogs", setLogs);
    const u3 = subscribeWeightLogs(user.uid, setWeightLogs);
    return () => { u1(); u2(); u3(); };
  }, [user]);

  const today = todayKey();
  const todayWeight = weightLogs[today];

  const weightDates = Object.keys(weightLogs).sort();
  const lastWeightDate = weightDates[weightDates.length - 1];
  const lastWeight = lastWeightDate ? weightLogs[lastWeightDate] : null;

  async function saveHeight() {
    if (!heightInput) return;
    await setProfile(user.uid, { heightCm: Number(heightInput) });
  }

  async function saveWeight() {
    if (!weightInput) return;
    await setWeightLog(user.uid, today, Number(weightInput));
    setWeightInput("");
  }

  async function handleAddExercise(e) {
    e.preventDefault();
    if (!name.trim()) return;
    await addExerciseLog(user.uid, {
      date: today,
      name: name.trim(),
      durationMinutes: duration ? Number(duration) : null,
      sets: sets ? Number(sets) : null,
      reps: reps ? Number(reps) : null,
      completed: false,
    });
    setName(""); setDuration(""); setSets(""); setReps("");
  }

  const todayLogs = logs.filter((l) => l.date === today);
  const historyLogs = [...logs]
    .filter((l) => l.completed)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="p-8 space-y-6">
      <header>
        <h2 className="text-2xl font-display font-semibold">Exercise</h2>
        <p className="text-xs text-parchment-300 mt-1">Height, weight history, and daily exercise tracking.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4">
          <p className="text-[11px] font-semibold text-parchment-300 uppercase tracking-wide mb-2">Height</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={heightInput}
              onChange={(e) => setHeightInput(e.target.value)}
              onBlur={saveHeight}
              placeholder="cm"
              className="w-24 bg-ink-700 border border-ink-600 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-brass-500"
            />
            <span className="text-xs text-parchment-300">cm</span>
          </div>
        </div>

        <div className="card p-4">
          <p className="text-[11px] font-semibold text-parchment-300 uppercase tracking-wide mb-2">
            Weight {todayWeight ? `— ${todayWeight}kg today` : ""}
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              placeholder={todayWeight ? String(todayWeight) : "kg"}
              className="w-24 bg-ink-700 border border-ink-600 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-brass-500"
            />
            <button onClick={saveWeight} className="bg-brass-500 hover:bg-brass-400 text-ink-950 font-semibold rounded-lg px-3 py-1.5 text-xs">
              Log today
            </button>
          </div>
          {lastWeightDate && lastWeightDate !== today && (
            <p className="text-[11px] text-parchment-300 mt-2">
              Last logged: {lastWeight}kg on {formatDate(lastWeightDate)}
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleAddExercise} className="card p-4 flex flex-wrap items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Exercise (e.g. Running)"
          className="flex-1 min-w-[140px] bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500"
        />
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="min"
          className="w-20 bg-ink-700 border border-ink-600 rounded-lg px-2 py-2 text-sm outline-none"
        />
        <input
          type="number"
          value={sets}
          onChange={(e) => setSets(e.target.value)}
          placeholder="sets"
          className="w-16 bg-ink-700 border border-ink-600 rounded-lg px-2 py-2 text-sm outline-none"
        />
        <input
          type="number"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          placeholder="reps"
          className="w-16 bg-ink-700 border border-ink-600 rounded-lg px-2 py-2 text-sm outline-none"
        />
        <button type="submit" className="flex items-center gap-1 bg-brass-500 hover:bg-brass-400 text-ink-950 font-semibold rounded-lg px-3 py-2 text-sm">
          <Plus size={15} /> Add
        </button>
      </form>

      <div className="flex gap-1 bg-ink-800 rounded-lg p-1 w-fit">
        {["today", "history"].map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
              view === v ? "bg-brass-500 text-ink-950" : "text-parchment-300 hover:text-parchment-100"
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="card divide-y divide-ink-700/60">
        {(view === "today" ? todayLogs : historyLogs).length === 0 && (
          <p className="text-sm text-parchment-300 text-center py-10">Nothing here yet.</p>
        )}
        {(view === "today" ? todayLogs : historyLogs).map((l) => (
          <div key={l.id} className="flex items-center gap-3 px-5 py-3">
            <input
              type="checkbox"
              checked={l.completed}
              onChange={(e) => updateExerciseLog(user.uid, l.id, { completed: e.target.checked })}
              className="accent-brass-500 w-4 h-4"
            />
            <span className={`flex-1 text-sm ${l.completed ? "line-through text-parchment-300" : ""}`}>
              {l.name}
            </span>
            <span className="text-xs text-parchment-300">
              {[l.durationMinutes && `${l.durationMinutes}min`, l.sets && `${l.sets}x${l.reps || "?"}`]
                .filter(Boolean)
                .join(" · ")}
            </span>
            {view === "history" && <span className="text-xs text-parchment-300">{formatDate(l.date)}</span>}
            <button onClick={() => deleteExerciseLog(user.uid, l.id)} className="text-xs text-parchment-300 hover:text-clay-400">
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
