import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import {
  subscribeCollection,
  addSubject,
  updateSubject,
  deleteSubject,
} from "../lib/data";

function subjectProgress(subject) {
  const units = subject.units || [];
  if (units.length === 0) return 0;
  const doneCount = units.filter((u) => u.done).length;
  return Math.round((doneCount / units.length) * 100);
}

export default function Academics() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [filter, setFilter] = useState("all");
  const [openId, setOpenId] = useState(null);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectType, setNewSubjectType] = useState("backlog");

  useEffect(() => {
    if (!user) return;
    return subscribeCollection(user.uid, "subjects", setSubjects);
  }, [user]);

  const visible = subjects.filter(
    (s) => filter === "all" || s.type === filter
  );

  async function handleAddSubject(e) {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    await addSubject(user.uid, {
      name: newSubjectName.trim(),
      type: newSubjectType,
      units: [1, 2, 3, 4, 5].map((n) => ({
        id: `u${n}`,
        name: `Unit ${n}`,
        topics: [],
        notes: "",
        done: false,
      })),
    });
    setNewSubjectName("");
  }

  async function toggleUnit(subject, unitId) {
    const units = subject.units.map((u) =>
      u.id === unitId ? { ...u, done: !u.done } : u
    );
    await updateSubject(user.uid, subject.id, { units });
  }

  async function updateUnitNotes(subject, unitId, notes) {
    const units = subject.units.map((u) =>
      u.id === unitId ? { ...u, notes } : u
    );
    await updateSubject(user.uid, subject.id, { units });
  }

  return (
    <div className="p-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-semibold">Academics</h2>
          <p className="text-xs text-parchment-300 mt-1">
            Units 1–2 carry up to 42/marks — prioritize accordingly.
          </p>
        </div>
        <div className="flex gap-1 bg-ink-800 rounded-lg p-1">
          {["all", "backlog", "sem5"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                filter === f
                  ? "bg-brass-500 text-ink-950"
                  : "text-parchment-300 hover:text-parchment-100"
              }`}
            >
              {f === "sem5" ? "Semester 5" : f}
            </button>
          ))}
        </div>
      </header>

      <form
        onSubmit={handleAddSubject}
        className="card p-4 flex items-center gap-3"
      >
        <input
          value={newSubjectName}
          onChange={(e) => setNewSubjectName(e.target.value)}
          placeholder="Subject name (e.g. Database Management Systems)"
          className="flex-1 bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500"
        />
        <select
          value={newSubjectType}
          onChange={(e) => setNewSubjectType(e.target.value)}
          className="bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none"
        >
          <option value="backlog">Backlog</option>
          <option value="sem5">Semester 5</option>
        </select>
        <button
          type="submit"
          className="bg-brass-500 hover:bg-brass-400 text-ink-950 font-semibold rounded-lg px-4 py-2 text-sm"
        >
          Add Subject
        </button>
      </form>

      <div className="space-y-3">
        {visible.map((subject) => {
          const progress = subjectProgress(subject);
          const isOpen = openId === subject.id;
          return (
            <div key={subject.id} className="card overflow-hidden">
              <button
                onClick={() => setOpenId(isOpen ? null : subject.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide ${
                      subject.type === "backlog"
                        ? "bg-clay-500/20 text-clay-400"
                        : "bg-teal-500/20 text-teal-400"
                    }`}
                  >
                    {subject.type === "backlog" ? "Backlog" : "Sem 5"}
                  </span>
                  <span className="font-medium text-sm">{subject.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32 h-1.5 bg-ink-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brass-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-parchment-300 w-9 text-right">
                    {progress}%
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSubject(user.uid, subject.id);
                    }}
                    className="text-xs text-parchment-300 hover:text-clay-400"
                  >
                    Delete
                  </button>
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 space-y-3 border-t border-ink-700/60 pt-4">
                  {subject.units.map((unit) => (
                    <div
                      key={unit.id}
                      className="flex items-start gap-3 bg-ink-700/40 rounded-lg p-3"
                    >
                      <input
                        type="checkbox"
                        checked={unit.done}
                        onChange={() => toggleUnit(subject, unit.id)}
                        className="mt-1 accent-brass-500 w-4 h-4"
                      />
                      <div className="flex-1">
                        <p
                          className={`text-sm font-medium ${
                            unit.done
                              ? "line-through text-parchment-300"
                              : ""
                          }`}
                        >
                          {unit.name}
                        </p>
                        <textarea
                          defaultValue={unit.notes}
                          onBlur={(e) =>
                            updateUnitNotes(subject, unit.id, e.target.value)
                          }
                          placeholder="Notes, important questions, PYQ references…"
                          rows={2}
                          className="mt-2 w-full bg-ink-800 border border-ink-600 rounded-md px-2 py-1.5 text-xs outline-none focus:border-brass-500 resize-y"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {visible.length === 0 && (
          <p className="text-sm text-parchment-300 text-center py-10">
            No subjects yet — add one above.
          </p>
        )}
      </div>
    </div>
  );
}
