import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../lib/auth";
import {
  subscribeCollection,
  subscribeHabitList,
  subscribeHabitLogs,
  subscribeProfile,
  subscribeTimetableCompletions,
  subscribePomodoroSessions,
  subscribeConfig,
  getConfig,
} from "../lib/data";
import { subscribeNodes } from "../data/nodes";
import { daysUntil, formatDate, todayKey, currentStreak } from "../lib/dates";
import { formatHijri } from "../lib/hijri";
import { nextOccurrence } from "../lib/reminders";
import LiveClock from "../components/LiveClock";
import StatCard from "../components/StartCard";
import DraggableDashboardGrid from "../components/DraggableDashboardGrid";
import { getConfiguredTimeGreeting, formatConfiguredDate, normalizePreferences } from "../lib/preferences";
import { getDefaultDashboard, normalizeDashboard } from "../modules/dashboard";

export default function Dashboard() {
  const { user } = useAuth();
  const [deadlines, setDeadlines] = useState([]);
  const [habits, setHabits] = useState([]);
  const [logs, setLogs] = useState({});
  const [profile, setProfileState] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [ttCompletions, setTtCompletions] = useState({});
  const [pomodoroSessions, setPomodoroSessions] = useState([]);
  const [exerciseLogs, setExerciseLogs] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [dashboard, setDashboard] = useState(getDefaultDashboard);
  const [preferences, setPreferences] = useState(normalizePreferences());

  useEffect(() => {
    if (!user) return;
    let active = true;

    getConfig(user.uid)
      .then((config) => {
        if (!active) return;
        setDashboard(normalizeDashboard(config?.dashboard || getDefaultDashboard()));
        setPreferences(normalizePreferences(config?.preferences));
      })
      .catch((error) => console.error("Failed to load dashboard configuration", error));

    const subscriptions = [
      subscribeCollection(user.uid, "deadlines", setDeadlines),
      subscribeHabitList(user.uid, setHabits),
      subscribeHabitLogs(user.uid, setLogs),
      subscribeProfile(user.uid, setProfileState),
      subscribeCollection(user.uid, "reminders", setReminders),
      subscribeCollection(user.uid, "timetables", setTimetables),
      subscribeTimetableCompletions(user.uid, setTtCompletions),
      subscribePomodoroSessions(user.uid, setPomodoroSessions),
      subscribeCollection(user.uid, "exerciseLogs", setExerciseLogs),
      subscribeNodes(user.uid, "core", setNodes),
      subscribeConfig(user.uid, (config) => {
        setDashboard(normalizeDashboard(config?.dashboard || getDefaultDashboard()));
        setPreferences(normalizePreferences(config?.preferences));
      }),
    ];

    return () => {
      active = false;
      subscriptions.forEach((unsubscribe) => unsubscribe());
    };
  }, [user]);

  const today = todayKey();
  const todayLog = logs[today] || {};
  const habitsDoneToday = habits.filter((habit) => todayLog[habit.id]).length;
  const habitPercent = habits.length ? Math.round((habitsDoneToday / habits.length) * 100) : 0;
  const bestStreak = habits.reduce((max, habit) => Math.max(max, currentStreak(logs, habit.id)), 0);

  const activeTimetable = timetables.find((timetable) => timetable.active);
  const todayTtCompletions = ttCompletions[today] || {};
  const ttEntries = activeTimetable?.entries || [];
  const ttDone = ttEntries.filter((entry) => todayTtCompletions[`${activeTimetable?.id}:${entry.id}`]).length;
  const ttPercent = ttEntries.length ? Math.round((ttDone / ttEntries.length) * 100) : 0;

  const todayFocusMin = pomodoroSessions
    .filter((session) => session.date === today)
    .reduce((sum, session) => sum + (session.durationMinutes || 0), 0);

  const todayExercise = exerciseLogs.filter((entry) => entry.date === today);
  const exerciseDone = todayExercise.filter((entry) => entry.completed).length;
  const exercisePercent = todayExercise.length ? Math.round((exerciseDone / todayExercise.length) * 100) : 0;

  const upcoming = [...deadlines]
    .filter((deadline) => daysUntil(deadline.date) >= 0)
    .sort((a, b) => daysUntil(a.date) - daysUntil(b.date))
    .slice(0, 5);

  const upcomingReminders = reminders
    .map((reminder) => ({ reminder, next: nextOccurrence(reminder) }))
    .filter((item) => item.next)
    .sort((a, b) => a.next - b.next)
    .slice(0, 5);

  const orderedWidgets = useMemo(
    () => dashboard.widgets.filter((widget) => widget.enabled).sort((a, b) => a.order - b.order),
    [dashboard]
  );

  function renderWidget(widget) {
    const key = widget.key;
    const greeting = getConfiguredTimeGreeting(new Date(), preferences);
    const primaryDate =
      preferences.calendar.primary === "hijri"
        ? formatHijri(new Date(), profile?.hijriAdjustmentDays || 0)
        : formatConfiguredDate(new Date(), preferences, {
            weekday: "long",
            day: "2-digit",
            month: preferences.dateFormat === "short" ? "2-digit" : "long",
            year: "numeric",
          });
    const secondaryDate =
      preferences.calendar.secondary === "hijri"
        ? formatHijri(new Date(), profile?.hijriAdjustmentDays || 0)
        : preferences.calendar.secondary === "gregorian"
          ? formatConfiguredDate(new Date(), preferences)
          : null;

    const content = {
      greeting: preferences.greeting.enabled ? (
        <div className="card h-full p-5 flex items-end">
          <div>
            <p className="text-xs text-brass-500 mb-1">{greeting}</p>
            <h2 className="text-2xl font-display font-semibold">
              {preferences.greeting.includeName && profile?.name ? `${greeting}, ${profile.name}` : greeting}
            </h2>
          </div>
        </div>
      ) : null,

      clock: preferences.clock.enabled ? (
        <div className="card h-full p-5 flex items-center justify-center">
          <LiveClock preferences={preferences} className="text-xl font-display font-semibold text-brass-400 tabular-nums" />
        </div>
      ) : null,

      date: (
        <div className="card h-full p-5">
          <p className="text-xs text-parchment-300">
            <span>{primaryDate}</span>
            {preferences.calendar.showSecondary && secondaryDate && (
              <>
                <span className="mx-2 text-parchment-300/50">•</span>
                <span>{secondaryDate}</span>
              </>
            )}
          </p>
        </div>
      ),

      deadlines: (
        <div className="card h-full p-5">
          <h3 className="text-sm font-semibold mb-3">Upcoming Deadlines</h3>
          {upcoming.length === 0 ? (
            <p className="text-xs text-parchment-300">No deadlines set.</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((deadline) => {
                const days = daysUntil(deadline.date);
                return (
                  <div key={deadline.id} className="flex items-center justify-between py-2 border-b border-ink-700/60 last:border-0 gap-3">
                    <div className="min-w-0">
                      <p className="text-sm truncate">{deadline.title}</p>
                      <p className="text-xs text-parchment-300">{formatDate(deadline.date)}</p>
                    </div>
                    <span className={`text-sm font-semibold shrink-0 ${days <= 7 ? "text-clay-400" : "text-parchment-200"}`}>
                      {days === 0 ? "Today" : `${days} days`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ),

      reminders: (
        <div className="card h-full p-5">
          <h3 className="text-sm font-semibold mb-3">Upcoming Reminders</h3>
          {upcomingReminders.length === 0 ? (
            <p className="text-xs text-parchment-300">No reminders set.</p>
          ) : (
            <div className="space-y-2">
              {upcomingReminders.map(({ reminder, next }) => (
                <div key={reminder.id} className="flex items-center justify-between py-1.5 gap-3">
                  <span className="text-sm truncate">{reminder.title}</span>
                  <span className="text-xs text-parchment-300 shrink-0">
                    {Math.round((next - new Date().setHours(0, 0, 0, 0)) / 86400000) === 0 ? "Today" : formatDate(next)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ),

      habits: <StatCard title="Habits" value={`${habitsDoneToday}/${habits.length || 0}`} percent={habitPercent} color="#4F9A86" sublabel={`Best streak: ${bestStreak}d`} />,
      pomodoro: <StatCard title="Pomodoro" value={`${todayFocusMin}m`} color="#CB7360" sublabel="Focused today" />,
      exercise: <StatCard title="Exercise" value={`${exerciseDone}/${todayExercise.length || 0}`} percent={exercisePercent} color="#B85C4A" sublabel={todayExercise.length ? `${exercisePercent}% complete` : "Nothing logged today"} />,
      tasks: <StatCard title="Tasks" value="—" sublabel="Task capability available" />,
      calendar: <StatCard title="Calendar" value="—" sublabel="Calendar events" />,
      progress: <StatCard title="Progress" value={`${habitPercent}%`} percent={habitPercent} sublabel="Habit progress" />,
      counter: <StatCard title="Counter" value="0" sublabel="Configurable counter" />,
      statistics: <StatCard title="Statistics" value="—" sublabel="Statistics component" />,
      notes: <StatCard title="Notes" value="—" sublabel="Selected notes" />,
      timetable: <StatCard title="Timetable" value={activeTimetable ? `${ttDone}/${ttEntries.length}` : "—"} percent={activeTimetable ? ttPercent : 0} sublabel={activeTimetable ? activeTimetable.name : "No active timetable"} />,

      capabilities: (
        <div className="card h-full p-5">
          <h3 className="text-sm font-semibold mb-3">Node Capabilities</h3>
          {nodes.length === 0 ? (
            <p className="text-xs text-parchment-300">No nodes created yet.</p>
          ) : (
            <div className="space-y-2">
              {nodes.slice(0, 6).map((node) => (
                <div key={node.id} className="flex items-center justify-between gap-3 rounded-lg bg-ink-800/50 px-3 py-2">
                  <span className="text-sm truncate">{node.name}</span>
                  <span className="text-[10px] text-parchment-300 shrink-0">
                    {Array.isArray(node.capabilities) ? node.capabilities.length : 0} capabilities
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    };

    return content[key] || null;
  }

  const displayName = dashboard.name && dashboard.name !== "Main" && dashboard.name !== "Dashboard" ? dashboard.name : null;

  return (
    <div className="p-8 space-y-6">
      <header>
        <p className="text-xs text-parchment-300/60">Dashboard</p>
        {displayName ? <h2 className="text-2xl font-display font-semibold">{displayName}</h2> : null}
      </header>
      <DraggableDashboardGrid
        columns={dashboard.columns || 12}
        widgets={orderedWidgets}
        renderWidget={renderWidget}
        editable={false}
      />
    </div>
  );
}
