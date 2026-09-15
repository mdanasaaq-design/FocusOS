import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { subscribeCollection, addTask, toggleTask, deleteTask } from "../lib/data";
import { todayKey, formatDate } from "../lib/dates";

const CATEGORIES = [
  { id: "academics", label: "Academics", color: "brass" },
  { id: "upsc", label: "UPSC", color: "clay" },
  { id: "skills", label: "Skills/Career", color: "teal" },
  { id: "health", label: "Health", color: "clay" },
  { id: "personal", label: "Personal", color: "parchment" },
  { id: "finance", label: "Finance", color: "brass" },
];

const catColor = {
  academics: "bg-brass-500/20 text-brass-400",
  upsc: "bg-clay-500/20 text-clay-400",
  skills: "bg-teal-500/20 text-teal-400",
  health: "bg-clay-500/20 text-clay-400",
  personal: "bg-ink-600 text-parchment-200",
  finance: "bg-brass-500/20 text-brass-400",
};

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("academics");
  const [dueDate, setDueDate] = useState(todayKey());
  const [view, setView] = useState("today"); // today | all | history

  useEffect(() => {
    if (!user) return;
    return subscribeCollection(user.uid, "tasks", setTasks);
  }, [user]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!title.trim()) return;
    await addTask(user.uid, { title: title.trim(), category, dueDate });
    setTitle("");
  }

  const today = todayKey();
  let filtered = tasks;
  if (view === "today") filtered = tasks.filter((t) => t.dueDate === today);
  if (view === "history")
    filtered = tasks
      .filter((t) => t.completed)
      .sort((a, b) => (b.completedAt || "").localeCompare(a.completedAt || ""));

  return (
    <div className="p-8 space-y-6">
      <header>
        <h2 className="text-2xl font-display font-semibold">Tasks</h2>
        <p className="text-xs text-parchment-300 mt-1">
          Every completed task is timestamped — this is your history log.
        </p>
      </header>

      <form onSubmit={handleAdd} className="card p-4 flex flex-wrap items-center gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to get done?"
          className="flex-1 min-w-[200px] bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none"
        >
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          className="bg-brass-500 hover:bg-brass-400 text-ink-950 font-semibold rounded-lg px-4 py-2 text-sm"
        >
          Add Task
        </button>
      </form>

      <div className="flex gap-1 bg-ink-800 rounded-lg p-1 w-fit">
        {["today", "all", "history"].map((v) => (
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
        {filtered.length === 0 && (
          <p className="text-sm text-parchment-300 text-center py-10">
            Nothing here yet.
          </p>
        )}
        {filtered.map((t) => (
          <div key={t.id} className="flex items-center gap-3 px-5 py-3">
            <input
              type="checkbox"
              checked={t.completed}
              onChange={(e) => toggleTask(user.uid, t.id, e.target.checked)}
              className="accent-brass-500 w-4 h-4"
            />
            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide ${catColor[t.category]}`}>
              {CATEGORIES.find((c) => c.id === t.category)?.label}
            </span>
            <span className={`flex-1 text-sm ${t.completed ? "line-through text-parchment-300" : ""}`}>
              {t.title}
            </span>
            <span className="text-xs text-parchment-300">
              {view === "history" && t.completedAt
                ? `Done ${formatDate(t.completedAt.slice(0, 10))}`
                : formatDate(t.dueDate)}
            </span>
            <button
              onClick={() => deleteTask(user.uid, t.id)}
              className="text-xs text-parchment-300 hover:text-clay-400"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
