import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Trash2 } from "lucide-react";
import { useAuth } from "../lib/auth";
import {
  subscribeProfile,
  subscribeCollection,
  addReminder,
  updateReminder,
  deleteReminder,
} from "../lib/data";
import { getMonthGrid, isSameDay, todayKey, formatDate } from "../lib/dates";
import { toHijri, HIJRI_MONTHS } from "../lib/hijri";
import {
  occursOnDate,
  nextOccurrence,
  REMINDER_TYPES,
  REPEAT_OPTIONS,
} from "../lib/reminders";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function calendarDateLabel(date, system, adjustment) {
  const gregorian = date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const h = toHijri(date, adjustment);
  const hijri = `${h.day} ${HIJRI_MONTHS[h.month - 1]} ${h.year} AH`;
  if (system === "hijri") return hijri;
  if (system === "dual") return `${gregorian} · ${hijri}`;
  return gregorian;
}

function CalendarAlternateView({ view, cursor, reminders, remindersOn, upcoming, openEditForm, calendarSystem, adjustment, onSelectDay }) {
  const start = new Date(cursor);
  const weekStart = new Date(start);
  weekStart.setDate(start.getDate() - start.getDay());
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
  if (view === "day") {
    const items = remindersOn(cursor);
    return <section className="card p-5">
      <h3 className="text-sm font-semibold mb-4">{calendarDateLabel(cursor, calendarSystem, adjustment)}</h3>
      {items.length ? <div className="space-y-2">{items.map((r) => <button key={r.id} onClick={() => openEditForm(r)} className="w-full flex items-center justify-between gap-3 rounded-lg bg-ink-800/50 px-3 py-3 text-left hover:bg-ink-700"><span className="text-sm">{r.title}</span><span className="text-xs text-parchment-300/60">{r.time || "All day"}</span></button>)}</div> : <p className="text-xs text-parchment-300/50">No reminders on this day.</p>}
    </section>;
  }
  if (view === "week") {
    return <section className="card p-4">
      <h3 className="text-sm font-semibold mb-4">{calendarDateLabel(days[0], calendarSystem, adjustment)} — {calendarDateLabel(days[6], calendarSystem, adjustment)}</h3>
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2">{days.map((day) => {
        const items = remindersOn(day);
        return <button key={day.toISOString()} type="button" onClick={() => onSelectDay(day)} className="min-h-32 rounded-lg border border-ink-700 bg-ink-800/40 p-2 text-left hover:border-brass-500/60">
          <p className="text-xs font-semibold">{day.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" })}</p>
          {calendarSystem !== "gregorian" && <p className="text-[9px] text-brass-400 mt-1">{calendarDateLabel(day, calendarSystem, adjustment)}</p>}
          <div className="space-y-1 mt-2">{items.slice(0, 5).map((r) => <div key={r.id} className="rounded bg-ink-700 px-1.5 py-1 text-[10px] truncate">{r.time ? `${r.time} · ` : ""}{r.title}</div>)}{items.length > 5 && <p className="text-[9px] text-parchment-300/50">+{items.length - 5} more</p>}</div>
        </button>;
      })}</div>
    </section>;
  }
  if (view === "year") {
    const months = Array.from({ length: 12 }, (_, month) => new Date(cursor.getFullYear(), month, 1));
    return <section className="card p-5">
      <h3 className="text-sm font-semibold mb-4">{cursor.getFullYear()} overview</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">{months.map((month) => {
        const count = reminders.filter((r) => {
          const next = nextOccurrence(r);
          return next && next.getFullYear() === month.getFullYear() && next.getMonth() === month.getMonth();
        }).length;
        return <div key={month.getMonth()} className="rounded-lg border border-ink-700 bg-ink-800/40 p-3"><p className="text-xs font-semibold">{month.toLocaleDateString("en-IN", { month: "long" })}</p><p className="text-[11px] text-parchment-300/50 mt-2">{count} upcoming item{count === 1 ? "" : "s"}</p></div>;
      })}</div>
    </section>;
  }
  return <section className="card p-5"><h3 className="text-sm font-semibold mb-4">Agenda</h3><div className="space-y-2">{upcoming.map(({ r, next }) => <button key={r.id} onClick={() => openEditForm(r)} className="w-full flex items-center justify-between gap-3 rounded-lg bg-ink-800/50 px-3 py-3 text-left hover:bg-ink-700"><span className="text-sm truncate">{r.title}</span><span className="text-xs text-parchment-300/60">{calendarDateLabel(next, calendarSystem, adjustment)}{r.time ? ` · ${r.time}` : ""}</span></button>)}{upcoming.length === 0 && <p className="text-xs text-parchment-300/50">No upcoming events.</p>}</div></section>;
}

