import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../lib/auth";
import {
  subscribeCollection,
  subscribeHabitList,
  subscribeHabitLogs,
  subscribeProfile,
  subscribePrayerLogs,
  setPrayerLog,
  subscribeTimetableCompletions,
  subscribePomodoroSessions,
  subscribeConfig,
  PRAYERS,
} from "../lib/data";
import { daysUntil, formatDate, todayKey, currentStreak, timeOfDayGreeting } from "../lib/dates";
import { formatHijri } from "../lib/hijri";
import { nextOccurrence } from "../lib/reminders";
import LiveClock from "../components/LiveClock";
import StatCard from "../components/StartCard";
import { getDefaultDashboard, normalizeDashboard } from "../modules/dashboard";

const PRAYER_LABELS = { fajr: "Fajr", dhuhr: "Dhuhr", asr: "Asr", maghrib: "Maghrib", isha: "Isha" };

export default function Dashboard() {
  const { user } = useAuth();
  const [deadlines, setDeadlines] = useState([]);
  const [habits, setHabits] = useState([]);
  const [logs, setLogs] = useState({});
  const [profile, setProfileState] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [prayerLogs, setPrayerLogs] = useState({});
  const [timetables, setTimetables] = useState([]);
  const [ttCompletions, setTtCompletions] = useState({});
  const [pomodoroSessions, setPomodoroSessions] = useState([]);
  const [exerciseLogs, setExerciseLogs] = useState([]);
  const [dashboard, setDashboard] = useState(getDefaultDashboard);

  useEffect(() => {
    if (!user) return;
    const subs = [
      subscribeCollection(user.uid, "deadlines", setDeadlines),
      subscribeHabitList(user.uid, setHabits),
      subscribeHabitLogs(user.uid, setLogs),
      subscribeProfile(user.uid, setProfileState),
      subscribeCollection(user.uid, "reminders", setReminders),
      subscribePrayerLogs(user.uid, setPrayerLogs),
      subscribeCollection(user.uid, "timetables", setTimetables),
      subscribeTimetableCompletions(user.uid, setTtCompletions),
      subscribePomodoroSessions(user.uid, setPomodoroSessions),
      subscribeCollection(user.uid, "exerciseLogs", setExerciseLogs),
      subscribeConfig(user.uid, (config) => {
        setDashboard(normalizeDashboard(config?.dashboard || getDefaultDashboard()));
      }),
    ];
    return () => subs.forEach((unsub) => unsub());
  }, [user]);

  const enabledWidgets = useMemo(
    () => new Set(dashboard.widgets.filter((widget) => widget.enabled).map((widget) => widget.key)),
    [dashboard]
  );

  const today = todayKey();
  const todayLog = logs[today] || {};
  const habitsDoneToday = habits.filter((h) => todayLog[h.id]).length;
  const habitPercent = habits.length ? Math.round((habitsDoneToday / habits.length) * 100) : 0;
  const bestStreak = habits.reduce((max, h) => Math.max(max, currentStreak(logs, h.id)), 0);

  const todayPrayers = prayerLogs[today] || {};
  const prayersDone = PRAYERS.filter((p) => todayPrayers[p]).length;
  const prayerPercent = Math.round((prayersDone / PRAYERS.length) * 100);

  const activeTimetable = timetables.find((t) => t.active);
  const todayTtCompletions = ttCompletions[today] || {};
  const ttEntries = activeTimetable?.entries || [];
  const ttDone = ttEntries.filter((e) => todayTtCompletions[`${activeTimetable?.id}:${e.id}`]).length;
  const ttPercent = ttEntries.length ? Math.round((ttDone / ttEntries.length) * 100) : 0;

  const todayFocusMin = pomodoroSessions
    .filter((s) => s.date === today)
    .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

  const todayExercise = exerciseLogs.filter((e) => e.date === today);
  const exerciseDone = todayExercise.filter((e) => e.completed).length;
  const exercisePercent = todayExercise.length ? Math.round((exerciseDone / todayExercise.length) * 100) : 0;

  const upcoming = [...deadlines]
    .filter((d) => daysUntil(d.date) >= 0)
    .sort((a, b) => daysUntil(a.date) - daysUntil(b.date))
    .slice(0, 5);
  const criticalDeadline = upcoming.find((d) => d.type === "critical");

  const upcomingReminders = reminders
    .map((r) => ({ r, next: nextOccurrence(r) }))
    .filter((x) => x.next)
    .sort((a, b) => a.next - b.next)
    .slice(0, 5);

  return (
    <div className="p-8 space-y-6">
      {enabledWidgets.has("greeting") && (
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs text-brass-500 mb-1">Assalamualaikum warahmatullahi wabarkatahu</p>
            <h2 className="text-2xl font-display font-semibold">
              {timeOfDayGreeting()}{profile?.name ? `, ${profile.name}` : ""}
            </h2>
          </div>
          {enabledWidgets.has("clock") && <LiveClock className="text-xl font-display font-semibold text-brass-400 tabular-nums" />}
        </header>
      )}

      {enabledWidgets.has("date") && (
        <p className="text-xs text-parchment-300 mt-1.5 space-x-2">
          <span>{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</span>
          <span className="text-parchment-300/50">•</span>
          <span>{formatHijri(new Date(), profile?.hijriAdjustmentDays || 0)}</span>
        </p>
      )}

      {enabledWidgets.has("deadlines") && criticalDeadline && (
        <div className="card border-clay-500/50 bg-clay-500/10 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-clay-400">{criticalDeadline.title}</p>
            <p className="text-xs text-parchment-300">{formatDate(criticalDeadline.date)}</p>
          </div>
          <p className="text-2xl font-display font-semibold text-clay-400">{daysUntil(criticalDeadline.date)}d</p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {enabledWidgets.has("habits") && <StatCard title="Habits" value={`${habitsDoneToday}/${habits.length || 0}`} percent={habitPercent} color="#4F9A86" sublabel={`Best streak: ${bestStreak}d`} />}
        {enabledWidgets.has("timetable") && <StatCard title="Timetable Follow" value={activeTimetable ? `${ttDone}/${ttEntries.length}` : "—"} percent={activeTimetable ? ttPercent : 0} color="#D9B968" sublabel={activeTimetable ? activeTimetable.name : "No active timetable"} />}
        {enabledWidgets.has("pomodoro") && <StatCard title="Pomodoro" value={`${todayFocusMin}m`} color="#CB7360" sublabel="Focused today" />}
        {enabledWidgets.has("exercise") && <StatCard title="Exercise" value={`${exerciseDone}/${todayExercise.length || 0}`} percent={exercisePercent} color="#B85C4A" sublabel={todayExercise.length === 0 ? "Nothing logged today" : `${exercisePercent}% complete`} />}
        {enabledWidgets.has("tasks") && <StatCard title="Tasks" value="—" sublabel="Task capability available" />}
        {enabledWidgets.has("calendar") && <StatCard title="Calendar" value="—" sublabel="Calendar events" />}
        {enabledWidgets.has("reminders") && <StatCard title="Reminders" value={`${upcomingReminders.length}`} sublabel="Upcoming reminders" />}
        {enabledWidgets.has("progress") && <StatCard title="Progress" value={`${habitPercent}%`} percent={habitPercent} sublabel="Habit progress" />}
        {enabledWidgets.has("counter") && <StatCard title="Counter" value="0" sublabel="Configurable counter" />}
        {enabledWidgets.has("statistics") && <StatCard title="Statistics" value="—" sublabel="Statistics component" />}
        {enabledWidgets.has("notes") && <StatCard title="Notes" value="—" sublabel="Selected notes" />}
        {enabledWidgets.has("deadlines") && !criticalDeadline && <StatCard title="Deadlines" value={`${upcoming.length}`} sublabel="Upcoming deadlines" />}
        {enabledWidgets.has("reminders") && upcomingReminders.length > 0 && null}
        {enabledWidgets.has("tasks") && null}
        {enabledWidgets.has("calendar") && null}
        {enabledWidgets.has("habits") && null}
        {enabledWidgets.has("timetable") && null}
        {enabledWidgets.has("pomodoro") && null}
        {enabledWidgets.has("exercise") && null}
        {enabledWidgets.has("progress") && null}
        {enabledWidgets.has("counter") && null}
        {enabledWidgets.has("statistics") && null}
        {enabledWidgets.has("notes") && null}
        {enabledWidgets.has("deadlines") && null}
        {enabledWidgets.has("greeting") && null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {enabledWidgets.has("deadlines") && (
          <div className="card p-6">
            <h3 className="text-sm font-semibold mb-4">Upcoming Deadlines</h3>
            {upcoming.length === 0 ? <p className="text-xs text-parchment-300">No deadlines set.</p> : <div className="space-y-2">{upcoming.map((d) => { const days = daysUntil(d.date); const urgent = days <= 7; return <div key={d.id} className="flex items-center justify-between py-2 border-b border-ink-700/60 last:border-0"><div><p className="text-sm">{d.title}</p><p className="text-xs text-parchment-300">{formatDate(d.date)}</p></div><span className={`text-sm font-semibold ${urgent ? "text-clay-400" : "text-parchment-200"}`}>{days === 0 ? "Today" : `${days} days`}</span></div>; })}</div>}
          </div>
        )}

        {enabledWidgets.has("reminders") && (
          <div className="card p-6">
            <h3 className="text-sm font-semibold mb-4">Upcoming Reminders</h3>
            {upcomingReminders.length === 0 ? <p className="text-xs text-parchment-300">No reminders set — add some from the Calendar page.</p> : <div className="space-y-2">{upcomingReminders.map(({ r, next }) => { const days = Math.round((next - new Date().setHours(0, 0, 0, 0)) / 86400000); return <div key={r.id} className="flex items-center justify-between py-1.5"><span className="text-sm">{r.title}</span><span className="text-xs text-parchment-300">{days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days} days`}</span></div>; })}</div>}
          </div>
        )}
      </div>

      {enabledWidgets.has("greeting") && <div className="card p-4"><p className="text-[11px] text-parchment-300/60">Dashboard: {dashboard.name}</p></div>}
    </div>
  );
}
