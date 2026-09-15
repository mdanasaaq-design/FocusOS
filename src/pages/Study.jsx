import { useEffect, useState } from "react";
import { ChevronLeft, Plus, X, Trash2, Pencil } from "lucide-react";
import { useAuth } from "../lib/auth";
import {
  subscribeCollection,
  addStudyProgram,
  updateStudyProgram,
  deleteStudyProgram,
  addStudySubject,
  updateStudySubject,
  deleteStudySubject,
  addStudyContent,
  updateStudyContent,
  deleteStudyContent,
} from "../lib/data";
import {
  CONTENT_TYPES,
  DEFAULT_DURATION_TYPES,
  contentStatus,
  contentPercent,
  formatHMS,
  hmsToSeconds,
  secondsToHms,
} from "../lib/study";

const STATUS_STYLE = {
  not_started: "bg-ink-600 text-parchment-300",
  in_progress: "bg-brass-500/20 text-brass-400",
  completed: "bg-teal-500/20 text-teal-400",
};
const STATUS_LABEL = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
};

function emptyContentForm() {
  return {
    type: "lecture",
    title: "",
    instructor: "",
    url: "",
    notes: "",
    hasDuration: true,
    totalH: 0,
    totalM: 0,
    totalS: 0,
  };
}

export default function Study() {
  const { user } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [contents, setContents] = useState([]);

  const [activeProgramId, setActiveProgramId] = useState(null);
  const [activeSubjectId, setActiveSubjectId] = useState(null);

  const [newProgramName, setNewProgramName] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");

  const [contentModal, setContentModal] = useState(null);
  const [contentForm, setContentForm] = useState(emptyContentForm());
  const [progressModal, setProgressModal] = useState(null);

  useEffect(() => {
    if (!user) return;
    const u1 = subscribeCollection(user.uid, "studyPrograms", setPrograms);
    const u2 = subscribeCollection(user.uid, "studySubjects", setSubjects);
    const u3 = subscribeCollection(user.uid, "studyContents", setContents);
    return () => {
      u1();
      u2();
      u3();
    };
  }, [user]);

  const activeProgram = programs.find((p) => p.id === activeProgramId);
  const activeSubject = subjects.find((s) => s.id === activeSubjectId);
  const subjectsOfProgram = subjects.filter((s) => s.programId === activeProgramId);
  const contentsOfSubject = contents.filter((c) => c.subjectId === activeSubjectId);

  async function handleAddProgram(e) {
    e.preventDefault();
    if (!newProgramName.trim()) return;
    await addStudyProgram(user.uid, { name: newProgramName.trim() });
    setNewProgramName("");
  }

  async function handleAddSubject(e) {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    await addStudySubject(user.uid, { programId: activeProgramId, name: newSubjectName.trim() });
    setNewSubjectName("");
  }

  function openNewContent() {
    setContentForm(emptyContentForm());
    setContentModal("new");
  }

  function openEditContent(c) {
    const { h, m, s } = secondsToHms(c.totalSeconds || 0);
    setContentForm({
      type: c.type,
      title: c.title,
      instructor: c.instructor || "",
      url: c.url || "",
      notes: c.notes || "",
      hasDuration: !!c.hasDuration,
      totalH: h,
      totalM: m,
      totalS: s,
    });
    setContentModal(c);
  }

  async function handleSaveContent(e) {
    e.preventDefault();
    if (!contentForm.title.trim()) return;
    const totalSeconds = hmsToSeconds(contentForm.totalH, contentForm.totalM, contentForm.totalS);
    const payload = {
      subjectId: activeSubjectId,
      type: contentForm.type,
      title: contentForm.title.trim(),
      instructor: contentForm.instructor.trim(),
      url: contentForm.url.trim(),
      notes: contentForm.notes,
      hasDuration: contentForm.hasDuration,
      totalSeconds: contentForm.hasDuration ? totalSeconds : 0,
    };
    if (contentModal === "new") {
      await addStudyContent(user.uid, { ...payload, completedSeconds: 0, done: false });
    } else {
      await updateStudyContent(user.uid, contentModal.id, payload);
    }
    setContentModal(null);
  }

  async function handleDeleteContent(id) {
    await deleteStudyContent(user.uid, id);
    setContentModal(null);
  }

  return (
    <div className="p-8 space-y-6">
      <header>
        <h2 className="text-2xl font-display font-semibold">Study / Work</h2>
        <p className="text-xs text-parchment-300 mt-1">
          Build any structure — exam prep, coursework, skills — nothing here assumes what you're studying.
        </p>
      </header>

      {(activeProgram || activeSubject) && (
        <div className="flex items-center gap-2 text-xs text-parchment-300">
          <button onClick={() => { setActiveProgramId(null); setActiveSubjectId(null); }} className="hover:text-brass-400">
            Programs
          </button>
          {activeProgram && (
            <>
              <ChevronLeft size={12} className="rotate-180" />
              <button onClick={() => setActiveSubjectId(null)} className="hover:text-brass-400">
                {activeProgram.name}
              </button>
            </>
          )}
          {activeSubject && (
            <>
              <ChevronLeft size={12} className="rotate-180" />
              <span className="text-parchment-100">{activeSubject.name}</span>
            </>
          )}
        </div>
      )}

      {!activeProgramId && (
        <>
          <form onSubmit={handleAddProgram} className="card p-4 flex items-center gap-3">
            <input
              value={newProgramName}
              onChange={(e) => setNewProgramName(e.target.value)}
              placeholder="New Study Program (e.g. UPSC, B.Tech, GATE)"
              className="flex-1 bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500"
            />
            <button type="submit" className="bg-brass-500 hover:bg-brass-400 text-ink-950 font-semibold rounded-lg px-4 py-2 text-sm">
              Add Program
            </button>
          </form>
          <div className="space-y-2">
            {programs.map((p) => {
              const subjCount = subjects.filter((s) => s.programId === p.id).length;
              return (
                <button
                  key={p.id}
                  onClick={() => setActiveProgramId(p.id)}
                  className="w-full card p-4 flex items-center justify-between hover:border-brass-500/50 border border-transparent text-left"
                >
                  <span className="text-sm font-medium">{p.name}</span>
                  <span className="text-xs text-parchment-300">{subjCount} subject{subjCount !== 1 ? "s" : ""}</span>
                </button>
              );
            })}
            {programs.length === 0 && (
              <p className="text-sm text-parchment-300 text-center py-10">No study programs yet — add one above.</p>
            )}
          </div>
        </>
      )}

      {activeProgramId && !activeSubjectId && (
        <>
          <div className="flex items-center justify-between">
            <button onClick={() => setActiveProgramId(null)} className="text-xs text-parchment-300 hover:text-parchment-100 flex items-center gap-1">
              <ChevronLeft size={14} /> Back to Programs
            </button>
            <button
              onClick={() => deleteStudyProgram(user.uid, activeProgramId).then(() => setActiveProgramId(null))}
              className="text-xs text-parchment-300 hover:text-clay-400"
            >
              Delete Program
            </button>
          </div>
          <form onSubmit={handleAddSubject} className="card p-4 flex items-center gap-3">
            <input
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              placeholder="New Subject (e.g. Polity, DBMS)"
              className="flex-1 bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500"
            />
            <button type="submit" className="bg-brass-500 hover:bg-brass-400 text-ink-950 font-semibold rounded-lg px-4 py-2 text-sm">
              Add Subject
            </button>
          </form>
          <div className="space-y-2">
            {subjectsOfProgram.map((s) => {
              const items = contents.filter((c) => c.subjectId === s.id);
              const doneCount = items.filter((c) => contentStatus(c) === "completed").length;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSubjectId(s.id)}
                  className="w-full card p-4 flex items-center justify-between hover:border-brass-500/50 border border-transparent text-left"
                >
                  <span className="text-sm font-medium">{s.name}</span>
                  <span className="text-xs text-parchment-300">{doneCount}/{items.length} completed</span>
                </button>
              );
            })}
            {subjectsOfProgram.length === 0 && (
              <p className="text-sm text-parchment-300 text-center py-10">No subjects yet — add one above.</p>
            )}
          </div>
        </>
      )}

      {activeSubjectId && (
        <>
          <div className="flex items-center justify-between">
            <button onClick={() => setActiveSubjectId(null)} className="text-xs text-parchment-300 hover:text-parchment-100 flex items-center gap-1">
              <ChevronLeft size={14} /> Back to Subjects
            </button>
            <button
              onClick={() => deleteStudySubject(user.uid, activeSubjectId).then(() => setActiveSubjectId(null))}
              className="text-xs text-parchment-300 hover:text-clay-400"
            >
              Delete Subject
            </button>
          </div>

          <button
            onClick={openNewContent}
            className="flex items-center gap-1.5 bg-brass-500 hover:bg-brass-400 text-ink-950 font-semibold rounded-lg px-3 py-2 text-sm"
          >
            <Plus size={16} /> Add Content
          </button>

          <div className="space-y-2">
            {contentsOfSubject.map((c) => {
              const status = contentStatus(c);
              const percent = contentPercent(c);
              const remaining = (c.totalSeconds || 0) - (c.completedSeconds || 0);
              return (
                <div key={c.id} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-ink-600 text-parchment-300 uppercase tracking-wide">
                          {CONTENT_TYPES.find((t) => t.id === c.type)?.label}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_STYLE[status]}`}>
                          {STATUS_LABEL[status]}
                        </span>
                      </div>
                      <p className="text-sm font-medium mt-1">{c.title}</p>
                      {c.instructor && <p className="text-xs text-parchment-300">{c.instructor}</p>}
                      {c.hasDuration && c.totalSeconds > 0 && (
                        <p className="text-xs text-parchment-300 mt-1">
                          {formatHMS(c.completedSeconds || 0)} / {formatHMS(c.totalSeconds)}
                          {status === "in_progress" && ` — Continue, ${formatHMS(remaining)} remaining`}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openEditContent(c)} className="p-1.5 text-parchment-300 hover:text-parchment-100">
                        <Pencil size={14} />
                      </button>
                    </div>
                  </div>

                  {c.hasDuration ? (
                    <>
                      <div className="h-1.5 rounded-full bg-ink-700 overflow-hidden mt-3">
                        <div className="h-full bg-brass-500 rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                      <button
                        onClick={() => setProgressModal(c)}
                        className="text-[11px] text-brass-400 hover:text-brass-300 mt-2"
                      >
                        Update progress ({percent}%)
                      </button>
                    </>
                  ) : (
                    <label className="flex items-center gap-2 mt-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!c.done}
                        onChange={(e) => updateStudyContent(user.uid, c.id, { done: e.target.checked })}
                        className="accent-brass-500 w-4 h-4"
                      />
                      <span className="text-xs text-parchment-300">Mark as done</span>
                    </label>
                  )}
                </div>
              );
            })}
            {contentsOfSubject.length === 0 && (
              <p className="text-sm text-parchment-300 text-center py-10">No content yet — add a lecture, book, or note above.</p>
            )}
          </div>
        </>
      )}

      {contentModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setContentModal(null)}>
          <div className="card w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-semibold">
                {contentModal === "new" ? "Add Content" : "Edit Content"}
              </h3>
              <button onClick={() => setContentModal(null)} className="text-parchment-300 hover:text-parchment-100">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveContent} className="space-y-3">
              <select
                value={contentForm.type}
                onChange={(e) =>
                  setContentForm({
                    ...contentForm,
                    type: e.target.value,
                    hasDuration: DEFAULT_DURATION_TYPES.includes(e.target.value),
                  })
                }
                className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none"
              >
                {CONTENT_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
              <input
                autoFocus
                required
                value={contentForm.title}
                onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
                placeholder="Title (e.g. Indian Polity — Lecture 04)"
                className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500"
              />
              <input
                value={contentForm.instructor}
                onChange={(e) => setContentForm({ ...contentForm, instructor: e.target.value })}
                placeholder="Instructor / source (optional)"
                className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500"
              />
              <input
                value={contentForm.url}
                onChange={(e) => setContentForm({ ...contentForm, url: e.target.value })}
                placeholder="URL (optional)"
                className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500"
              />
              <textarea
                value={contentForm.notes}
                onChange={(e) => setContentForm({ ...contentForm, notes: e.target.value })}
                placeholder="Notes (optional)"
                rows={2}
                className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500 resize-y"
              />

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={contentForm.hasDuration}
                  onChange={(e) => setContentForm({ ...contentForm, hasDuration: e.target.checked })}
                  className="accent-brass-500 w-4 h-4"
                />
                <span className="text-xs text-parchment-300">Track duration/progress (for lectures, videos)</span>
              </label>

              {contentForm.hasDuration && (
                <div>
                  <label className="block text-[11px] text-parchment-300 mb-1">Total duration</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min="0" value={contentForm.totalH} onChange={(e) => setContentForm({ ...contentForm, totalH: e.target.value })} className="w-16 bg-ink-700 border border-ink-600 rounded-md px-2 py-1.5 text-xs outline-none" />
                    <span className="text-xs text-parchment-300">h</span>
                    <input type="number" min="0" max="59" value={contentForm.totalM} onChange={(e) => setContentForm({ ...contentForm, totalM: e.target.value })} className="w-16 bg-ink-700 border border-ink-600 rounded-md px-2 py-1.5 text-xs outline-none" />
                    <span className="text-xs text-parchment-300">m</span>
                    <input type="number" min="0" max="59" value={contentForm.totalS} onChange={(e) => setContentForm({ ...contentForm, totalS: e.target.value })} className="w-16 bg-ink-700 border border-ink-600 rounded-md px-2 py-1.5 text-xs outline-none" />
                    <span className="text-xs text-parchment-300">s</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button type="submit" className="flex-1 bg-brass-500 hover:bg-brass-400 text-ink-950 font-semibold rounded-lg py-2 text-sm">
                  Save
                </button>
                {contentModal !== "new" && (
                  <button
                    type="button"
                    onClick={() => handleDeleteContent(contentModal.id)}
                    className="p-2 rounded-lg border border-clay-500/50 text-clay-400 hover:bg-clay-500/10"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {progressModal && (
        <ProgressEditor
          uid={user.uid}
          content={progressModal}
          onClose={() => setProgressModal(null)}
        />
      )}
    </div>
  );
}

function ProgressEditor({ uid, content, onClose }) {
  const start = secondsToHms(content.completedSeconds || 0);
  const [h, setH] = useState(start.h);
  const [m, setM] = useState(start.m);
  const [s, setS] = useState(start.s);

  const totalSeconds = content.totalSeconds || 0;
  const enteredSeconds = hmsToSeconds(h, m, s);
  const clamped = Math.min(enteredSeconds, totalSeconds || enteredSeconds);
  const remaining = Math.max(0, totalSeconds - clamped);
  const percent = totalSeconds > 0 ? Math.round((clamped / totalSeconds) * 100) : 0;

  async function save() {
    await updateStudyContent(uid, content.id, { completedSeconds: clamped });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-display font-semibold">Update Progress</h3>
          <button onClick={onClose} className="text-parchment-300 hover:text-parchment-100">
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-parchment-300 mb-1">{content.title}</p>
        <p className="text-xs text-parchment-300 mb-4">Total: {formatHMS(totalSeconds)}</p>

        <label className="block text-[11px] text-parchment-300 mb-1">Completed</label>
        <div className="flex items-center gap-2 mb-4">
          <input type="number" min="0" value={h} onChange={(e) => setH(e.target.value)} className="w-16 bg-ink-700 border border-ink-600 rounded-md px-2 py-1.5 text-xs outline-none" />
          <span className="text-xs text-parchment-300">h</span>
          <input type="number" min="0" max="59" value={m} onChange={(e) => setM(e.target.value)} className="w-16 bg-ink-700 border border-ink-600 rounded-md px-2 py-1.5 text-xs outline-none" />
          <span className="text-xs text-parchment-300">m</span>
          <input type="number" min="0" max="59" value={s} onChange={(e) => setS(e.target.value)} className="w-16 bg-ink-700 border border-ink-600 rounded-md px-2 py-1.5 text-xs outline-none" />
          <span className="text-xs text-parchment-300">s</span>
        </div>

        <div className="bg-ink-700/40 rounded-lg p-3 space-y-1 mb-4">
          <div className="h-1.5 rounded-full bg-ink-700 overflow-hidden">
            <div className="h-full bg-brass-500 rounded-full" style={{ width: `${percent}%` }} />
          </div>
          <p className="text-[11px] text-parchment-300">
            {percent}% — Remaining: {formatHMS(remaining)}
          </p>
        </div>

        <button onClick={save} className="w-full bg-brass-500 hover:bg-brass-400 text-ink-950 font-semibold rounded-lg py-2 text-sm">
          Save progress
        </button>
      </div>
    </div>
  );
}
