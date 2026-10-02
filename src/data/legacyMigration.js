import { collection, doc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { addCapabilityActivity } from "./capabilityActivity";

const userPath = (uid, ...segments) => ["users", uid, ...segments];

async function getCollection(uid, name) {
  const snap = await getDocs(collection(db, ...userPath(uid, name)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function migrateOnce(uid, key, importer) {
  const ref = doc(db, ...userPath(uid, "migrations", key));
  const existing = await getDocs(collection(db, ...userPath(uid, "migrations")));
  if (existing.docs.some((d) => d.id === key && d.data().status === "completed")) return { skipped: true, count: existing.docs.find((d) => d.id === key)?.data().count || 0 };
  const count = await importer();
  await setDoc(ref, { status: "completed", count, completedAt: serverTimestamp() }, { merge: true });
  return { skipped: false, count };
}

export async function migratePomodoro(uid, pageId) {
  const rows = await getCollection(uid, "pomodoroSessions");
  return migrateOnce(uid, `pomodoro-to-${pageId}`, async () => {
    let count = 0;
    for (const row of rows) {
      await addCapabilityActivity(uid, { pageId, capability: "focus", type: "focus_completed", title: row.label || "Imported focus session", date: row.date || null, durationMinutes: row.durationMinutes || null, status: "completed", metadata: { migratedFrom: "pomodoroSessions", sourceId: row.id, programId: row.programId || null, subjectId: row.subjectId || null } });
      count += 1;
    }
    return count;
  });
}

export async function migrateTasks(uid, pageId) {
  const rows = await getCollection(uid, "tasks");
  return migrateOnce(uid, `tasks-to-${pageId}`, async () => {
    let count = 0;
    for (const row of rows) {
      await addCapabilityActivity(uid, { pageId, capability: "tasks", type: "task", title: row.title || row.name || "Imported task", date: row.date || null, dueDate: row.dueDate || row.date || null, priority: row.priority || "normal", status: row.completed ? "completed" : "open", metadata: { migratedFrom: "tasks", sourceId: row.id, original: row } });
      count += 1;
    }
    return count;
  });
}

export async function migrateHabits(uid, pageId) {
  const habits = await getCollection(uid, "meta");
  const habitList = habits.find((row) => row.id === "habitList")?.habits || [];
  const logs = await getCollection(uid, "habitLogs");
  return migrateOnce(uid, `habits-to-${pageId}`, async () => {
    const ids = new Map();
    for (const habit of habitList) {
      const id = await addCapabilityActivity(uid, { pageId, capability: "habits", type: "habit", title: habit.name || habit.title || "Imported habit", date: todayFromHabitLogs(logs), status: "active", metadata: { migratedFrom: "habitList", sourceId: habit.id, cadence: "daily" } });
      ids.set(habit.id, id.id);
    }
    let count = habitList.length;
    for (const log of logs) {
      for (const [habitId, done] of Object.entries(log)) {
        if (habitId === "id" || !done || !ids.has(habitId)) continue;
        const habit = habitList.find((item) => item.id === habitId);
        await addCapabilityActivity(uid, { pageId, capability: "habits", type: "habit_checkin", title: habit?.name || habit?.title || "Imported habit", date: log.id, status: "completed", metadata: { habitId: ids.get(habitId), migratedFrom: "habitLogs", sourceId: log.id } });
        count += 1;
      }
    }
    return count;
  });
}

function todayFromHabitLogs(logs) {
  return logs.length ? logs.map((x) => x.id).sort().at(-1) : null;
}

export async function migrateExerciseAndWeight(uid, pageId) {
  const exercises = await getCollection(uid, "exerciseLogs");
  const weights = await getCollection(uid, "weightLogs");
  return migrateOnce(uid, `fitness-to-${pageId}`, async () => {
    let count = 0;
    for (const row of exercises) {
      await addCapabilityActivity(uid, { pageId, capability: "workout", type: "workout", title: row.name || "Imported workout", date: row.date || null, durationMinutes: row.durationMinutes || null, status: "completed", metadata: { migratedFrom: "exerciseLogs", sourceId: row.id, sets: row.sets || null, reps: row.reps || null } });
      count += 1;
    }
    for (const row of weights) {
      await addCapabilityActivity(uid, { pageId, capability: "measurements", type: "measurement", title: "Weight", date: row.id, value: row.weightKg, unit: "kg", status: "completed", metadata: { migratedFrom: "weightLogs", sourceId: row.id } });
      count += 1;
    }
    return count;
  });
}

export async function getLegacyCounts(uid) {
  const [pomodoro, tasks, exercise, weights, habits] = await Promise.all([
    getCollection(uid, "pomodoroSessions"),
    getCollection(uid, "tasks"),
    getCollection(uid, "exerciseLogs"),
    getCollection(uid, "weightLogs"),
    getCollection(uid, "meta"),
  ]);
  return {
    pomodoro: pomodoro.length,
    tasks: tasks.length,
    exercise: exercise.length,
    weights: weights.length,
    habits: habits.find((row) => row.id === "habitList")?.habits?.length || 0,
  };
}
