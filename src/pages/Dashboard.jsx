import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
  setConfig,
} from "../lib/data";
import { subscribeNodes } from "../data/nodes";
import { daysUntil, formatDate, todayKey, currentStreak } from "../lib/dates";
import { formatHijri } from "../lib/hijri";
import { nextOccurrence } from "../lib/reminders";
import LiveClock from "../components/LiveClock";
import StatCard from "../components/StartCard";
import DraggableDashboardGrid from "../components/DraggableDashboardGrid";
import { getConfiguredTimeGreeting, formatConfiguredDate, normalizePreferences } from "../lib/preferences";
import { subscribePages } from "../data/pages";
import { subscribeCapabilityActivity } from "../data/capabilityActivity";
import { getDefaultDashboard, normalizeDashboardLayouts } from "../modules/dashboard";

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
  const [pages, setPages] = useState([]);
  const [activity, setActivity] = useState([]);
  const [customize, setCustomize] = useState(false);
  const [customizeSaved, setCustomizeSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    getConfig(user.uid)
      .then((config) => {
        if (!active) return;
        const layoutState = normalizeDashboardLayouts(config || {});
        setDashboard(layoutState.layouts.find((layout) => layout.id === layoutState.activeDashboardId) || layoutState.layouts[0]);
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
      subscribePages(user.uid, setPages),
      subscribeCapabilityActivity(user.uid, { limit: 2000, sinceDate: todayKey(new Date(Date.now() - 90 * 86400000)), onError: (err) => console.error("Dashboard activity listener failed", err) }, setActivity),
      subscribeNodes(user.uid, "core", setNodes),
      subscribeConfig(user.uid, (config) => {
        const layoutState = normalizeDashboardLayouts(config || {});
        setDashboard(layoutState.layouts.find((layout) => layout.id === layoutState.activeDashboardId) || layoutState.layouts[0]);
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
  const todayFocusMin = pomodoroSessions.filter((session) => session.date === today).reduce((sum, session) => sum + (session.durationMinutes || 0), 0);
  const todayExercise = exerciseLogs.filter((entry) => entry.date === today);
  const exerciseDone = todayExercise.filter((entry) => entry.completed).length;
  const exercisePercent = todayExercise.length ? Math.round((exerciseDone / todayExercise.length) * 100) : 0;
  const upcoming = [...deadlines].filter((deadline) => daysUntil(deadline.date) >= 0).sort((a, b) => daysUntil(a.date) - daysUntil(b.date)).slice(0, 5);
  const upcomingReminders = reminders.map((reminder) => ({ reminder, next: nextOccurrence(reminder) })).filter((item) => item.next).sort((a, b) => a.next - b.next).slice(0, 5);
  const activePageIds = new Set(pages.filter((page) => !page.archived && !page.trashedAt).map((page) => page.id));
  const activePageActivity = activity.filter((item) => !item.pageId || activePageIds.has(item.pageId));
  const trackerEntries = activePageActivity.filter((item) => item.capability === "tracking" && item.type === "tracker_entry");
  const todayActivity = activePageActivity.filter((item) => item.date === today);
  const taskItems = activePageActivity.filter((item) => item.capability === "tasks" && item.type === "task");
  const openTasks = taskItems.filter((item) => item.status !== "completed");
  const completedTasks = taskItems.filter((item) => item.status === "completed");
  const noteItems = activePageActivity.filter((item) => item.capability === "notes" && item.type === "note");
  const calendarCount = reminders.filter((item) => nextOccurrence(item)).length;

  const analysisSeries = (source, trackerId = null, range = 7) => Array.from({ length: range }, (_, index) => {
    const date = new Date(); date.setDate(date.getDate() - (range - 1 - index));
    const key = todayKey(date);
    const dayItems = activePageActivity.filter((item) => item.date === key);
    if (source === "focusMinutes") return dayItems.filter((item) => item.capability === "focus").reduce((sum, item) => sum + (Number(item.durationMinutes) || 0), 0);
    if (source === "trackedMinutes") return dayItems.filter((item) => item.capability === "timeTracking").reduce((sum, item) => sum + (Number(item.durationMinutes) || 0), 0);
    if (source === "deadlines") return deadlines.filter((item) => item.date === key).length;
    if (source === "tracker") return trackerEntries.filter((item) => item.date === key && (!trackerId || item.metadata?.trackerId === trackerId)).reduce((sum, item) => sum + (Number(item.value) || 0), 0);
    if (source === "habitCompletion") return habits.length ? Math.round((habits.filter((habit) => logs[key]?.[habit.id]).length / habits.length) * 100) : 0;
    if (source === "exerciseCompletion") { const dayExercise = exerciseLogs.filter((entry) => entry.date === key); return dayExercise.length ? Math.round((dayExercise.filter((entry) => entry.completed).length / dayExercise.length) * 100) : 0; }
    if (source === "scheduleCompletion") { const completion = ttCompletions[key] || {}; return ttEntries.length ? Math.round((ttEntries.filter((entry) => completion[`${activeTimetable?.id}:${entry.id}`]).length / ttEntries.length) * 100) : 0; }
    return 0;
  });
  const analysisValue = (source, trackerId = null, range = 7) => analysisSeries(source, trackerId, range).at(-1) || 0;
  const analysisDayLabel = (index, range) => {
    if (index === range - 1) return "Today";
    const daysAgo = range - 1 - index;
    if (daysAgo < 7) return `-${daysAgo}d`;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toLocaleDateString(preferences.locale || "en-IN", { day: "2-digit", month: "short" });
  };
  const analysisLabel = (source) => ({ habitCompletion: "Habits", exerciseCompletion: "Exercise", scheduleCompletion: "Schedule", focusMinutes: "Focus", trackedMinutes: "Tracked time", deadlines: "Deadlines", tracker: "Tracker" }[source] || "Metric");
  const orderedWidgets = useMemo(() => dashboard.widgets.filter((widget) => widget.enabled && widget.key !== "greeting").sort((a, b) => a.order - b.order), [dashboard]);

  function renderWidget(widget) {
    const key = widget.key;
    const greeting = getConfiguredTimeGreeting(new Date(), preferences);
    const primaryDate = preferences.calendar.primary === "hijri"
      ? formatHijri(new Date(), profile?.hijriAdjustmentDays || 0)
      : formatConfiguredDate(new Date(), preferences, { weekday: "long", day: "2-digit", month: preferences.dateFormat === "short" ? "2-digit" : "long", year: "numeric" });
    const secondaryDate = preferences.calendar.secondary === "hijri"
      ? formatHijri(new Date(), profile?.hijriAdjustmentDays || 0)
      : preferences.calendar.secondary === "gregorian" ? formatConfiguredDate(new Date(), preferences) : null;

    if (widget.type === "node-capability") {
      const node = nodes.find((item) => item.id === widget.nodeId);
      const title = widget.config?.title || node?.name || widget.config?.nodeName || "Node";
      const capability = widget.capabilityKey || "capability";
      if (!node) return <div className="card h-full p-5"><p className="text-sm font-medium">{title}</p><p className="text-xs text-parchment-300">Node is no longer available.</p></div>;
      const count = Array.isArray(node.capabilities) ? node.capabilities.length : 0;
      return (
        <div className="card h-full p-5">
          <p className="text-xs text-brass-400">{capability}</p>
          <h3 className="text-sm font-semibold mt-1">{title}</h3>
          {widget.view === "progress" ? <div className="mt-4"><div className="flex justify-between text-xs text-parchment-300"><span>Capabilities</span><span>{count}</span></div><div className="h-2 bg-ink-700 rounded-full mt-2 overflow-hidden"><div className="h-full bg-brass-500 rounded-full" style={{ width: `${Math.min(100, count * 20)}%` }} /></div></div> : <p className="text-xs text-parchment-300/70 mt-3">{count} capability{count === 1 ? "" : "ies"} attached to this node.</p>}
        </div>
      );
    }

    const content = {
      greeting: preferences.greeting.enabled ? (
        <div className="card h-full p-5 flex items-center">
          <h2 className="text-2xl font-display font-semibold">
            {preferences.greeting.includeName && profile?.name ? `${greeting}, ${profile.name}` : greeting}
          </h2>
        </div>
      ) : null,
      clock: preferences.clock.enabled ? (
        <div className="card h-full p-5 flex items-center justify-center"><LiveClock preferences={preferences} className="text-xl font-display font-semibold text-brass-400 tabular-nums" /></div>
      ) : null,
      date: (
        <div className="card h-full p-5"><p className="text-xs text-parchment-300"><span>{primaryDate}</span>{preferences.calendar.showSecondary && secondaryDate && <><span className="mx-2 text-parchment-300/50">•</span><span>{secondaryDate}</span></>}</p></div>
      ),
      deadlines: (
        <div className="card h-full p-5"><h3 className="text-sm font-semibold mb-3">Upcoming Deadlines</h3>{upcoming.length === 0 ? <p className="text-xs text-parchment-300">No deadlines set.</p> : <div className="space-y-2">{upcoming.map((deadline) => { const days = daysUntil(deadline.date); return <div key={deadline.id} className="flex items-center justify-between py-2 border-b border-ink-700/60 last:border-0 gap-3"><div className="min-w-0"><p className="text-sm truncate">{deadline.title}</p><p className="text-xs text-parchment-300">{formatDate(deadline.date)}</p></div><span className={`text-sm font-semibold shrink-0 ${days <= 7 ? "text-clay-400" : "text-parchment-200"}`}>{days === 0 ? "Today" : `${days} days`}</span></div>; })}</div>}</div>
      ),
      reminders: (
        <div className="card h-full p-5"><h3 className="text-sm font-semibold mb-3">Upcoming Reminders</h3>{upcomingReminders.length === 0 ? <p className="text-xs text-parchment-300">No reminders set.</p> : <div className="space-y-2">{upcomingReminders.map(({ reminder, next }) => <div key={reminder.id} className="flex items-center justify-between py-1.5 gap-3"><span className="text-sm truncate">{reminder.title}</span><span className="text-xs text-parchment-300 shrink-0">{Math.round((next - new Date().setHours(0, 0, 0, 0)) / 86400000) === 0 ? "Today" : formatDate(next)}</span></div>)}</div>}</div>
      ),
      habits: <StatCard title="Habits" value={`${habitsDoneToday}/${habits.length || 0}`} percent={habitPercent} color="#4F9A86" sublabel={`Best streak: ${bestStreak}d`} />,
      pomodoro: <StatCard title="Pomodoro" value={`${todayFocusMin}m`} color="#CB7360" sublabel="Focused today" />,
      exercise: <StatCard title="Exercise" value={`${exerciseDone}/${todayExercise.length || 0}`} percent={exercisePercent} color="#B85C4A" sublabel={todayExercise.length ? `${exercisePercent}% complete` : "Nothing logged today"} />,
      tasks: <StatCard title="Tasks" value={`${completedTasks.length}/${taskItems.length}`} percent={taskItems.length ? Math.round((completedTasks.length / taskItems.length) * 100) : 0} sublabel={`${openTasks.length} open`} />,
      calendar: <StatCard title="Calendar" value={String(calendarCount)} sublabel="Upcoming reminders" />,
      progress: (() => { const source = widget.config?.source || "habitCompletion"; const target = Math.max(1, Number(widget.config?.target) || 100); const current = Number(analysisValue(source, widget.config?.trackerId, Number(widget.config?.range) || 7)) || 0; const percent = Math.min(100, Math.max(0, Math.round((current / target) * 100))); return <StatCard title={widget.config?.title || "Progress"} value={`${current}`} percent={percent} sublabel={`${analysisLabel(source)} · target ${target}`} />; })(),
      pieChart: (() => { const source = widget.config?.source || "habitCompletion"; const value = Math.min(100, Math.max(0, Number(analysisValue(source, widget.config?.trackerId, Number(widget.config?.range) || 7)) || 0)); return <div className="card h-full p-5"><h3 className="text-sm font-semibold mb-3">{widget.config?.title || analysisLabel(source)} distribution</h3><div className="mx-auto h-32 w-32 rounded-full" style={{ background: `conic-gradient(#d6a85f ${value}%, #272b2a ${value}% 100%)` }} /><p className="text-center text-xs text-parchment-300/60 mt-3">{value}{source.includes("Completion") ? "%" : ""} {analysisLabel(source)}</p></div>; })(),
      donutChart: (() => { const source = widget.config?.source || "habitCompletion"; const value = Math.min(100, Math.max(0, Number(analysisValue(source, widget.config?.trackerId, Number(widget.config?.range) || 7)) || 0)); return <div className="card h-full p-5"><h3 className="text-sm font-semibold mb-3">{widget.config?.title || "Progress"}</h3><div className="mx-auto h-32 w-32 rounded-full flex items-center justify-center" style={{background:`conic-gradient(#d6a85f 0 ${value}%, #428475 ${value}% 100%)`}}><div className="h-20 w-20 rounded-full bg-ink-800 flex items-center justify-center text-xs text-parchment-300">{value}{source.includes("Completion") ? "%" : ""}</div></div><p className="text-center text-xs text-parchment-300/50 mt-3">{analysisLabel(source)}</p></div>; })(),
      barChart: (() => { const source = widget.config?.source || "habitCompletion"; const values = analysisSeries(source, widget.config?.trackerId, Number(widget.config?.range) || 7); const max = Math.max(1, ...values); return <div className="card h-full p-5"><h3 className="text-sm font-semibold mb-3">{widget.config?.title || analysisLabel(source)}</h3><div className="flex items-end justify-around h-32 gap-2">{values.map((value,index) => <div key={index} className="flex-1 flex flex-col items-center gap-1"><div className="w-full bg-ink-700 rounded-t h-24 flex items-end"><div className="w-full bg-brass-500 rounded-t" style={{height:`${Math.max(3,(value/max)*100)}%`}} /></div><span className="text-[8px] text-parchment-300/50">{analysisDayLabel(index, values.length)}</span></div>)}</div></div>; })(),
      lineChart: (() => { const source = widget.config?.source || "habitCompletion"; const values = analysisSeries(source, widget.config?.trackerId, Number(widget.config?.range) || 7); const max = Math.max(1, ...values); const points = values.map((value,index) => `${(index/Math.max(1,values.length-1))*100},${100-(value/max)*80-10}`).join(" "); return <div className="card h-full p-5"><h3 className="text-sm font-semibold mb-3">{widget.config?.title || `${analysisLabel(source)} trend`}</h3><svg viewBox="0 0 100 100" className="w-full h-32 overflow-visible" preserveAspectRatio="none"><polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" className="text-brass-400" vectorEffect="non-scaling-stroke" /></svg><p className="text-xs text-parchment-300/50 mt-2">Last {Number(widget.config?.range) || 7} days</p></div>; })(),
      areaChart: (() => { const source = widget.config?.source || "habitCompletion"; const values = analysisSeries(source, widget.config?.trackerId, Number(widget.config?.range) || 7); const max = Math.max(1, ...values); const line = values.map((value,index) => `${(index/Math.max(1,values.length-1))*100},${100-(value/max)*80-10}`).join(" "); const area = `0,100 ${line} 100,100`; return <div className="card h-full p-5"><h3 className="text-sm font-semibold mb-3">{widget.config?.title || `${analysisLabel(source)} area`}</h3><svg viewBox="0 0 100 100" className="w-full h-32 overflow-visible" preserveAspectRatio="none"><polygon points={area} className="fill-brass-500/20" /><polyline points={line} fill="none" stroke="currentColor" strokeWidth="2" className="text-brass-400" vectorEffect="non-scaling-stroke" /></svg></div>; })(),
      kpi: (() => { const source = widget.config?.source || "habitCompletion"; return <div className="card h-full p-5 flex flex-col justify-center"><p className="text-xs text-parchment-300/60">{widget.config?.title || analysisLabel(source)}</p><p className="text-4xl font-display font-semibold text-brass-400 mt-2">{analysisValue(source, widget.config?.trackerId, Number(widget.config?.range) || 7)}{source.includes("Completion") ? "%" : ""}</p><p className="text-xs text-parchment-300/50 mt-1">Current value</p></div>; })(),
      progressChart: (() => { const source = widget.config?.source || "habitCompletion"; const value = Math.min(100, Math.max(0, Number(analysisValue(source, widget.config?.trackerId, Number(widget.config?.range) || 7)) || 0)); return <div className="card h-full p-5"><div className="flex justify-between text-xs"><span>{widget.config?.title || analysisLabel(source)}</span><span>{value}%</span></div><div className="h-3 bg-ink-700 rounded-full mt-3 overflow-hidden"><div className="h-full bg-brass-500 rounded-full" style={{width:`${value}%`}} /></div></div>; })(),
      table: (() => { const source = widget.config?.source || "habitCompletion"; const values = analysisSeries(source, widget.config?.trackerId, Number(widget.config?.range) || 7); return <div className="card h-full p-5"><h3 className="text-sm font-semibold mb-3">{widget.config?.title || analysisLabel(source)}</h3><div className="grid gap-1 text-[9px]" style={{ gridTemplateColumns: `repeat(${Math.min(14, Number(widget.config?.range) || 7)}, minmax(0, 1fr))` }}>{values.map((value,index)=><div key={index} className="rounded bg-ink-700/70 p-2 text-center"><div className="text-parchment-300/50">{analysisDayLabel(index, values.length)}</div><div className="font-semibold mt-1">{value}</div></div>)}</div></div>; })(),
      heatmap: (() => { const source = widget.config?.source || "habitCompletion"; const values = analysisSeries(source, widget.config?.trackerId, Number(widget.config?.range) || 7); const max = Math.max(1, ...values); return <div className="card h-full p-5"><h3 className="text-sm font-semibold mb-3">{widget.config?.title || `${analysisLabel(source)} activity`}</h3><div className="grid grid-cols-7 gap-1">{values.map((value,index)=><div key={index} title={String(value)} className="aspect-square rounded bg-brass-500" style={{opacity:0.2 + (value/max)*0.8}} />)}</div></div>; })(),
      counter: <StatCard title={widget.config?.title || "Counter"} value={String(Number(widget.config?.value) || 0)} sublabel={widget.config?.label || "Manual counter"} />,
      statistics: <StatCard title={widget.config?.title || "Today"} value={String(todayActivity.length)} sublabel={`${activity.length} total activity records`} />,
      notes: <StatCard title={widget.config?.title || "Notes"} value={String(noteItems.length)} sublabel={noteItems.length ? noteItems[0].title : "No notes yet"} />,
      timetable: <StatCard title="Timetable" value={activeTimetable ? `${ttDone}/${ttEntries.length}` : "—"} percent={activeTimetable ? ttPercent : 0} sublabel={activeTimetable ? activeTimetable.name : "No active timetable"} />,
      pages: (
        <div className="card h-full p-5">
          <h3 className="text-sm font-semibold mb-3">Pages</h3>
          {pages.filter((page) => page.config?.showOnDashboard === true).slice(0, 8).length === 0
            ? <p className="text-xs text-parchment-300">No Pages are configured for Dashboard visibility.</p>
            : <div className="space-y-2">{pages.filter((page) => page.config?.showOnDashboard === true).slice(0, 8).map((page) => (
              <Link key={page.id} to={`/page/${page.id}`} className="flex items-center gap-3 rounded-lg bg-ink-800/50 px-3 py-2 hover:bg-ink-700">
                <span style={{ color: page.color || "#428475" }}>{page.icon || "◆"}</span>
                <span className="text-sm truncate">{page.name}</span>
              </Link>
            ))}</div>}
        </div>
      ),
      "page-capability": (() => { const page = pages.find((item) => item.id === widget.pageId); return <div className="card h-full p-4"><p className="text-xs text-brass-400">{page?.name || widget.config?.pageName || "Page"}</p><h3 className="text-sm font-semibold mt-1">{widget.capabilityKey || "Capability"}</h3>{page ? <Link to={`/page/${page.id}/${widget.capabilityKey}`} className="text-xs text-parchment-300/60 mt-3 inline-block">Open Page →</Link> : <p className="text-xs text-clay-400 mt-3">Page no longer available.</p>}</div>; })(),
      capabilities: (
        <div className="card h-full p-5"><h3 className="text-sm font-semibold mb-3">Node Capabilities</h3>{nodes.length === 0 ? <p className="text-xs text-parchment-300">No dashboard-visible nodes configured yet.</p> : <div className="space-y-2">{nodes.filter((node) => node.presentation?.showOnDashboard === true).sort((a, b) => (a.presentation?.dashboardOrder ?? 0) - (b.presentation?.dashboardOrder ?? 0)).slice(0, 6).map((node) => <div key={node.id} className="flex items-center justify-between gap-3 rounded-lg bg-ink-800/50 px-3 py-2"><span className="text-sm truncate">{node.name}</span><span className="text-[10px] text-parchment-300 shrink-0">{Array.isArray(node.capabilities) ? node.capabilities.length : 0} capabilities</span></div>)}</div>}</div>
      ),
    };
    return content[key] || null;
  }

  const displayName = dashboard.name && dashboard.name !== "Main" && dashboard.name !== "Dashboard" ? dashboard.name : null;
  const timeGreeting = getConfiguredTimeGreeting(new Date(), { ...preferences, greeting: { ...preferences.greeting, prefixEnabled: false } });
  const primaryDate = preferences.calendar.primary === "hijri"
    ? formatHijri(new Date(), profile?.hijriAdjustmentDays || 0)
    : formatConfiguredDate(new Date(), preferences, { weekday: "long", day: "numeric", month: preferences.dateFormat === "short" ? "numeric" : "long", year: "numeric" });
  const secondaryDate = preferences.calendar.secondary === "hijri"
    ? formatHijri(new Date(), profile?.hijriAdjustmentDays || 0)
    : preferences.calendar.secondary === "gregorian" ? formatConfiguredDate(new Date(), preferences, { weekday: "long", day: "numeric", month: preferences.dateFormat === "short" ? "numeric" : "long", year: "numeric" }) : null;
  return <div className="max-w-7xl mx-auto px-2 py-4 sm:px-4 lg:px-6">
    <header className="mb-5 space-y-4">
      <div className="flex justify-end gap-2"><button type="button" onClick={() => setCustomize((value) => !value)} className="px-3 py-2 rounded-lg border border-ink-600 text-xs">{customize ? "Done customizing" : "Customize dashboard"}</button>{customize && <button type="button" onClick={async () => { const config = await getConfig(user.uid); const state = normalizeDashboardLayouts(config || {}); const layouts = state.layouts.map((layout) => layout.id === dashboard.id ? dashboard : layout); await setConfig(user.uid, { dashboardLayouts: layouts, activeDashboardId: dashboard.id }); setCustomizeSaved(true); setTimeout(() => setCustomizeSaved(false), 1500); }} className="px-3 py-2 rounded-lg bg-brass-500 text-ink-950 font-semibold text-xs">{customizeSaved ? "Saved ✓" : "Save layout"}</button>}</div>
      {preferences.greeting.enabled && (
        <div className="space-y-1">
          {preferences.greeting.prefixEnabled && preferences.greeting.prefixText && (
            <p className="text-2xl sm:text-3xl font-display font-semibold text-parchment-100">{preferences.greeting.prefixText}</p>
          )}
          <p className="text-2xl sm:text-3xl font-display font-semibold text-parchment-100">
            {preferences.greeting.includeName && profile?.name ? timeGreeting + ", " + profile.name : timeGreeting}
          </p>
        </div>
      )}
      {!preferences.greeting.enabled && displayName ? <h1 className="text-2xl font-display font-semibold">{displayName}</h1> : null}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
        <div className="card px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-parchment-300/45">Date</p>
          <p className="text-sm font-medium text-parchment-200 mt-1">{primaryDate}</p>
          {preferences.calendar.showSecondary && secondaryDate && (
            <p className="text-xs text-parchment-300/60 mt-1">{secondaryDate}</p>
          )}
        </div>
        {preferences.clock.enabled && (
          <div className="card px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-parchment-300/45">Time</p>
            <LiveClock preferences={preferences} className="text-lg font-semibold text-brass-400 tabular-nums mt-1" />
          </div>
        )}
      </div>
    </header>
    <DraggableDashboardGrid columns={dashboard.columns || 12} widgets={orderedWidgets} renderWidget={renderWidget} editable={customize} onChange={(widgets) => setDashboard((current) => ({ ...current, widgets }))} />
  </div>;
}
