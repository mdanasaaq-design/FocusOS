import { useEffect, useState } from "react";
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
  PRAYERS,
} from "../lib/data";
import { daysUntil, formatDate, todayKey, currentStreak, timeOfDayGreeting } from "../lib/dates";
import { formatHijri } from "../lib/hijri";
import { nextOccurrence } from "../lib/reminders";
import LiveClock from "../components/LiveClock";
import StatCard from "../components/StartCard";

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
    ];
    return () => subs.forEach((unsub) => unsub());
  }, [user]);

  const today = todayKey();

  // Habits
  const todayLog = logs[today] || {};
  const habitsDoneToday = habits.filter((h) => todayLog[h.id]).length;
  const habitPercent = habits.length ? Math.round((habitsDoneToday / habits.length) * 100) : 0;
  const bestStreak = habits.reduce((max, h) => Math.max(max, currentStreak(logs, h.id)), 0);

  // Namaz
  const todayPrayers = prayerLogs[today] || {};
  const prayersDone = PRAYERS.filter((p) => todayPrayers[p]).length;
  const prayerPercent = Math.round((prayersDone / PRAYERS.length) * 100);

  // Timetable follow-through
  const activeTimetable = timetables.find((t) => t.active);
  const todayTtCompletions = ttCompletions[today] || {};
  const ttEntries = activeTimetable?.entries || [];
  const ttDone = ttEntries.filter((e) => todayTtCompletions[`${activeTimetable?.id}:${e.id}`]).length;
  const ttPercent = ttEntries.length ? Math.round((ttDone / ttEntries.length) * 100) : 0;

  // Pomodoro today
  const todayFocusMin = pomodoroSessions
    .filter((s) => s.date === today)
    .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

  // Exercise today
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
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-brass-500 mb-1">
            Assalamualaikum Warahmatullahi Wabarakatuh
          </p>
          <h2 className="text-2xl font-display font-semibold">
            {timeOfDayGreeting()}{profile?.name ? `, ${profile.name}` : ""}
          </h2>
          <p className="text-xs text-parchment-300 mt-1.5 space-x-2">
            <span>
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span className="text-parchment-300/50">•</span>
            <span>{formatHijri(new Date(), profile?.hijriAdjustmentDays || 0)}</span>
          </p>
        </div>
        <LiveClock className="text-xl font-display font-semibold text-brass-400 tabular-nums" />
      </header>

      {criticalDeadline && (
        <div className="card border-clay-500/50 bg-clay-500/10 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-clay-400">{criticalDeadline.title}</p>
            <p className="text-xs text-parchment-300">{formatDate(criticalDeadline.date)}</p>
          </div>
          <p className="text-2xl font-display font-semibold text-clay-400">
            {daysUntil(criticalDeadline.date)}d
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          title="Habits"
          value={`${habitsDoneToday}/${habits.length || 0}`}
          percent={habitPercent}
          color="#4F9A86"
          sublabel={`Best streak: ${bestStreak}d`}
        />
        <StatCard
          title="Timetable Follow"
          value={activeTimetable ? `${ttDone}/${ttEntries.length}` : "—"}
          percent={activeTimetable ? ttPercent : 0}
          color="#D9B968"
          sublabel={activeTimetable ? activeTimetable.name : "No active timetable"}
        />
        <StatCard
          title="Pomodoro"
          value={`${todayFocusMin}m`}
          color="#CB7360"
          sublabel="Focused today"
        />
        <StatCard
          title="Exercise"
          value={`${exerciseDone}/${todayExercise.length || 0}`}
          percent={exercisePercent}
          color="#B85C4A"
          sublabel={todayExercise.length === 0 ? "Nothing logged today" : `${exercisePercent}% complete`}
        />
        <div className="card p-4">
          <p className="text-[11px] font-semibold text-parchment-300 uppercase tracking-wide mb-2.5">
            Namaz — {prayersDone}/5
          </p>
          <div className="h-1.5 rounded-full bg-ink-700 overflow-hidden mb-2.5">
            <div
              className="h-full rounded-full bg-teal-500 transition-all"
              style={{ width: `${prayerPercent}%` }}
            />
          </div>
          <div className="flex gap-1">
            {PRAYERS.map((p) => (
              <button
                key={p}
                onClick={() => setPrayerLog(user.uid, today, p, !todayPrayers[p])}
                title={PRAYER_LABELS[p]}
                className={`flex-1 text-[9px] py-1 rounded-md font-medium transition-colors ${
                  todayPrayers[p]
                    ? "bg-teal-500/25 text-teal-400"
                    : "bg-ink-700 text-parchment-300 hover:bg-ink-600"
                }`}
              >
                {PRAYER_LABELS[p][0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card p-6">
          <h3 className="text-sm font-semibold mb-4">Upcoming Deadlines</h3>
          {upcoming.length === 0 ? (
            <p className="text-xs text-parchment-300">No deadlines set.</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((d) => {
                const days = daysUntil(d.date);
                const urgent = days <= 7;
                return (
                  <div key={d.id} className="flex items-center justify-between py-2 border-b border-ink-700/60 last:border-0">
                    <div>
                      <p className="text-sm">{d.title}</p>
                      <p className="text-xs text-parchment-300">{formatDate(d.date)}</p>
                    </div>
                    <span className={`text-sm font-semibold ${urgent ? "text-clay-400" : "text-parchment-200"}`}>
                      {days === 0 ? "Today" : `${days} days`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-semibold mb-4">Upcoming Reminders</h3>
          {upcomingReminders.length === 0 ? (
            <p className="text-xs text-parchment-300">No reminders set — add some from the Calendar page.</p>
          ) : (
            <div className="space-y-2">
              {upcomingReminders.map(({ r, next }) => {
                const days = Math.round((next - new Date().setHours(0, 0, 0, 0)) / 86400000);
                return (
                  <div key={r.id} className="flex items-center justify-between py-1.5">
                    <span className="text-sm">{r.title}</span>
                    <span className="text-xs text-parchment-300">
                      {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days} days`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
