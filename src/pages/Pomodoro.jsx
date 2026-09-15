import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { useAuth } from "../lib/auth";
import { subscribeCollection, addPomodoroSession, subscribePomodoroSessions } from "../lib/data";
import { todayKey } from "../lib/dates";

const PRESETS = [
  { id: "25-5", label: "25 / 5", focus: 25, break: 5 },
  { id: "50-10", label: "50 / 10", focus: 50, break: 10 },
  { id: "custom", label: "Custom", focus: null, break: null },
];

export default function Pomodoro() {
  const { user } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);

  const [presetId, setPresetId] = useState("25-5");
  const [customFocus, setCustomFocus] = useState(25);
  const [customBreak, setCustomBreak] = useState(5);
  const [programId, setProgramId] = useState("");
  const [subjectId, setSubjectId] = useState("");

  const [phase, setPhase] = useState("focus"); // focus | break
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(25 * 60);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const u1 = subscribeCollection(user.uid, "studyPrograms", setPrograms);
    const u2 = subscribeCollection(user.uid, "studySubjects", setSubjects);
    const u3 = subscribePomodoroSessions(user.uid, setSessions);
    return () => { u1(); u2(); u3(); };
  }, [user]);

  const preset = PRESETS.find((p) => p.id === presetId);
  const focusMin = presetId === "custom" ? Number(customFocus) || 0 : preset.focus;
  const breakMin = presetId === "custom" ? Number(customBreak) || 0 : preset.break;

  useEffect(() => {
    if (!running) {
      setRemaining((phase === "focus" ? focusMin : breakMin) * 60);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusMin, breakMin, phase]);

  useEffect(() => {
    if (!running) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          handlePhaseComplete();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  async function handlePhaseComplete() {
    setRunning(false);
    if (phase === "focus") {
      await addPomodoroSession(user.uid, {
        date: todayKey(),
        durationMinutes: focusMin,
        programId: programId || null,
        subjectId: subjectId || null,
      });
      setPhase("break");
      setRemaining(breakMin * 60);
    } else {
      setPhase("focus");
      setRemaining(focusMin * 60);
    }
  }

  function toggleRunning() {
    setRunning((r) => !r);
  }

  function reset() {
    setRunning(false);
    setPhase("focus");
    setRemaining(focusMin * 60);
  }

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  const today = todayKey();
  const todayMinutes = sessions
    .filter((s) => s.date === today)
    .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

  const subjectsOfProgram = subjects.filter((s) => s.programId === programId);
  const currentLabel = (() => {
    const p = programs.find((x) => x.id === programId);
    const s = subjects.find((x) => x.id === subjectId);
    if (p && s) return `${p.name} → ${s.name}`;
    if (p) return p.name;
    return null;
  })();

  return (
    <div className="p-8 space-y-6">
      <header>
        <h2 className="text-2xl font-display font-semibold">Pomodoro</h2>
        <p className="text-xs text-parchment-300 mt-1">
          Today: <span className="text-brass-400 font-semibold">{todayMinutes} min</span> focused
        </p>
      </header>

      <div className="card p-8 flex flex-col items-center max-w-md mx-auto">
        <div className="flex gap-1 bg-ink-700 rounded-lg p-1 mb-6">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              disabled={running}
              onClick={() => { setPresetId(p.id); setPhase("focus"); setRunning(false); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-40 ${
                presetId === p.id ? "bg-brass-500 text-ink-950" : "text-parchment-300 hover:text-parchment-100"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {presetId === "custom" && !running && (
          <div className="flex items-center gap-3 mb-6 text-xs text-parchment-300">
            <label className="flex items-center gap-1.5">
              Focus
              <input type="number" min="1" value={customFocus} onChange={(e) => setCustomFocus(e.target.value)} className="w-14 bg-ink-700 border border-ink-600 rounded-md px-2 py-1 text-center outline-none" />
              min
            </label>
            <label className="flex items-center gap-1.5">
              Break
              <input type="number" min="1" value={customBreak} onChange={(e) => setCustomBreak(e.target.value)} className="w-14 bg-ink-700 border border-ink-600 rounded-md px-2 py-1 text-center outline-none" />
              min
            </label>
          </div>
        )}

        <p className={`text-xs uppercase tracking-widest mb-2 ${phase === "focus" ? "text-brass-400" : "text-teal-400"}`}>
          {phase === "focus" ? "Focus" : "Break"}
        </p>
        <div className="text-6xl font-display font-semibold tabular-nums mb-6">
          {mm}:{ss}
        </div>

        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={toggleRunning}
            className="flex items-center gap-2 bg-brass-500 hover:bg-brass-400 text-ink-950 font-semibold rounded-lg px-5 py-2.5 text-sm"
          >
            {running ? <Pause size={16} /> : <Play size={16} />}
            {running ? "Pause" : "Start"}
          </button>
          <button
            onClick={reset}
            className="flex items-center gap-2 border border-ink-600 hover:border-parchment-300 text-parchment-300 rounded-lg px-4 py-2.5 text-sm"
          >
            <RotateCcw size={15} /> Reset
          </button>
        </div>

        {!running && (
          <div className="w-full space-y-2">
            <p className="text-[11px] text-parchment-300">What are you working on? (optional)</p>
            <div className="flex gap-2">
              <select
                value={programId}
                onChange={(e) => { setProgramId(e.target.value); setSubjectId(""); }}
                className="flex-1 bg-ink-700 border border-ink-600 rounded-lg px-2 py-1.5 text-xs outline-none"
              >
                <option value="">General</option>
                {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {programId && (
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="flex-1 bg-ink-700 border border-ink-600 rounded-lg px-2 py-1.5 text-xs outline-none"
                >
                  <option value="">All subjects</option>
                  {subjectsOfProgram.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}
            </div>
          </div>
        )}
        {running && currentLabel && (
          <p className="text-xs text-parchment-300">Working on: <span className="text-brass-400">{currentLabel}</span></p>
        )}
      </div>
    </div>
  );
}
