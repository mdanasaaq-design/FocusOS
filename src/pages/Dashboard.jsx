import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../lib/auth";
import {
  subscribeCollection,
  subscribeHabitList,
  subscribeHabitLogs,
  subscribeProfile,
  subscribePrayerLogs,
  subscribeTimetableCompletions,
  subscribePomodoroSessions,
  subscribeConfig,
  setConfig,
  PRAYERS,
} from "../lib/data";
import { subscribeNodes } from "../data/nodes";
import { daysUntil, formatDate, todayKey, currentStreak, timeOfDayGreeting } from "../lib/dates";
import { formatHijri } from "../lib/hijri";
import { nextOccurrence } from "../lib/reminders";
import LiveClock from "../components/LiveClock";
import StatCard from "../components/StartCard";
import DraggableDashboardGrid from "../components/DraggableDashboardGrid";
import { getDefaultDashboard, normalizeDashboard, DASHBOARD_WIDGET_REGISTRY } from "../modules/dashboard";

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
  const [nodes, setNodes] = useState([]);
  const [dashboard, setDashboard] = useState(getDefaultDashboard);
  const [editMode, setEditMode] = useState(false);

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
      subscribeNodes(user.uid, "core", setNodes),
      subscribeConfig(user.uid, (config) =>
        setDashboard(normalizeDashboard(config?.dashboard || getDefaultDashboard()))
      ),
    ];
    return () => subs.forEach((unsubscribe) => unsubscribe());
  }, [user]);

  const today = todayKey();
  const todayLog = logs[today] || {};
  const habitsDoneToday = habits.filter((habit) => todayLog[habit.id]).length;
  const habitPercent = habits.length ? Math.round((habitsDoneToday / habits.length) * 100) : 0;
  const bestStreak = habits.reduce((max, habit) => Math.max(max, currentStreak(logs, habit.id)), 0);
  const todayPrayers = prayerLogs[today] || {};
  const prayerPercent = Math.round(
    (PRAYERS.filter((prayer) => todayPrayers[prayer]).length / PRAYERS.length) * 100
  );
  const activeTimetable = timetables.find((timetable) => timetable.active);
  const todayTtCompletions = ttCompletions[today] || {};
  const ttEntries = activeTimetable?.entries || [];
  const ttDone = ttEntries.filter(
    (entry) => todayTtCompletions[`${activeTimetable?.id}:${entry.id}`]
  ).length;
  const ttPercent = ttEntries.length ? Math.round((ttDone / ttEntries.length) * 100) : 0;
  const todayFocusMin = pomodoroSessions
    .filter((session) => session.date === today)
    .reduce((sum, session) => sum + (session.durationMinutes || 0), 0);
  const todayExercise = exerciseLogs.filter((entry) => entry.date === today);
  const exerciseDone = todayExercise.filter((entry) => entry.completed).length;
  const exercisePercent = todayExercise.length
    ? Math.round((exerciseDone / todayExercise.length) * 100)
    : 0;
  const upcoming = [...deadlines]
    .filter((deadline) => daysUntil(deadline.date) >= 0)
    .sort((a, b) => daysUntil(a.date) - daysUntil(b.date))
    .slice(0, 5);
  const criticalDeadline = upcoming.find((deadline) => deadline.type === "critical");
  const upcomingReminders = reminders
    .map((reminder) => ({ reminder, next: nextOccurrence(reminder) }))
    .filter((item) => item.next)
    .sort((a, b) => a.next - b.next)
    .slice(0, 5);

  const capabilitySummary = useMemo(() => {
    const counts = {};
    let attachedNodes = 0;
    nodes.forEach((node) => {
      const capabilities = Array.isArray(node.capabilities) ? node.capabilities : [];
      if (capabilities.length) attachedNodes += 1;
      capabilities.forEach((capability) => {
        counts[capability] = (counts[capability] || 0) + 1;
      });
    });
    return {
      counts,
      attachedNodes,
      total: Object.values(counts).reduce((sum, count) => sum + count, 0),
    };
  }, [nodes]);

  const orderedWidgets = useMemo(
    () => dashboard.widgets.filter((widget) => widget.enabled).sort((a, b) => a.order - b.order),
    [dashboard]
  );
  const columns = dashboard.columns || 12;

  async function saveLayout(widgets) {
    if (!user) return;
    await setConfig(user.uid, { dashboard: { ...dashboard, widgets } });
  }

  function renderCapabilityWidget(widget) {
    const definition = DASHBOARD_WIDGET_REGISTRY[widget.key];
    const capabilityKey = widget.capabilityKey || definition?.capabilityKey;
    if (!capabilityKey) return null;

    const assignedNodes = nodes.filter(
      (node) => Array.isArray(node.capabilities) && node.capabilities.includes(capabilityKey)
    );
    const label = definition?.label || widget.key;

    return (
      <div className="card h-full p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-sm font-semibold">{label}</h3>
          <span className="text-xs text-parchment-300">
            {assignedNodes.length} node{assignedNodes.length === 1 ? "" : "s"}
          </span>
        </div>
        {assignedNodes.length === 0 ? (
          <p className="text-xs text-parchment-300/60">
            No nodes have this capability yet. Assign it in Settings.
          </p>
        ) : (
          <div className="space-y-2">
            {assignedNodes.slice(0, 6).map((node) => (
              <div
                key={node.id}
                className="flex items-center justify-between rounded-lg bg-ink-800/50 px-3 py-2"
              >
                <span className="text-sm truncate">{node.name}</span>
                <span className="text-[10px] text-brass-500">enabled</span>
              </div>
            ))}
            {assignedNodes.length > 6 && (
              <p className="text-[11px] text-parchment-300/60">
                +{assignedNodes.length - 6} more
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  function renderWidget(widget) {
    const capabilityWidget = renderCapabilityWidget(widget);
    if (capabilityWidget) return capabilityWidget;

    const key = widget.key;
    const content = {
      greeting: (
        <div className="h-full flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs text-brass-500 mb-1">Assalamualaikum warahmatullahi wabarkatahu</p>
            <h2 className="text-2xl font-display font-semibold">
              {timeOfDayGreeting()}
              {profile?.name ? `, ${profile.name}` : ""}
            </h2>
          </div>
        </div>
      ),
      clock: (
        <div className="card h-full p-5 flex items-center justify-center">
          <LiveClock className="text-xl font-display font-semibold text-brass-400 tabular-nums" />
        </div>
      ),
      date: (
        <div className="card h-full p-5">
          <p className="text-xs text-parchment-300">
            <span>
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span className="mx-2 text-parchment-300/50">•</span>
            <span>{formatHijri(new Date(), profile?.hijriAdjustmentDays || 0)}</span>
          </p>
        </div>
      ),
      habits: (
        <StatCard
          title="Habits"
          value={`${habitsDoneToday}/${habits.length || 0}`}
          percent={habitPercent}
          color="#4F9A86"
          sublabel={`Best streak: ${bestStreak}d`}
        />
      ),
      pomodoro: (
        <StatCard title="Pomodoro" value={`${todayFocusMin}m`} color="#CB7360" sublabel="Focused today" />
      ),
      exercise: (
        <StatCard
          title="Exercise"
          value={`${exerciseDone}/${todayExercise.length || 0}`}
          percent={exercisePercent}
          color="#B85C4A"
          sublabel={todayExercise.length ? `${exercisePercent}% complete` : "Nothing logged today"}
        />
      ),
      tasks: <StatCard title="Tasks" value="—" sublabel="Task capability available" />,
      calendar: <StatCard title="Calendar" value="—" sublabel="Calendar events" />,
      progress: <StatCard title="Progress" value={`${habitPercent}%`} percent={habitPercent} sublabel="Habit progress" />,
      counter: <StatCard title="Counter" value="0" sublabel="Configurable counter" />,
      statistics: <StatCard title="Statistics" value="—" sublabel="Statistics component" />,
      notes: <StatCard title="Notes" value="—" sublabel="Selected notes" />,
      timetable: (
        <StatCard
          title="Timetable Follow"
          value={activeTimetable ? `${ttDone}/${ttEntries.length}` : "—"}
          percent={activeTimetable ? ttPercent : 0}
          sublabel={activeTimetable ? activeTimetable.name : "No active timetable"}
        />
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
                  <div
                    key={deadline.id}
                    className="flex items-center justify-between py-2 border-b border-ink-700/60 last:border-0"
                  >
                    <div>
                      <p className="text-sm">{deadline.title}</p>
                      <p className="text-xs text-parchment-300">{formatDate(deadline.date)}</p>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        days <= 7 ? "text-clay-400" : "text-parchment-200"
                      }`}
                    >
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
                <div key={reminder.id} className="flex items-center justify-between py-1.5">
                  <span className="text-sm">{reminder.title}</span>
                  <span className="text-xs text-parchment-300">
                    {Math.round((next - new Date().setHours(0, 0, 0, 0)) / 86400000) === 0
                      ? "Today"
                      : formatDate(next)}
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

  function renderEditableWidget(widget) {
    return (
      <div className={`h-full rounded-xl ${editMode ? "ring-1 ring-brass-500/40" : ""}`}>
        {renderWidget(widget)}
        {editMode && (
          <div className="absolute top-2 right-2 rounded-lg bg-ink-950/90 px-2 py-1 text-[10px] text-parchment-200 shadow-lg">
            Drag to move • Resize corner
          </div>
        )}
      </div>
    );
  }

  async function saveChanges() {
    try {
      await saveLayout(dashboard.widgets);
      setEditMode(false);
    } catch (error) {
      console.error("Failed to save dashboard", error);
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-parchment-300/60">Dashboard</p>
          <h2 className="text-2xl font-display font-semibold">{dashboard.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs text-parchment-300/50">{columns}-column layout</p>
          {editMode ? (
            <button className="btn-primary text-xs px-3 py-2" onClick={saveChanges}>
              Save layout
            </button>
          ) : (
            <button className="btn-secondary text-xs px-3 py-2" onClick={() => setEditMode(true)}>
              Customize
            </button>
          )}
        </div>
      </div>

      <DraggableDashboardGrid
        columns={columns}
        widgets={orderedWidgets}
        renderWidget={renderEditableWidget}
        editable={editMode}
        onChange={(widgets) => setDashboard((current) => ({ ...current, widgets }))}
      />

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

      <div className="card p-4">
        <p className="text-[11px] text-parchment-300/60">
          Dashboard widgets can represent system tools or capabilities assigned to your universal nodes. Configure node capabilities in Settings.
        </p>
      </div>
    </div>
  );
}
