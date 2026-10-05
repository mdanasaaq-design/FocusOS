import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { useAuth } from "../lib/auth";
import { subscribeConfig, subscribeCollection, addReminder, updateReminder, deleteReminder } from "../lib/data";
import { subscribePages } from "../data/pages";
import { subscribeCapabilityActivity } from "../data/capabilityActivity";
import { getMonthGrid, isSameDay, todayKey } from "../lib/dates";
import { formatHijri } from "../lib/hijri";

const emptyEvent = { title: "", description: "", date: todayKey(), time: "", repeat: "never", pageId: "" };

function dayKey(date, timeZone) { return todayKey(date, timeZone); }

export default function CalendarPage() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({});
  const [pages, setPages] = useState([]);
  const [events, setEvents] = useState([]);
  const [activity, setActivity] = useState([]);
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(new Date());
  const [pageFilter, setPageFilter] = useState("all");
  const [form, setForm] = useState(emptyEvent);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const u1 = subscribeConfig(user.uid, (config) => setPreferences(config?.preferences || {}));
    const u2 = subscribePages(user.uid, setPages);
    const u3 = subscribeCollection(user.uid, "reminders", setEvents);
    const u4 = subscribeCapabilityActivity(user.uid, { sinceDate: todayKey(new Date(Date.now() - 365 * 86400000), preferences?.timeZone || "Asia/Kolkata"), limit: 0 }, setActivity);
    return () => { u1(); u2(); u3(); u4(); };
  }, [user, preferences?.timeZone]);

  const timeZone = preferences?.timeZone || "Asia/Kolkata";
  const calendarSystem = preferences?.calendar?.primary || "gregorian";
  const adjustment = Number(preferences?.hijriAdjustmentDays || 0);
  const activePages = useMemo(() => pages.filter((page) => !page.archived && !page.trashedAt), [pages]);
  const visibleEvents = useMemo(() => pageFilter === "all" ? events : events.filter((event) => (event.pageId || "") === pageFilter), [events, pageFilter]);
  const tasks = useMemo(() => activity.filter((item) => item.capability === "tasks" && item.type === "task" && item.status !== "completed" && (!item.pageId || pageFilter === "all" || item.pageId === pageFilter)), [activity, pageFilter]);
  const cells = useMemo(() => getMonthGrid(cursor.getFullYear(), cursor.getMonth()), [cursor]);
  const selectedKey = dayKey(selected, timeZone);
  const selectedEvents = visibleEvents.filter((event) => event.date === selectedKey);
  const selectedTasks = tasks.filter((task) => task.dueDate === selectedKey);

  function goToday() { const now = new Date(); setCursor(now); setSelected(now); }
  function moveMonth(delta) { setCursor((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1)); }

  function openAdd(date = selected) { setEditingId(null); setForm({ ...emptyEvent, date: dayKey(date, timeZone) }); setFormOpen(true); }
  function openEdit(event) { setEditingId(event.id); setForm({ title: event.title || "", description: event.description || "", date: event.date || selectedKey, time: event.time || "", repeat: event.repeat || "never", pageId: event.pageId || "" }); setFormOpen(true); }

  async function save(event) {
    event.preventDefault();
    if (!form.title.trim()) return;
    if (editingId) await updateReminder(user.uid, editingId, form);
    else await addReminder(user.uid, { ...form, type: "calendar_event" });
    setFormOpen(false);
  }

  async function remove() { if (editingId) await deleteReminder(user.uid, editingId); setFormOpen(false); }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-display font-semibold">Calendar</h1>
          <p className="text-xs text-parchment-300/50 mt-1">Plan, schedule and manage events across your calendar.</p>
        </div>
        <button type="button" onClick={() => openAdd()} className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-brass-500 text-ink-950 font-semibold text-xs"><Plus size={14}/> Event</button>
      </header>

      <div className="w-full">
        <section className="card p-2.5 sm:p-4 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <button type="button" onClick={() => moveMonth(-1)} className="p-2 rounded-lg border border-ink-600 hover:bg-ink-700" aria-label="Previous month"><ChevronLeft size={16}/></button>
              <button type="button" onClick={goToday} className="px-3 py-2 rounded-lg border border-ink-600 text-xs hover:bg-ink-700">Today</button>
              <button type="button" onClick={() => moveMonth(1)} className="p-2 rounded-lg border border-ink-600 hover:bg-ink-700" aria-label="Next month"><ChevronRight size={16}/></button>
            </div>
            <div>
              <h2 className="font-display font-semibold">{cursor.toLocaleDateString(preferences?.locale || "en-IN", { month: "long", year: "numeric" })}</h2>
              <p className="text-[11px] text-brass-400 mt-0.5">{calendarSystem === "hijri" ? formatHijri(cursor, adjustment, preferences?.calendar?.hijriMethod || "tabular") : `Hijri: ${formatHijri(cursor, adjustment, preferences?.calendar?.hijriMethod || "tabular")}`}</p>
            </div>
            <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-3 text-[10px] sm:text-[11px] text-parchment-300/50"><span>{tasks.length} deadlines</span><span>{visibleEvents.length} events</span></div>
          </div>
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1.5 sm:mb-2">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((day) => <div key={day} className="text-center text-[10px] text-parchment-300/50 py-1">{day}</div>)}</div>
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 md:gap-2 w-full">
            {cells.map((cell) => {
              const key = dayKey(cell.date, timeZone);
              const dayTasks = tasks.filter((task) => task.dueDate === key);
              const dayEvents = visibleEvents.filter((event) => event.date === key);
              const isToday = isSameDay(cell.date, new Date());
              const isSelected = isSameDay(cell.date, selected);
              return <button key={cell.key} type="button" onClick={() => setSelected(cell.date)} className={`min-h-[4.5rem] sm:min-h-24 lg:min-h-28 rounded-md sm:rounded-lg p-1 sm:p-2 text-left border transition-colors ${isSelected ? "border-brass-500 bg-brass-500/10" : isToday ? "border-brass-500/50 bg-brass-500/5" : "border-ink-700 bg-ink-800/30 hover:bg-ink-800"} ${cell.inMonth ? "" : "opacity-35"}`}>
                <div className="flex justify-between"><span className={`text-[10px] sm:text-xs font-semibold ${isToday ? "text-brass-400" : "text-parchment-100"}`}>{cell.date.getDate()}</span>{dayTasks.length + dayEvents.length > 0 && <span className="text-[8px] sm:text-[9px] text-parchment-300/50">{dayTasks.length + dayEvents.length}</span>}</div>
                <div className="space-y-0.5 sm:space-y-1 mt-1 sm:mt-2">
                  {dayTasks.slice(0, 2).map((task) => <div key={task.id} className="rounded bg-clay-500/15 border border-clay-500/20 px-1 py-0.5 sm:px-1.5 sm:py-1 text-[8px] sm:text-[9px] truncate text-clay-300">Deadline · {task.title}</div>)}
                  {dayEvents.slice(0, 2).map((event) => <div key={event.id} onClick={(e) => { e.stopPropagation(); openEdit(event); }} className="rounded bg-brass-500/15 border border-brass-500/20 px-1 py-0.5 sm:px-1.5 sm:py-1 text-[8px] sm:text-[9px] truncate text-brass-300">{event.time ? `${event.time} · ` : ""}{event.title}</div>)}
                  {dayTasks.length + dayEvents.length > 4 && <p className="text-[8px] sm:text-[9px] text-parchment-300/40">+{dayTasks.length + dayEvents.length - 4} more</p>}
                </div>
              </button>;
            })}
          </div>
        </section>

        <aside className="hidden">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div><p className="text-xs text-brass-400 uppercase tracking-wider">Selected day</p><h2 className="text-lg font-display font-semibold mt-1">{selected.toLocaleDateString(preferences?.locale || "en-IN", { weekday: "long", day: "numeric", month: "long" })}</h2></div>
            <button type="button" onClick={() => openAdd(selected)} className="p-2 rounded-lg border border-ink-600 hover:bg-ink-800" aria-label="Add event"><Plus size={15}/></button>
          </div>
          <div className="space-y-3">
            <div><p className="text-[10px] uppercase tracking-wider text-parchment-300/40 mb-2">Deadlines</p>{selectedTasks.length ? selectedTasks.map((task) => <div key={task.id} className="rounded-lg bg-clay-500/10 border border-clay-500/20 p-3 mb-2"><p className="text-sm">{task.title}</p><p className="text-[10px] text-parchment-300/50 mt-1">{task.priority || "No priority"}</p></div>) : <p className="text-xs text-parchment-300/40">No open deadlines.</p>}</div>
            <div><p className="text-[10px] uppercase tracking-wider text-parchment-300/40 mb-2">Events</p>{selectedEvents.length ? selectedEvents.map((event) => <button key={event.id} type="button" onClick={() => openEdit(event)} className="w-full text-left rounded-lg bg-ink-800 p-3 mb-2 hover:bg-ink-700"><p className="text-sm">{event.title}</p><p className="text-[10px] text-parchment-300/50 mt-1">{event.time || "All day"}{event.repeat && event.repeat !== "never" ? ` · ${event.repeat}` : ""}</p></button>) : <p className="text-xs text-parchment-300/40">No events.</p>}</div>
          </div>
        </aside>
      </div>

      {formOpen && <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" role="dialog" aria-modal="true">
        <form onSubmit={save} className="w-full max-w-md card p-5 space-y-4">
          <div className="flex items-center justify-between"><h2 className="font-semibold">{editingId ? "Edit event" : "Add event"}</h2><button type="button" onClick={() => setFormOpen(false)} className="p-1 rounded hover:bg-ink-700" aria-label="Close"><X size={16}/></button></div>
          <input autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Event name" className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm"/>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)" rows="3" className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm"/>
          <div className="grid grid-cols-2 gap-2"><label className="text-[11px] text-parchment-300/60">Date<input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full mt-1 bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm"/></label><label className="text-[11px] text-parchment-300/60">Time<input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="w-full mt-1 bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm"/></label></div>
          <div className="grid grid-cols-2 gap-2"><label className="text-[11px] text-parchment-300/60">Repeat<select value={form.repeat} onChange={(e) => setForm({ ...form, repeat: e.target.value })} className="w-full mt-1 bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm"><option value="never">One time</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></label><label className="text-[11px] text-parchment-300/60">Page<select value={form.pageId} onChange={(e) => setForm({ ...form, pageId: e.target.value })} className="w-full mt-1 bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm"><option value="">General</option>{activePages.map((page) => <option key={page.id} value={page.id}>{page.name}</option>)}</select></label></div>
          <div className="flex justify-between gap-2"><div>{editingId && <button type="button" onClick={remove} className="px-3 py-2 rounded-lg border border-clay-500/30 text-clay-300 text-xs">Delete</button>}</div><div className="flex gap-2"><button type="button" onClick={() => setFormOpen(false)} className="px-3 py-2 rounded-lg border border-ink-600 text-xs">Cancel</button><button type="submit" className="px-3 py-2 rounded-lg bg-brass-500 text-ink-950 font-semibold text-xs">Save event</button></div></div>
        </form>
      </div>}
    </div>
  );
}