const TYPE_COLOR = {
  birthday: "bg-brass-500",
  anniversary: "bg-brass-500",
  exam: "bg-clay-500",
  assignment: "bg-clay-500",
  payment: "bg-teal-500",
  personal: "bg-parchment-300",
  custom: "bg-parchment-300",
};

const emptyForm = {
  title: "",
  description: "",
  date: todayKey(),
  time: "",
  type: "personal",
  repeat: "never",
};

export default function CalendarPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [cursor, setCursor] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [view, setView] = useState("month");
  const [calendarSystem, setCalendarSystem] = useState("gregorian");

  useEffect(() => {
    if (!user) return;
    const u1 = subscribeProfile(user.uid, setProfile);
    const u2 = subscribeCollection(user.uid, "reminders", setReminders);
    return () => {
      u1();
      u2();
    };
  }, [user]);

  const adjustment = profile?.hijriAdjustmentDays || 0;
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const today = new Date();
  const cells = getMonthGrid(year, month);
  const midMonthHijri = toHijri(new Date(year, month, 15), adjustment);

  function goMonth(delta) {
    setCursor(new Date(year, month + delta, 1));
    setSelectedDay(null);
  }

  function remindersOn(date) {
    return reminders.filter((r) => occursOnDate(r, date));
  }

  const selectedDayReminders = selectedDay ? remindersOn(selectedDay.date) : [];

  const upcoming = useMemo(() => {
    return reminders
      .map((r) => ({ r, next: nextOccurrence(r) }))
      .filter((x) => x.next)
      .sort((a, b) => a.next - b.next)
      .slice(0, 8);
  }, [reminders]);

  function openAddForm(date) {
    setEditingId(null);
    setForm({ ...emptyForm, date: todayKey(date || new Date()) });
    setFormOpen(true);
  }

  function openEditForm(reminder) {
    setEditingId(reminder.id);
    setForm({
      title: reminder.title,
      description: reminder.description || "",
      date: reminder.date,
      time: reminder.time || "",
      type: reminder.type,
      repeat: reminder.repeat,
    });
    setFormOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (editingId) {
      await updateReminder(user.uid, editingId, form);
    } else {
      await addReminder(user.uid, form);
    }
    setFormOpen(false);
  }

  async function handleDelete(id) {
    await deleteReminder(user.uid, id);
    setFormOpen(false);
  }

  return (
    <div className="px-8 pt-6 pb-8 space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-display font-semibold">Calendar</h2>
          <p className="text-[11px] text-parchment-300 mt-0.5">
            Gregorian + Hijri, with recurring reminders.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-ink-600 overflow-hidden">
            {["day", "week", "month", "year", "agenda"].map((option) => (
              <button key={option} type="button" onClick={() => setView(option)} className={`px-2.5 py-1.5 text-[11px] capitalize ${view === option ? "bg-brass-500 text-ink-950 font-semibold" : "bg-ink-700 text-parchment-300 hover:bg-ink-600"}`}>
                {option}
              </button>
            ))}
          </div>
          <select value={calendarSystem} onChange={(e) => setCalendarSystem(e.target.value)} className="bg-ink-700 border border-ink-600 rounded-lg px-2.5 py-1.5 text-[11px]">
            <option value="gregorian">Gregorian</option>
            <option value="hijri">Hijri</option>
            <option value="dual">Dual</option>
          </select>
          <button
            onClick={() => openAddForm(selectedDay?.date)}
            className="flex items-center gap-1.5 bg-brass-500 hover:bg-brass-400 text-ink-950 font-semibold rounded-lg px-3 py-1.5 text-xs"
          >
            <Plus size={14} /> Add Reminder
          </button>
        </div>
      </header>

      {view === "month" ? <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => goMonth(-1)}
              className="p-1.5 rounded-lg hover:bg-ink-700 text-parchment-300 hover:text-parchment-100"
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="text-center">
              <h3 className="text-sm font-display font-semibold">
                {cursor.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </h3>
              <p className="text-[10px] text-brass-400">
                {HIJRI_MONTHS[midMonthHijri.month - 1]} {midMonthHijri.year} AH
              </p>
            </div>

            <button
              onClick={() => goMonth(1)}
              className="p-1.5 rounded-lg hover:bg-ink-700 text-parchment-300 hover:text-parchment-100"
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((w) => (
              <div key={w} className="text-center text-[9px] font-medium text-parchment-300 py-0.5">
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell) => {
              const isToday = isSameDay(cell.date, today);
              const isSelected = selectedDay && isSameDay(cell.date, selectedDay.date);
              const h = toHijri(cell.date, adjustment);
              const dayReminders = remindersOn(cell.date);
              return (
                <button
                  key={cell.key}
                  onClick={() => setSelectedDay(cell)}
                  className={`relative h-11 sm:h-12 rounded-md px-1 py-0.5 text-left transition-colors ${
                    isSelected
                      ? "bg-brass-500/30 border border-brass-500"
                      : isToday
                      ? "bg-brass-500/15 border border-brass-500/60"
                      : cell.inMonth
                      ? "bg-ink-700/40 border border-transparent hover:border-ink-600"
                      : "bg-transparent border border-transparent opacity-30"
                  }`}
                >
                  <span
                    className={`block text-[11px] leading-none font-semibold ${
                      isToday || isSelected ? "text-brass-400" : cell.inMonth ? "text-parchment-100" : "text-parchment-300"
                    }`}
                  >
                    {cell.date.getDate()}
                  </span>
                  <span className="block text-[8px] leading-none text-parchment-300 mt-1">
                    {h.day} {HIJRI_MONTHS[h.month - 1]?.slice(0, 3)}
                  </span>
                  {dayReminders.length > 0 && (
                    <div className="absolute bottom-1 right-1 flex gap-0.5">
                      {dayReminders.slice(0, 3).map((r) => (
                        <span
                          key={r.id}
                          className={`w-1 h-1 rounded-full ${TYPE_COLOR[r.type] || "bg-parchment-300"}`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="text-xs font-semibold mb-2">
              {selectedDay
                ? selectedDay.date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                : "Select a day"}
            </h3>
            {selectedDay && selectedDayReminders.length === 0 && (
              <p className="text-[11px] text-parchment-300">No reminders on this day.</p>
            )}
            <div className="space-y-1.5">
              {selectedDayReminders.map((r) => (
                <button
                  key={r.id}
                  onClick={() => openEditForm(r)}
                  className="w-full text-left bg-ink-700/40 hover:bg-ink-700 rounded-lg px-2.5 py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${TYPE_COLOR[r.type]}`} />
                    <span className="text-xs font-medium">{r.title}</span>
                  </div>
                  {r.time && <p className="text-[10px] text-parchment-300 mt-0.5 ml-3.5">{r.time}</p>}
                </button>
              ))}
            </div>
            {selectedDay && (
              <button
                onClick={() => openAddForm(selectedDay.date)}
                className="w-full mt-2 text-[11px] text-brass-400 hover:text-brass-300 flex items-center justify-center gap-1 py-1"
              >
                <Plus size={12} /> Add reminder for this day
              </button>
            )}
          </div>

          <div className="card p-4">
            <h3 className="text-xs font-semibold mb-2">Upcoming</h3>
            {upcoming.length === 0 && (
              <p className="text-[11px] text-parchment-300">No upcoming reminders.</p>
            )}
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {upcoming.map(({ r, next }) => (
                <button
                  key={r.id}
                  onClick={() => openEditForm(r)}
                  className="w-full flex items-center justify-between text-left hover:bg-ink-700/40 rounded-lg px-2 py-1"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${TYPE_COLOR[r.type]}`} />
                    <span className="text-xs truncate">{r.title}</span>
                  </div>
                  <span className="text-[10px] text-parchment-300 shrink-0 ml-2">
                    {formatDate(todayKey(next))}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div> : <CalendarAlternateView view={view} cursor={cursor} reminders={reminders} remindersOn={remindersOn} upcoming={upcoming} openEditForm={openEditForm} calendarSystem={calendarSystem} adjustment={adjustment} onSelectDay={(date) => setSelectedDay({ date })} />
      {formOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setFormOpen(false)}
        >
          <div
            className="card w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-semibold">
                {editingId ? "Edit Reminder" : "New Reminder"}
              </h3>
              <button onClick={() => setFormOpen(false)} className="text-parchment-300 hover:text-parchment-100">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <input
                autoFocus
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Title"
                className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500"
              />
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Notes (optional)"
                rows={2}
                className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500 resize-y"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-parchment-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-parchment-300 mb-1">Time (optional)</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-parchment-300 mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none"
                  >
                    {REMINDER_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-parchment-300 mb-1">Repeat</label>
                  <select
                    value={form.repeat}
                    onChange={(e) => setForm({ ...form, repeat: e.target.value })}
                    className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none"
                  >
                    {REPEAT_OPTIONS.map((r) => (
                      <option key={r.id} value={r.id}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-brass-500 hover:bg-brass-400 text-ink-950 font-semibold rounded-lg py-2 text-sm"
                >
                  {editingId ? "Save changes" : "Add reminder"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => handleDelete(editingId)}
                    className="p-2 rounded-lg border border-clay-500/50 text-clay-400 hover:bg-clay-500/10"
                    aria-label="Delete reminder"
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